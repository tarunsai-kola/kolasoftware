'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

// =============================================================================
// Types
// =============================================================================

export type SelectedVariant = {
  groupId: string
  groupName: string
  variantName: string
  price: number
}

export type SelectedAddon = {
  groupId: string
  addonName: string
  price: number
}

export type CartEntry = {
  cartEntryId: string // Unique hash for this specific configuration
  menuItemId: string
  name: string
  basePrice: number
  price: number // Total price (base + variants + addons)
  imageUrl: string | null
  quantity: number
  selectedVariants?: SelectedVariant[]
  selectedAddons?: SelectedAddon[]
}

/** Minimal shape of a menu item required by addItem(). */
interface AddableItem {
  id: string
  name: string
  basePrice: number
  image_url: string | null
  selectedVariants?: SelectedVariant[]
  selectedAddons?: SelectedAddon[]
}

interface CartContextValue {
  cart: Record<string, CartEntry>
  cartEntries: CartEntry[]
  totalItems: number
  totalPrice: number
  addItem: (item: AddableItem) => void
  incrementItem: (cartEntryId: string) => void
  decrementItem: (cartEntryId: string) => void
  removeItem: (cartEntryId: string) => void
  clearCart: () => void
  getItemQuantity: (menuItemId: string) => number // Total quantity of a menuItem across all configurations
}

// =============================================================================
// Context
// =============================================================================

const CartContext = createContext<CartContextValue | null>(null)
CartContext.displayName = 'CartContext'

// =============================================================================
// Provider
// =============================================================================

function generateEntryId(item: AddableItem): string {
  // If no customizations, the ID is just the menuItemId
  if (!item.selectedVariants?.length && !item.selectedAddons?.length) {
    return item.id
  }
  
  // Sort to ensure identical configurations generate the same ID
  const varString = item.selectedVariants
    ? item.selectedVariants.map(v => `${v.groupId}:${v.variantName}`).sort().join('|')
    : ''
  const addString = item.selectedAddons
    ? item.selectedAddons.map(a => `${a.groupId}:${a.addonName}`).sort().join('|')
    : ''

  return `${item.id}-[V:${varString}]-[A:${addString}]`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartEntry>>({})

  const addItem = useCallback((item: AddableItem) => {
    const entryId = generateEntryId(item)
    
    // Calculate total unit price
    const variantsPrice = item.selectedVariants?.reduce((sum, v) => sum + v.price, 0) || 0
    const addonsPrice = item.selectedAddons?.reduce((sum, a) => sum + a.price, 0) || 0
    const totalPrice = item.basePrice + variantsPrice + addonsPrice

    setCart((prev) => ({
      ...prev,
      [entryId]: {
        cartEntryId: entryId,
        menuItemId: item.id,
        name: item.name,
        basePrice: item.basePrice,
        price: totalPrice,
        imageUrl: item.image_url,
        selectedVariants: item.selectedVariants,
        selectedAddons: item.selectedAddons,
        quantity: (prev[entryId]?.quantity ?? 0) + 1,
      },
    }))
  }, [])

  const incrementItem = useCallback((entryId: string) => {
    setCart((prev) => {
      if (!prev[entryId]) return prev
      return {
        ...prev,
        [entryId]: { ...prev[entryId], quantity: prev[entryId].quantity + 1 },
      }
    })
  }, [])

  const decrementItem = useCallback((entryId: string) => {
    setCart((prev) => {
      if (!prev[entryId]) return prev
      if (prev[entryId].quantity <= 1) {
        const next = { ...prev }
        delete next[entryId]
        return next
      }
      return {
        ...prev,
        [entryId]: { ...prev[entryId], quantity: prev[entryId].quantity - 1 },
      }
    })
  }, [])

  const removeItem = useCallback((entryId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      delete next[entryId]
      return next
    })
  }, [])

  const clearCart = useCallback(() => setCart({}), [])

  const cartEntries = useMemo(() => Object.values(cart), [cart])

  const totalItems = useMemo(
    () => cartEntries.reduce((s, e) => s + e.quantity, 0),
    [cartEntries],
  )

  const totalPrice = useMemo(
    () => cartEntries.reduce((s, e) => s + e.price * e.quantity, 0),
    [cartEntries],
  )

  const getItemQuantity = useCallback((menuItemId: string) => {
    return cartEntries
      .filter(entry => entry.menuItemId === menuItemId)
      .reduce((sum, entry) => sum + entry.quantity, 0)
  }, [cartEntries])

  const value: CartContextValue = {
    cart,
    cartEntries,
    totalItems,
    totalPrice,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    getItemQuantity,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// =============================================================================
// Consumer hook
// =============================================================================

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error(
      'useCart() must be called inside a <CartProvider>. ' +
        'Ensure (storefront)/layout.tsx wraps children with <CartProvider>.',
    )
  }
  return ctx
}
