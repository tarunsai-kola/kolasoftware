import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false },
}

interface PageProps {
  params: Promise<{ orderId: string }>
}

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

/** First 8 chars of UUID uppercased — short, customer-friendly order reference */
function shortOrderId(uuid: string): string {
  return '#' + uuid.replace(/-/g, '').slice(0, 8).toUpperCase()
}

/** Estimated ready time range — placeholder until restaurant sets their own estimate */
function estimatedTime(deliveryType: string): string {
  return deliveryType === 'pickup' ? '20–30 minutes' : '35–50 minutes'
}

// =============================================================================
// Page
// =============================================================================

export default async function OrderConfirmedPage({ params }: PageProps) {
  const { orderId } = await params
  const { theme } = await getRestaurantContext()
  const supabase = await createServiceRoleClient()

  // ── Fetch order ────────────────────────────────────────────────────────────
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      total_amount,
      payment_status,
      delivery_type,
      delivery_address,
      items,
      created_at,
      customer:customers ( name, phone )
    `,
    )
    .eq('id', orderId)
    .single()

  if (error || !order) {
    notFound()
  }

  type SnapshotItem = { name: string; quantity: number; price: number }
  const items: SnapshotItem[] = Array.isArray(order.items)
    ? (order.items as SnapshotItem[])
    : []

  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
  const isPaid = order.payment_status === 'paid'
  const isFailed = order.payment_status === 'failed'
  const totalAmount = Number(order.total_amount)

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gray-50 font-brand">

      {/* ── Minimal header ─────────────────────────────────────────────────── */}
      <header className="flex h-14 items-center justify-center border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="" aria-hidden="true"
              className="h-7 w-7 rounded-full object-cover" />
          )}
          <span className="text-sm font-bold text-gray-800">{theme.name}</span>
        </div>
      </header>

      {/* ── Main content — centred card ─────────────────────────────────────── */}
      <main className="mx-auto max-w-lg px-4 py-8 pb-20">

        {/* ── Status section ────────────────────────────────────────────────── */}
        <div className="text-center">
          {isFailed ? (
            <>
              {/* Failure state */}
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="h-10 w-10" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Payment Failed</h1>
              <p className="mt-2 text-sm text-gray-500">
                No amount was charged. Your order is saved — you can retry payment.
              </p>
              <Link
                href={`/payment/${orderId}`}
                className="btn-brand mt-6 inline-flex"
              >
                Retry payment
              </Link>
            </>
          ) : (
            <>
              {/* Success / processing state */}
              <div
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: 'var(--restaurant-primary-muted)' }}
              >
                {isPaid ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="var(--restaurant-primary)" strokeWidth={2.5}
                    strokeLinecap="round" strokeLinejoin="round"
                    className="h-10 w-10" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24"
                    aria-hidden="true" style={{ color: 'var(--restaurant-primary)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                {isPaid ? 'Order Confirmed! 🎉' : 'Payment Processing…'}
              </h1>

              {isPaid ? (
                <p className="mt-2 text-sm text-gray-500">
                  {customer?.name
                    ? `Thank you, ${customer.name.split(' ')[0]}! `
                    : 'Thank you! '}
                  Your order is being prepared.
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  We're confirming your payment. This page will update automatically.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Order details card ───────────────────────────────────────────── */}
        {!isFailed && (
          <div className="mt-8 space-y-4">

            {/* Order number + ETA */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Order reference
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold tracking-tight text-gray-900">
                    {shortOrderId(orderId)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Est. time
                  </p>
                  <p
                    className="mt-0.5 text-sm font-bold"
                    style={{ color: 'var(--restaurant-primary)' }}
                  >
                    {estimatedTime(order.delivery_type)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-gray-900">Your Order</h2>
              <ul className="divide-y divide-gray-100" role="list">
                {items.map((item, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 py-2.5">
                    <span className="text-sm text-gray-700">
                      {item.name}
                      <span className="ml-1.5 text-gray-400">×{item.quantity}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Total */}
              <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-3">
                <span className="text-sm font-medium text-gray-500">Total paid</span>
                <span
                  className="text-lg font-extrabold tabular-nums"
                  style={{ color: 'var(--restaurant-primary)' }}
                >
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Delivery info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="mb-2 text-sm font-bold text-gray-900">
                {order.delivery_type === 'pickup' ? 'Pickup' : 'Delivering to'}
              </h2>
              {order.delivery_type === 'pickup' ? (
                <div className="flex items-start gap-2">
                  <span className="text-base">🏪</span>
                  <p className="text-sm text-gray-600">
                    Please pick up your order from {theme.name} when it's ready. We'll notify you.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-base">📍</span>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.delivery_address ?? '—'}
                  </p>
                </div>
              )}
            </div>

            {/* Payment status badge */}
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3">
              <span className="text-sm">
                {isPaid ? '✅' : '⏳'}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {isPaid
                  ? 'Payment confirmed by Razorpay'
                  : 'Payment is being verified — usually takes a few seconds'}
              </span>
            </div>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: 'var(--restaurant-primary)' }}
          >
            ← Back to menu
          </Link>
        </div>
      </main>
    </div>
  )
}
