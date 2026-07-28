import { headers } from 'next/headers'

// =============================================================================
// Types
// =============================================================================

/**
 * Branding and display tokens for a restaurant.
 * Populated from the restaurants table and injected by middleware.
 */
export interface RestaurantTheme {
  /** Display name of the restaurant, e.g. "Spice House" */
  name: string
  /** URL of the restaurant's logo image, or null if not set */
  logoUrl: string | null
  /** Primary brand colour as a hex string, e.g. "#D85A30" */
  primaryColor: string
  /** CSS font-family value, e.g. "Inter" or "Playfair Display" */
  fontFamily: string
  /** URL of the hero/banner image, or null if not set */
  bannerImageUrl: string | null
  /** WhatsApp contact number, e.g. "+1234567890" or null if not set */
  whatsappNumber: string | null
  /** Whether the restaurant is currently open and accepting orders */
  isAcceptingOrders: boolean
  /** Optional announcement message to show as a marquee */
  announcementMessage: string | null
}

/**
 * Full tenant context available to every Server Component on a restaurant route.
 */
export interface RestaurantContext {
  /** UUID of the restaurant row in the `restaurants` table */
  restaurantId: string
  /** All branding tokens parsed from the x-restaurant-theme header */
  theme: RestaurantTheme
}

// =============================================================================
// Internal header constants
// Must match the header names written in middleware.ts
// =============================================================================

const HEADER_RESTAURANT_ID = 'x-restaurant-id'
const HEADER_RESTAURANT_THEME = 'x-restaurant-theme'

// =============================================================================
// Public API
// =============================================================================

/**
 * Read the restaurant context injected by middleware into request headers.
 *
 * Use this in:
 *   - Server Components (layouts, pages)
 *   - Server Actions
 *   - Route Handlers
 *
 * Do NOT call this in Client Components — pass the context down as props,
 * or create a React context in a layout that wraps your client components.
 *
 * @throws {RestaurantContextError} if the headers are missing or malformed.
 *   This should never happen on a valid restaurant route; if it does, the
 *   middleware matcher is misconfigured or a page is being accessed directly
 *   outside a restaurant domain.
 *
 * @example
 * // In a Server Component layout:
 * const { restaurantId, theme } = await getRestaurantContext()
 * return (
 *   <html style={{ '--color-primary': theme.primaryColor }}>
 *     ...
 *   </html>
 * )
 */
export async function getRestaurantContext(): Promise<RestaurantContext> {
  const headersList = await headers()

  const restaurantId = headersList.get(HEADER_RESTAURANT_ID)
  const themeJson = headersList.get(HEADER_RESTAURANT_THEME)

  if (!restaurantId) {
    throw new RestaurantContextError(
      `Header "${HEADER_RESTAURANT_ID}" is missing. ` +
        'Ensure middleware is running for this route and the request ' +
        'is coming from a valid restaurant domain.',
    )
  }

  if (!themeJson) {
    throw new RestaurantContextError(
      `Header "${HEADER_RESTAURANT_THEME}" is missing. ` +
        'Ensure middleware is running for this route.',
    )
  }

  let theme: RestaurantTheme
  try {
    const parsed = JSON.parse(themeJson)
    theme = {
      ...parsed,
      isAcceptingOrders: parsed.isAcceptingOrders ?? true,
      announcementMessage: parsed.announcementMessage ?? null,
    } as RestaurantTheme
  } catch {
    throw new RestaurantContextError(
      `Header "${HEADER_RESTAURANT_THEME}" contains invalid JSON: ${themeJson}`,
    )
  }

  // Validate that required theme fields are present
  if (!theme.primaryColor || !theme.fontFamily) {
    throw new RestaurantContextError(
      `Parsed theme is missing required fields. Got: ${themeJson}`,
    )
  }

  console.log('[getRestaurantContext] Parsed theme:', {
    isAcceptingOrders: theme.isAcceptingOrders,
    announcementMessage: theme.announcementMessage
  })

  return { restaurantId, theme }
}

/**
 * Like `getRestaurantContext()` but returns `null` instead of throwing when
 * headers are absent.
 *
 * Use this in shared layouts that may render on both tenant routes (where
 * headers are present) and non-tenant routes (e.g. the admin portal,
 * /restaurant-not-found, /restaurant-unavailable).
 *
 * @example
 * const ctx = await getRestaurantContextOrNull()
 * if (ctx) {
 *   // Apply restaurant branding
 * }
 */
export async function getRestaurantContextOrNull(): Promise<RestaurantContext | null> {
  try {
    return await getRestaurantContext()
  } catch (err) {
    if (err instanceof RestaurantContextError) return null
    // Re-throw unexpected errors (e.g. next/headers itself failing)
    throw err
  }
}

// =============================================================================
// Error class
// =============================================================================

/**
 * Thrown by `getRestaurantContext()` when the middleware-injected headers
 * are missing or malformed.
 */
export class RestaurantContextError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RestaurantContextError'
  }
}
