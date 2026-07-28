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
import { useCustomer } from './CustomerContext'
import CustomerAuthModal from './CustomerAuthModal'
import CustomizationModal from './CustomizationModal'
import type { MenuItem } from '@/app/(storefront)/page'
import MenuItemCard from './MenuItemCard'
import CartDrawer from './CartDrawer'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// =============================================================================
// Helpers
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
  const router = useRouter()

  const {
    cart,
    cartEntries,
    totalItems,
    totalPrice,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    getItemQuantity,
  } = useCart()

  const { user, customer, isLoading: customerLoading, signOut } = useCustomer()
  const searchParams = useSearchParams()

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  
  // Calculate if the store is currently open based on IST time
  const isStoreOpen = useMemo(() => {
    if (!theme.isAcceptingOrders) return false
    if (!theme.openingTime || !theme.closingTime) return true

    try {
      const now = new Date()
      const istDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      const istDate = new Date(istDateStr)
      
      const currentTotalSeconds = istDate.getHours() * 3600 + istDate.getMinutes() * 60 + istDate.getSeconds()

      const parseTime = (t: string) => {
        const [h, m, s] = t.split(':').map(Number)
        return (h || 0) * 3600 + (m || 0) * 60 + (s || 0)
      }

      const openSecs = parseTime(theme.openingTime)
      const closeSecs = parseTime(theme.closingTime)

      if (openSecs < closeSecs) {
        // Normal day: e.g., 09:00 to 22:00
        return currentTotalSeconds >= openSecs && currentTotalSeconds <= closeSecs
      } else {
        // Overnight: e.g., 18:00 to 02:00
        return currentTotalSeconds >= openSecs || currentTotalSeconds <= closeSecs
      }
    } catch (e) {
      console.error('Failed to parse opening hours:', e)
      return theme.isAcceptingOrders
    }
  }, [theme.isAcceptingOrders, theme.openingTime, theme.closingTime])
  
  // Automatically open auth modal if ?login=true is in the URL
  useEffect(() => {
    if (searchParams?.get('login') === 'true' && !user && !customerLoading) {
      setIsAuthOpen(true)
      // Clean up URL without reloading
      router.replace('/')
    }
  }, [searchParams, user, customerLoading, router])

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const groupedItems = useMemo(() => groupByCategory(menuItems), [menuItems])
  const categories = useMemo(() => Object.keys(groupedItems), [groupedItems])

  const [activeCategory, setActiveCategory] = useState<string>(() => categories[0] ?? '')
  const categoryNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const nav = categoryNavRef.current
    if (!nav || !activeCategory) return
    const pill = nav.querySelector<HTMLElement>(`[data-pill="${CSS.escape(activeCategory)}"]`)
    pill?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [activeCategory])

  useEffect(() => {
    if (categories.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setActiveCategory(visible.target.getAttribute('data-category') ?? '')
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 },
    )
    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${slugify(cat)}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [categories])

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToCategory = useCallback((category: string) => {
    const el = document.getElementById(`cat-${slugify(category)}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen font-brand" style={{ background: '#faf9f7' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative h-60 overflow-hidden sm:h-80 group animate-fade-in-up">
        {/* Banner image or gradient */}
        {theme.bannerImageUrl ? (
          <img
            src={theme.bannerImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--restaurant-primary-dark) 0%, var(--restaurant-primary) 60%, var(--restaurant-primary-light) 100%)',
            }}
          />
        )}

        {/* Layered gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Identity — anchored to bottom of hero */}
        <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="flex items-end gap-4 transform transition-transform duration-700 hover:-translate-y-1">
            {theme.logoUrl && (
              <img
                src={theme.logoUrl}
                alt={`${theme.name} logo`}
                className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/50 object-cover shadow-2xl sm:h-20 sm:w-20 bg-white"
              />
            )}
            <div className="min-w-0 pb-1 flex-1">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl">
                {theme.name}
              </h1>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Order directly · No commissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ANNOUNCEMENT MARQUEE
      ════════════════════════════════════════════════════════════════════════ */}
      {theme.announcementMessage && (
        <div className="overflow-hidden whitespace-nowrap bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          <div className="inline-block animate-marquee">
            {theme.announcementMessage}
            <span className="mx-8 opacity-50">•</span>
            {theme.announcementMessage}
            <span className="mx-8 opacity-50">•</span>
            {theme.announcementMessage}
            <span className="mx-8 opacity-50">•</span>
            {theme.announcementMessage}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STICKY HEADER (appears after scroll past hero)
      ════════════════════════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200/50 bg-white/70 px-4 backdrop-blur-xl transition-all duration-300 sm:px-6 ${
          scrolled ? 'shadow-sm' : 'shadow-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {theme.logoUrl ? (
            <img
              src={theme.logoUrl}
              alt=""
              aria-hidden="true"
              className="h-7 w-7 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: 'var(--restaurant-primary)' }}
            >
              {theme.name ? theme.name[0].toUpperCase() : '?'}
            </span>
          )}
          <div className="flex flex-col">
            <span className="truncate text-sm font-bold text-gray-900">{theme.name}</span>
            {!isStoreOpen && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Closed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link
              href="/my-orders"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm transition-colors hover:bg-gray-200 sm:h-9 sm:w-9"
              aria-label="My Orders"
            >
              👤
            </Link>
          )}
          <CartHeaderButton
            totalItems={totalItems}
            totalPrice={totalPrice}
            formatPrice={formatPrice}
            onOpen={openCart}
          />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          CATEGORY NAV
      ════════════════════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <nav
          ref={categoryNavRef}
          aria-label="Menu categories"
          className="sticky top-16 z-40 flex gap-2.5 overflow-x-auto border-b border-gray-100/50 bg-white/70 px-4 py-3 backdrop-blur-xl scrollbar-hide sm:px-6"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              data-pill={cat}
              onClick={() => scrollToCategory(cat)}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 sm:px-5 sm:text-sm active:scale-95"
              style={
                activeCategory === cat
                  ? ({
                      background: 'var(--restaurant-primary)',
                      color: '#fff',
                      boxShadow: '0 4px 12px var(--restaurant-primary-muted)',
                      transform: 'translateY(-1px)',
                    } as CSSProperties)
                  : ({
                      background: '#f3f4f6',
                      color: '#4b5563',
                      border: '1px solid transparent',
                    } as CSSProperties)
              }
              aria-current={activeCategory === cat ? 'true' : undefined}
            >
              {cat}
            </button>
          ))}
        </nav>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MENU
      ════════════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-2xl px-4 py-6 pb-32 sm:px-6 sm:py-8">
        {menuItems.length === 0 ? (
          <EmptyMenu restaurantName={theme.name} />
        ) : (
          <div className="space-y-10">
            {categories.map((category) => (
              <section
                key={category}
                id={`cat-${slugify(category)}`}
                data-category={category}
                className="scroll-mt-28"
              >
                {/* ── Section header ──────────────────────────────────── */}
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
                    {category}
                  </h2>
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-400">
                    {groupedItems[category].length}
                  </span>
                </div>

                {/* ── Cards ───────────────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                  {groupedItems[category].map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={cart[item.id]?.quantity ?? 0}
                      totalQuantity={getItemQuantity(item.id)}
                      isClosed={!isStoreOpen}
                      onAdd={() => {
                        if (!isStoreOpen) return
                        const isCustomizable = (item.variant_groups && item.variant_groups.length > 0) || (item.addon_groups && item.addon_groups.length > 0)
                        if (isCustomizable) {
                          setCustomizingItem(item)
                        } else {
                          addItem({ ...item, basePrice: item.price })
                        }
                      }}
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

      {/* ── Floating cart bar ─────────────────────────────────────────────────── */}
      <CartFab
        totalItems={totalItems}
        totalPrice={totalPrice}
        formatPrice={formatPrice}
        onOpen={openCart}
      />

      {/* ── Cart drawer ───────────────────────────────────────────────────────── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartEntries}
        totalPrice={totalPrice}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onRemove={removeItem}
        formatPrice={formatPrice}
        onCheckout={() => {
          if (!user) {
            closeCart()
            setIsAuthOpen(true)
          } else {
            router.push('/checkout')
          }
        }}
        isClosed={!isStoreOpen}
      />

      {/* ── Customer Auth Modal ───────────────────────────────────────────────── */}
      <CustomerAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false)
          router.push('/checkout')
        }}
        primaryColor={theme.primaryColor}
      />

      {/* ── Customization Modal ───────────────────────────────────────────────── */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(customizedItem) => {
            addItem({
              id: customizingItem.id,
              name: customizingItem.name,
              basePrice: customizingItem.price,
              image_url: customizingItem.image_url,
              selectedVariants: customizedItem.selectedVariants,
              selectedAddons: customizedItem.selectedAddons
            })
            setCustomizingItem(null)
          }}
          primaryColor={theme.primaryColor}
        />
      )}
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
      className="relative flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 sm:text-sm"
      style={{
        background: 'var(--restaurant-primary)',
        ['--tw-ring-color' as string]: 'var(--restaurant-primary-muted)',
      } as CSSProperties}
    >
      <CartSVG className="h-3.5 w-3.5" />
      {totalItems > 0 ? (
        <>
          <span className="font-extrabold">{totalItems}</span>
          <span className="text-white/50">·</span>
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
      className="fixed bottom-6 left-1/2 z-[49] -translate-x-1/2 animate-fade-in-up"
    >
      <button
        onClick={onOpen}
        aria-label={`View cart — ${totalItems} items, ${formatPrice(totalPrice)}`}
        aria-haspopup="dialog"
        className="flex items-center gap-3 rounded-full px-6 py-4 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none animate-pulse-glow"
        style={{
          background: 'var(--restaurant-primary)',
        }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-xs font-black shadow-inner">
          {totalItems}
        </span>
        <span className="tracking-wide">View cart</span>
        <span className="text-white/60">·</span>
        <span className="font-extrabold">{formatPrice(totalPrice)}</span>
      </button>
    </div>
  )
}

function EmptyMenu({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
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
