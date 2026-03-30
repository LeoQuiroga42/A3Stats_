# A3Stats - Inteligencia Operacional para Arma 3

Plataforma Web integral para la recolección, procesamiento y visualización de estadísticas de servidores de simulación militar (Arma 3). Analiza logs crudos exportados del motor RV y los transforma en un Dashboard estético, interactivo y en tiempo real.

![A3Stats](public/ctu_logo.jpg)

## 📌 Características Principales

- **Dashboard Glassmorphism:** Interfaz moderna, oscura y translúcida construida con Tailwind CSS.
- **Drilldown de Operaciones:** Análisis profundo por partida (Categoría, Duración, Bandos, KillFeed interactivo, Efectividad, Armas Top).
- **Drilldown de Operadores:** Perfil público e individual para cada jugador, con cálculo de K/D, Supervivencia, Arma Favorita, Fuego Amigo (TK) y distancias máximas.
- **Motor de Ingesta Optimizado:** Parser capaz de leer archivos JSON exportados desde Arma 3, generando firmas únicas para deduplicar eventos y subirlos a PostgreSQL de forma secuencial y optimizada.
- **Sincronización Inteligente:** Omite archivos previamente cargados para ahorrar ráfagas de subida, con opción para forzar una sincronización total desde una ruta local específica.
- **Tablas Avanzadas:** Todas las tablas de datos admiten ordenamiento dinámico (Sorting) por cualquier columna.

## 🏗 Arquitectura del Sistema

El sistema utiliza las tecnologías más modernas del ecosistema web:
- **Framework:** Next.js 14+ (App Router, Server-Side Rendering, Server Actions).
- **Estilos:** Tailwind CSS con variables nativas complejas para el Glassmorphism.
- **Base de Datos:** Supabase (PostgreSQL) con cálculo intensivo delegado a RPCs y CTEs para mayor rendimiento.
- **Data Ingestion:** Endpoints dedicados (`/api/sync`) con librerías nativas (`fs`, `path`) que leen los JSON y hacen 'upsert' en base.

## 🗄️ Estructura de Base de Datos

El diseño de la base utiliza relaciones rígidas entre las siguientes tablas principales:
- `matches`: Datos y meta-información de las misiones jugadas.
- `match_categories`: Módulo para clasificar y organizar misiones (por campañas o mapas).
- `players`: Listado unificado de los jugadores (UID Steam).
- `match_events`: El corazón del sistema; registra cada baja o suceso cronológico con deduplicación por microsegundos.

## 🚀 Instalación y Puesta en Marcha

1. **Clonar este repositorio:**
   ```bash
   git clone https://github.com/LeoQuiroga42/A3Stats_
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Variables de entorno:**
   Crea un archivo `.env.local` y define los accesos a tu instancia de base de datos Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```
4. **Desplegar Migraciones:**
   Sube los archivos SQL contenidos en `deploy/` hacia el editor SQL de Supabase para generar las tablas y funciones RPC.
5. **Configurar Administrador:**
   Visita la ruta `/login` (Credenciales por defecto basadas en sesión en crudo mientras se establece un Auth dinámico).
6. **Ejecutar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```

## 🛠 Estándares de Desarrollo
- Diseñado bajo los principios expuestos en `MD/A3Stats_DOC.md` apoyándose fuertemente en tablas ordenables y componentes funcionales.
- Todo desarrollo nuevo debe actualizar `MD/CHANGELOG.MD` siguiendo esquema SemVer.

## 📄 Licencia y Reconocimientos
Este proyecto está regido bajo uso privado por su creador.
Interfaz y firma base: **By Comunidad Tactica Unida**.
