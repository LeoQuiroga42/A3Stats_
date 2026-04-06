# 🌐 Guía: Acceso Público para zonadecombate.ddns.net

Esta guía te explica cómo hacer que tu servidor local sea accesible desde cualquier parte del mundo de forma segura y profesional.

---

## 1. El Portero: Caddy Server

Caddy es el servidor que se encargará de recibir las conexiones de internet y enviarlas a tu aplicación (puerto 3000) de forma segura con **HTTPS automático**.

1.  **Descarga**: Ve a [Caddy para Windows](https://caddyserver.com/download) y descarga el ejecutable (selecciona `Windows amd64`).
2.  **Preparación**: Renombra el archivo descargado a `caddy.exe` y colócalo en la carpeta:
    `C:\A3Stats\A3Stats\deploy\`
3.  **Configuración**: Ya he actualizado el archivo `Caddyfile` en esa misma carpeta con tu dominio `zonadecombate.ddns.net`.

---

## 2. Abrir la Puerta: Port Forwarding

Para que la gente llegue a Caddy, tu **Router** debe permitir el paso. Debes configurar tu router (habitualmente entrando a `192.168.1.1` o `192.168.0.1` en el navegador).

**Acción Requerida**:
Configura estas dos reglas de redirección (Port Forwarding / Virtual Server):

| Puerto Externo | Puerto Interno | Protocolo | IP Interna (Servidor) |
| :--- | :--- | :--- | :--- |
| **80** | 80 | TCP | Tu IP (ej. 192.168.1.10) |
| **443** | 443 | TCP | Tu IP (ej. 192.168.1.10) |

---

## 3. Encender el Acceso Público

1.  Abre una terminal (PowerShell) como **Administrador** en la carpeta `deploy`:
    ```powershell
    cd C:\A3Stats\A3Stats\deploy
    ```
2.  Inicia Caddy:
    ```powershell
    .\caddy.exe run --config Caddyfile
    ```

**¿Qué verás?**
Caddy se conectará con "Let's Encrypt" para obtener un certificado de seguridad gratuito para tu dominio. Si todo está bien, verás un mensaje diciendo que el certificado fue obtenido con éxito.

---

## 4. Verificación Final

1.  **Desde tu Celular**: Desactiva el Wi-Fi (usa datos móviles) y entra en: `https://zonadecombate.ddns.net`
2.  **Seguridad**: Deberías ver el candado verde y la web cargando tus estadísticas.

---

## 5. Mantenimiento y Persistencia

Para que Caddy no se cierre si cierras la ventana de la terminal:

- **Opción Rápida**: Ejecuta `.\caddy.exe start --config Caddyfile` en lugar de `run`. Esto lo corre en segundo plano.
- **Opción Robusta**: Puedes agregarlo a PM2 para que vigile a Caddy también:
    ```powershell
    pm2 start ".\caddy.exe run --config Caddyfile" --name "a3stats-proxy"
    pm2 save
    ```

---

> [!IMPORTANT]
> **HTTPS en Local**: Una vez que Caddy esté funcionando, la aplicación podrá detectar que el tráfico es seguro. Si tienes errores de "Mixed Content", asegúrate de que todas tus URLs en la configuración de la app usen `https://`.
