-- ============================================================
-- RPC: get_player_stats(p_category_id UUID DEFAULT NULL)
-- Descripción: Agrega kills, TKs, muertes, partidas y último
-- visto de cada jugador directamente en Postgres.
-- Si p_category_id IS NULL → todo sin filtro.
-- Si p_category_id IS NOT NULL → solo partidas de esa categoría.
--
-- IMPORTANTE: Eliminar la versión anterior sin parámetro para evitar
-- ambigüedad de overloading en PostgREST (error PGRST203).
--
-- Para ejecutar: SQL Editor de Supabase → pegar y ejecutar.
-- ============================================================

-- Eliminar overload viejo si existe (sin parámetros)
DROP FUNCTION IF EXISTS public.get_player_stats();


CREATE OR REPLACE FUNCTION get_player_stats(p_category_id UUID DEFAULT NULL)
RETURNS TABLE (
  steam_uid        TEXT,
  alias            TEXT,
  total_matches    BIGINT,
  kills            BIGINT,
  tks              BIGINT,
  muertes          BIGINT,
  last_match_date  TIMESTAMPTZ,
  equipo_tags      TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- CTE 0: Partidas filtradas por categoría (o todas si NULL)
  WITH filtered_matches AS (
    SELECT id FROM matches
    WHERE (p_category_id IS NULL OR category_id = p_category_id)
  ),

  -- CTE 1: Enriquecer cada evento KILL con el bando del actor y la víctima
  kill_events AS (
    SELECT
      e.match_id,
      e.actor_uid,
      e.target_uid,
      actor_mp.side  AS actor_side,
      victim_mp.side AS victim_side
    FROM match_events e
    INNER JOIN filtered_matches fm ON fm.id = e.match_id
    LEFT JOIN match_players actor_mp
      ON actor_mp.match_id = e.match_id
     AND actor_mp.player_uid = e.actor_uid
    LEFT JOIN match_players victim_mp
      ON victim_mp.match_id = e.match_id
     AND victim_mp.player_uid = e.target_uid
    WHERE e.event_type = 'KILL'
  ),

  -- CTE 2: Kills y TKs por jugador
  player_kills AS (
    SELECT
      actor_uid AS steam_uid,
      COUNT(*) FILTER (
        WHERE actor_side IS NULL
           OR victim_side IS NULL
           OR actor_side != victim_side
      ) AS kills,
      COUNT(*) FILTER (
        WHERE actor_side IS NOT NULL
          AND victim_side IS NOT NULL
          AND actor_side = victim_side
      ) AS tks
    FROM kill_events
    WHERE actor_uid IS NOT NULL
    GROUP BY actor_uid
  ),

  -- CTE 3: Muertes por jugador
  player_deaths AS (
    SELECT
      target_uid AS steam_uid,
      COUNT(*) AS muertes
    FROM kill_events
    WHERE target_uid IS NOT NULL
    GROUP BY target_uid
  ),

  -- CTE 4: Participación en partidas y última fecha vista
  player_matches AS (
    SELECT
      mp.player_uid          AS steam_uid,
      COUNT(DISTINCT mp.match_id) AS total_matches,
      MAX(m.played_at)       AS last_match_date
    FROM match_players mp
    INNER JOIN filtered_matches fm ON fm.id = mp.match_id
    JOIN matches m ON m.id = mp.match_id
    GROUP BY mp.player_uid
  ),

  -- CTE 5: Squads históricas del jugador
  player_squads AS (
    SELECT
      mp.player_uid AS steam_uid,
      ARRAY_AGG(DISTINCT mp.squad_name)
        FILTER (WHERE mp.squad_name IS NOT NULL AND mp.squad_name != '') AS equipo_tags
    FROM match_players mp
    INNER JOIN filtered_matches fm ON fm.id = mp.match_id
    GROUP BY mp.player_uid
  )

  SELECT
    p.steam_uid,
    p.alias,
    COALESCE(pm.total_matches, 0)                   AS total_matches,
    COALESCE(pk.kills,         0)                   AS kills,
    COALESCE(pk.tks,           0)                   AS tks,
    COALESCE(pd.muertes,       0)                   AS muertes,
    pm.last_match_date,
    COALESCE(ps.equipo_tags, ARRAY[]::TEXT[])        AS equipo_tags
  FROM players p
  LEFT JOIN player_matches pm ON pm.steam_uid = p.steam_uid
  LEFT JOIN player_kills   pk ON pk.steam_uid = p.steam_uid
  LEFT JOIN player_deaths  pd ON pd.steam_uid = p.steam_uid
  LEFT JOIN player_squads  ps ON ps.steam_uid = p.steam_uid
$$;
