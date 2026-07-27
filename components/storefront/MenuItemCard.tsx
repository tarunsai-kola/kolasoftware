'use client'

import { useState } from 'react'
import type { MenuItem } from '@/app/(storefront)/page'

interface MenuItemCardProps {
  item: MenuItem
  quantity: number
  totalQuantity?: number
  onAdd: () => void
  onDecrement: () => void
  formatPrice: (price: number) => string
}

export default function MenuItemCard({
  item,
  quantity,
  totalQuantity = quantity,
  onAdd,
  onDecrement,
  formatPrice,
}: MenuItemCardProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = Boolean(item.image_url) && !imgError
  
  const isCustomizable = (item.variant_groups && item.variant_groups.length > 0) || (item.addon_groups && item.addon_groups.length > 0)

  return (
    <article
      className="flex gap-4 p-4 sm:p-5 bg-white group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/50"
      aria-label={item.name}
    >
      {/* ── Text content ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {item.food_type && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-4 h-4 border flex items-center justify-center p-[2px] rounded-sm ${
              item.food_type === 'veg' ? 'border-green-600' : 
              item.food_type === 'non-veg' ? 'border-red-600' : 'border-yellow-500'
            }`}>
              {item.food_type === 'veg' && <div className="w-full h-full bg-green-600 rounded-full"></div>}
              {item.food_type === 'non-veg' && <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-600"></div>}
              {item.food_type === 'egg' && <div className="w-2 h-2.5 bg-yellow-500 rounded-full"></div>}
            </div>
            {item.cuisine_tags && item.cuisine_tags.length > 0 && (
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm truncate">
                {item.cuisine_tags.join(', ')}
              </span>
            )}
          </div>
        )}
        
        <h3 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-[#3e4152]">
          {item.name}
        </h3>
        
        <div className="mt-1 text-[15px] font-medium text-[#3e4152]">
          {formatPrice(item.price)}
        </div>

        {item.description && (
          <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-[#686b78]">
            {item.description}
          </p>
        )}
        
        {isCustomizable && (
          <p className="mt-2 text-[12px] font-medium text-amber-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Customizable
          </p>
        )}
        
        {/* If NO image, put the button at the bottom left or we just let it sit on the right? 
            Zomato puts it on the right side. */}
        {!showImage && (
          <div className="mt-4 sm:hidden">
            <ActionButton isCustomizable={isCustomizable} quantity={quantity} onAdd={onAdd} onDecrement={onDecrement} />
          </div>
        )}
      </div>

      {/* ── Image & Action Area ────────────────────────────────────────────── */}
      <div className={`relative shrink-0 flex flex-col items-center justify-center ${showImage ? 'w-[118px] sm:w-[140px]' : 'w-auto'}`}>
        
        {showImage && (
          <div className="relative w-[118px] h-[118px] sm:w-[140px] sm:h-[140px] mb-3">
            <div className="w-full h-full overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] bg-gray-50">
              <img
                src={item.image_url!}
                alt={item.name}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            {/* Overlapping Button */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
              <ActionButton isCustomizable={isCustomizable} quantity={quantity} onAdd={onAdd} onDecrement={onDecrement} />
            </div>
          </div>
        )}

        {/* If NO image, the button just sits on the right vertically centered (hidden on mobile to show it bottom left instead) */}
        {!showImage && (
          <div className="hidden sm:block">
            <ActionButton isCustomizable={isCustomizable} quantity={quantity} onAdd={onAdd} onDecrement={onDecrement} />
          </div>
        )}

      </div>
    </article>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function ActionButton({ 
  isCustomizable,
  quantity, 
  onAdd, 
  onDecrement 
}: { 
  isCustomizable: boolean | undefined | null
  quantity: number
  onAdd: () => void
  onDecrement: () => void 
}) {
  // If it's customizable, we always show the ADD/CUSTOMIZE button to open the modal
  if (isCustomizable) {
    return (
      <div className="relative">
        <button 
          onClick={onAdd}
          className="bg-white text-[var(--restaurant-primary,#e23744)] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.08)] font-bold text-[14px] sm:text-[15px] px-7 sm:px-9 py-2 rounded-full tracking-wide hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap z-10"
        >
          ADD <span className="absolute top-1 right-2 sm:right-3 text-[10px] sm:text-[12px] font-black opacity-70">+</span>
        </button>
      </div>
    )
  }

  if (quantity === 0) {
    return (
      <button 
        onClick={onAdd}
        className="bg-white text-[var(--restaurant-primary,#e23744)] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.08)] font-bold text-[15px] px-8 py-2 rounded-full uppercase tracking-wide hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap z-10"
      >
        ADD
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between bg-white text-[var(--restaurant-primary,#e23744)] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-full whitespace-nowrap min-w-[100px] overflow-hidden z-10">
      <button 
        onClick={onDecrement} 
        className="flex items-center justify-center w-9 h-10 text-xl font-medium hover:bg-[var(--restaurant-primary-muted)] active:bg-gray-100 transition-colors focus:outline-none"
      >
        −
      </button>
      <span className="text-[15px] font-bold w-6 text-center select-none">
        {quantity}
      </span>
      <button 
        onClick={onAdd} 
        className="flex items-center justify-center w-9 h-10 text-xl font-medium hover:bg-[var(--restaurant-primary-muted)] active:bg-gray-100 transition-colors focus:outline-none"
      >
        +
      </button>
    </div>
  )
}
