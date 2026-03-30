import { NextRequest, NextResponse } from 'next/server';
import { parseArma3Mission } from '@/lib/parsers/arma3Parser';

export async function POST(req: NextRequest) {
  try {
    // Parseo rápido del stream JSON
    const body = await req.json();
    const { filename, data } = body;

    // Validación temprana
    if (!filename || !data) {
      return NextResponse.json(
        { error: "Petición rechazada. Faltan propiedades obligatorias 'filename' o 'data'." }, 
        { status: 400 }
      );
    }

    console.log(`[API /upload] Recibiendo carga de datos de: ${filename}`);

    // Inyección asíncrona mediante el motor de la librería server
    const result = await parseArma3Mission(data, filename);

    return NextResponse.json({ 
        message: "JSON procesado y persitido en PostgreSQL con éxito.",
        ...result 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API /upload] Error fatal al procesar archivo:", error);
    return NextResponse.json(
        { error: "Error interno procesando en Supabase.", details: error.message }, 
        { status: 500 }
    );
  }
}
