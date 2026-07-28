import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// =============================================================================
// Types
// =============================================================================

/**
 * Columns fetched from the `restaurants` table during tenant lookup.
 * Must match the `select` parameter in lookupRestaurant().
 */
interface RestaurantRow {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
  font_family: string
  banner_image_url: string | null
  whatsapp_number: string | null
  is_accepting_orders: boolean
  announcement_message: string | null
  status: 'active' | 'suspended' | 'pending_setup'
}

// Shape written to the x-restaurant-theme header (read by getRestaurantContext)
interface RestaurantThemeHeader {
  name: string
  logoUrl: string | null
  primaryColor: string
  fontFamily: string
  bannerImageUrl: string | null
  whatsappNumber: string | null
  isAcceptingOrders: boolean
  announcementMessage: string | null
}

// =============================================================================
// In-Memory Cache
// =============================================================================
//
// Module-level Map provides best-effort caching within a single Edge/Node.js
// runtime instance. On Vercel, each Edge region has its own instance — this
// cache is not globally shared but still eliminates most per-request DB hits
// within a warm instance.
//
// For globally consistent invalidation across all Edge regions, replace this
// with Vercel KV (upstash/redis). See CLAUDE.md before changing this.

type CacheEntry = {
  restaurant: RestaurantRow | null // null = confirmed "not found" — also cached
  cachedAt: number
}

const restaurantCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // 60 seconds

function getFromCache(key: string): RestaurantRow | null | undefined {
  const entry = restaurantCache.get(key)
  if (!entry) return undefined // cache miss
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    restaurantCache.delete(key)
    return undefined // expired
  }
  return entry.restaurant // null = known 404, object = found
}

function writeToCache(key: string, restaurant: RestaurantRow | null): void {
  restaurantCache.set(key, { restaurant, cachedAt: Date.now() })
}

// =============================================================================
// Supabase REST Lookup
// =============================================================================
//
// Uses direct fetch() to the Supabase PostgREST API with the service role key.
// We intentionally avoid @supabase/ssr here because:
//   1. Middleware runs before cookies are fully processed
//   2. Tenant lookup is public data — no user session needed
//   3. Direct fetch is lighter and edge-compatible
//
// The OR filter checks BOTH `domain` (custom domain) AND `subdomain` (platform
// subdomain slug) so a single query handles both cases.

/**
 * Sanitise a raw hostname string to only valid hostname characters.
 * Prevents any injection into the PostgREST OR filter.
 */
function sanitiseHostname(raw: string): string {
  // Strip port (present in local dev: localhost:3000)
  const withoutPort = raw.split(':')[0]
  // Allow only lowercase letters, digits, hyphens, dots
  return withoutPort.toLowerCase().replace(/[^a-z0-9.\-]/g, '')
}

/**
 * Extract the leftmost label from a hostname for subdomain matching.
 * "spicehouse.kolasolution.com" → "spicehouse"
 * "spicehouse.com"             → "spicehouse"  (used as fallback; won't match unless slug = "spicehouse")
 */
function extractSubdomainSlug(hostname: string): string {
  return hostname.split('.')[0]
}

/**
 * Look up a restaurant by hostname. Returns:
 *   - RestaurantRow   if found (any status)
 *   - null            if no restaurant matched
 * Throws on network / Supabase errors.
 */
async function lookupRestaurant(
  rawHostname: string,
): Promise<RestaurantRow | null> {
  const hostname = sanitiseHostname(rawHostname)
  const subdomainSlug = extractSubdomainSlug(hostname)

  // ── Cache hit ──────────────────────────────────────────────────────────────
  // Use the full hostname as the cache key (covers both domain + subdomain cases)
  const cached = getFromCache(hostname)
  if (cached !== undefined) return cached

  // ── Supabase REST query ────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!baseUrl || !serviceKey) {
    throw new Error(
      '[middleware] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.',
    )
  }

  // PostgREST OR filter: match custom domain OR subdomain slug
  // URLSearchParams.set() handles URL-encoding of the entire value.
  const params = new URLSearchParams({
    or: `(domain.eq.${hostname},subdomain.eq.${subdomainSlug})`,
    select: 'id,name,logo_url,primary_color,font_family,banner_image_url,whatsapp_number,is_accepting_orders,announcement_message,status',
    limit: '1',
  })

  const res = await fetch(`${baseUrl}/rest/v1/restaurants?${params.toString()}`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
    // Do NOT use next.revalidate here — we manage our own TTL cache above.
    // Using 'no-store' ensures we always get fresh data from Supabase and
    // rely solely on our Map for caching.
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(
      `[middleware] Supabase REST returned ${res.status} ${res.statusText}`,
    )
  }

  const rows: RestaurantRow[] = await res.json()
  const restaurant = rows[0] ?? null
  
  if (restaurant) {
    console.log('[middleware] Fetched restaurant:', {
      name: restaurant.name,
      isAcceptingOrders: restaurant.is_accepting_orders,
      announcementMessage: restaurant.announcement_message
    })
  }

  // Cache the result — including null ("not found") to avoid re-querying
  // for hostnames that have no restaurant row (e.g. bots, invalid domains)
  writeToCache(hostname, restaurant)

  return restaurant
}

