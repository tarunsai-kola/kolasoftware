'use server'

import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createServiceRoleClient, createClient } from '@/lib/supabase/server'
import { sendOrderConfirmationWhatsApp } from '@/lib/whatsapp'
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
  couponCode?: string | null
  paymentMethod: 'cod' | 'online'
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

export async function validateCoupon(code: string, cartTotal: number, phone: string | null) {
  try {
    const { restaurantId } = await getRestaurantContext()
    const supabase = await createServiceRoleClient()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('code', code.toUpperCase())
      .single()

    if (error || !coupon) {
      return { success: false, error: 'Invalid coupon code.' }
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { success: false, error: 'This coupon has expired.' }
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { success: false, error: 'This coupon has reached its overall usage limit.' }
    }

    if (cartTotal < coupon.min_order_amount) {
      return { success: false, error: `Minimum order amount of ₹${coupon.min_order_amount} required.` }
    }

    if (!coupon.multiple_uses_per_customer && phone) {
      const normalizedPhone = phone.replace(/^\+91[\-\s]?/, '').replace(/[\s\-]/g, '').trim()
      const { data: customer } = await supabase.from('customers').select('id').eq('phone', normalizedPhone).single()
      
      if (customer) {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('coupon_code', coupon.code)
          .neq('status', 'cancelled')

        if (count && count > 0) {
          return { success: false, error: 'You have already used this coupon.' }
        }
      }
    }

    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = cartTotal * (coupon.discount_value / 100)
    } else {
      discountAmount = coupon.discount_value
    }
    
    // discount amount cannot exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal)

    return { success: true, discountAmount, code: coupon.code }
  } catch (err) {
    return { success: false, error: 'Failed to validate coupon.' }
  }
}

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
    const { restaurantId, theme } = await getRestaurantContext()

// Helper to calculate distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

    const supabase = await createServiceRoleClient()

    // ── Pre-check: Verify delivery radius ──────────────────────────────────
    if (input.deliveryType === 'delivery') {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('lat, lng, delivery_radius_km')
        .eq('id', restaurantId)
        .single()
        
      if (restData?.lat && restData?.lng && restData?.delivery_radius_km) {
        if (!input.lat || !input.lng) {
           return { success: false, error: 'Please provide a valid delivery address with location coordinates.' }
        }
        
        const distance = getDistanceFromLatLonInKm(input.lat, input.lng, restData.lat, restData.lng)
        if (distance > restData.delivery_radius_km) {
           return { success: false, error: `Your location is outside our delivery area (Max distance: ${restData.delivery_radius_km}km).` }
        }
      }
    }

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
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    const upsertPayload: any = { phone, name: input.name.trim(), email }
    if (user?.id) {
      upsertPayload.user_id = user.id
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        upsertPayload,
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

    let discountAmount = 0
    let finalCouponCode = null

    // ── Step 2.5: Apply Coupon ─────────────────────────────────────────────
    if (input.couponCode) {
      const valResult = await validateCoupon(input.couponCode, totalAmount, phone)
      if (!valResult.success) {
        return { success: false, error: valResult.error }
      }
      discountAmount = valResult.discountAmount ?? 0
      finalCouponCode = valResult.code
    }

    // ── Step 3: Create the order row ───────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        customer_id: customer.id,
        items: itemsSnapshot,          // JSONB snapshot
        total_amount: totalAmount - discountAmount, // Store the discounted total
        status: 'new',
        payment_status: input.paymentMethod === 'cod' ? 'pending' : 'pending', // could leave it as pending in both cases
        payment_method: input.paymentMethod,
        delivery_type: input.deliveryType,
        delivery_address:
          input.deliveryType === 'delivery' ? (input.address?.trim() ?? null) : null,
        delivery_lat: input.deliveryType === 'delivery' ? (input.lat ?? null) : null,
        delivery_lng: input.deliveryType === 'delivery' ? (input.lng ?? null) : null,
        customer_email: email,
        coupon_code: finalCouponCode,
        discount_amount: discountAmount
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

    // ── Step 3.2: Increment coupon usage ───────────────────────────────────
    if (finalCouponCode) {
      await supabase.rpc('increment_coupon_usage', { 
        p_restaurant_id: restaurantId, 
        p_code: finalCouponCode 
      })
      // Alternatively, we can just use an update query if RPC doesn't exist
      // Since we don't have an RPC, let's just do a direct update:
      // Actually, standard supabase SQL update works:
      const { data: cpn } = await supabase
        .from('coupons')
        .select('usage_count')
        .eq('restaurant_id', restaurantId)
        .eq('code', finalCouponCode)
        .single()
      
      if (cpn) {
        await supabase
          .from('coupons')
          .update({ usage_count: cpn.usage_count + 1 })
          .eq('restaurant_id', restaurantId)
          .eq('code', finalCouponCode)
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

    // ── Step 5: Send WhatsApp confirmation (for COD) ───────────────────────
    if (input.paymentMethod === 'cod') {
      // Run asynchronously to not block the request
      sendOrderConfirmationWhatsApp(phone, {
        orderId: order.id,
        customerName: input.name.trim(),
        totalAmount: totalAmount - discountAmount,
        restaurantName: theme.name
      }).catch(err => {
        console.error('[createOrder] Background WhatsApp notification failed:', err)
      })
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
