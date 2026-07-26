'use client'

import { useState, type CSSProperties } from 'react'
import type { MenuItem } from '@/app/(storefront)/page'

// =============================================================================
// Props
// =============================================================================

interface MenuItemCardProps {
  item: MenuItem
  quantity: number
  onAdd: () => void
  onDecrement: () => void
  formatPrice: (price: number) => string
}

// =============================================================================
// Component
// =============================================================================

/**
 * MenuItemCard — displays a single menu item with an Add/Stepper toggle.
 *
 * Layout:
 *   - Image (top, 180px fixed height) or placeholder icon
 *   - Name, description (2-line clamp), price — below image
 *   - "Add" button → transitions to [-  n  +] stepper once quantity > 0
 *
 * All interactive colours use CSS variables from ThemeProvider so each
 * restaurant gets automatic branding without component changes.
 */
export default function MenuItemCard({
  item,
  quantity,
  onAdd,
  onDecrement,
  formatPrice,
}: MenuItemCardProps) {
  // Track image load errors so we can fall back to the placeholder icon
  const [imgError, setImgError] = useState(false)
  const showImage = Boolean(item.image_url) && !imgError

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
      aria-label={item.name}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gray-100">
        {showImage ? (
          <img
            src={item.image_url!}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage />
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold leading-snug text-gray-900">
          {item.name}
        </h3>

        {item.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}

        {/* ── Price + Add/Stepper ─────────────────────────────────────────── */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(item.price)}
          </span>

          {quantity === 0 ? (
            // "Add" button — transitions to stepper on first tap
            <AddButton onClick={onAdd} label={`Add ${item.name}`} />
          ) : (
            // Quantity stepper
            <Stepper
              quantity={quantity}
              onAdd={onAdd}
              onDecrement={onDecrement}
              itemName={item.name}
            />
          )}
        </div>
      </div>
    </article>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function AddButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1 rounded-lg px-5 py-1.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
      style={
        {
          background: 'var(--restaurant-primary)',
          '--tw-ring-color': 'var(--restaurant-primary-muted)',
        } as CSSProperties
      }
    >
      Add
      <span aria-hidden="true" className="text-white/70">
        +
      </span>
    </button>
  )
}

function Stepper({
  quantity,
  onAdd,
  onDecrement,
  itemName,
}: {
  quantity: number
  onAdd: () => void
  onDecrement: () => void
  itemName: string
}) {
  return (
    <div
      role="group"
      aria-label={`Quantity for ${itemName}`}
      className="flex items-center overflow-hidden rounded-lg"
      style={{
        border: '1.5px solid var(--restaurant-primary)',
      }}
    >
      <button
        onClick={onDecrement}
        aria-label={`Remove one ${itemName}`}
        className="flex h-8 w-9 items-center justify-center text-xl font-bold transition-colors duration-100 focus-visible:outline-none"
        style={{ color: 'var(--restaurant-primary)' }}
      >
        −
      </button>

      <span
        className="min-w-[2rem] select-none text-center text-sm font-bold tabular-nums"
        aria-live="polite"
        aria-atomic="true"
        style={{ color: 'var(--restaurant-primary)' }}
      >
        {quantity}
      </span>

      <button
        onClick={onAdd}
        aria-label={`Add another ${itemName}`}
        className="flex h-8 w-9 items-center justify-center text-xl font-bold transition-colors duration-100 focus-visible:outline-none"
        style={{ color: 'var(--restaurant-primary)' }}
      >
        +
      </button>
    </div>
  )
}

// ── Placeholder shown when item has no image or image fails to load ───────────

function PlaceholderImage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className="h-12 w-12 opacity-20"
        aria-hidden="true"
      >
        {/* Fork */}
        <rect x="12" y="8" width="4" height="20" rx="2" fill="currentColor" />
        <rect x="20" y="8" width="4" height="12" rx="2" fill="currentColor" />
        <rect x="28" y="8" width="4" height="20" rx="2" fill="currentColor" />
        <rect x="12" y="28" width="20" height="4" rx="2" fill="currentColor" />
        <rect x="20" y="32" width="4" height="24" rx="2" fill="currentColor" />
        {/* Knife */}
        <rect x="42" y="8" width="4" height="48" rx="2" fill="currentColor" />
        <path
          d="M42 8 C42 8 50 12 50 24 L46 24 L42 24 Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>
      <span className="text-xs text-gray-300">No image</span>
    </div>
  )
}
