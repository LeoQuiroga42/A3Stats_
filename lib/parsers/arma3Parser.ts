import { createAdminClient } from '../supabase/server';

/**
 * Convierte un string de tiempo formato "HH:MM", "HH:MM:SS" o Date object a segundos.
 */
function timeToSeconds(timeStr: string | undefined): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export async function parseArma3Mission(jsonData: any, filename: string) {
  const supabase = createAdminClient();

  // 1. Extracción de Metadata de la Partida (matches)
  // Calculamos la duración real usando la diferencia del tiempo UTC capturado por la telemetría FPS
  let duration = 0;
  let playedAt = new Date().toISOString();

  if (jsonData.fps && Array.isArray(jsonData.fps) && jsonData.fps.length > 0) {
    const firstLog = new Date(jsonData.fps[0].timeUTC).getTime();
    const lastLog = new Date(jsonData.fps[jsonData.fps.length - 1].timeUTC).getTime();
    duration = Math.floor(Math.abs(lastLog - firstLog) / 1000); // Segundos exactos
    playedAt = new Date(firstLog).toISOString(); // La fecha EXACTA en la que se jugó la misión
  } else if (jsonData.date) {
    playedAt = new Date(jsonData.date).toISOString();
  }

  console.log(`[Parser] Iniciando carga de partida: ${jsonData.missionName} | Fecha Real: ${playedAt}`);

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .upsert({
      filename: filename,
      mission_name: jsonData.missionName,
      map_name: jsonData.worldname,
      duration_seconds: duration,
      played_at: playedAt,
      // Nuevos campos de resultado de misión
      victory:        jsonData.victory       || null,
      score_blue:     jsonData.scoreBlue     ? parseInt(jsonData.scoreBlue,  10) : null,
      score_red:      jsonData.scoreRed      ? parseInt(jsonData.scoreRed,   10) : null,
      score_green:    jsonData.scoreGreen    ? parseInt(jsonData.scoreGreen, 10) : null,
      mission_author: jsonData.missionAuthor || null,
      mission_type:   jsonData.missionType   || null,
    }, { onConflict: 'filename' })
    .select('id, category_id')
    .single();

  if (matchError || !match) {
    throw new Error(`Error al registrar match: ${matchError?.message}`);
  }

  const matchId = match.id;

  // ── Auto-detección de categoría ────────────────────────────────────
  // Solo intentar si la misión NO tiene categoría asignada manualmente.
  if (!match.category_id) {
    const { data: categories } = await supabase
      .from('match_categories')
      .select('id, keywords')
      .limit(100);

    if (categories && categories.length > 0) {
      const missionLower = (jsonData.missionName || '').toLowerCase();
      const matched = categories.find((cat: any) => {
        const kws: string[] = cat.keywords || [];
        return kws.length > 0 && kws.every((kw: string) => missionLower.includes(kw.toLowerCase()));
      });

      if (matched) {
        await supabase
          .from('matches')
          .update({ category_id: matched.id })
          .eq('id', matchId);
        console.log(`[Parser] Categoría autodetectada para '${jsonData.missionName}': ${matched.id}`);
      }
    }
  }

  // 2. Resolución de Jugadores (players y match_players)
  if (jsonData.players && Array.isArray(jsonData.players)) {
    const playersToUpsert = jsonData.players.map((p: any) => ({
      steam_uid: p.playerUID,
      alias: p.name
    }));

    // Upsert masivo de jugadores
    const { error: playersError } = await supabase
      .from('players')
      .upsert(playersToUpsert, { onConflict: 'steam_uid' });

    if (playersError) {
      console.error(`[Parser] Advertencia al upsertar players: ${playersError.message}`);
    }

    const matchPlayersToInsert = jsonData.players.map((p: any) => ({
      match_id: matchId,
      player_uid: p.playerUID,
      side: p.side,
      squad_name: p.squad,
      role: p.role,
      metadata: {
        shots: p.shots,
        hits: p.hits,
        class: p.class
      }
    }));

    // Insert masivo de la relación jugador-partida
    const { error: mpError } = await supabase
      .from('match_players')
      .upsert(matchPlayersToInsert, { onConflict: 'match_id,player_uid' });

    if (mpError) {
      console.error(`[Parser] Advertencia en match_players: ${mpError.message}`);
    }
  }

  // 3. Desglose de Timeline de Eventos (kills y otros si existen)
  const eventsToInsert: any[] = [];

  if (jsonData.kills && Array.isArray(jsonData.kills)) {
    const seenEvents = new Set<string>();
    
    jsonData.kills.forEach((k: any) => {
      // Regla de cero pérdida
      const { id, time, victim, killer, weapon, distance, ...rest } = k;
      const eventTimeSecs = timeToSeconds(time) - timeToSeconds(jsonData.missionStart);
      const uuid = `${killer || 'null'}-${victim || 'null'}-${eventTimeSecs}`;
      
      if (seenEvents.has(uuid)) return;
      seenEvents.add(uuid);
      
      eventsToInsert.push({
        match_id: matchId,
        event_time: eventTimeSecs,
        event_type: 'KILL',
        actor_uid: killer || null,
        target_uid: victim || null,
        weapon_used: weapon,
        distance_meters: parseFloat(distance) || 0,
        metadata: Object.keys(rest).length > 0 ? rest : null
      });
    });
  }

  /* 
   * [Optimización de Data / Reducción de Ruido]
   * El arreglo 'fps' (event_type: 'SERVER_FPS') generaba ~16,000 registros por set, 
   * siendo prescindible para las estadísticas K/D directas.
   * Se comenta la extracción para evitar polucionar la Base de Datos.
   */
  // if (jsonData.fps && Array.isArray(jsonData.fps)) {
  //   jsonData.fps.forEach((f: any) => {
  //     eventsToInsert.push({
  //       match_id: matchId,
  //       event_time: f.timeUTC ? Math.floor(new Date(f.timeUTC).getTime() / 1000) : 0, 
  //       event_type: 'SERVER_FPS',
  //       actor_uid: null,
  //       target_uid: null,
  //       weapon_used: null,
  //       distance_meters: 0,
  //       metadata: { fps: f.fps }
  //     });
  //   });
  // }

  // ── ANTI-DUPLICADOS: Borrar eventos previos del match antes de re-insertar ──
  // Esto garantiza idempotencia: si el mismo JSON se carga 2 veces, los eventos
  // no se duplican. matches/match_players ya están cubiertos por upsert.
  if (eventsToInsert.length > 0) {
    const { error: deleteError } = await supabase
      .from('match_events')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) {
      console.error(`[Parser] Error al limpiar eventos previos: ${deleteError.message}`);
    } else {
      console.log(`[Parser] Eventos previos del match ${matchId} eliminados. Re-insertando ${eventsToInsert.length} eventos limpios.`);
    }
  }

  // Insertar Eventos por Lotes (Batch) para no saturar DB
  const BATCH_SIZE = 500;
  for (let i = 0; i < eventsToInsert.length; i += BATCH_SIZE) {
    const batch = eventsToInsert.slice(i, i + BATCH_SIZE);
    const { error: eventsError } = await supabase
      .from('match_events')
      .insert(batch);
      
    if (eventsError) {
      console.error(`[Parser] Error insertando lote de eventos: ${eventsError.message}`);
    }
  }

  console.log(`[Parser] Partida ${filename} cargada exitosamente. Eventos procesados: ${eventsToInsert.length}`);
  return { success: true, matchId, totalEvents: eventsToInsert.length };
}
