# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.3.0-alpha] - 2026-03-29
### Added (Añadido)
- **Sistema de Control de Acceso (Auth)**: Implementación de Middleware y Cookies (`a3stats_session`) nativas de Next.js para separar Perfiles de "Administrador" y "Visitante".
- **Página de Login Protegida**: Nueva ruta `/login` con Server Actions seguras contra inyección.
- **Protección de Funciones Críticas**: Las páginas de `Configuración` y `Sincronización` ahora están estrictamente bloqueadas para visitantes. Del mismo modo, editar, crear o inactivar equipos y clasificaciones valida la autorización desde el servidor.
- **Top Rankings en Drilldown (Consolidado)**: Las métricas individuales ahora incluyen 3 nuevas tablas dinámicas: *Arma Favorita*, *Víctima Frecuente* y *Asesino Frecuente*. Estas se calculan resolviendo en tiempo real los Alias vs UIDs de la base de datos de manera estricta.

### Changed (Cambiado)
- **Estadísticas de Armas Mejoradas**: La columna de *Arma Favorita* en la vista individual muestra la Distancia Máxima de kill en un formato tabular separado (Kills | Max Dist).
- **Distancia de Kills**: Reemplazada estadística de de "Distancia Promedio" general a "Distancia Máxima Registrada Múltiple" para mayor impacto visual analítico.
- **Refactorización de Interfaz Teams**: El botón para Registrar un Nuevo Destacamento y Editar ahora están vinculados a la sesión actual (sólo visible para ADMs).
- **Redacción General**: Renombrado enlace de "Volver al Roster" por "Volver a Jugadores" respetando la terminología elegida para el diseño.

## [1.2.0-alpha] - 2026-03-29
### Added (Añadido)
- **Sistema de Clasificación de Partidas**: Nueva tabla `match_categories` con nombre, keywords de autodetección, color y conteo de partidas asociadas.
- **Filtro de Contexto Global en Sidebar**: Dropdown que propaga `?cat=<uuid>` como query param en todos los links. Muestra badge de la categoría activa con su color. Todas las páginas (General, Jugadores, Drilldown, Equipos) respetan el filtro.
- **Badge de Categoría en tablas**: Cada partida en `MatchesTable` (General → Historial) y `PlayerMatchesTable` (Drilldown → Historial de Operaciones) muestra un badge de color con el nombre de su categoría, o "Sin clasificar" en gris si no tiene.
- **Autodetección en Parser**: Al cargar un JSON, el parser busca en `match_categories` si alguna categoría tiene todos sus keywords contenidos en el `mission_name` (case-insensitive). Si hay match, asigna `category_id` automáticamente. Si la misión ya tenía categoría asignada manualmente, la respeta.
- **Página Configuración funcional**: CRUD completo de categorías con modal de creación/edición (nombre, keywords, color picker + presets, preview live de badge). Tab de clasificación manual de partidas con selector por fila. Botón "Re-ejecutar Autodetección" para procesar partidas sin clasificar.
- **RPC `get_player_stats` filtrado**: Acepta parámetro opcional `p_category_id UUID DEFAULT NULL`. Si se provee, los CTEs filtran kills, muertes y partidas solo a las de esa categoría.
- **Seed automático**: `migration_add_categories.sql` incluye las 2 campañas conocidas (Chasiv Yar 2025, Siria Libre 2026) y UPDATE retroactivo para partidas ya existentes.

### Migration requerida
- Ejecutar `deploy/migration_add_categories.sql` en Supabase SQL Editor.
- Re-ejecutar `deploy/rpc_get_player_stats.sql` para actualizar la firma del RPC.

