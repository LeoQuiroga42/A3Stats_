-- =====================================================================================
-- SCHEMA DE BASE DE DATOS PARA A3STATS (POSTGRESQL / SUPABASE)
-- =====================================================================================

-- Extensión obligatoria para generación automática de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: players
CREATE TABLE IF NOT EXISTS public.players (
    steam_uid TEXT PRIMARY KEY,
    alias TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla: matches
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT UNIQUE NOT NULL,
    mission_name TEXT,
    map_name TEXT,
    duration_seconds INTEGER,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla: match_players (Puente / Roster de la Partida)
CREATE TABLE IF NOT EXISTS public.match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_uid TEXT NOT NULL REFERENCES public.players(steam_uid) ON DELETE CASCADE,
    side TEXT,
    squad_name TEXT,
    role TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Contendrá shots, hits, class de Arma 3
    UNIQUE(match_id, player_uid)
);

-- 4. Tabla: match_events (Timeline de la Partida)
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    event_time INTEGER NOT NULL,     -- Segundos desde el inicio de la partida
    event_type TEXT NOT NULL,        -- Por ejemplo: 'KILL', 'SERVER_FPS'
    actor_uid TEXT REFERENCES public.players(steam_uid) ON DELETE SET NULL,
    target_uid TEXT REFERENCES public.players(steam_uid) ON DELETE SET NULL,
    weapon_used TEXT,
    distance_meters NUMERIC,
    metadata JSONB DEFAULT '{}'::jsonb -- Propiedades que no encajan como 'coordenadas' o 'vehicle'
);

-- =====================================================================================
-- (Opcional) Índices de rendimiento recomendados para las visualizaciones analíticas
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_actor_uid ON public.match_events(actor_uid);
CREATE INDEX IF NOT EXISTS idx_match_events_event_type ON public.match_events(event_type);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);

-- =====================================================================================
-- ESTRUCTURAS DE EQUIPO (FRONTEND)
-- =====================================================================================

-- 5. Tabla: teams (Equipos creados desde el Front)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla: team_players (Asociación Jugador <-> Equipo)
CREATE TABLE IF NOT EXISTS public.team_players (
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_uid TEXT NOT NULL REFERENCES public.players(steam_uid) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(team_id, player_uid)
);

-- =====================================================================================
-- FUNCIONES RPC (ejecutar después de las tablas)
-- Los RPCs están en archivos separados en /deploy/:
--   - rpc_get_player_stats.sql  → Agrega kills/TKs/muertes/partidas por jugador (DB-side)
-- =====================================================================================
