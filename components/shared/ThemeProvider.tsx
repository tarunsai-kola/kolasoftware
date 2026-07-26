'use client'

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export interface RestaurantTheme {
  name: string
  logoUrl: string | null
  primaryColor: string
  fontFamily: string
  bannerImageUrl: string | null
}

export interface RestaurantContextValue {
  /** UUID of the restaurant from the database */
  restaurantId: string
  /** All display/branding data */
  theme: RestaurantTheme
}

// =============================================================================
// Defaults
// =============================================================================
// Applied when theme props are missing or partially undefined.
// Keeps the UI coherent even if middleware data is unavailable
// (e.g. during local development without a real restaurant row).

const THEME_DEFAULTS = {
  primaryColor: '#D85A30',  // warm orange — neutral enough to not look broken
  fontFamily: 'system-ui, sans-serif',
  name: '',
  logoUrl: null,
  bannerImageUrl: null,
} satisfies RestaurantTheme

// =============================================================================
// Context
// =============================================================================

const RestaurantContext = createContext<RestaurantContextValue | null>(null)

RestaurantContext.displayName = 'RestaurantContext'

// =============================================================================
// Provider
// =============================================================================

export interface ThemeProviderProps {
  restaurantId: string
  theme: Partial<RestaurantTheme>
  children: ReactNode
}

/**
 * ThemeProvider — inject per-restaurant CSS custom properties and expose
 * restaurant context to the entire Client Component tree.
 *
 * **Where to render this:**
 * In the storefront and dashboard layouts (server components) that read the
 * middleware-injected headers via `getRestaurantContext()`, then pass the
 * result down as props to this component.
 *
 * **What it does:**
 * 1. Merges incoming theme props with safe defaults (never crashes on nulls).
 * 2. Sets CSS custom properties on `document.documentElement` via useEffect
 *    so they cascade to every element — no inline style pollution.
 * 3. Also writes an inline `style` attribute on the wrapping `<div>` for
 *    SSR correctness (custom properties are available on first paint).
 * 4. Provides `useRestaurantContext()` to any nested client component.
 *
 * @example
 * // In a Server Component layout:
 * const { restaurantId, theme } = await getRestaurantContext()
 * return (
 *   <ThemeProvider restaurantId={restaurantId} theme={theme}>
 *     {children}
 *   </ThemeProvider>
 * )
 */
export function ThemeProvider({
  restaurantId,
  theme: rawTheme,
  children,
}: ThemeProviderProps) {
  // Merge partial theme props with defaults — every field is guaranteed defined
  const theme: RestaurantTheme = {
    primaryColor: rawTheme.primaryColor || THEME_DEFAULTS.primaryColor,
    fontFamily: rawTheme.fontFamily || THEME_DEFAULTS.fontFamily,
    name: rawTheme.name || THEME_DEFAULTS.name,
    logoUrl: rawTheme.logoUrl ?? null,
    bannerImageUrl: rawTheme.bannerImageUrl ?? null,
  }

  // Derived colours — computed once so they're consistent across SSR and client
  const primaryHsl = hexToHslComponents(theme.primaryColor)

  // ── CSS variable map ────────────────────────────────────────────────────────
  // All variables prefixed with --restaurant- to avoid collisions with
  // Tailwind's or Next.js's own CSS variables.
  const cssVars = {
    '--restaurant-primary':         theme.primaryColor,
    '--restaurant-primary-h':       primaryHsl ? String(primaryHsl.h) : '19',
    '--restaurant-primary-s':       primaryHsl ? `${primaryHsl.s}%` : '67%',
    '--restaurant-primary-l':       primaryHsl ? `${primaryHsl.l}%` : '50%',
    '--restaurant-primary-light':   primaryHsl
      ? `hsl(${primaryHsl.h} ${primaryHsl.s}% ${Math.min(primaryHsl.l + 15, 95)}%)`
      : '#e8896b',
    '--restaurant-primary-dark':    primaryHsl
      ? `hsl(${primaryHsl.h} ${primaryHsl.s}% ${Math.max(primaryHsl.l - 15, 10)}%)`
      : '#a83d15',
    '--restaurant-primary-muted':   primaryHsl
      ? `hsl(${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}% / 0.12)`
      : 'rgb(216 90 48 / 0.12)',
    '--restaurant-font':            theme.fontFamily,
  } as const

  // ── useEffect: update document root on client ──────────────────────────────
  // This runs after hydration and whenever the theme changes. Writing to
  // documentElement ensures the variables cascade globally without needing
  // every component to have its own style prop.
  useEffect(() => {
    const root = document.documentElement
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Set the font-family on body for components that use var(--restaurant-font)
    document.body.style.setProperty(
      'font-family',
      `var(--restaurant-font), system-ui, sans-serif`,
    )

    return () => {
      // Clean up on unmount (e.g. route changes in the same browser session
      // that switch between restaurants — unlikely but defensive)
      Object.keys(cssVars).forEach((key) => {
        root.style.removeProperty(key)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.primaryColor, theme.fontFamily])

  const contextValue: RestaurantContextValue = { restaurantId, theme }

  return (
    <RestaurantContext.Provider value={contextValue}>
      {/*
        Inline `style` serves two purposes:
        1. SSR: CSS variables are present on the very first HTML paint before
           useEffect runs, avoiding a flash of un-themed content.
        2. Scoping: variables are also scoped to this subtree in addition to
           the document root, so they work in Shadow DOM / iframe contexts.
      */}
      <div
        style={cssVars as React.CSSProperties}
        // data-restaurant-id is useful for Cypress / Playwright selectors
        data-restaurant-id={restaurantId}
      >
        {children}
      </div>
    </RestaurantContext.Provider>
  )
}

// =============================================================================
// Consumer Hook
// =============================================================================

/**
 * Access the current restaurant's theme and ID from any Client Component.
 *
 * @throws if called outside a `<ThemeProvider>` tree.
 *
 * @example
 * const { theme, restaurantId } = useRestaurantContext()
 * return <img src={theme.logoUrl ?? '/default-logo.png'} alt={theme.name} />
 */
export function useRestaurantContext(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) {
    throw new Error(
      'useRestaurantContext() must be called inside a <ThemeProvider>. ' +
        'Ensure the storefront or dashboard layout wraps its children with <ThemeProvider>.',
    )
  }
  return ctx
}

/**
 * Like `useRestaurantContext()` but returns null instead of throwing when
 * called outside a `<ThemeProvider>` tree.
 * Use in shared components that may render in both tenant and non-tenant routes.
 */
export function useRestaurantContextOrNull(): RestaurantContextValue | null {
  return useContext(RestaurantContext)
}

// =============================================================================
// Colour Utility — hex → HSL components
// =============================================================================
// Splitting primary into H, S, L components lets us derive light/dark/muted
// variants purely from CSS math without a colour library dependency.

interface HslComponents {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

function hexToHslComponents(hex: string): HslComponents | null {
  // Normalise: strip # and handle 3-char shorthand
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean

  if (full.length !== 6) return null

  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}
