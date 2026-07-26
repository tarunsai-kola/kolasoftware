import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createServiceRoleClient } from '@/lib/supabase/server'
import PaymentClient, { type PaymentClientProps } from '@/components/storefront/PaymentClient'

// Never index the payment page — it's session-specific
export const metadata: Metadata = {
  title: 'Complete Payment',
  robots: { index: false },
}

interface PageProps {
  params: Promise<{ orderId: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { orderId } = await params
  const { theme } = await getRestaurantContext()
  const supabase = await createServiceRoleClient()

  // ── Fetch order + customer ─────────────────────────────────────────────────
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      total_amount,
      payment_status,
      items,
      customer:customers ( name, email, phone )
    `,
    )
    .eq('id', orderId)
    .single()

  if (error || !order) {
    notFound()
  }

  // Redirect if already paid — no need to show payment page again
  if (order.payment_status === 'paid') {
    redirect(`/order-confirmed/${orderId}`)
  }

  // If payment definitively failed AND there's no active Razorpay order,
  // allow retrying (keep them on this page). payment.failed is recoverable.

  // ── Resolve customer data ──────────────────────────────────────────────────
  const customer = Array.isArray(order.customer)
    ? order.customer[0]
    : order.customer

  // ── Build props for PaymentClient ──────────────────────────────────────────
  // Parse items from the JSONB snapshot
  type SnapshotItem = { name: string; quantity: number; price: number }
  const items: SnapshotItem[] = Array.isArray(order.items)
    ? (order.items as SnapshotItem[])
    : []

  const props: PaymentClientProps = {
    orderId,
    restaurantName: theme.name,
    restaurantLogo: theme.logoUrl,
    primaryColor: theme.primaryColor,
    totalAmount: Number(order.total_amount),
    items,
    customerName: customer?.name ?? null,
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? null,
  }

  return (
    <div className="min-h-screen bg-gray-50 font-brand pb-16">
      {/* ── Minimal header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm">
        <Link
          href="/checkout"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Back to checkout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="h-4 w-4" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Checkout
        </Link>

        <div className="flex items-center gap-2">
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="" aria-hidden="true"
              className="h-6 w-6 rounded-full object-cover" />
          )}
          <span className="text-sm font-semibold text-gray-800">{theme.name}</span>
        </div>

        <div className="w-20" aria-hidden="true" />
      </header>

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 pt-8 pb-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Complete Payment
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Order #{orderId.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* ── Payment client component ────────────────────────────────────────── */}
      <PaymentClient {...props} />
    </div>
  )
}
