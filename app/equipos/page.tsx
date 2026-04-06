import React from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { TeamsClient, TeamStat } from '@/components/equipos/TeamsClient';
import { cookies } from 'next/headers';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function EquiposPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }> | { cat?: string };
}) {
  const supabase = createAdminClient();
  
  // Soporte para Next.js 14/15 donde searchParams puede ser una Promise
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const catId = resolvedParams?.cat || null;

  let teams: TeamStat[] = [];
  let allPlayers: { uid: string; alias: string; assignedTeamId: string | null }[] = [];

  try {
    // Intentamos extraer las tablas (Si esto falla es porque el Admin no ejecutó el SQL aún)
    const { data: dbTeams, error: teamsError } = await supabase.from('teams').select('*').limit(1000);
    if (teamsError) throw teamsError;

    const { data: dbMembers } = await supabase.from('team_players').select('*').limit(10000);
    const membersMap = new Map((dbMembers || []).map((m: any) => [m.player_uid, m.team_id]));

    const { data: dbPlayers } = await supabase.from('players').select('steam_uid, public_id, alias').limit(10000);
    if (dbPlayers) {
      allPlayers = dbPlayers.map(p => ({
        uid: p.public_id, // Usamos ID público para frontend
        steam_uid: p.steam_uid, // Guardamos interno para lógica de asignación
        alias: p.alias,
        assignedTeamId: membersMap.get(p.steam_uid) || null
      }));
    }

    // Filtrar eventos por categoría si aplica
    let categoryMatchIds: string[] | null = null;
    if (catId) {
      const { data: catMatches } = await supabase.from('matches').select('id').eq('category_id', catId).limit(10000);
      categoryMatchIds = (catMatches || []).map((m: any) => m.id);
    }

    let eventsQuery = supabase.from('match_events').select('actor_uid, target_uid').eq('event_type', 'KILL').limit(50000);
    if (categoryMatchIds) {
      eventsQuery = eventsQuery.in('match_id', categoryMatchIds.length > 0 ? categoryMatchIds : ['__none__']) as any;
    }
    const { data: dbEvents } = await eventsQuery;

    // OPTIMIZACIÓN DE PERFORMANCE
    // En lugar de hacer .includes() dentro de un .forEach (Big O = N * M),
    // precalculamos las kills y muertes por cada jugador en un Map (Big O = N + M).
    const playerKills = new Map<string, number>();
    const playerDeaths = new Map<string, number>();

    if (dbEvents) {
      for (const e of dbEvents) {
        if (e.actor_uid) {
          playerKills.set(e.actor_uid, (playerKills.get(e.actor_uid) || 0) + 1);
        }
        if (e.target_uid) {
          playerDeaths.set(e.target_uid, (playerDeaths.get(e.target_uid) || 0) + 1);
        }
      }
    }

    teams = (dbTeams || []).map((t) => {
      const miembrosIds = (dbMembers || []).filter(m => m.team_id === t.id).map(m => m.player_uid);
      
      let kills = 0;
      let muertes = 0;

      // Sumamos las stats precalculadas de cada miembro del equipo
      for (const uid of miembrosIds) {
        kills += playerKills.get(uid) || 0;
        muertes += playerDeaths.get(uid) || 0;
      }

      const kd = muertes > 0 ? (kills / muertes).toFixed(2) : kills.toFixed(2);

      return {
        id: t.id,
        name: t.name,
        tag: t.tag,
        logoUrl: t.logo_url,
        membersCount: miembrosIds.length,
        members: miembrosIds,
        kills, 
        muertes,
        kd,
        createdAt: t.created_at
      };
    });

  } catch (error: any) {
    if (error.code === '42P01') {
       console.warn('[Supabase] Tablas de teams no existen en postgresql aún.');
    } else {
       console.error('[EquiposPage Error]', error);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-8 xl:p-10 relative z-0">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-green-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="relative flex flex-col place-items-center mb-10 z-10 w-full max-w-[1600px] text-center pt-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] drop-shadow-md mb-6 leading-tight">
          Destacamentos y <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Equipos</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          Organización de clanes, escuadras y divisiones operacionales gestionadas manualmente.
        </p>
      </div>

      <TeamsClient teams={teams} allPlayers={allPlayers} isAdmin={cookies().get('a3stats_session')?.value === 'true'} />
    </main>
  );
}
