-- ============================================================
-- MIGRATION: Sistema de Clasificación de Partidas
-- A3Stats v1.2.0-alpha
-- Ejecutar en Supabase SQL Editor DESPUÉS de supabase_schema.sql
-- ============================================================

-- 1. Tabla de categorías de partida
CREATE TABLE IF NOT EXISTS public.match_categories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL,
    keywords   TEXT[] NOT NULL DEFAULT '{}',
    color      TEXT NOT NULL DEFAULT '#6B7280',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agregar columna category_id a matches
ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS category_id UUID
    REFERENCES public.match_categories(id) ON DELETE SET NULL;

-- 3. Índice para filtrado eficiente
CREATE INDEX IF NOT EXISTS idx_matches_category_id ON public.matches(category_id);

-- 4. Seed: campañas conocidas
--    Los keywords son case-insensitive en el parser (se comparan en lower())
INSERT INTO public.match_categories (name, keywords, color)
VALUES
    ('Campaña Chasiv Yar 2025',  ARRAY['campaña', 'chasiv'],       '#F59E0B'),
    ('Campaña Siria Libre 2026', ARRAY['campaña', 'sirialibre'],    '#3B82F6')
ON CONFLICT DO NOTHING;

-- 5. Auto-asignar campañas a partidas ya existentes
-- (se puede re-ejecutar sin problema)
UPDATE public.matches m
SET category_id = mc.id
FROM public.match_categories mc
WHERE
    mc.id = (SELECT id FROM public.match_categories WHERE name = 'Campaña Chasiv Yar 2025')
    AND LOWER(m.mission_name) LIKE '%campaña%'
    AND LOWER(m.mission_name) LIKE '%chasiv%'
    AND m.category_id IS NULL;

UPDATE public.matches m
SET category_id = mc.id
FROM public.match_categories mc
WHERE
    mc.id = (SELECT id FROM public.match_categories WHERE name = 'Campaña Siria Libre 2026')
    AND LOWER(m.mission_name) LIKE '%campaña%'
    AND (LOWER(m.mission_name) LIKE '%sirialibre%' OR LOWER(m.mission_name) LIKE '%sirialib%')
    AND m.category_id IS NULL;
