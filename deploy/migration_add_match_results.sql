-- =====================================================================================
-- MIGRACIÓN: Agregar columnas de resultado de misión a la tabla matches
-- Ejecutar en Supabase SQL Editor
-- =====================================================================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS victory       TEXT,
  ADD COLUMN IF NOT EXISTS score_blue    INTEGER,
  ADD COLUMN IF NOT EXISTS score_red     INTEGER,
  ADD COLUMN IF NOT EXISTS score_green   INTEGER,
  ADD COLUMN IF NOT EXISTS mission_author TEXT,
  ADD COLUMN IF NOT EXISTS mission_type   TEXT;

-- Índice útil para filtrar por tipo de misión en el futuro
CREATE INDEX IF NOT EXISTS idx_matches_mission_type ON public.matches(mission_type);

-- Confirmar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'matches' AND table_schema = 'public'
ORDER BY ordinal_position;