// =============================================================================
// Middleware
// =============================================================================

export async function middleware(request: NextRequest) {
  const rawHostname = request.headers.get('host') ?? ''
  const hostname = sanitiseHostname(rawHostname)
  const pathname = request.nextUrl.pathname
  const adminDomain = sanitiseHostname((process.env.PLATFORM_ADMIN_DOMAIN ?? '').toLowerCase())

  // ── Step 1: Supabase Auth session refresh ──────────────────────────────────
  // Required by @supabase/ssr on EVERY request. Keeps the JWT + cookie
  // session alive and rotated. Do NOT move auth.getUser() below any early
  // returns — the session refresh must always run.
  //
  // The `supabaseResponse` variable is reassigned inside setAll() when cookies
  // change. The final response we return must be this variable (or must carry
  // the same cookies) — otherwise the user will be randomly logged out.

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies into the request object so Server Components see them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Rebuild supabaseResponse so it carries the new cookies on the response
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not write any code between createServerClient and getUser().
  // Even a single await in between can cause hard-to-debug logout issues.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Step 2: Super-admin domain routing ────────────────────────────────────
  // Requests to PLATFORM_ADMIN_DOMAIN are served by the /(super-admin) layout.
  // Bypasses all tenant lookup. Redirects to /admin/login if not authenticated.
  if (hostname === adminDomain) {
    // 1. Rewrite root to the public landing page route
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/landing', request.url))
    }

    // 2. Auth protection for all other admin routes (except login and the rewritten landing page)
    if (!user && !pathname.startsWith('/admin/login') && !pathname.startsWith('/landing')) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }

    // Pass through with auth cookies; no tenant headers injected
    return supabaseResponse
  }

  // ── Step 3: Tenant lookup ──────────────────────────────────────────────────
  let restaurant: RestaurantRow | null

  try {
    restaurant = await lookupRestaurant(rawHostname)
  } catch (err) {
    // Supabase is unreachable or env vars are missing — fail gracefully
    // rather than crashing the entire request.
    console.error('[middleware] Restaurant lookup failed:', err)
    return NextResponse.rewrite(
      new URL('/restaurant-unavailable?reason=service_error', request.url),
    )
  }

  // ── Step 4: No restaurant found ────────────────────────────────────────────
  // The hostname doesn't match any domain or subdomain in the restaurants table.
  if (!restaurant) {
    return NextResponse.rewrite(new URL('/restaurant-not-found', request.url))
  }

  // ── Step 5: Restaurant suspended or pending setup ──────────────────────────
  if (restaurant.status === 'suspended') {
    return NextResponse.rewrite(
      new URL('/restaurant-unavailable?reason=suspended', request.url),
    )
  }

  if (restaurant.status === 'pending_setup') {
    return NextResponse.rewrite(
      new URL('/restaurant-unavailable?reason=pending_setup', request.url),
    )
  }

  // ── Step 6: Active restaurant — inject tenant headers ─────────────────────
  // These headers are read in Server Components via lib/get-restaurant-context.ts
  // x-restaurant-id    → plain UUID string
  // x-restaurant-theme → JSON blob with all branding tokens

  const theme: RestaurantThemeHeader = {
    name: restaurant.name,
    logoUrl: restaurant.logo_url,
    primaryColor: restaurant.primary_color,
    fontFamily: restaurant.font_family,
    bannerImageUrl: restaurant.banner_image_url,
    whatsappNumber: restaurant.whatsapp_number,
    isAcceptingOrders: restaurant.is_accepting_orders ?? true,
    announcementMessage: restaurant.announcement_message ?? null,
  }

  // Clone the incoming headers and add our custom headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-restaurant-id', restaurant.id)
  requestHeaders.set('x-restaurant-theme', JSON.stringify(theme))

  // Build a new response that forwards the modified request headers downstream
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // ── Step 7: Forward auth session cookies ──────────────────────────────────
  // The supabaseResponse may have set/refreshed auth cookies in Step 1.
  // We must carry those through on the final response, otherwise the session
  // is silently dropped and the user is logged out on the next request.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie as Parameters<typeof response.cookies.set>[2])
  })

  return response
}

// =============================================================================
// Matcher
// =============================================================================
//
// Run middleware on all routes EXCEPT:
//   - _next/static, _next/image     → Next.js internals / static assets
//   - favicon.ico                   → browser default
//   - /restaurant-not-found         → rewrite target (prevent loop)
//   - /restaurant-unavailable       → rewrite target (prevent loop)
//   - Common static file extensions → fonts, images, etc.

export const config = {
  matcher: [
    /*
     * Run middleware on all routes EXCEPT:
     *   _next/static, _next/image  — Next.js internals
     *   favicon.ico                — browser default
     *   api/*                      — API routes have no tenant headers; skip lookup
     *   restaurant-not-found       — rewrite target, prevent loop
     *   restaurant-unavailable     — rewrite target, prevent loop
     *   Common static extensions   — fonts, images, etc.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/|restaurant-not-found|restaurant-unavailable|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
}
