import { createAdminClient } from '@/lib/supabase/server';
import { MatchesTable, Match } from '@/components/tables/MatchesTable';

export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams: { cat?: string } }) {
  const supabase = createAdminClient();
  const catId = searchParams?.cat ?? null;

  let playersCount = 0;
  let matchesCount = 0;
  let killsCount = 0;
  let vehiclesCount = 0;
  let allMatches: Match[] = [];

  try {
    // Queries base con filtro de categoría cuando aplica
    const matchFilter = catId
      ? supabase.from('matches').select('*', { count: 'exact', head: true }).eq('category_id', catId)
      : supabase.from('matches').select('*', { count: 'exact', head: true });

    // Para kills/vehículos filtrados por categoría: necesitamos matchIds de la categoría
    let categoryMatchIds: string[] | null = null;
    if (catId) {
      const { data: catMatches } = await supabase
        .from('matches')
        .select('id')
        .eq('category_id', catId)
        .limit(10000);
      categoryMatchIds = (catMatches || []).map((m: any) => m.id);
    }

    const killQuery = categoryMatchIds
      ? supabase.from('match_events').select('*', { count: 'exact', head: true }).eq('event_type', 'KILL').in('match_id', categoryMatchIds.length > 0 ? categoryMatchIds : ['__none__'])
      : supabase.from('match_events').select('*', { count: 'exact', head: true }).eq('event_type', 'KILL');

    const vehicleQuery = categoryMatchIds
      ? supabase.from('match_events').select('*', { count: 'exact', head: true }).eq('event_type', 'VEHICLE_DESTROYED').in('match_id', categoryMatchIds.length > 0 ? categoryMatchIds : ['__none__'])
      : supabase.from('match_events').select('*', { count: 'exact', head: true }).eq('event_type', 'VEHICLE_DESTROYED');

    // Query de matches con JOIN a categorías para los badges
    let matchesQuery = supabase
      .from('matches')
      .select('id, mission_name, map_name, duration_seconds, played_at, victory, match_categories(name, color)')
      .order('played_at', { ascending: false })
      .limit(1000);

    if (catId) matchesQuery = matchesQuery.eq('category_id', catId) as any;

    const [
      { count: pc },
      { count: mc },
      { count: kc },
      { count: vc },
      { data: matches }
    ] = await Promise.all([
      supabase.from('players').select('*', { count: 'exact', head: true }),
      matchFilter,
      killQuery,
      vehicleQuery,
      matchesQuery
    ]);

    playersCount = pc ?? 0;
    matchesCount = mc ?? 0;
    killsCount = kc ?? 0;
    vehiclesCount = vc ?? 0;

    // Mapear el resultado con la categoría anidada al tipo Match
    allMatches = (matches || []).map((m: any) => ({
      id: m.id,
      mission_name: m.mission_name,
      map_name: m.map_name,
      duration_seconds: m.duration_seconds,
      played_at: m.played_at,
      category: m.match_categories ?? null,
      victory: m.victory ?? null,
    }));
  } catch (err) {
    console.error('[General Page] Error al cargar datos de Supabase:', err);
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-8 xl:p-10 relative z-0">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="relative flex flex-col place-items-center mb-10 z-10 w-full max-w-[1600px] text-center pt-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] drop-shadow-md mb-6 leading-tight">
          Estadística <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">General</span>
        </h1>
      </div>

      <div className="mb-10 grid text-left w-full max-w-[1600px] grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
        <div className="group px-6 py-8 transition-all hover:border-[rgba(255,255,255,0.15)] glass-panel relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
          <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-widest opacity-80">Despliegues Oficiales</p>
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-3 drop-shadow-sm">{playersCount?.toLocaleString() || 0}</h2>
          <p className="text-xs text-gray-400 max-w-[25ch]">Operadores registrados en campañas.</p>
        </div>

        <div className="group px-6 py-8 transition-all hover:border-[rgba(255,255,255,0.15)] glass-panel relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
          <p className="text-xs font-semibold text-purple-400 mb-1 uppercase tracking-widest opacity-80">Total Operaciones</p>
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-3 drop-shadow-sm">{matchesCount?.toLocaleString() || 0}</h2>
          <p className="text-xs text-gray-400 max-w-[25ch]">Misiones catalogadas del historial táctico.</p>
        </div>

        <div className="group px-6 py-8 transition-all hover:border-[rgba(255,255,255,0.15)] glass-panel relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-red-500/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
          <p className="text-xs font-semibold text-red-500 mb-1 uppercase tracking-widest opacity-80">Bajas Confirmadas</p>
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-3 drop-shadow-sm">{killsCount?.toLocaleString() || 0}</h2>
          <p className="text-xs text-gray-400 max-w-[25ch]">Muertes globales auditadas en DB.</p>
        </div>

        <div className="group px-6 py-8 transition-all hover:border-[rgba(255,255,255,0.15)] glass-panel relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
          <p className="text-xs font-semibold text-orange-500 mb-1 uppercase tracking-widest opacity-80">Vehículos Destruidos</p>
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-3 drop-shadow-sm">{vehiclesCount?.toLocaleString() || 0}</h2>
          <p className="text-xs text-gray-400 max-w-[25ch]">Pérdidas de material rodante y aéreo.</p>
        </div>
      </div>

      <div className="w-full max-w-[1600px] z-10">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-white/90">Historial Reciente</h3>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Live Sync</span>
        </div>
        <MatchesTable matches={allMatches} />
      </div>
    </main>
  );
}
