import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { PlayerMatchesTable, PlayerMatch } from '@/components/tables/PlayerMatchesTable';
import { PlayerKillsTable, PlayerKill } from '@/components/tables/PlayerKillsTable';

export const revalidate = 60;

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { cat?: string };
}) {
  const id = decodeURIComponent(params.id);
  const supabase = createAdminClient();
  const catId = searchParams?.cat ?? null;

  // ── 1. Buscar jugador por ID público o steam_uid (fallback) ───────────
  let player = null;
  
  // Intentar buscar por public_id primero
  const { data: playerByPublicId } = await supabase
    .from('players')
    .select('*')
    .eq('public_id', id)
    .single();
  
  // Si no existe por public_id, intentar por steam_uid (fallback)
  if (!playerByPublicId) {
    const { data: playerBySteamId } = await supabase
      .from('players')
      .select('*')
      .eq('steam_uid', id)
      .single();
    player = playerBySteamId;
  } else {
    player = playerByPublicId;
  }

  if (!player) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Operador No Encontrado</h1>
        <p className="text-gray-400 mb-6">El perfil del operador solicitado no está disponible o no existe en el sistema.</p>
        <Link href="/jugadores" className="text-blue-400 hover:text-blue-300 transition-colors">← Volver al Roster</Link>
      </main>
    );
  }

  const uid = player.steam_uid; // Usamos el UID interno para las relaciones de DB

  // ── 2. Fetch all required data in parallel ──────────────────────────
  const [
    { data: matchLinks },
    { data: killsAsActor },
    { data: deathsAsVictim },
    { data: teamLink },
  ] = await Promise.all([
    supabase.from('match_players').select('match_id, side, squad_name, role, metadata').eq('player_uid', uid).limit(5000),
    supabase.from('match_events').select('match_id, target_uid, weapon_used, distance_meters').eq('event_type', 'KILL').eq('actor_uid', uid).limit(5000),
    supabase.from('match_events').select('match_id, actor_uid').eq('event_type', 'KILL').eq('target_uid', uid).limit(5000),
    supabase.from('team_players').select('team_id, teams(name, tag, logo_url)').eq('player_uid', uid).limit(1),
  ]);

  const links = matchLinks || [];
  const actorKills = killsAsActor || [];
  const victimDeaths = deathsAsVictim || [];

  // Fetch all related matches (filtrado por categoría si aplica)
  const matchIds = Array.from(new Set(links.map(l => l.match_id)));
  let matchesQuery = supabase
    .from('matches')
    .select('id, mission_name, map_name, duration_seconds, played_at, match_categories(name, color)')
    .in('id', matchIds.length > 0 ? matchIds : ['__none__']);
  if (catId) matchesQuery = matchesQuery.eq('category_id', catId) as any;
  const { data: matchesData } = await matchesQuery;
  const matchesMap = new Map((matchesData || []).map((m: any) => [m.id, m]));

  // Filtrar links solo a las partidas visibles con el filtro activo
  const visibleMatchIds = new Set((matchesData || []).map((m: any) => m.id));
  const filteredLinks = catId ? links.filter(l => visibleMatchIds.has(l.match_id)) : links;

  // Fetch all player aliases for victim & killer resolution
  const victimUids = Array.from(new Set(actorKills.map(k => k.target_uid).filter(Boolean)));
  const killerUids = Array.from(new Set(victimDeaths.map(d => d.actor_uid).filter(Boolean)));
  const comboUids = Array.from(new Set([...victimUids, ...killerUids]));

  const { data: interactionPlayers } = await supabase.from('players').select('steam_uid, public_id, alias').in('steam_uid', comboUids.length > 0 ? comboUids : ['__none__']);
  const interactionInfoMap = new Map((interactionPlayers || []).map(p => [p.steam_uid, { alias: p.alias, public_id: p.public_id }]));
  const aliasMap = new Map((interactionPlayers || []).map(p => [p.steam_uid, p.alias]));

  // ── 2. Compute global stats ─────────────────────────────────────────
  const totalMatches = filteredLinks.length;

  // More accurate TK computation requires victim side per match
  const { data: allMpForMatches } = await supabase.from('match_players').select('match_id, player_uid, side').in('match_id', matchIds.length > 0 ? matchIds : ['__none__']).limit(10000);
  const mpLookup = allMpForMatches || [];

  let totalKills = 0;
  let totalTks = 0;
  actorKills.filter(k => visibleMatchIds.size === 0 || !catId || visibleMatchIds.has(k.match_id)).forEach(k => {
    const killerMp = mpLookup.find(mp => mp.match_id === k.match_id && mp.player_uid === uid);
    const victimMp = mpLookup.find(mp => mp.match_id === k.match_id && mp.player_uid === k.target_uid);
    if (killerMp && victimMp && killerMp.side === victimMp.side) {
      totalTks++;
    } else {
      totalKills++;
    }
  });

  const totalMuertes = catId
    ? victimDeaths.filter(d => visibleMatchIds.has(d.match_id)).length
    : victimDeaths.length;
  const kd = totalMuertes > 0 ? (totalKills / totalMuertes).toFixed(2) : totalKills.toFixed(2);
  const survivalRate = totalMatches > 0 ? (Math.max(0, (totalMatches - totalMuertes) / totalMatches) * 100).toFixed(1) : '0.0';

  // Extended stats
  const weaponFreq = new Map<string, number>();
  let maxGlobalDistance = 0;
  actorKills.forEach(k => {
    const w = k.weapon_used || 'Desconocida';
    weaponFreq.set(w, (weaponFreq.get(w) || 0) + 1);
    const dist = Number(k.distance_meters) || 0;
    if (dist > maxGlobalDistance) maxGlobalDistance = dist;
  });
  const topWeapon = Array.from(weaponFreq.entries()).sort((a, b) => b[1] - a[1])[0];

  // Accuracy from metadata
  let totalShots = 0;
  let totalHits = 0;
  links.forEach(l => {
    const meta = l.metadata as any;
    if (meta) {
      totalShots += Number(meta.shots) || 0;
      totalHits += Number(meta.hits) || 0;
    }
  });
  const accuracy = totalShots > 0 ? ((totalHits / totalShots) * 100).toFixed(1) : 'N/A';

  // Last seen
  const latestMatch = [...links].map(l => matchesMap.get(l.match_id)).filter(Boolean).sort((a, b) => new Date(b!.played_at).getTime() - new Date(a!.played_at).getTime())[0];

  // ── 3. Build table data ─────────────────────────────────────────────
  const playerMatches: PlayerMatch[] = filteredLinks.map(l => {
    const m = matchesMap.get(l.match_id) as any;
    const killsInMatch = actorKills.filter(k => k.match_id === l.match_id).length;
    const deathsInMatch = victimDeaths.filter(d => d.match_id === l.match_id).length;
    return {
      matchId: l.match_id,
      missionName: m?.mission_name || 'Desconocida',
      mapName: m?.map_name || '?',
      side: l.side || '?',
      role: l.role || '',
      squadName: l.squad_name || '',
      kills: killsInMatch,
      muertes: deathsInMatch,
      playedAt: m?.played_at || new Date().toISOString(),
      category: m?.match_categories ?? null,
    };
  });

  const playerKills: PlayerKill[] = actorKills.map(k => {
    const m = matchesMap.get(k.match_id);
    return {
      victimAlias: aliasMap.get(k.target_uid) || 'Op. Desconocido',
      weapon: k.weapon_used || 'Desconocida',
      distance: Number(k.distance_meters) || 0,
      missionName: m?.mission_name || 'Desconocida',
      playedAt: m?.played_at || new Date().toISOString(),
    };
  });

  // ── 4. Rankings Data ────────────────────────────────────────────────
  const weaponStats = new Map<string, { kills: number, maxDistance: number }>();
  const victimStats = new Map<string, number>();
  const killerStats = new Map<string, number>();

  actorKills.filter(k => visibleMatchIds.size === 0 || !catId || visibleMatchIds.has(k.match_id)).forEach(k => {
    const w = k.weapon_used || 'Desconocida';
    const dist = Number(k.distance_meters) || 0;
    
    const ws = weaponStats.get(w) || { kills: 0, maxDistance: 0 };
    ws.kills++;
    if (dist > ws.maxDistance) ws.maxDistance = dist;
    weaponStats.set(w, ws);

    if (k.target_uid) {
      victimStats.set(k.target_uid, (victimStats.get(k.target_uid) || 0) + 1);
    }
  });

  victimDeaths.filter(d => visibleMatchIds.size === 0 || !catId || visibleMatchIds.has(d.match_id)).forEach(d => {
    if (d.actor_uid) {
      killerStats.set(d.actor_uid, (killerStats.get(d.actor_uid) || 0) + 1);
    }
  });

  const weaponTop = Array.from(weaponStats.entries()).sort((a, b) => b[1].kills - a[1].kills);
  const victimTop = Array.from(victimStats.entries()).sort((a, b) => b[1] - a[1]);
  const killerTop = Array.from(killerStats.entries()).sort((a, b) => b[1] - a[1]);

  // Team info
  const teamInfo = (teamLink && teamLink.length > 0) ? (teamLink[0] as any).teams : null;

  const formatDate = (ds: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ds));

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-8 xl:p-10 relative z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="w-full max-w-[1600px] z-10 mb-6 pt-4">
        <Link href="/jugadores" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Volver a Jugadores
        </Link>
      </div>

      {/* ── Profile Header ─────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-8 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600/40 to-purple-600/40 border-2 border-blue-500/30 flex items-center justify-center font-black text-3xl text-white shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            {player.alias.substring(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-white mb-1 tracking-tight">{player.alias}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
              {teamInfo ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-400">
                  {teamInfo.logo_url ? <img src={teamInfo.logo_url} alt="" className="w-4 h-4 rounded" /> : null}
                  [{teamInfo.tag}] {teamInfo.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 border border-gray-500/30 text-gray-400">
                  Operador Independiente
                </span>
              )}
              <span className="text-xs text-gray-500">Registrado: {formatDate(player.created_at)}</span>
              {latestMatch && <span className="text-xs text-gray-500">Últ. visto: {formatDate(latestMatch.played_at)}</span>}
            </div>
          </div>

          {/* Quick Stats (right side) */}
          <div className="flex gap-6 text-center shrink-0">
            <div>
              <div className="text-2xl font-black text-white">{totalMatches}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Operaciones</div>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-400">{totalKills + totalTks}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Bajas Totales</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Kills Enemigos" value={totalKills} color="blue" />
        <StatCard label="Muertes Sufridas" value={totalMuertes} color="gray" />
        <StatCard label="K/D Ratio" value={kd} color={parseFloat(kd) >= 1 ? 'green' : 'orange'} />
        <StatCard label="% Supervivencia" value={`${survivalRate}%`} color="purple" />
        <StatCard label="TK (Fuego Aliado)" value={totalTks} color="red" />
      </div>

      {/* ── Extended Stats ─────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Arma Favorita</div>
            <div className="text-sm font-bold text-white">{topWeapon ? topWeapon[0] : 'N/A'}</div>
            {topWeapon && <div className="text-[10px] text-gray-500">{topWeapon[1]} bajas con esta arma</div>}
          </div>
        </div>

        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Distancia Máxima de Kill</div>
            <div className="text-sm font-bold text-white">{maxGlobalDistance.toFixed(0)}m</div>
          </div>
        </div>

        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Precisión (Hits/Shots)</div>
            <div className="text-sm font-bold text-white">{accuracy === 'N/A' ? accuracy : `${accuracy}%`}</div>
            {totalShots > 0 && <div className="text-[10px] text-gray-500">{totalHits} impactos / {totalShots} disparos</div>}
          </div>
        </div>
      </div>

      {/* ── Rankings Tables ────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <RankingList 
          title="Arma Favorita" 
          icon={<svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
          data={weaponTop} 
          emptyText="Sin kills registradas"
          renderRow={(item, i) => (
            <div key={i} className="flex items-center p-3 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
              <span className="flex-1 text-sm font-bold text-gray-300 group-hover:text-white truncate pr-4" title={item[0]}>{item[0]}</span>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block leading-none mb-1">MAX DIST.</span>
                  <span className="text-sm text-cyan-400 font-mono font-bold leading-none">{item[1].maxDistance.toFixed(0)}m</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-right min-w-[50px]">
                  <span className="text-[10px] text-gray-500 block leading-none mb-1">KILLS</span>
                  <span className="text-sm text-yellow-400 font-mono font-bold leading-none">{item[1].kills}</span>
                </div>
              </div>
            </div>
          )}
        />
        <RankingList 
          title="Víctima Frecuente" 
          icon={<svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          data={victimTop} 
          emptyText="No ha neutralizado a nadie"
          renderRow={(item, i) => (
            <Link key={i} href={`/jugadores/${encodeURIComponent(interactionInfoMap.get(item[0])?.public_id || item[0])}`} className="flex justify-between items-center p-3 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
              <span className="text-sm font-bold text-gray-300 group-hover:text-blue-400 truncate pr-4">{aliasMap.get(item[0]) || "Op. Desconocido"}</span>
              <span className="text-sm text-green-400 font-mono font-bold shrink-0">{item[1]} muertes</span>
            </Link>
          )}
        />
        <RankingList 
          title="Asesino Frecuente" 
          icon={<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
          data={killerTop} 
          emptyText="No ha sido abatido por otro jugador"
          renderRow={(item, i) => (
            <Link key={i} href={`/jugadores/${encodeURIComponent(interactionInfoMap.get(item[0])?.public_id || item[0])}`} className="flex justify-between items-center p-3 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
              <span className="text-sm font-bold text-gray-300 group-hover:text-blue-400 truncate pr-4">{aliasMap.get(item[0]) || "Op. Desconocido"}</span>
              <span className="text-sm text-red-400 font-mono font-bold shrink-0">{item[1]} kills</span>
            </Link>
          )}
        />
      </div>

      {/* ── Matches History Table ───────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Historial de Operaciones
        </h3>
        <PlayerMatchesTable matches={playerMatches} />
      </div>

      {/* ── Kill Feed Table ─────────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Registro de Bajas
        </h3>
        <PlayerKillsTable kills={playerKills} />
      </div>
    </main>
  );
}

// ── Stat Card Component ───────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    gray: 'text-gray-300 bg-gray-500/10 border-gray-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  const cls = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-5 text-center border ${cls.split(' ').slice(2).join(' ')}`}>
      <div className={`text-3xl font-black ${cls.split(' ')[0]}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ── Ranking List Component ────────────────────────────────────────────
function RankingList({ title, icon, data, emptyText, renderRow }: { title: string; icon: React.ReactNode; data: any[]; emptyText: string; renderRow: (item: any, idx: number) => React.ReactNode }) {
  return (
    <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 flex flex-col overflow-hidden h-[300px]">
      <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/[0.02] shrink-0">
        {icon}
        <h3 className="font-bold text-xs text-white uppercase tracking-widest">{title}</h3>
      </div>
      <div className="overflow-y-auto flex-1 p-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 font-medium">{emptyText}</div>
        ) : (
          data.map((item, i) => renderRow(item, i))
        )}
      </div>
    </div>
  );
}
