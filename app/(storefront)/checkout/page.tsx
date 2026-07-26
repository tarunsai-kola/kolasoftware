import type { Metadata } from 'next'
import Link from 'next/link'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import CheckoutForm from '@/components/storefront/CheckoutForm'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { theme } = await getRestaurantContext()
    return {
      title: `Checkout — ${theme.name}`,
      robots: { index: false }, // checkout page must never be indexed
    }
  } catch {
    return { title: 'Checkout', robots: { index: false } }
  }
}

/**
 * Checkout page — server component wrapper.
 *
 * Reads restaurant context for the page header (logo, name).
 * Passes no cart data — CheckoutForm reads it from CartContext directly,
 * which persists across client-side navigation from the menu page.
 */
export default async function CheckoutPage() {
  const { theme } = await getRestaurantContext()

  return (
    <div className="min-h-screen bg-gray-50 font-brand pb-32 lg:pb-0">

      {/* ── Minimal header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm">
        {/* Back to menu */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          aria-label="Back to menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Menu
        </Link>

        {/* Restaurant identity */}
        <div className="flex items-center gap-2">
          {theme.logoUrl && (
            <img
              src={theme.logoUrl}
              alt=""
              aria-hidden="true"
              className="h-6 w-6 rounded-full object-cover"
            />
          )}
          <span className="text-sm font-semibold text-gray-800">{theme.name}</span>
        </div>

        {/* Spacer to keep identity centred */}
        <div className="w-16" aria-hidden="true" />
      </header>

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Review your order and enter your details below.
        </p>
      </div>

      {/* ── Form — client component that reads cart from CartContext ─────────── */}
      <CheckoutForm />
    </div>
  )
}
