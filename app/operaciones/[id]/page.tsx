import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { MissionRosterTable, MissionPlayer } from '@/components/tables/MissionRosterTable';
import { MissionKillFeedTable, MissionKill } from '@/components/tables/MissionKillFeedTable';

export const revalidate = 60;

export default async function OperacionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const matchId = params.id;

  // ── 1. Fetch paralelo de todos los datos de la misión ───────────────
  const [
    { data: match },
    { data: rawPlayers },
    { data: rawEvents },
  ] = await Promise.all([
    // Misión con categoría
    supabase
      .from('matches')
      .select('id, mission_name, map_name, duration_seconds, played_at, victory, score_blue, score_red, score_green, mission_author, mission_type, match_categories(name, color)')
      .eq('id', matchId)
      .single(),
    // Roster de la partida
    supabase
      .from('match_players')
      .select('player_uid, side, squad_name, role, metadata')
      .eq('match_id', matchId)
      .limit(500),
    // Eventos de kill de la partida
    supabase
      .from('match_events')
      .select('id, event_time, actor_uid, target_uid, weapon_used, distance_meters')
      .eq('match_id', matchId)
      .eq('event_type', 'KILL')
      .order('event_time', { ascending: true })
      .limit(5000),
  ]);

  if (!match) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Operación No Encontrada</h1>
        <p className="text-gray-400 mb-6">El ID <code className="text-white bg-black/30 px-2 py-1 rounded">{matchId}</code> no existe en la base de datos.</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">← Volver al Dashboard</Link>
      </main>
    );
  }

  const players  = rawPlayers  || [];
  const events   = rawEvents   || [];

  // ── 2. Resolver alias y equipos de todos los UIDs involucrados ──────
  const allUids = Array.from(new Set([
    ...players.map((p: any) => p.player_uid),
    ...events.map((e: any) => e.actor_uid).filter(Boolean),
    ...events.map((e: any) => e.target_uid).filter(Boolean),
  ]));

  const [{ data: rawAliases }, { data: rawTeams }] = await Promise.all([
    supabase.from('players').select('steam_uid, alias').in('steam_uid', allUids.length > 0 ? allUids : ['__none__']).limit(1000),
    supabase.from('team_players').select('player_uid, teams(name, tag)').in('player_uid', allUids.length > 0 ? allUids : ['__none__']).limit(1000),
  ]);

  const aliasMap = new Map((rawAliases || []).map((p: any) => [p.steam_uid, p.alias]));
  const teamMap  = new Map((rawTeams  || []).map((t: any) => [t.player_uid, t.teams as { name: string; tag: string }]));

  // ── 3. Calcular kills y muertes por jugador ─────────────────────────
  const killsByUid:        Map<string, number> = new Map();
  const deathsEnemyByUid: Map<string, number> = new Map(); // muertes por enemigos
  const deathsTKByUid:    Map<string, number> = new Map(); // muertes por TK recibido
  const sideByUid:        Map<string, string> = new Map();

  players.forEach((p: any) => sideByUid.set(p.player_uid, p.side || ''));

  events.forEach((e: any) => {
    if (e.actor_uid) killsByUid.set(e.actor_uid, (killsByUid.get(e.actor_uid) || 0) + 1);
    if (e.target_uid) {
      const actorSide  = sideByUid.get(e.actor_uid);
      const victimSide = sideByUid.get(e.target_uid);
      const isSuicide = e.actor_uid === e.target_uid;
      const isTK = isSuicide || !!(actorSide && victimSide && actorSide === victimSide);      if (isTK) {
        deathsTKByUid.set(e.target_uid, (deathsTKByUid.get(e.target_uid) || 0) + 1);
      } else {
        deathsEnemyByUid.set(e.target_uid, (deathsEnemyByUid.get(e.target_uid) || 0) + 1);
      }
    }
  });

  // ── 4. Stat Cards calculations ──────────────────────────────────────
  const totalKills     = events.length;
  const totalPlayers   = players.length;
  const maxDistance    = events.reduce((m: number, e: any) => Math.max(m, Number(e.distance_meters) || 0), 0);
  const uniqueWeapons  = new Set(events.map((e: any) => e.weapon_used).filter(Boolean)).size;

  // Precisión media: hits/shots de todos los jugadores con metadata
  let totalHits = 0, totalShots = 0;
  players.forEach((p: any) => {
    totalHits  += Number(p.metadata?.hits  || 0);
    totalShots += Number(p.metadata?.shots || 0);
  });
  const avgPrecision = totalShots > 0 ? ((totalHits / totalShots) * 100).toFixed(1) : 'N/A';

  // Friendly Fire: actor y victim del mismo bando
  const tkCount = events.filter((e: any) => {
    const actorSide  = sideByUid.get(e.actor_uid);
    const victimSide = sideByUid.get(e.target_uid);
    return actorSide && victimSide && actorSide === victimSide && e.actor_uid !== e.target_uid;
  }).length;

  // ── 5. Composición por bandos ───────────────────────────────────────
  const sideComposition: Map<string, string[]> = new Map();
  players.forEach((p: any) => {
    const side = p.side || 'DESCONOCIDO';
    if (!sideComposition.has(side)) sideComposition.set(side, []);
    sideComposition.get(side)!.push(p.player_uid);
  });

  // ── 6. Top Armas ────────────────────────────────────────────────────
  const weaponMap: Map<string, number> = new Map();
  events.forEach((e: any) => {
    const w = e.weapon_used || 'Desconocida';
    weaponMap.set(w, (weaponMap.get(w) || 0) + 1);
  });
  const topWeapons = Array.from(weaponMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── 7. Top Killers y Victims ────────────────────────────────────────
  // killers: contamos solo kills a enemigos (excluimos TKs del conteo de efectividad)
  const killsEnemyByUid: Map<string, number> = new Map();
  events.forEach((e: any) => {
    if (!e.actor_uid) return;
    const actorSide  = sideByUid.get(e.actor_uid);
    const victimSide = sideByUid.get(e.target_uid);
    const isSuicide = e.actor_uid === e.target_uid;
    const isTK = isSuicide || !!(actorSide && victimSide && actorSide === victimSide);
    if (!isTK) killsEnemyByUid.set(e.actor_uid, (killsEnemyByUid.get(e.actor_uid) || 0) + 1);
  });

  const topKillers = Array.from(killsEnemyByUid.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  // victims: muertes totales (enemy + TK)
  const deathsTotalByUid: Map<string, number> = new Map();
  [
    ...Array.from(deathsEnemyByUid.entries()),
    ...Array.from(deathsTKByUid.entries()),
  ].forEach(([uid, n]) => {
    deathsTotalByUid.set(uid, (deathsTotalByUid.get(uid) || 0) + n);
  });
  const topVictims = Array.from(deathsTotalByUid.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── 8. Construir props para componentes CSR ─────────────────────────
  const missionPlayers: MissionPlayer[] = players.map((p: any) => ({
    uid:       p.player_uid,
    alias:     aliasMap.get(p.player_uid) || p.player_uid,
    teamTag:   teamMap.get(p.player_uid)?.tag  || null,
    teamName:  teamMap.get(p.player_uid)?.name || null,
    side:      p.side      || '',
    squadName: p.squad_name || '',
    role:      p.role      || '',
    kills:     killsEnemyByUid.get(p.player_uid) || 0,
    muertes:   (deathsEnemyByUid.get(p.player_uid) || 0) > 0 
                 ? (deathsEnemyByUid.get(p.player_uid) || 0) 
                 : (deathsTKByUid.get(p.player_uid) || 0),
    shots:     Number(p.metadata?.shots || 0),
    hits:      Number(p.metadata?.hits  || 0),
  }));

  const missionKills: MissionKill[] = events.map((e: any) => {
    const actorSide  = sideByUid.get(e.actor_uid);
    const victimSide = sideByUid.get(e.target_uid);
    return {
      id:           e.id,
      eventTime:    Number(e.event_time) || 0,
      actorUid:     e.actor_uid  || null,
      actorAlias:   e.actor_uid  ? (aliasMap.get(e.actor_uid)  || null) : null,
      targetUid:    e.target_uid || null,
      targetAlias:  e.target_uid ? (aliasMap.get(e.target_uid) || null) : null,
      weapon:       e.weapon_used || null,
      distance:     Number(e.distance_meters) || 0,
      isFriendlyFire: !!(actorSide && victimSide && actorSide === victimSide && e.actor_uid !== e.target_uid),
    };
  });

  // ── Helpers ──────────────────────────────────────────────────────────
  const category = (match as any).match_categories ?? null;
  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s % 60}s`;
  };
  const formatDate = (ds: string) =>
    new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ds));

  const sideColors: Record<string, string> = {
    WEST: 'text-blue-400',
    EAST: 'text-red-400',
    GUER: 'text-green-400',
    CIV:  'text-yellow-400',
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-8 xl:p-10 relative z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />

      {/* ── Back Button ─────────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-6 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al Dashboard
        </Link>
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Icono de misión */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 border border-purple-500/30 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {category && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}50`, color: category.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                )}
                {match.mission_type && (
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {match.mission_type}
                  </span>
                )}
                {match.victory && (
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/30">
                    🏆 Victoria: {match.victory}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1 truncate">{match.mission_name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-3">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                  {match.map_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {formatDuration(match.duration_seconds || 0)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  {formatDate(match.played_at)}
                </span>
                {match.mission_author && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Escenario por {match.mission_author}
                  </span>
                )}
              </div>
            </div>

            {/* Scores (si hay) */}
            {(match.score_blue != null || match.score_red != null) && (
              <div className="flex gap-4 shrink-0">
                {match.score_blue != null && (
                  <div className="text-center px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-2xl font-black text-blue-400">{match.score_blue}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">WEST</div>
                  </div>
                )}
                {match.score_red != null && (
                  <div className="text-center px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-2xl font-black text-red-400">{match.score_red}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">EAST</div>
                  </div>
                )}
                {match.score_green != null && (
                  <div className="text-center px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-2xl font-black text-green-400">{match.score_green}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">GUER</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Operadores" value={totalPlayers} color="blue" />
        <StatCard label="Kills Totales" value={totalKills} color="red" />
        <StatCard label="Armas Distintas" value={uniqueWeapons} color="yellow" />
        <StatCard label="Dist. Máxima" value={`${maxDistance.toFixed(0)}m`} color="cyan" />
        <StatCard label="Friendly Fire" value={tkCount} color={tkCount > 0 ? 'orange' : 'gray'} />
        <StatCard label="Precisión Media" value={avgPrecision === 'N/A' ? 'N/A' : `${avgPrecision}%`} color="green" />
      </div>

      {/* ── Composición + Top Armas ─────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Composición por Bandos */}
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-6">
          <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Composición de Bandos
          </h3>
          <div className="space-y-3">
            {Array.from(sideComposition.entries()).map(([side, uids]) => {
              const isWinner = match.victory && match.victory.toUpperCase().includes(side.toUpperCase());
              return (
              <div key={side}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${sideColors[side] || 'text-gray-400'}`}>{side}</span>
                    {isWinner && (
                      <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">🏆 Ganador</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{uids.length} ops.</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      side === 'WEST' ? 'bg-blue-500' :
                      side === 'EAST' ? 'bg-red-500' :
                      side === 'GUER' ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${totalPlayers > 0 ? (uids.length / totalPlayers) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {uids.slice(0, 8).map(uid => (
                    <Link
                      key={uid}
                      href={`/jugadores/${encodeURIComponent(uid)}`}
                      className="text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
                    >
                      {aliasMap.get(uid) || uid.slice(0, 8)}
                    </Link>
                  ))}
                  {uids.length > 8 && (
                    <span className="text-[10px] text-gray-600 px-1.5 py-0.5">+{uids.length - 8} más</span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Top Armas */}
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-6">
          <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Top 5 Armas de la Operación
          </h3>
          <div className="space-y-2">
            {topWeapons.map(([weapon, count], i) => {
              const maxKills = topWeapons[0]?.[1] || 1;
              return (
                <div key={weapon} className="flex items-center gap-3 p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                  <span className="text-[10px] font-mono text-gray-600 w-4 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-200 truncate">{weapon}</span>
                      <span className="text-sm text-yellow-400 font-mono font-bold ml-2 shrink-0">{count}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1">
                      <div className="h-1 rounded-full bg-yellow-500/60" style={{ width: `${(count / maxKills) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {topWeapons.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Sin datos de armas.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Killers + Top Victims ────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Killers */}
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-6">
          <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Top Efectivos de la Operación
          </h3>
          <div className="space-y-2">
            {topKillers.map(([uid, count], i) => (
              <div key={uid} className="flex items-center gap-3 p-2.5 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                <span className={`text-xs font-black w-5 shrink-0 ${i === 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {i === 0 ? '★' : `#${i + 1}`}
                </span>
                <Link href={`/jugadores/${encodeURIComponent(uid)}`} className="flex-1 text-sm font-semibold text-gray-200 hover:text-blue-400 transition-colors truncate">
                  {aliasMap.get(uid) || uid}
                </Link>
                <span className="text-sm text-blue-300 font-mono font-bold shrink-0">{count} kills</span>
              </div>
            ))}
            {topKillers.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Sin datos.</p>}
          </div>
        </div>

        {/* Top Victims */}
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-6">
          <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            Mayores Bajas de la Operación
          </h3>
          <div className="space-y-2">
            {topVictims.map(([uid, count], i) => (
              <div key={uid} className="flex items-center gap-3 p-2.5 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <span className="text-xs font-mono text-gray-600 w-5 shrink-0">#{i + 1}</span>
                <Link href={`/jugadores/${encodeURIComponent(uid)}`} className="flex-1 text-sm font-semibold text-gray-200 hover:text-blue-400 transition-colors truncate">
                  {aliasMap.get(uid) || uid}
                </Link>
                <span className="text-sm text-red-400 font-mono font-bold shrink-0">{count} bajas</span>
              </div>
            ))}
            {topVictims.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Sin datos.</p>}
          </div>
        </div>
      </div>

      {/* ── Roster Completo ──────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Operadores Desplegados
        </h3>
        <MissionRosterTable players={missionPlayers} />
      </div>

      {/* ── Kill Feed ────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Registro de Bajas Cronológico
        </h3>
        <MissionKillFeedTable kills={missionKills} />
      </div>
    </main>
  );
}

// ── Stat Card Component ──────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    gray:   'text-gray-300 bg-gray-500/10 border-gray-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red:    'text-red-400 bg-red-500/10 border-red-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };
  const cls = colorClasses[color] || colorClasses.gray;
  return (
    <div className={`glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-5 text-center border ${cls.split(' ').slice(2).join(' ')}`}>
      <div className={`text-3xl font-black ${cls.split(' ')[0]}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{label}</div>
    </div>
  );
}