## [1.1.0-alpha] - 2026-03-29
### Added (Añadido)
- **Drilldown de Jugador**: Nueva ruta dinámica `/jugadores/[uid]` (SSR) con perfil individual completo:
  - Cabecera con avatar, alias y badge de equipo oficial (datos reales de `team_players`).
  - 5 Stat Cards: Kills Enemigos, Muertes, K/D Ratio, % Supervivencia, TK (Fuego Aliado).
  - Estadísticas extendidas: Arma Favorita, Distancia Promedio de Kill, Precisión (Hits/Shots).
  - Tabla paginada de Historial de Operaciones con Bando, Rol, Escuadra, Kills y Muertes por misión.
  - Tabla paginada de Registro de Bajas (Kill Feed) con Víctima, Arma, Distancia, Misión y Fecha.
- **Componentes CSR**: `PlayerMatchesTable.tsx` y `PlayerKillsTable.tsx` siguiendo el estándar DataTables.
- **Autodetectar Operadores por TAG**: En el Modal de Nuevo Equipo, botón para autoasignar todos los jugadores cuyos alias contengan el TAG del equipo.
- **Estadísticas de Equipo en tiempo real**: La página `/equipos` ahora suma Kills/Muertes/K/D de todos los miembros asociados en `team_players` consultando `match_events`.
- **Tablas de Equipos expandidas en ancho**: Ahora usan `max-w-[1600px]` para mejor aprovechamiento de pantallas HD.

### Changed (Cambiado)
- **UI General**: Eliminado badge "Monitoreo en tiempo real..." y reemplazado título "Inteligencia Operacional" por "Estadística General".
- **Columna "Últ. Visto"**: Renombrada desde "Último Alistamiento" y ahora muestra la fecha real de la última misión jugada.
- **playedAt en Parser**: La fecha de la misión se extrae desde el timestamp UTC del primer evento FPS (`jsonData.fps[0].timeUTC`) garantizando fechas históricas reales.
- **Fórmula % Supervivencia**: Protegida con `Math.max(0, ...)` para evitar valores negativos.
- **Filas de PlayersTable clickeables**: Con hover azul y chevron animado para indicar interactividad.
- **revalidate = 0 en General**: Sin caché ISR para reflejar cambios de DB inmediatamente.

### Fixed (Corregido)
- **CRÍTICO - Anti-duplicados en Parser**: `match_events` ahora hace `DELETE` de eventos previos del mismo `match_id` antes de re-insertar. Esto garantiza idempotencia: ejecutar el parser dos veces sobre el mismo JSON no duplica kills.
- **CRÍTICO - Límite silencioso de Supabase (1000 filas)**: Todas las queries masivas de producción carecían de `.limit()` explícito. Supabase trunca silenciosamente los resultados a 1000 filas cuando no se especifica, causando que los conteos de Kills en la tabla de Jugadores fueran incorrectos respecto al drilldown individual. Fix aplicado en `jugadores/page.tsx`, `jugadores/[uid]/page.tsx` y `equipos/page.tsx` con límites de hasta 50.000 registros.
- **CRÍTICO - Refactorización a RPC para estadísticas de jugadores**: La página `/jugadores` reemplaza el patrón de "traer todos los eventos a JavaScript" (que de todas formas estaba sujeto al cap del servidor PostgREST) por una función RPC `get_player_stats()` en PostgreSQL. Toda la agregación de kills, TKs, muertes, partidas y última fecha se calcula via CTEs en Postgres y se retorna pre-calculado. Archivo SQL: `deploy/rpc_get_player_stats.sql`.
- **404 en página General**: Añadido `try/catch` defensivo alrededor de las queries de Supabase para evitar que un error de DB rompa el render SSR.
- **Código muerto en drilldown**: Eliminado el bloque `totalKills++` inicial en el perfil de jugador que se calculaba pero nunca se usaba (se reseteaba en el bloque siguiente), causando confusión y potencial inconsistencia.
- **TypeScript**: Corregido `[...new Set(...)]` por `Array.from(new Set(...))` para compatibilidad con target ES.
- **Sorting null-safety**: `valA ?? ''` y `valB ?? ''` en PlayersTable y tablas de perfil.

