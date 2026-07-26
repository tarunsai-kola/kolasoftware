import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client (for use in Client Components).
 *
 * Uses @supabase/ssr's createBrowserClient which handles cookie
 * persistence automatically in the browser.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('menu_items').select('*')
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
