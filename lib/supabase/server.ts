import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase estructurado para operaciones de Backend puro (API Routes).
 * Utiliza el SERVICE_ROLE_KEY para evadir el Row Level Security (RLS).
 * Ideal para el Parseo de JSON de Arma 3 y cargas masivas a la DB.
 * 
 * ⚠️ ADVERTENCIA: NUNCA EXPORTAR NI USAR ESTE CLIENTE EN EL FRONTEND.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
