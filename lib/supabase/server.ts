import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client (for use in Server Components, Server Actions,
 * Route Handlers, and middleware).
 *
 * Uses @supabase/ssr's createServerClient with Next.js cookie store so that
 * Auth session cookies are correctly read and refreshed on the server.
 *
 * IMPORTANT: Call this inside an async function — `cookies()` from next/headers
 * requires a dynamic rendering context.
 *
 * Usage (Server Component):
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 * Usage (Route Handler / Server Action):
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('orders').select('*')
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions — the session will still be active.
          }
        },
      },
    },
  )
}

/**
 * Service-role Supabase client — bypasses Row Level Security.
 *
 * ⚠️  ONLY use this in:
 *   - Webhook handlers that need to write data without an active session
 *   - Super-admin API routes (behind admin auth check)
 *   - Background jobs / cron routes
 *
 * NEVER use this in client-accessible routes without explicit auth checks.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export async function createServiceRoleClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Intentionally empty — see note above.
          }
        },
      },
    },
  )
}
