# 🏠 Guía: Supabase Local con Docker de A3Stats

Esta guía te ayudará a clonar tu base de datos de la nube a tu propio servidor local. Al terminar, tendrás el control total de tus datos y no dependerás de servicios externos.

---

## 1. Requisitos Previos (Instalación)

Para que Supabase funcione en tu PC, necesitas instalar **Docker Desktop**. Es el programa que permite "emular" los servidores de base de datos de forma aislada.

1.  **Descarga**: Ve a [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/) y descarga el instalador.
2.  **Instalación**: Ejecuta el instalador. Si te pregunta por **WSL 2**, marca la casilla (es recomendado para mejor rendimiento).
3.  **Reinicio**: Probablemente te pida reiniciar la PC.
4.  **Ejecución**: Abre Docker Desktop y espera a que el icono de la ballena abajo a la izquierda esté en **verde** (Running).

---

## 2. Preparar el Entorno Local

Ve a la carpeta de tu proyecto en la terminal (PowerShell) y entra en la carpeta de despliegue:

```powershell
cd C:\A3Stats\A3Stats\deploy\supabase-server
```

### Configura tus llaves (Opcional pero recomendado)
Abre el archivo `.env` que está en esa carpeta con el Bloc de Notas. Verás algo como esto:
- `POSTGRES_PASSWORD`: Es la contraseña "maestra" de tu base de datos local. Cámbiala por algo seguro.
- `JWT_SECRET`: Firma de seguridad. Puedes dejar el que está por defecto para local.

---

## 3. Encender Supabase Local

Desde la misma carpeta (`deploy/supabase-server`), ejecuta el siguiente comando:

```powershell
docker-compose up -d
```

**¿Qué está pasando?**
Docker descargará las imágenes de Supabase (Postgres, Auth, API) y las pondrá en marcha. La primera vez puede tardar unos minutos.

**Verificación**:
Abre tu navegador y entra en: `http://localhost:54321`
Si ves un mensaje de error de Kong o una página en blanco, es normal; lo importante es que el puerto responda. El API de PostgREST debería estar en `http://localhost:54321/rest/v1/`.

---

## 4. Migrar los Datos (De la Nube al Local)

Este es el paso más importante: traer tus jugadores y partidas actuales.

### 4.1 Exportar desde la Nube (Cloud)
1.  Abre tu [Dashboard de Supabase Cloud](https://app.supabase.com).
2.  Ve a **Project Settings** > **Database**.
3.  Busca la sección de **Connection string** y elige **URI**.
4.  Copia esa cadena. Se ve así: `postgresql://postgres:[TU_PASS]@db.xxxx.supabase.co:5432/postgres`

Desde tu PC local (con el Supabase CLI instalado o simplemente usando `pg_dump` si sabes usarlo), ejecuta:

> [!TIP]
> **Forma Sencilla**: Si no quieres instalar más herramientas, ve al **SQL Editor** en la web de Supabase y descarga los resultados de tus tablas a CSV, o pídele a Antigravity que genere un script de volcado personalizado si la base es pequeña.

### 4.2 Importar en el Servidor Local
Una vez que tengas tu archivo `backup.sql`, muévelo a la carpeta del proyecto y usa Docker para meterlo en la base de datos:

```powershell
# Suponiendo que tu archivo se llama backup.sql
docker exec -i supabase-db psql -U postgres < backup.sql
```

---

## 5. Conectar A3Stats a la DB Local

Ahora que tu DB local tiene los datos, debes decirle a la aplicación web que deje de usar la nube.

1.  Abre el archivo `.env.local` de la aplicación A3Stats.
2.  Cambia las variables:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_local (la encuentras en kong.yml o usa la misma si usas el mismo JWT_SECRET)
    SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_local
    ```

---

## 6. Comandos Útiles de Mantenimiento

- **Detener todo**: `docker-compose stop`
- **Borrar todo (Cuidado: borra datos)**: `docker-compose down -v`
- **Ver logs**: `docker-compose logs -f db`

> [!CAUTION]
> **Persistencia**: Tus datos se guardan en la carpeta `volumes/db/data`. **No borres esa carpeta** o perderás la base de datos local.
