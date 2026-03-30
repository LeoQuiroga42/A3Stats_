# Arquitectura y Conexión de Base de Datos (Supabase)

## 📌 Configuración de Conexión
El proyecto utiliza Supabase (PostgreSQL). Las credenciales deben estar definidas en el archivo `.env.local` en la raíz del proyecto.

**Variables de Entorno Requeridas:**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
Clientes de Supabase:

Cliente Frontend (lib/supabase/client.ts): Utiliza createBrowserClient de @supabase/ssr con la URL y la ANON KEY. Solo para lectura de datos públicos (ej. dashboards).

Cliente Backend (lib/supabase/server.ts o admin.ts): Utiliza el SUPABASE_SERVICE_ROLE_KEY para operaciones de escritura seguras (ej. parseo del JSON). Nunca exponer este cliente al frontend.

🗄️ Esquema Relacional (PostgreSQL)
La base de datos está normalizada para permitir cruces estadísticos complejos.

1. Tabla: players
Registro único de jugadores.

steam_uid (PK, text): ID de Steam.

alias (text): Nombre en el juego.

created_at (timestamptz): Fecha de primer registro.

2. Tabla: matches
Cabecera de cada operación/partida.

id (PK, uuid): ID generado por Supabase.

filename (text, unique): Evita duplicar el mismo archivo JSON.

mission_name (text)

map_name (text)

duration_seconds (integer)

played_at (timestamptz)

3. Tabla: match_players
Tabla puente: Roster de la partida.

id (PK, uuid)

match_id (FK -> matches.id, cascade)

player_uid (FK -> players.steam_uid, cascade)

side (text): BLUFOR, OPFOR, etc.

squad_name (text)

role (text)

Constraint: UNIQUE(match_id, player_uid)

4. Tabla: match_events
Núcleo estadístico. Cada acción registrada en el JSON es una fila.

id (PK, uuid)

match_id (FK -> matches.id, cascade)

event_time (integer): Segundos desde inicio.

event_type (text): KILL, HIT, REVIVE, etc.

actor_uid (FK -> players.steam_uid, set null)

target_uid (FK -> players.steam_uid, set null)

weapon_used (text)

distance_meters (numeric)

metadata (jsonb): Almacén para cualquier dato extra del JSON que no tenga columna fija.