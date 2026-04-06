# Guía de Acceso Público y Visibilidad en Internet

Sigue estos pasos para que cualquier persona con el link pueda acceder a tu servidor local de **A3Stats**.

## 📍 1. Nombre de Dominio (DNS/DDNS)

Si no tienes una IP estática, es necesario usar un servicio de **DNS Dinámico (DDNS)**:

1.  Usa un proveedor gratuito como [DuckDNS](https://duckdns.org/) o [No-IP](https://www.no-ip.com/).
2.  Crea un subdominio (ej: `a3stats.no-ip.org`).
3.  Instala su cliente en tu servidor para que tu dominio siempre apunte a tu IP actual.

---

## 🔒 2. Seguridad y HTTPS (Reverse Proxy)

No es seguro exponer directamente el puerto 3000 a internet. La mejor forma de hacerlo es con **Caddy**, que gestiona SSL automáticamente (HTTPS).

1.  Instala [Caddy Server](https://caddyserver.com/).
2.  Crea o edita el archivo `deploy/Caddyfile` con este contenido:
    ```caddyfile
    {
        # Tu email para Let's Encrypt
        email tu-email@ejemplo.com
    }

    # Tu dominio para la app
    mi-dominio.no-ip.org {
        reverse_proxy localhost:3000
    }

    # Tu subdominio para la API de Supabase (Opcional, para login externo)
    api.mi-dominio.no-ip.org {
        reverse_proxy localhost:54321
    }
    ```
3.  Lanza Caddy: `caddy run --config deploy/Caddyfile`.

---

## 🌐 3. Configuración del Router (Port Forwarding)

Para que el tráfico de internet llegue a tu PC, debes abrir los puertos en tu router:

1.  Asigna una **IP Estática Local** a tu PC (ej: `192.168.1.50`).
2.  Entra a la configuración de tu Router (`192.168.1.1` habitualmente).
3.  Encuentra el apartado de **Port Forwarding** o **Servidores Virtuales**.
4.  Crea dos reglas:
    *   **Puerto 80 (HTTP)** -> Redirigir a `192.168.1.50:80`
    *   **Puerto 443 (HTTPS)** -> Redirigir a `192.168.1.50:443`

---

## 🛡️ 4. Firewall de Windows

Asegúrate de que Windows permita el tráfico en los puertos 80 y 443:

1.  Ve a `Panel de Control` > `Sistema y Seguridad` > `Firewall de Windows Defender`.
2.  Selecciona `Configuración Avanzada` > `Reglas de Entrada`.
3.  Crea una `Nueva Regla` tipo `Puerto`.
4.  Especifica `TCP` y puertos `80, 443`.
5.  Permite la conexión.

---

## ⚙️ 5. Actualización Final de la App

Debes actualizar tu archivo `.env.local` con tu nuevo dominio público para que los scripts del navegador (browser) intenten conectar a la URL correcta:

```env
NEXT_PUBLIC_SUPABASE_URL=https://api.mi-dominio.no-ip.org
```

Ahora, cualquier persona con el link `https://mi-dominio.no-ip.org` podrá ver tus estadísticas.