## [1.0.0-alpha] - 2026-03-29
### Added (Añadido)
- **Navegación Lateral (Sidebar)**: Introducción del componente `@/components/layout/Sidebar.tsx` inyectado en el Root Layout para permitir navegación entre paneles (General, Jugadores, Equipos, Sync, Configuración) de forma persistente.
- **Módulo de Jugadores**: Nueva página SSR `/app/jugadores` que enumera de manera asíncrona la lista global de perfiles, UIDs de Steam y fecha de alistamiento extraída de `players`.
- **Módulos Placeholder**: Creación visual y estética de las instancias base de `equipos`, `configuracion` y `sync`.

### Changed (Cambiado)
- **Data Optimization**: Se inhabilitó el procesamiento del array de `fps` en `/lib/parsers/arma3Parser.ts` para evitar la inyección de miles de eventos muertos (`SERVER_FPS`) que inflaban el tamaño de la Base de Datos sin aportar estadísticas de jugador.
- **Match Duration Fix**: Se reemplazó el cálculo de fallido del tiempo crudo del mod (`missionStart`/`missionEnd`) por validación estricta de marcas de tiempo UTC iterando el primer y último evento de telemetría de la partida.
- **Database Schema (Supabase)**: Creación de arquitectura base relacional de PostgreSQL estructurada en `/deploy/supabase_schema.sql` unificando las tablas (`players`, `matches`, `match_players`, `match_events`).
- **API Endpoint de Ingestión**: Se creó el endpoint `/app/api/upload/route.ts` que permite a clientes externos enviar POSTs crudos o Webhooks directamente desde los Servidores de Arma para parsear e inyectarlos con Supabase. 
- **Script Batch Local (Tester)**: Automatización bajo Node puro (`/scripts/test-parser.mjs`) capaz de leer la carpeta `JSON examples/` e iterar los 7 archivos gigantes, empujándolos secuencialmente hacia el entorno API corriendo en `localhost:3000`.
- **Arma 3 Parser**: Creación del script core `/lib/parsers/arma3Parser.ts` capaz de leer e inyectar el JSON a la API SSR.
  - Implementación de la Inserción por Lotes (Batch Insert).
  - Integración de Upserts combinados (`players` -> `match_players`) asegurando Cero Pérdida vía columnas `metadata`.
  - Tratamiento robusto de FPS metrics como eventos del motor `SERVER_FPS`.
- **Supabase SSR Clients**: Creación de las instancias base en `/lib/supabase/client.ts` (Lectura Pública) y `/lib/supabase/server.ts` (Escritura/Admin) usando la clave de servicio para evadir RLS durante el parseo de datos.
- **Dependencias**: Se agregaron `@supabase/supabase-js` y `@supabase/ssr` al stack del servidor.
- **Base Next.js App Router**: Creación de la estructura del meta-framework de React (`/app`, `/components`, `/lib`, `/types`).
- **Tailwind CSS**: Implementación del nuevo motor de diseño con las variables CSS de *Glassmorphism*.
- Configuración inicial de TypeScript estricto (`tsconfig.json`).
- `page.tsx` base que reemplaza la antigua landing Vanilla.

### Removed (Eliminado)
- **[BREAKING CHANGE]** Eliminación completa de las carpetas legacy (`/frontend`, `/backend`, `/docs`, `/core`, `/deploy`) y su correspondiente Vanilla HTML/JS. El proyecto renace como una aplicación SPA isomórfica (Next.js).

## [Unreleased]
### Added (Añadido)
- N/A

### Changed (Cambiado)
- **Data Optimization**: Se inhabilitó el procesamiento del array de `fps` en `/lib/parsers/arma3Parser.ts` para evitar la inyección de miles de eventos muertos (`SERVER_FPS`) que inflaban el tamaño de la Base de Datos sin aportar estadísticas de jugador.

### Deprecated (Obsoleto)
- N/A

### Removed (Eliminado)
- N/A

### Fixed (Corregido)
- N/A

### Security (Seguridad)
- N/A

