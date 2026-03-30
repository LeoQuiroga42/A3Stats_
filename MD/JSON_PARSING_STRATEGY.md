```markdown
# Estrategia de Parseo y Desglose de Archivos JSON (Arma 3)

## 📌 Objetivo
Convertir el archivo JSON generado por el servidor de Arma 3 en registros relacionales para PostgreSQL (Supabase), asegurando **CERO pérdida de datos**. Todo dato que no encaje en una columna específica irá a la columna `metadata` (JSONB) de la tabla correspondiente.

## ⚙️ Flujo de Procesamiento (Parser)

El script de parseo (ubicado en `lib/parsers/`) debe ejecutarse en el entorno de servidor de Next.js (API Route) utilizando el `SUPABASE_SERVICE_ROLE_KEY`.

### Paso 1: Extracción de Metadata de la Partida (`matches`)
* Leer la raíz del JSON (o la sección de configuración de la misión).
* Extraer nombre de misión, mapa, duración y fecha.
* Generar un hash del archivo o usar el nombre del archivo para verificar si ya fue procesado.
* **Insertar/Retornar `match_id`.**

### Paso 2: Resolución de Jugadores (`players` y `match_players`)
* Iterar sobre la lista de participantes del JSON.
* **Upsert en `players`:** Insertar el `steam_uid` y `alias`. Si el `steam_uid` ya existe, actualizar el `alias` al más reciente.
* **Insert en `match_players`:** Vincular cada `steam_uid` con el `match_id` actual. Extraer y guardar bando, escuadra y rol. 
* *Salvavidas (metadata):* Si el mod exporta datos raros del jugador (ej. loadout inicial, fatiga), inyectar eso en una columna JSONB en `match_players`.

### Paso 3: Desglose del Timeline de Eventos (`match_events`)
* Recorrer el array de eventos de la partida.
* Mapear cada evento estándar a las columnas tipadas:
    * `event_time`, `event_type` (ej. KILL, HIT, HEAL).
    * `actor_uid` y `target_uid`.
    * `weapon_used` y `distance_meters`.
* **La Regla de Oro (Cero Pérdida):** Cualquier propiedad extraña del evento (ej. `hit_part: "head"`, `vehicle_type: "Hunter"`, `ammo_caliber: "5.56"`, coordenadas X/Y/Z) debe empaquetarse en un objeto y guardarse en la columna `metadata` (tipo JSONB).
* **Inserción en Lote (Batch Insert):** Para evitar bloquear la base de datos, agrupar los eventos e insertarlos en bloques (ej. 500 filas por consulta) usando el cliente de Supabase.

## 🛑 Manejo de Inconsistencias
* **Desconexiones:** Si el JSON muestra un evento de un jugador que se desconectó y su ID se vuelve nulo o corrupto, registrar el evento con `actor_uid` en `null` pero guardar la data cruda del actor en `metadata` para auditoría manual si es necesario.
* **Rollback:** Todo el proceso de parseo e inserción debe realizarse idealmente en una transacción de base de datos (o simularla limpiando el `match_id` en caso de fallo crítico en el script) para evitar tener partidas a medio cargar.