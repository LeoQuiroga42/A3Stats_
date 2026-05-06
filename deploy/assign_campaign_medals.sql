-- ============================================================
-- FUNCIÓN: Asignar medallas basadas en participación y bando
-- Se ejecuta después de migration_add_medals.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_campaign_medals()
RETURNS TABLE(player_uid TEXT, medal_id TEXT, action TEXT) AS $$
DECLARE
    v_campaign_id UUID;
    v_total_operations INTEGER;
    v_threshold_50pct NUMERIC;
BEGIN
    -- 1. Obtener el ID de la campaña "Campaña Siria Libre 2026"
    SELECT id INTO v_campaign_id
    FROM public.match_categories
    WHERE name = 'Campaña Siria Libre 2026'
    LIMIT 1;

    IF v_campaign_id IS NULL THEN
        RAISE NOTICE 'Campaña "Campaña Siria Libre 2026" no encontrada';
        RETURN;
    END IF;

    -- 2. Contar total de operaciones en la campaña
    SELECT COUNT(DISTINCT m.id) INTO v_total_operations
    FROM public.matches m
    WHERE m.category_id = v_campaign_id;

    IF v_total_operations = 0 THEN
        RAISE NOTICE 'No hay operaciones en la campaña';
        RETURN;
    END IF;

    v_threshold_50pct := CEIL(v_total_operations * 0.5);

    -- 3. Asignar medalla SR-ARMY-MEDAL (EAST - 50%+ participación)
    INSERT INTO public.player_medals (player_uid, medal_id)
    WITH east_players AS (
        SELECT mp.player_uid AS p_uid
        FROM public.match_players mp
        INNER JOIN public.matches m ON mp.match_id = m.id
        WHERE m.category_id = v_campaign_id
            AND mp.side = 'EAST'
        GROUP BY mp.player_uid
        HAVING COUNT(DISTINCT mp.match_id) >= v_threshold_50pct
    )
    SELECT p_uid, 'sr-army-medal'
    FROM east_players ep
    WHERE NOT EXISTS (
        SELECT 1 FROM public.player_medals pm
        WHERE pm.player_uid = ep.p_uid AND pm.medal_id = 'sr-army-medal'
    );

    -- 4. Asignar medalla ISIS-MEDAL (WEST - 50%+ participación)
    INSERT INTO public.player_medals (player_uid, medal_id)
    WITH west_players AS (
        SELECT mp.player_uid AS p_uid
        FROM public.match_players mp
        INNER JOIN public.matches m ON mp.match_id = m.id
        WHERE m.category_id = v_campaign_id
            AND mp.side = 'WEST'
        GROUP BY mp.player_uid
        HAVING COUNT(DISTINCT mp.match_id) >= v_threshold_50pct
    )
    SELECT p_uid, 'isis-medal'
    FROM west_players wp
    WHERE NOT EXISTS (
        SELECT 1 FROM public.player_medals pm
        WHERE pm.player_uid = wp.p_uid AND pm.medal_id = 'isis-medal'
    );

    -- Retornar las medallas asignadas
    RETURN QUERY
    SELECT pm.player_uid AS player_uid, pm.medal_id AS medal_id, 'assigned'::TEXT AS action
    FROM public.player_medals pm
    WHERE pm.medal_id IN ('sr-army-medal', 'isis-medal');
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función para asignar las medallas
SELECT * FROM public.assign_campaign_medals();