## [0.4.0] - 2026-03-28
### Added (Añadido)
- **Vista Analítica de Equipos (SPA)**: Se integró la nueva vista `#view-teams` con una tabla interactiva (Mismo nivel que "Jugadores") mostrando estadísticas analíticas por clanes.
- **Panel de Configuración Avanzada**: Nueva sección dividida en sub-pestañas que permiten listar, ordenar y buscar registros técnicos.
- **Módulo CRUD Interactivo**: Implementación de un Modal estético interactivo que permite Editar atributos, Alternar Estado (Activo/Inactivo) mediante iconos y Crear jugadores/equipos en tiempo real sobre la memoria visual (`app.js`).

### Changed (Cambiado)
- **Refactorización de Lógica de Tabla**: El antiguo código de renderizado de `app.js` fue extraído a una potente función genérica `renderGenericTable(...)` que inyecta datos dinámicamente, asegurando mantenibilidad (Clean Code).

## [0.3.2] - 2026-03-28
### Changed (Cambiado)
- **Perfil y LogOut Reubicados**: Se eliminó el bloque de usuario temporal en el Navbar superior para integrarlo semánticamente al fondo del menú lateral (`sidebar`), unificando la consola de administración.
- **Iconografía**: El botón de *LogOut* pasó de ser texto plano a un botón cuadrado con icono SVG (estado de hover rojo *glassmorphic*) cumpliendo pautas de diseño moderno.

## [0.3.1] - 2026-03-28
### Added (Añadido)
- **LogOut Button**: Se añadió un botón de "Cerrar Sesión" en la barra de navegación superior junto al perfil de usuario.
- **Nuevos Items en Menú Lateral**: Agregados los botones "Equipos" y "Sincronizar" al menú lateral (`nav-menu`).

### Changed (Cambiado)
- Se renombró la opción "Vehículos" en el menú lateral por "Configuración".

### Removed (Eliminado)
- El selector "Motor de Juego" (Toggle entre RV y Enfusion) fue eliminado por requerimiento de la UI. Se eliminó el código relacionado en `app.js`.

## [0.3.0] - 2026-03-28
### Added (Añadido)
- **Vista de Jugadores (SPA)**: Se integró navegación dinámica en `app.js` permitiendo simular el ruteo hacia la nueva sección sin recargar la página.
- **Tabla de Estadísticas Interactiva**: Creada usando Vanilla JS en la pestaña "Jugadores".
  - Filtro integrado tipo buscador por nombre o rol de jugador.
  - Ordenamiento (Sorting) ascendente y descendente presionando sobre las cabeceras (headers).
  - Paginación dinámica parametrizable (5, 10 o 20 resultados por hoja).
- **Estilos de Interfaz**: Implementación de clases en `styles.css` para tablas responsivas, utilidades `.hidden` y controles visuales para paginación (botones `.btn-glass`).

## [0.2.0] - 2026-03-28
### Added (Añadido)
- Maquetado inicial del frontend (Vanilla JS/HTML/CSS) con interfaz premium (Glassmorphism, animaciones).
- Contadores dinámicos y base de estilos para los datos de Arma 3 / Reforger.
- Estructura base del proyecto y repositorios.
- Definición de la arquitectura inicial para el parseo de logs de Real Virtuality (Arma 3) y Enfusion (Arma Reforger).
- Archivos iniciales de documentación (`README.md` y `CHANGELOG.md`).
- Creación de directorios base del sistema (`frontend`, `backend`, `core`, `docs`, `deploy`).
- **Desarrollo del Frontend (Vanilla JS/CSS/HTML)**: Creación de la estructura de diseño base usando Vanilla CSS (tokens, variables, utilidades).
- **Mockup Interactivo**: Desarrollo del primer mockup visual del Dashboard de Estadísticas interactivo para cambiar entre Arma 3 y Reforger.

## [0.1.0] - 2026-03-26
### Added
- Inicialización del proyecto "Arma & Reforger Stats Platform".
- Configuración del entorno de desarrollo (Antigravity).