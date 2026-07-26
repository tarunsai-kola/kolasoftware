'use client'

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from 'react'
import { useRestaurantContext } from '@/components/shared/ThemeProvider'
import { useCart } from './CartContext'
import type { MenuItem } from '@/app/(storefront)/page'
import MenuItemCard from './MenuItemCard'
import CartDrawer from './CartDrawer'

// =============================================================================
// Helpers (module-private)
// =============================================================================

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})
}

// =============================================================================
// StorefrontClient
// =============================================================================

interface StorefrontClientProps {
  menuItems: MenuItem[]
}

export default function StorefrontClient({ menuItems }: StorefrontClientProps) {
  const { theme } = useRestaurantContext()

  // ── Cart — from shared CartContext (persists to /checkout) ─────────────────
  const {
    cart,
    cartEntries,
    totalItems,
    totalPrice,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
  } = useCart()

  // ── Drawer open/close state ────────────────────────────────────────────────
  // Kept here (not in CartContext) since the drawer is only rendered on this page.
  const [isCartOpen, setIsCartOpen] = useState(false)
  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  // ── Grouped menu + categories ──────────────────────────────────────────────
  const groupedItems = useMemo(() => groupByCategory(menuItems), [menuItems])
  const categories = useMemo(() => Object.keys(groupedItems), [groupedItems])

  // ── Active category scrollspy ──────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>(
    () => categories[0] ?? '',
  )
  const categoryNavRef = useRef<HTMLDivElement>(null)

  // Sync active pill into horizontal view whenever activeCategory changes
  useEffect(() => {
    const nav = categoryNavRef.current
    if (!nav || !activeCategory) return
    const pill = nav.querySelector<HTMLElement>(
      `[data-pill="${CSS.escape(activeCategory)}"]`,
    )
    pill?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [activeCategory])

  // IntersectionObserver scrollspy — highlight the pill matching the visible section
  useEffect(() => {
    if (categories.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) {
          setActiveCategory(visible.target.getAttribute('data-category') ?? '')
        }
      },
      {
        rootMargin: '-128px 0px -55% 0px',
        threshold: 0,
      },
    )

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${slugify(cat)}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [categories])

  // ── Header show/hide on scroll ─────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 180)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Category click → scroll ────────────────────────────────────────────────
  const scrollToCategory = useCallback((category: string) => {
    const el = document.getElementById(`cat-${slugify(category)}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 128
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gray-50 font-brand">

      {/* ── Hero / Banner ───────────────────────────────────────────────────── */}
      <div className="relative h-52 overflow-hidden sm:h-72">
        {theme.bannerImageUrl ? (
          <img
            src={theme.bannerImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, var(--restaurant-primary-dark) 0%, var(--restaurant-primary) 60%, var(--restaurant-primary-light) 100%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
        <div className="relative z-10 flex h-full flex-col items-center justify-end gap-2 pb-8 text-center">
          {theme.logoUrl && (
            <img
              src={theme.logoUrl}
              alt={`${theme.name} logo`}
              className="mb-1 h-16 w-16 rounded-full border-2 border-white/60 object-cover shadow-xl ring-4 ring-black/10"
            />
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl">
            {theme.name}
          </h1>
          <p className="text-xs font-medium text-white/70 tracking-wider uppercase">
            Order directly · No commissions
          </p>
        </div>
      </div>

      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'shadow-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {theme.logoUrl ? (
            <img
              src={theme.logoUrl}
              alt=""
              aria-hidden="true"
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'var(--restaurant-primary)' }}
              aria-hidden="true"
            >
              {theme.name ? theme.name[0].toUpperCase() : '?'}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-gray-900">
            {theme.name}
          </span>
        </div>

        <CartHeaderButton
          totalItems={totalItems}
          totalPrice={totalPrice}
          formatPrice={formatPrice}
          onOpen={openCart}
        />
      </header>

      {/* ── Category Navigation ─────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <nav
          ref={categoryNavRef}
          aria-label="Menu categories"
          className="sticky top-14 z-40 flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 scrollbar-hide"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              data-pill={cat}
              onClick={() => scrollToCategory(cat)}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
              style={
                activeCategory === cat
                  ? ({
                      background: 'var(--restaurant-primary)',
                      color: '#fff',
                      boxShadow: '0 2px 8px var(--restaurant-primary-muted)',
                    } as CSSProperties)
                  : ({
                      background: 'var(--restaurant-primary-muted)',
                      color: 'var(--restaurant-primary-dark)',
                    } as CSSProperties)
              }
              aria-current={activeCategory === cat ? 'true' : undefined}
            >
              {cat}
            </button>
          ))}
        </nav>
      )}

      {/* ── Menu ────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-4 py-8 pb-28">
        {menuItems.length === 0 ? (
          <EmptyMenu restaurantName={theme.name} />
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <section
                key={category}
                id={`cat-${slugify(category)}`}
                data-category={category}
                className="scroll-mt-32"
              >
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    {category}
                  </h2>
                  <div
                    className="h-px flex-1"
                    style={{ background: 'var(--restaurant-primary-muted)' }}
                  />
                  <span className="shrink-0 text-xs text-gray-400">
                    {groupedItems[category].length}{' '}
                    {groupedItems[category].length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {groupedItems[category].map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={cart[item.id]?.quantity ?? 0}
                      onAdd={() => addItem(item)}
                      onDecrement={() => decrementItem(item.id)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* ── Floating cart bar (mobile) ───────────────────────────────────────── */}
      <CartFab
        totalItems={totalItems}
        totalPrice={totalPrice}
        formatPrice={formatPrice}
        onOpen={openCart}
      />

      {/* ── Cart drawer ─────────────────────────────────────────────────────── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartEntries}
        totalPrice={totalPrice}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onRemove={removeItem}
        formatPrice={formatPrice}
      />
    </div>
  )
}

// =============================================================================
// Private sub-components
// =============================================================================

function CartHeaderButton({
  totalItems,
  totalPrice,
  formatPrice,
  onOpen,
}: {
  totalItems: number
  totalPrice: number
  formatPrice: (p: number) => string
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      aria-label={
        totalItems > 0
          ? `View cart — ${totalItems} items, ${formatPrice(totalPrice)}`
          : 'Open cart'
      }
      aria-haspopup="dialog"
      className="relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
      style={{
        background: 'var(--restaurant-primary)',
        ['--tw-ring-color' as string]: 'var(--restaurant-primary-muted)',
      }}
    >
      <CartSVG className="h-3.5 w-3.5" />
      {totalItems > 0 ? (
        <>
          <span>{totalItems}</span>
          <span className="text-white/60">·</span>
          <span>{formatPrice(totalPrice)}</span>
        </>
      ) : (
        <span>Cart</span>
      )}
    </button>
  )
}

function CartFab({
  totalItems,
  totalPrice,
  formatPrice,
  onOpen,
}: {
  totalItems: number
  totalPrice: number
  formatPrice: (p: number) => string
  onOpen: () => void
}) {
  if (totalItems === 0) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[49] -translate-x-1/2 sm:hidden"
      style={{ animation: 'fadeInUp 0.25s ease-out' }}
    >
      <button
        onClick={onOpen}
        aria-label={`View cart — ${totalItems} items, ${formatPrice(totalPrice)}`}
        aria-haspopup="dialog"
        className="flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-2xl transition-transform duration-150 active:scale-95 focus-visible:outline-none"
        style={{
          background: 'var(--restaurant-primary)',
          boxShadow:
            '0 8px 30px var(--restaurant-primary-muted), 0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
          {totalItems}
        </span>
        <span>View cart</span>
        <span className="text-white/70">·</span>
        <span>{formatPrice(totalPrice)}</span>
      </button>
    </div>
  )
}

function EmptyMenu({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
        style={{ background: 'var(--restaurant-primary-muted)' }}
      >
        🍽️
      </div>
      <h2 className="text-xl font-bold text-gray-800">Menu coming soon</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
        {restaurantName
          ? `${restaurantName} is still setting up their menu.`
          : 'This restaurant is still setting up their menu.'}{' '}
        Check back shortly!
      </p>
    </div>
  )
}

function CartSVG({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
