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

/**
 * Canonical cart item type — shared across:
 *   StorefrontClient (per-item quantity lookup)
 *   CartDrawer      (item list display)
 *   CheckoutForm    (read cart for order summary + order creation)
 *
 * Defined here to avoid circular imports between those files.
 */
export type CartEntry = {
  menuItemId: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

/** Minimal shape of a menu item required by addItem(). Matches MenuItem fields. */
interface AddableItem {
  id: string
  name: string
  price: number
  image_url: string | null
}

interface CartContextValue {
  /** Raw map keyed by menuItemId — use for O(1) per-item quantity lookups */
  cart: Record<string, CartEntry>
  /** Derived array form — use where iteration is needed (drawer, checkout) */
  cartEntries: CartEntry[]
  /** Sum of all quantities */
  totalItems: number
  /** Sum of price × quantity for all entries */
  totalPrice: number
  /** Add an item from the menu, or increment its quantity if already present */
  addItem: (item: AddableItem) => void
  /** Increment an existing cart item by 1 (used in drawer) */
  incrementItem: (itemId: string) => void
  /** Decrement by 1; removes the item if quantity reaches 0 */
  decrementItem: (itemId: string) => void
  /** Remove an item entirely regardless of quantity */
  removeItem: (itemId: string) => void
  /** Reset the cart to empty — call after successful order creation */
  clearCart: () => void
}

// =============================================================================
// Context
// =============================================================================

const CartContext = createContext<CartContextValue | null>(null)
CartContext.displayName = 'CartContext'

// =============================================================================
// Provider
// =============================================================================

/**
 * CartProvider — wraps the (storefront) layout so cart state persists
 * across client-side navigation between the menu page and checkout page.
 *
 * Cart is in-memory only (intentional MVP decision — see CLAUDE.md).
 * It resets on full page reload.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartEntry>>({})

  const addItem = useCallback((item: AddableItem) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.image_url,
        quantity: (prev[item.id]?.quantity ?? 0) + 1,
      },
    }))
  }, [])

  const incrementItem = useCallback((itemId: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantity: prev[itemId].quantity + 1 },
      }
    })
  }, [])

  const decrementItem = useCallback((itemId: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev
      if (prev[itemId].quantity <= 1) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantity: prev[itemId].quantity - 1 },
      }
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      delete next[itemId]
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
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// =============================================================================
// Consumer hook
// =============================================================================

/**
 * Access the shared cart state from any Client Component within the
 * storefront layout.
 *
 * @throws if called outside a `<CartProvider>` tree.
 */
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
