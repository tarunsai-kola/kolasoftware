'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// =============================================================================
// Razorpay global type declarations
// =============================================================================
// Razorpay's checkout.js attaches the Razorpay constructor to window.
// We declare it here so TypeScript is satisfied without an external package.

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number          // in paise
  currency: string
  name: string            // restaurant name
  description?: string
  image?: string | null   // restaurant logo
  order_id: string        // Razorpay order ID
  prefill?: {
    name?: string | null
    email?: string | null
    contact?: string | null
  }
  notes?: Record<string, string>
  theme?: { color?: string }
  callback_url?: string
  redirect?: boolean
  handler?: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
    confirm_close?: boolean
    escape?: boolean
  }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
  on: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

// =============================================================================
// Types
// =============================================================================

interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface PaymentClientProps {
  orderId: string
  restaurantName: string
  restaurantLogo: string | null
  primaryColor: string
  totalAmount: number       // in rupees (from DB numeric)
  items: OrderItem[]
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
}

type PaymentState = 'idle' | 'creating' | 'processing' | 'failed'

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

/** Injects the Razorpay checkout.js script into <body> if not already loaded */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)   // already loaded

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// =============================================================================
// PaymentClient
// =============================================================================

/**
 * Client component for the payment page.
 *
 * Flow:
 *   1. User clicks "Pay ₹XXX"
 *   2. Dynamically loads Razorpay checkout.js
 *   3. Calls POST /api/payments/create-order → gets razorpay_order_id + key_id
 *   4. Opens Razorpay modal with restaurant branding
 *   5. On success → redirects to /order-confirmed/[orderId]
 *   6. On dismiss/failure → shows retry option, state resets to idle
 */
export default function PaymentClient({
  orderId,
  restaurantName,
  restaurantLogo,
  primaryColor,
  totalAmount,
  items,
  customerName,
  customerEmail,
  customerPhone,
}: PaymentClientProps) {
  const router = useRouter()
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')

  const handlePay = useCallback(async () => {
    setPaymentState('creating')

    try {
      // ── Step 1: Load Razorpay checkout.js ─────────────────────────────────
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load payment SDK. Check your internet connection and try again.')
        setPaymentState('idle')
        return
      }

      // ── Step 2: Create Razorpay order via our API ──────────────────────────
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Could not initiate payment. Please try again.')
        setPaymentState('failed')
        return
      }

      const { razorpay_order_id, amount, currency, key_id } = await res.json()

      setPaymentState('processing')

      // ── Step 3: Open Razorpay checkout modal ───────────────────────────────
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        name: restaurantName,
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        image: restaurantLogo ?? undefined,
        order_id: razorpay_order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone ? `+91${customerPhone}` : undefined,
        },
        notes: {
          platform_order_id: orderId,
        },
        theme: {
          color: primaryColor,
        },
        
        // ── Redirect flow (Best for Mobile / UPI Intent) ─────────────
        callback_url: `/api/payments/callback`,
        redirect: true,

        modal: {
          // Warn user before closing mid-payment
          confirm_close: true,
          escape: false,

          ondismiss: () => {
            // User closed the modal without completing payment
            if (paymentState === 'processing') {
              toast('Payment cancelled. You can try again.', {
                icon: '⚠️',
                duration: 4000,
              })
            }
            setPaymentState('failed')
          },
        },
      })

      rzp.open()
    } catch (err) {
      console.error('[PaymentClient] unexpected error:', err)
      toast.error('An unexpected error occurred. Please try again.')
      setPaymentState('failed')
    }
  }, [
    orderId,
    restaurantName,
    restaurantLogo,
    primaryColor,
    customerName,
    customerEmail,
    customerPhone,
    paymentState,
    router,
  ])

  const isLoading = paymentState === 'creating' || paymentState === 'processing'

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* ── Order summary card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">Order Summary</h2>

        <ul className="divide-y divide-gray-100" role="list">
          {items.map((item, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 py-3">
              <span className="text-sm text-gray-700">
                {item.name}
                <span className="ml-2 text-gray-400">×{item.quantity}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {/* Total */}
        <div
          className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4"
        >
          <span className="text-sm font-medium text-gray-500">Total to pay</span>
          <span
            className="text-2xl font-extrabold tabular-nums"
            style={{ color: 'var(--restaurant-primary)' }}
          >
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* ── Security note ───────────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <LockIcon className="h-3.5 w-3.5" />
        <span>Secured by Razorpay · 256-bit SSL encryption</span>
      </div>

      {/* ── Pay button ──────────────────────────────────────────────────────── */}
      <button
        onClick={handlePay}
        disabled={isLoading}
        className="btn-brand mt-6 w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label={`Pay ${formatPrice(totalAmount)} via Razorpay`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            {paymentState === 'creating' ? 'Preparing payment…' : 'Opening payment window…'}
          </span>
        ) : paymentState === 'failed' ? (
          <span className="flex items-center justify-center gap-2">
            <RetryIcon className="h-4 w-4" />
            Retry payment · {formatPrice(totalAmount)}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <RazorpayIcon className="h-5 w-5" />
            Pay {formatPrice(totalAmount)}
          </span>
        )}
      </button>

      {/* ── Failure message ─────────────────────────────────────────────────── */}
      {paymentState === 'failed' && (
        <p className="mt-3 text-center text-sm text-gray-400">
          Your order is saved — no amount was charged. Tap &quot;Retry payment&quot; to try again.
        </p>
      )}

      {/* ── Accepted methods ────────────────────────────────────────────────── */}
      <p className="mt-5 text-center text-xs text-gray-400">
        UPI · Cards · Net Banking · Wallets accepted
      </p>
    </div>
  )
}

// =============================================================================
// SVG icons (inline, no library dependency)
// =============================================================================

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4" />
    </svg>
  )
}

function RazorpayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className={className} aria-hidden="true">
      <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
    </svg>
  )
}
