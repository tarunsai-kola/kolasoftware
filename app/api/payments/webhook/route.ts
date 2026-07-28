import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/utils/error'

type RazorpayEventType =
  | 'payment.captured'
  | 'payment.failed'
  | 'order.paid'           // alternative to payment.captured on some plans
  | string                 // other events we silently acknowledge

interface RazorpayPaymentEntity {
  id: string           // e.g. pay_XXXXXXXXXX
  order_id: string     // e.g. order_XXXXXXXXXX
  status: string
  amount: number       // paise
  currency: string
  email?: string
  contact?: string
}

interface RazorpayWebhookPayload {
  event: RazorpayEventType
  payload: {
    payment?: { entity: RazorpayPaymentEntity }
    order?: { entity: { id: string; status: string } }
  }
  created_at: number
}

export async function POST(req: NextRequest) {
  // ── 1. Read raw body BEFORE any parsing ───────────────────────────────────
  const rawBody = await req.text()

  // ── 2. Extract Razorpay signature header ──────────────────────────────────
  const signature = req.headers.get('x-razorpay-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 })
  }

  // ── 3. Parse payload to find razorpay_order_id ───────────────────────────
  let event: RazorpayWebhookPayload
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const razorpayOrderId = event.payload.payment?.entity?.order_id
  if (!razorpayOrderId) {
    // If there is no order_id, we can't map it to a restaurant, thus can't verify signature.
    // For now, just ack it.
    return NextResponse.json({ received: true })
  }

  // ── 4. Fetch the restaurant's webhook secret ─────────────────────────────
  const supabase = await createServiceRoleClient()
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('restaurant:restaurants(razorpay_webhook_secret)')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (orderError || !orderData) {
    console.error(`[webhook] Could not find order for razorpay_order_id: ${razorpayOrderId}`)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const restaurant = Array.isArray(orderData.restaurant) ? orderData.restaurant[0] : orderData.restaurant
  const webhookSecret = restaurant?.razorpay_webhook_secret

  if (!webhookSecret) {
    console.error('[webhook] Restaurant does not have a webhook secret configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // ── 5. Verify HMAC-SHA256 signature ───────────────────────────────────────
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  const isValid =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer)

  if (!isValid) {
    console.warn('[webhook] Invalid signature — request rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── 6. Process event ───────────────────────────────────────────────────────
  try {
    // ── payment.captured ──────────────────────────────────────────────────────
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment?.entity
      if (payment?.order_id) {
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_id: payment.id,       // e.g. pay_XXXXXXXXXX
            status: 'confirmed',           // auto-confirm kitchen queue
          })
          .eq('razorpay_order_id', payment.order_id)

        if (error) {
          console.error('[webhook] payment.captured DB update failed:', getErrorMessage(error))
        } else {
          console.log('[webhook] payment.captured — order updated to paid:', payment.order_id)
        }
      }
    }

    // ── payment.failed ────────────────────────────────────────────────────────
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment?.entity
      if (payment?.order_id) {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('razorpay_order_id', payment.order_id)

        if (error) {
          console.error('[webhook] payment.failed DB update failed:', getErrorMessage(error))
        } else {
          console.log('[webhook] payment.failed — order marked failed:', payment.order_id)
        }
      }
    }
  } catch (err) {
    console.error('[webhook] Unexpected error while processing event:', event.event, err)
  }

  // ── 7. Respond with 200 immediately ───────────────────────────────────────
  return NextResponse.json({ received: true })
}
