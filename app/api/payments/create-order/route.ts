import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'

// =============================================================================
// Platform fee config
// =============================================================================
//
// Per-order platform fee in paise (100 paise = ₹1).
// Default 0 because the business model is a flat ₹2,000/month subscription —
// not a per-order commission. Change PLATFORM_FEE_PAISE in .env.local if
// you introduce a per-transaction processing fee.

const PLATFORM_FEE_PAISE = parseInt(process.env.PLATFORM_FEE_PAISE ?? '0', 10)

// =============================================================================
// Rate Limiter
// =============================================================================
// Simple in-memory rate limiter to protect against basic rapid-fire abuse.
// Limits each IP to 5 requests per minute.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60000
const MAX_REQUESTS_PER_WINDOW = 5

// =============================================================================
// Request validation
// =============================================================================

const bodySchema = z.object({
  order_id: z.string().uuid('order_id must be a valid UUID'),
})

// =============================================================================
// Route handler: POST /api/payments/create-order
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    // ── 0. Rate Limiting ───────────────────────────────────────────────────────
    // Use x-forwarded-for to get the client IP, fallback to 'unknown'
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const now = Date.now()

    const record = rateLimitMap.get(ip)
    if (record) {
      if (now > record.resetTime) {
        // Window expired, reset
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
      } else {
        // Still in window
        record.count++
        if (record.count > MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            { error: 'Too many requests. Please wait a minute before trying again.' },
            { status: 429 }
          )
        }
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    }

    // ── 1. Parse + validate request body ──────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 },
      )
    }

    const { order_id } = parsed.data

    // ── 2. Fetch order + restaurant ────────────────────────────────────────────
    const supabase = await createServiceRoleClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        total_amount,
        payment_status,
        razorpay_order_id,
        restaurant:restaurants (
          id,
          name,
          is_online_payment_enabled,
          razorpay_key_id,
          razorpay_key_secret
        )
      `,
      )
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('[create-order] order fetch error:', orderError?.message)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ── 3. Guard against duplicate / invalid attempts ─────────────────────────
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }

    const restaurant = Array.isArray(order.restaurant)
      ? order.restaurant[0]
      : order.restaurant

    if (!restaurant?.is_online_payment_enabled || !restaurant?.razorpay_key_id || !restaurant?.razorpay_key_secret) {
      return NextResponse.json({ error: 'Online payments are not configured for this restaurant.' }, { status: 400 })
    }

    // If a Razorpay order was already created (e.g. user refreshed the page),
    // return the existing one instead of creating a duplicate.
    if (order.razorpay_order_id) {
      return NextResponse.json({
        razorpay_order_id: order.razorpay_order_id,
        amount: Math.round(Number(order.total_amount) * 100),
        currency: 'INR',
        key_id: restaurant.razorpay_key_id,
      })
    }

    // ── 4. Build Razorpay order options ───────────────────────────────────────
    const totalPaise = Math.round(Number(order.total_amount) * 100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const razorpayOptions: any = {
      amount: totalPaise,
      currency: 'INR',
      // receipt: max 40 chars; order_id is a 36-char UUID so slice to be safe
      receipt: order_id.replace(/-/g, '').slice(0, 40),
      notes: {
        platform_order_id: order_id,
        restaurant_name: restaurant?.name ?? '',
      },
    }

    // ── 5. Create Razorpay order ──────────────────────────────────────────────
    const razorpay = new Razorpay({
      key_id: restaurant.razorpay_key_id,
      key_secret: restaurant.razorpay_key_secret,
    })

    // Razorpay's TS types are slightly broken here, so we cast to any.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const razorpayOrder = (await razorpay.orders.create(razorpayOptions)) as any

    // ── 6. Persist razorpay_order_id on our order row ─────────────────────────
    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order_id)

    if (updateError) {
      console.error('[create-order] failed to persist razorpay_order_id:', updateError.message)
    }

    // ── 7. Return public-safe response to frontend ─────────────────────────────
    return NextResponse.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,       // in paise
      currency: razorpayOrder.currency,
      key_id: restaurant.razorpay_key_id, // publishable — safe to send to browser
    })
  } catch (err) {
    console.error('[create-order] unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 },
    )
  }
}
