import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

// =============================================================================
// Webhook handler: POST /api/payments/webhook
// =============================================================================
//
// Razorpay sends signed webhook events to this endpoint.
// Every event MUST be verified before trusting the payload.
//
// Security model:
//   1. Read raw body as text (required for HMAC-SHA256 verification)
//   2. Compute expected signature with RAZORPAY_WEBHOOK_SECRET
//   3. Use crypto.timingSafeEqual to prevent timing attacks
//   4. Only process verified events
//
// Reliability model:
//   - Respond with HTTP 200 as quickly as possible
//   - Razorpay retries any webhook that doesn't return 2xx within ~5 seconds
//   - All slow downstream work (emails, notifications) must be async / queued
//   - DB updates are fast and acceptable inside the webhook handler for MVP
//
// Idempotency:
//   - Updates are keyed on razorpay_order_id — safe to receive twice
//   - Supabase UPDATE on a row that's already 'paid' is a no-op in terms of correctness

// =============================================================================
// Supported Razorpay event types
// =============================================================================

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

// =============================================================================
// Route handler
// =============================================================================

export async function POST(req: NextRequest) {
  // ── 1. Read raw body BEFORE any parsing ───────────────────────────────────
  // In Next.js App Router the body is not pre-consumed, so req.text() works.
  const rawBody = await req.text()

  // ── 2. Extract Razorpay signature header ──────────────────────────────────
  const signature = req.headers.get('x-razorpay-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 })
  }

  // ── 3. Verify HMAC-SHA256 signature ───────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  // Pad both buffers to the same length before timingSafeEqual
  // (timingSafeEqual throws if lengths differ)
  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  const isValid =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer)

  if (!isValid) {
    // Log without echoing the signature — keep secrets out of logs
    console.warn('[webhook] Invalid signature — request rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── 4. Parse verified payload ──────────────────────────────────────────────
  let event: RazorpayWebhookPayload
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // ── 5. Process event ───────────────────────────────────────────────────────
  // Use service role — webhook runs outside any user session.
  // Process inside a try/catch so errors don't prevent the 200 response.
  try {
    const supabase = await createServiceRoleClient()

    // ── payment.captured ──────────────────────────────────────────────────────
    // Fires after Razorpay successfully captures a payment.
    // This is the authoritative signal that money has been collected.
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment?.entity
      if (!payment?.order_id) {
        console.warn('[webhook] payment.captured missing order_id')
      } else {
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_id: payment.id,       // e.g. pay_XXXXXXXXXX
            status: 'confirmed',           // auto-confirm kitchen queue
          })
          .eq('razorpay_order_id', payment.order_id)

        if (error) {
          console.error('[webhook] payment.captured DB update failed:', error.message)
        } else {
          console.log('[webhook] payment.captured — order updated to paid:', payment.order_id)
        }

        // TODO Phase 6: queue order confirmation email + kitchen SMS here.
        // Example: await emailQueue.enqueue({ type: 'ORDER_CONFIRMED', orderId })
        // Do NOT await slow operations inside the webhook handler.
      }
    }

    // ── payment.failed ────────────────────────────────────────────────────────
    // Fires when a payment attempt fails (card declined, timeout, etc.)
    // The customer can retry — we don't cancel the order, just update payment_status.
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment?.entity
      if (!payment?.order_id) {
        console.warn('[webhook] payment.failed missing order_id')
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('razorpay_order_id', payment.order_id)

        if (error) {
          console.error('[webhook] payment.failed DB update failed:', error.message)
        } else {
          console.log('[webhook] payment.failed — order marked failed:', payment.order_id)
        }
      }
    }

    // All other events (e.g. order.paid, transfer.settled) are acknowledged
    // with 200 but not acted on in this phase.

  } catch (err) {
    // Log the error but still return 200 — prevents Razorpay from infinite retry.
    // In production, pipe this to a monitoring service (Sentry, Datadog, etc.)
    console.error('[webhook] Unexpected error while processing event:', event.event, err)
  }

  // ── 6. Respond with 200 immediately ───────────────────────────────────────
  // Razorpay expects a 200 within ~5 seconds; it retries on anything else.
  return NextResponse.json({ received: true })
}
