import fs from 'fs';
import path from 'path';

// Parámetros de conexión local
const API_URL = 'http://localhost:3000/api/upload';
const JSON_FOLDER = path.join(process.cwd(), 'JSON examples');

/**
 * Script transitorio (Opción B) encargado de leer los JSONs en lote
 * del disco rígido del host y simular llamadas asíncronas POST
 * a la instancia viva de la Feature (Opción A) en el framework Next.js.
 */
async function triggerLocalInjection() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  A3Stats - Inyector Local por Lotes (Script)  ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  if (!fs.existsSync(JSON_FOLDER)) {
    console.error(`[CRÍTICO] No se encontró la carpeta objetivo en: ${JSON_FOLDER}`);
    process.exit(1);
  }

  const files = fs.readdirSync(JSON_FOLDER).filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    console.log('[AVISO] La carpeta "JSON examples" está vacía de archivos .json.');
    process.exit(0);
  }

  console.log(`[Scanner] Detectados ${files.length} archivos listos para inyección.\n`);

  for (const filename of files) {
    const filePath = path.join(JSON_FOLDER, filename);
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`⏳ Empujando ${filename} hacia Supabase vía API local...`);
    
    try {
      const ping = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: rawData })
      });

      const response = await ping.json();

      if (ping.ok) {
        console.log(`   ✅ ÉXITO: Persistidos ${response.totalEvents} eventos de telemetría a PostgreSQL.\n`);
      } else {
        console.error(`   ❌ FALLO APLICACIÓN: ${response.error || 'Error desconocido del servidor.'}\n`);
      }
    } catch (e) {
      console.error(`\n[FATAL ERROR] Fallo estrepitoso de conectividad (Fetch).`);
      console.error(`-> Asegúrate de tener el servidor de Next.js encendido usando "npm run dev".`);
      console.error(`-> Error nativo: ${e.message}\n`);
      process.exit(1);
    }
  }

  console.log('🏁 Batch de subida concluido de forma limpia.');
}

// Inicializar rutina
triggerLocalInjection();
