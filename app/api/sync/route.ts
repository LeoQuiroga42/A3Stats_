import { NextRequest, NextResponse } from 'next/server';
import { parseArma3Mission } from '@/lib/parsers/arma3Parser';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  // Solo admins
  if (cookies().get('a3stats_session')?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let customPath = '';
  let forceAll = false;
  try {
    const body = await req.json();
    if (body.path) customPath = body.path;
    if (body.forceAll) forceAll = true;
  } catch(e) {}

  const JSON_FOLDER = customPath ? path.resolve(customPath) : path.join(process.cwd(), 'JSON examples');

  if (!fs.existsSync(JSON_FOLDER)) {
    return NextResponse.json({ error: `Carpeta no encontrada: ${JSON_FOLDER}` }, { status: 404 });
  }

  const files = fs.readdirSync(JSON_FOLDER).filter(f => f.endsWith('.json'));
  
  // Buscar archivos ya procesados en la DB
  const { createAdminClient } = await import('@/lib/supabase/server');
  const supabase = createAdminClient();
  const { data: existingMatches } = await supabase.from('matches').select('filename');
  const existingSet = new Set(existingMatches?.map(m => m.filename) || []);

  const results: { filename: string; status: 'ok' | 'error' | 'skipped'; events?: number; error?: string }[] = [];
  let skippedCount = 0;

  for (const filename of files) {
    if (!forceAll && existingSet.has(filename)) {
      results.push({ filename, status: 'skipped' });
      skippedCount++;
      continue;
    }

    try {
      const filePath = path.join(JSON_FOLDER, filename);
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const result = await parseArma3Mission(rawData, filename);
      results.push({ filename, status: 'ok', events: result.totalEvents });
    } catch (e: any) {
      results.push({ filename, status: 'error', error: e.message });
    }
  }

  const ok     = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'error').length;

  return NextResponse.json({ ok, failed, skipped: skippedCount, total: results.length, results }, { status: 200 });
}
