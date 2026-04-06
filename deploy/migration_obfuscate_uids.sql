-- =====================================================================================
-- MIGRACIÓN: ANONIMIZACIÓN DE UIDS
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================================

-- 1. Añadir la columna public_id
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE;

-- 2. Asegurarse de que todos los registros actuales tengan un UUID
UPDATE public.players SET public_id = uuid_generate_v4() WHERE public_id IS NULL;

-- 3. Hacerla obligatoria (No nula)
ALTER TABLE public.players ALTER COLUMN public_id SET NOT NULL;
