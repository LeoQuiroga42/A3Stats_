import { createAdminClient } from '@/lib/supabase/server';
import { PlayersTable, PlayerStat } from '@/components/tables/PlayersTable';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }> | { cat?: string };
}) {
  const supabase = createAdminClient();

  // Next.js 14/15: searchParams puede ser una Promise en algunos contextos
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const catId = resolvedParams?.cat || null;

  let rpcData: any[] | null = null;

  try {
    // Siempre pasamos p_category_id explícitamente (null = sin filtro)
    // para que PostgREST no tenga ambigüedad entre overloads de la función.
    const { data, error } = await supabase.rpc('get_player_stats', {
      p_category_id: catId ?? null,
    });
    if (error) {
      console.error('[JugadoresPage] RPC falló:', JSON.stringify(error));
    } else {
      rpcData = data;
    }
  } catch (err) {
    console.error('[JugadoresPage] Excepción al llamar RPC:', err);
  }

  // Fetch active teams and assignments securely
  let activeTeamsList: { id: string, name: string, tag: string, logoUrl?: string }[] = [];
  const teamMap = new Map();

  try {
    const { data: dbTeams, error: tErr } = await supabase.from('teams').select('id, name, tag, logo_url').order('name');
    if (!tErr && dbTeams) {
       activeTeamsList = dbTeams.map((t:any) => ({ id: t.id, name: t.name, tag: t.tag, logoUrl: t.logo_url }));
    }

    const { data: tpData, error: tpErr } = await supabase.from('team_players').select('player_uid, team_id');
    if (!tpErr && tpData) {
       const amap = new Map(activeTeamsList.map(t => [t.id, t]));
       for (const row of tpData) {
          teamMap.set(row.player_uid, amap.get(row.team_id));
       }
    }
  } catch (e: any) {
    if (e?.code === '42P01') {
       console.warn('[JugadoresPage] Las tablas de teams no existen aún.');
    }
  }

  // Fallback si el RPC falló: traer jugadores básicos sin estadísticas
  if (!rpcData || rpcData.length === 0) {
    console.warn('[JugadoresPage] RPC devolvió vacío o nulo. Intentando fallback directo...');
    try {
      const { data: players, error: pErr } = await supabase
        .from('players')
        .select('steam_uid, public_id, alias')
        .limit(1000);
      if (pErr) {
        console.error('[JugadoresPage] Fallback falló:', pErr.message);
      } else if (players && players.length > 0) {
        console.log('[JugadoresPage] Fallback OK, jugadores encontrados:', players.length);
        // Devolver jugadores con stats en cero si el RPC falla totalmente
        rpcData = players.map((p: any) => ({
          steam_uid: p.steam_uid,
          public_id: p.public_id,
          alias: p.alias,
          kills: 0, tks: 0, muertes: 0, total_matches: 0,
          last_match_date: null, equipo_tags: [],
        }));
      }
    } catch (fbErr) {
      console.error('[JugadoresPage] Fallback excepción:', fbErr);
    }
  }

  const rows = rpcData || [];
  console.log('[JugadoresPage] Total filas para render:', rows.length, '| catId:', catId);

  const playersStats: PlayerStat[] = rows.map((r: any) => {
    const kills        = Number(r.kills)         || 0;
    const tks          = Number(r.tks)           || 0;
    const muertes      = Number(r.muertes)       || 0;
    const totalMatches = Number(r.total_matches) || 0;

    const kdRatio      = muertes > 0 ? (kills / muertes).toFixed(2) : kills.toFixed(2);
    const survivalRate = totalMatches > 0
      ? (Math.max(0, (totalMatches - muertes) / totalMatches) * 100).toFixed(1)
      : '0.0';

    const activeTeam = teamMap.get(r.steam_uid) || null;

    return {
      uid:           r.public_id, // Usamos ID público para URLs
      steam_uid:     r.steam_uid, // Mantenemos interno para lógica si fuera necesario
      alias:         r.alias,
      activeTeam,
      kills,
      muertes,
      tks,
      kd:            kdRatio,
      survivalRate,
      lastMatchDate: r.last_match_date ?? null,
      equiposDict:   Array.isArray(r.equipo_tags) ? r.equipo_tags : [],
    };
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-8 xl:p-10 relative z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="relative flex flex-col place-items-center mb-10 z-10 w-full max-w-[1600px] text-center pt-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[4rem] drop-shadow-md mb-4 leading-tight">
          Estadísticas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Jugadores</span>
        </h1>
        <p className="text-md text-gray-400 max-w-2xl bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          Directorio global de operadores en activo registrados en la plataforma.
        </p>
      </div>

      <div className="w-full max-w-[1600px] z-10">
        <PlayersTable players={playersStats} activeTeamsList={activeTeamsList} />
      </div>
    </main>
  );
}
