'use server'

import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { CartEntry } from '@/components/storefront/CartContext'

// =============================================================================
// Types
// =============================================================================

export type CheckoutInput = {
  name: string
  phone: string
  email?: string | null
  deliveryType: 'delivery' | 'pickup'
  address?: string | null
  lat?: number | null
  lng?: number | null
}

export type OrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string }

// Shape of one item in the orders.items JSONB column
type OrderItemSnapshot = {
  menu_item_id: string
  name: string
  quantity: number
  price: number // price AT time of order — immutable after this point
}

// =============================================================================
// Server Action
// =============================================================================

/**
 * createOrder — upsert customer + create order + create order_items.
 *
 * Uses the service role client because:
 *   1. Customers don't have Supabase Auth sessions (phone-identified)
 *   2. RLS anon policy allows INSERT on customers but not UPDATE
 *   3. We need to read-then-upsert in the same transaction context
 *
 * Security: this action is only reachable from our own client components.
 * The restaurant_id comes from middleware headers (not from the client).
 */
export async function createOrder(
  input: CheckoutInput,
  cartItems: CartEntry[],
): Promise<OrderResult> {
  // Guard: cart must have items
  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty.' }
  }

  try {
    // Read tenant context from middleware-injected headers (not from client)
    const { restaurantId } = await getRestaurantContext()

    const supabase = await createServiceRoleClient()

    // ── Normalize inputs ───────────────────────────────────────────────────
    // Phone: strip +91 prefix and any spaces/hyphens → 10-digit string
    const phone = input.phone
      .replace(/^\+91[\-\s]?/, '')
      .replace(/[\s\-]/g, '')
      .trim()

    const email =
      input.email && input.email.trim() !== '' ? input.email.trim() : null

    // ── Step 1: Upsert customer by phone ───────────────────────────────────
    // ON CONFLICT (phone) → update name and email so returning customers
    // see their latest details pre-filled.
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        { phone, name: input.name.trim(), email },
        { onConflict: 'phone', ignoreDuplicates: false },
      )
      .select('id, user_id')
      .single()

    if (customerError || !customer) {
      console.error('[createOrder] customer upsert failed:', customerError)
      return {
        success: false,
        error: 'Failed to save your details. Please check your phone number and try again.',
      }
    }

    // ── Step 2: Build the immutable JSONB snapshot ─────────────────────────
    // Never reference live menu_items prices after this point.
    // The snapshot is the ground truth for receipts and refunds.
    const itemsSnapshot = cartItems.map((item) => ({
      menu_item_id: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      selectedVariants: item.selectedVariants,
      selectedAddons: item.selectedAddons,
    }))

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )

    // ── Step 3: Create the order row ───────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customer.id,
        items: itemsSnapshot,          // JSONB snapshot
        total_amount: totalAmount,
        status: 'new',
        payment_status: 'pending',
        delivery_type: input.deliveryType,
        delivery_address:
          input.deliveryType === 'delivery' ? (input.address?.trim() ?? null) : null,
        delivery_lat: input.deliveryType === 'delivery' ? (input.lat ?? null) : null,
        delivery_lng: input.deliveryType === 'delivery' ? (input.lng ?? null) : null,
        customer_email: email,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[createOrder] order insert failed:', orderError)
      return {
        success: false,
        error: 'Failed to place your order. Please try again.',
      }
    }

    // ── Step 3.5: Save delivery address if logged in ───────────────────────
    if (customer.user_id && input.deliveryType === 'delivery' && input.address) {
      // Basic heuristic: check if this address already exists
      const { data: existingAddresses } = await supabase
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('address_line', input.address.trim())
      
      if (!existingAddresses || existingAddresses.length === 0) {
        // Find if this should be the default
        const { count } = await supabase
          .from('customer_addresses')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
        
        await supabase.from('customer_addresses').insert({
          customer_id: customer.id,
          label: count === 0 ? 'Home' : 'Other',
          address_line: input.address.trim(),
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          is_default: count === 0
        })
      }
    }

    // ── Step 4: Create normalised order_items rows ─────────────────────────
    // Mirrors the JSONB snapshot for analytics queries. menu_item_id may be
    // null in future if items are deleted — that's fine, snapshot is the record.
    const { error: itemsError } = await supabase.from('order_items').insert(
      cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        quantity: item.quantity,
        price_at_order: item.price,
      })),
    )

    if (itemsError) {
      // Non-fatal: the order exists and the JSONB snapshot is accurate.
      // order_items can be reconstructed from orders.items if needed.
      console.error(
        '[createOrder] order_items insert failed (non-fatal):',
        itemsError,
      )
    }

    return { success: true, orderId: order.id }
  } catch (err) {
    console.error('[createOrder] unexpected error:', err)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
