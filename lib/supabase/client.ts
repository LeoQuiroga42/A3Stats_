import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase para su uso en el Frontend (Client Components).
 * Utiliza las claves públicas anónimas.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
