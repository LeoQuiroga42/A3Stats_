# Guía de Despliegue en Producción (Nueva PC)

Esta guía detalla los pasos para montar **A3Stats** en un sistema limpio.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en el servidor:
1.  **Node.js (v18 o superior)**: Entorno de ejecución para Next.js.
2.  **Docker Desktop** (o Docker Engine en Linux): Para correr la base de datos Supabase.
3.  **Git**: Para clonar el repositorio.

---

## 🛠️ Paso 1: Clonación y Dependencias

1.  Clona el repositorio en la carpeta deseada:
    ```bash
    git clone <url-del-repo> a3stats
    cd a3stats
    ```
2.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```
3.  Instala **PM2** globalmente para la persistencia:
    ```bash
    npm install pm2 -g
    ```

---

## 🗄️ Paso 2: Infraestructura de Base de Datos (Supabase Docker)

Para que la base de datos funcione localmente de forma persistente:

1.  Navega a la carpeta de despliegue:
    ```bash
    cd deploy/supabase-server
    ```
2.  Levanta los contenedores en segundo plano:
    ```bash
    docker-compose up -d
    ```
3.  **Importante**: Si es una instalación nueva, deberás importar el esquema inicial. Puedes entrar al panel de control local (`http://localhost:54323`) y ejecutar el contenido de `/deploy/supabase_schema.sql` en el editor SQL.

---

## 🚀 Paso 3: Configuración de la App

1.  Regresa a la raíz del proyecto y crea un archivo `.env.local`:
    ```bash
    cp .env.example .env.local  # O crea uno nuevo
    ```
2.  Configura las variables con los valores de tu servidor local:
    *   `NEXT_PUBLIC_SUPABASE_URL`: `http://localhost:54321` (o tu dominio público si ya está configurado).
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: El anon key que se encuentra en los logs de docker o config inicial.
    *   `ADMIN_PASSWORD`: Define la contraseña para el modo administrador.

3.  Genera el build de producción:
    ```bash
    npm run build
    ```

---

## 🔄 Paso 4: Ejecución Persistente (PM2)

Inicia la aplicación con PM2 para que se reinicie sola si hay fallos o reinicios del sistema:

1.  Lanza el proceso:
    ```bash
    pm2 start npm --name "a3stats" -- start
    ```
2.  (En Windows) Registra PM2 como servicio de inicio:
    ```bash
    npm install pm2-windows-startup -g
    pm2-startup install
    pm2 save
    ```

Tu aplicación ahora está corriendo internamente en el puerto `3000`.
