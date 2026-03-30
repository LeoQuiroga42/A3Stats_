# A3Stats - Arquitectura y Estructura del Proyecto

## 📌 Descripción General
A3Stats es una plataforma web dinámica diseñada para procesar, almacenar y visualizar estadísticas de partidas de simulación militar (Arma 3 y Arma Reforger). El sistema consume archivos JSON generados tras cada operación, los procesa y expone la información a través de una interfaz interactiva con tablas, filtros y gráficos.

## 🛠️ Stack Tecnológico
* **Framework Principal:** Next.js (React) - App Router. Permite unificar Frontend y Backend (API Routes) en un solo repositorio.
* **Estilado:** Tailwind CSS + Componentes modulares (ej. Shadcn/ui o MUI).
* **Visualización de Datos:** Recharts o Chart.js para las gráficas de rendimiento (K/D, asistencia, roles, tiempo de vida).
* **Base de Datos:** PostgreSQL (Ideal para la estructura relacional entre Jugadores, Escuadrones y Partidas).
* **Procesamiento de Datos:** Node.js (nativo dentro de Next.js) para la lectura, limpieza y normalización de los JSON entrantes.

## 📂 Estructura de Directorios

```text
A3Stats/
├── app/                        # (Frontend + API) Carpeta principal de Next.js App Router
│   ├── api/                    # Endpoints del Backend
│   │   ├── upload/             # Endpoint para subir/recibir el JSON de la partida
│   │   ├── stats/              # Endpoints para servir datos estructurados al frontend
│   │   └── players/            # Endpoints de información y métricas de jugadores
│   ├── dashboard/              # Vista principal de estadísticas generales del servidor/comunidad
│   ├── matches/                # Vista de historial de operaciones/partidas
│   │   └── [id]/               # Vista de detalle de una partida específica (timeline, bajas, etc.)
│   ├── players/                # Vista del roster y estadísticas individuales históricas
│   ├── layout.tsx              # Layout principal (Navbar, Sidebar de navegación)
│   └── page.tsx                # Landing page / Home
├── components/                 # Componentes de React reutilizables
│   ├── ui/                     # Botones, Inputs, Modales, Tarjetas (Componentes base)
│   ├── charts/                 # Componentes envolventes para gráficas (Recharts/Chart.js)
│   └── tables/                 # Tablas de datos dinámicas (con ordenamiento, filtros y paginación)
├── lib/                        # Lógica de negocio y utilidades de Backend/Frontend
│   ├── db/                     # Configuración y conexión a la base de datos PostgreSQL
│   ├── parsers/                # Funciones core para leer y extraer datos crudos de los JSON de Arma
│   └── utils.ts                # Funciones de ayuda (formateo de fechas, cálculo de K/D, duraciones)
├── types/                      # Definiciones de tipos estrictos (TypeScript)
│   ├── match.d.ts              # Interfaz de la estructura de la partida y eventos
│   └── player.d.ts             # Interfaz del perfil del jugador y sus métricas
├── public/                     # Archivos estáticos (Logos, rangos, iconos militares, imágenes)
├── .env.example                # Variables de entorno de plantilla (Credenciales DB, tokens)
└── package.json                # Dependencias y scripts del proyecto

## 5. Estándar de Tablas Interactivas (DataTables)
Para mantener consistencia en la UI/UX a través de todos los módulos de A3Stats, todas las tablas de datos (General, Jugadores, Equipos, etc.) deben adherirse al siguiente patrón de componentes React CSR ("use client"):
- **Paginación:** Selector de cantidad de registros por página (ej. 10, 25, 50, 100).
- **Ordenamiento (Sorting):** TODAS las columnas sin excepción deben ser interactivas haciendo clic en las cabeceras `<th>` correspondientes, permitiendo orden ASC/DESC.
- **Búsqueda y Filtros:** Campo de búsqueda por texto y filtros dropdown por columnas (Equipos, Rol, Mapa, etc.).
