-- ============================================================
-- MIGRATION: Sistema de Medallas
-- A3Stats v1.3.0-alpha
-- Ejecutar en Supabase SQL Editor DESPUÉS de supabase_schema.sql y migration_add_categories.sql
-- ============================================================

-- 1. Tabla de definiciones de medallas
CREATE TABLE IF NOT EXISTS public.medal_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de medallas asignadas a jugadores
CREATE TABLE IF NOT EXISTS public.player_medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_uid TEXT NOT NULL REFERENCES public.players(steam_uid) ON DELETE CASCADE,
    medal_id TEXT NOT NULL REFERENCES public.medal_definitions(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_uid, medal_id)
);

-- 3. Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_player_medals_player_uid ON public.player_medals(player_uid);
CREATE INDEX IF NOT EXISTS idx_player_medals_medal_id ON public.player_medals(medal_id);

-- 4. Seed: Definiciones de medallas
INSERT INTO public.medal_definitions (id, name, image, description)
VALUES
    ('sr-army-medal', 'Ejército Sirio Libre', '/medals/srArmyMedal.png', 'Participó en 50%+ operaciones de la Campaña Siria Libre 2026 en el bando EAST'),
    ('isis-medal', 'ISIS', '/medals/isisMedal.png', 'Participó en 50%+ operaciones de la Campaña Siria Libre 2026 en el bando WEST')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    description = EXCLUDED.description;
