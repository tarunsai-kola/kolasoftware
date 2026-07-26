'use client'

import {
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from 'react'
import type { CartEntry } from './CartContext'

// =============================================================================
// Props
// =============================================================================

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartEntry[]
  totalPrice: number
  onIncrement: (itemId: string) => void
  onDecrement: (itemId: string) => void
  onRemove: (itemId: string) => void
  formatPrice: (price: number) => string
  /** Called when the user confirms they want to proceed to checkout */
  onCheckout?: () => void
}

// =============================================================================
// CartDrawer
// =============================================================================

/**
 * Slide-in cart drawer — rendered at the root of StorefrontClient so it sits
 * above all content via z-index.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true" signals a modal to screen readers
 *   - Focus is trapped inside while open (Tab / Shift+Tab cycle within drawer)
 *   - Escape key closes the drawer
 *   - Previously focused element is restored on close
 *   - aria-live="polite" on the total price announces changes to screen readers
 *
 * Animation:
 *   - Panel: translate-x-full → translate-x-0 (300ms ease-in-out)
 *   - Backdrop: opacity-0 → opacity-100 (300ms)
 *   - Both transitions play in both directions (open and close)
 */
export default function CartDrawer({
  isOpen,
  onClose,
  items,
  totalPrice,
  onIncrement,
  onDecrement,
  onRemove,
  formatPrice,
  onCheckout,
}: CartDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ── Focus trap + keyboard handling ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const panel = panelRef.current
    if (!panel) return

    // Save the element that was focused before opening so we can restore it
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Move focus into the drawer — the close button is first
    // Use rAF to ensure the transition has started and element is visible
    const focusRaf = requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    // Collect all keyboard-focusable elements within the drawer
    const getFocusable = (): HTMLElement[] =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(', '),
        ),
      )

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Trap Tab / Shift+Tab
      if (e.key !== 'Tab') return

      const focusable = getFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        // Shift+Tab from first → jump to last
        if (active === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab from last → jump to first
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusRaf)
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to whatever was active before the drawer opened
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  const isEmpty = items.length === 0
  const totalItems = items.reduce((s, e) => s + e.quantity, 0)

  // ── Click-outside handler ───────────────────────────────────────────────────
  // The backdrop <div> covers the rest of the screen. We close on its click.
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only fire if the click was directly on the backdrop, not bubbled from panel
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  return (
    // Outer container — full screen, z-above everything else
    // pointer-events-none when closed so the page underneath is clickable
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* ── Drawer panel ──────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out will-change-transform sm:max-w-[420px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <CartSVG className="h-5 w-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Your Cart</h2>
            {totalItems > 0 && (
              <span
                className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: 'var(--restaurant-primary)' }}
                aria-label={`${totalItems} ${totalItems === 1 ? 'item' : 'items'} in cart`}
              >
                {totalItems}
              </span>
            )}
          </div>

          {/* Close button — first focusable element in the drawer */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2"
            style={
              { '--tw-ring-color': 'var(--restaurant-primary-muted)' } as CSSProperties
            }
          >
            <CloseSVG className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable item list ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {isEmpty ? (
            <EmptyCartState onClose={onClose} />
          ) : (
            <ul
              className="divide-y divide-gray-100 px-5"
              role="list"
              aria-label="Cart items"
            >
              {items.map((entry) => (
                <CartItem
                  key={entry.menuItemId}
                  entry={entry}
                  onIncrement={() => onIncrement(entry.menuItemId)}
                  onDecrement={() => onDecrement(entry.menuItemId)}
                  onRemove={() => onRemove(entry.menuItemId)}
                  formatPrice={formatPrice}
                />
              ))}
            </ul>
          )}
        </div>

        {/* ── Sticky footer ───────────────────────────────────────────────── */}
        {!isEmpty && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
            {/* Subtotal */}
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-500">Subtotal</span>
              <span
                className="text-2xl font-extrabold tabular-nums"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Subtotal: ${formatPrice(totalPrice)}`}
                style={{ color: 'var(--restaurant-primary)' }}
              >
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="mb-5 text-xs text-gray-400">
              Delivery charges and taxes calculated at checkout.
            </p>

            {/* Checkout CTA */}
            <button
              onClick={onCheckout}
              disabled={isEmpty}
              className="btn-brand w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Proceed to checkout — total ${formatPrice(totalPrice)}`}
            >
              <span>Proceed to checkout</span>
              <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-sm">
                {formatPrice(totalPrice)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CartItem row
// =============================================================================

interface CartItemProps {
  entry: CartEntry
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
  formatPrice: (price: number) => string
}

function CartItem({
  entry,
  onIncrement,
  onDecrement,
  onRemove,
  formatPrice,
}: CartItemProps) {
  const linePrice = entry.price * entry.quantity

  return (
    <li className="flex items-start gap-3 py-4">
      {/* Thumbnail */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {entry.imageUrl ? (
          <img
            src={entry.imageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xl" aria-hidden="true">🍴</span>
          </div>
        )}
      </div>

      {/* Name + stepper */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <span className="truncate text-sm font-semibold text-gray-900 leading-snug">
          {entry.name}
        </span>

        <div className="flex items-center justify-between gap-2">
          {/* Compact stepper */}
          <div
            role="group"
            aria-label={`Quantity for ${entry.name}`}
            className="flex items-center overflow-hidden rounded-lg"
            style={{ border: '1.5px solid var(--restaurant-primary)' }}
          >
            <button
              onClick={onDecrement}
              aria-label={
                entry.quantity === 1
                  ? `Remove ${entry.name} from cart`
                  : `Decrease ${entry.name} quantity`
              }
              className="flex h-7 w-7 items-center justify-center text-base font-bold transition-colors focus-visible:outline-none"
              style={{ color: 'var(--restaurant-primary)' }}
            >
              −
            </button>
            <span
              className="min-w-[1.75rem] select-none text-center text-sm font-bold tabular-nums"
              aria-live="polite"
              aria-atomic="true"
              style={{ color: 'var(--restaurant-primary)' }}
            >
              {entry.quantity}
            </span>
            <button
              onClick={onIncrement}
              aria-label={`Add another ${entry.name}`}
              className="flex h-7 w-7 items-center justify-center text-base font-bold transition-colors focus-visible:outline-none"
              style={{ color: 'var(--restaurant-primary)' }}
            >
              +
            </button>
          </div>

          {/* Line price */}
          <span className="shrink-0 text-sm font-bold text-gray-800 tabular-nums">
            {formatPrice(linePrice)}
          </span>
        </div>

        {/* Per-unit price hint when qty > 1 */}
        {entry.quantity > 1 && (
          <span className="text-[11px] text-gray-400">
            {formatPrice(entry.price)} each
          </span>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        aria-label={`Remove ${entry.name} from cart`}
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <TrashSVG className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

// =============================================================================
// Empty state
// =============================================================================

function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      {/* Illustrated empty bag */}
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: 'var(--restaurant-primary-muted)' }}
      >
        <CartSVG className="h-10 w-10" style={{ color: 'var(--restaurant-primary)' }} />
      </div>

      <h3 className="text-lg font-bold text-gray-800">Your cart is empty</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
        Add items from the menu to get started.
      </p>

      <button
        onClick={onClose}
        className="btn-brand mt-7 px-8"
        aria-label="Browse the menu"
      >
        Browse menu
      </button>
    </div>
  )
}

// =============================================================================
// Icons (inline SVGs — no icon library dependency)
// =============================================================================

function CartSVG({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function CloseSVG({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashSVG({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
