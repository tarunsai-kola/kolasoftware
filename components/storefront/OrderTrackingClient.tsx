'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// =============================================================================
// Types & Config
// =============================================================================

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'

const STEPS: { status: OrderStatus | 'out_for_delivery'; label: string; icon: string; desc: string }[] = [
  { status: 'new',       label: 'Order Received',    icon: '✅', desc: 'Your order has been placed and is waiting for the restaurant.' },
  { status: 'preparing', label: 'Being Prepared',    icon: '👨‍🍳', desc: 'The kitchen is preparing your food fresh.' },
  { status: 'ready',     label: 'Ready',             icon: '🛎️', desc: 'Your order is ready and waiting for pickup or delivery.' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵', desc: 'Your delivery partner is on the way!' },
  { status: 'completed', label: 'Delivered',         icon: '🎉', desc: 'Enjoy your meal!' },
]

function getStepIndex(status: string, deliveryType: string): number {
  if (status === 'new')       return 0
  if (status === 'preparing') return 1
  if (status === 'ready' && deliveryType === 'pickup') return 3  // skip out_for_delivery
  if (status === 'ready')     return 2
  if (status === 'completed' && deliveryType === 'delivery') return 4
  if (status === 'completed') return 4
  return 0
}

function getStatusLabel(status: string, deliveryType: string) {
  if (status === 'ready' && deliveryType === 'delivery') return 'Out for Delivery'
  return STEPS.find(s => s.status === status)?.label ?? status
}

// =============================================================================
// Component
// =============================================================================

interface Props {
  orderId: string
  initialStatus: string
  deliveryType: string
  deliveryAddress: string | null
  totalAmount: number
  items: { name: string; quantity: number; price: number }[]
  customerName: string
  createdAt: string
  restaurantName: string
  restaurantColor: string
}

export default function OrderTrackingClient({
  orderId,
  initialStatus,
  deliveryType,
  deliveryAddress,
  totalAmount,
  items,
  customerName,
  createdAt,
  restaurantName,
  restaurantColor,
}: Props) {
  const supabase = createClient()
  const [status, setStatus] = useState(initialStatus)

  const shortId = orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
  const currentStep = getStepIndex(status, deliveryType)
  const isDelivery = deliveryType === 'delivery'
  const stepsToShow = isDelivery ? STEPS : STEPS.filter(s => s.status !== 'out_for_delivery')

  // ── Real-time status subscription ─────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.status) setStatus(payload.new.status)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId, supabase])

  const isCancelled = status === 'cancelled'
  const isDone = status === 'completed'

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white px-4 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
            ← Menu
          </Link>
          <span className="text-sm font-bold text-gray-900">{restaurantName}</span>
          <span className="font-mono text-xs font-semibold text-gray-400">#{shortId}</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6">

        {/* ── Status Banner ───────────────────────────────────────────────── */}
        <div
          className="mb-6 rounded-2xl p-5 text-white shadow-lg"
          style={{ background: isCancelled ? '#ef4444' : restaurantColor }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{isCancelled ? '❌' : (stepsToShow[Math.min(currentStep, stepsToShow.length - 1)]?.icon ?? '📋')}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Order Status</p>
              <p className="text-xl font-extrabold leading-tight">
                {isCancelled ? 'Order Cancelled' : getStatusLabel(status, deliveryType)}
              </p>
            </div>
            {!isDone && !isCancelled && (
              <span className="ml-auto flex h-2.5 w-2.5 rounded-full">
                <span className="animate-ping absolute h-2.5 w-2.5 rounded-full bg-white/60" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
              </span>
            )}
          </div>

          {/* Description */}
          {!isCancelled && (
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              {stepsToShow[Math.min(currentStep, stepsToShow.length - 1)]?.desc}
            </p>
          )}
        </div>

        {/* ── Progress Stepper ────────────────────────────────────────────── */}
        {!isCancelled && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Order Progress</p>
            <div className="space-y-0">
              {stepsToShow.map((step, idx) => {
                const effectiveStep = Math.min(currentStep, stepsToShow.length - 1)
                const isDone = idx <= effectiveStep
                const isCurrent = idx === effectiveStep
                const isLast = idx === stepsToShow.length - 1

                return (
                  <div key={step.label} className="flex gap-3">
                    {/* Timeline column */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                          isDone ? 'text-white shadow-md' : 'bg-gray-100 text-gray-300'
                        } ${isCurrent ? 'ring-4 ring-offset-1' : ''}`}
                        style={isDone ? { backgroundColor: restaurantColor, ['--tw-ring-color' as string]: `${restaurantColor}40` } : {}}
                      >
                        {isDone ? (isCurrent ? '●' : '✓') : idx + 1}
                      </div>
                      {!isLast && (
                        <div
                          className="my-1 w-0.5 flex-1 transition-all duration-500"
                          style={{ background: idx < effectiveStep ? restaurantColor : '#e5e7eb', minHeight: '20px' }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pb-5 pt-1">
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-300'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Order Summary ────────────────────────────────────────────────── */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Your Order</p>
          <ul className="space-y-2 border-b border-gray-100 pb-3">
            {items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  <span className="mr-1.5 font-bold text-gray-400">{item.quantity}×</span>
                  {item.name}
                </span>
                <span className="font-semibold text-gray-900">₹{(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between pt-3">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-sm font-extrabold" style={{ color: restaurantColor }}>₹{totalAmount}</span>
          </div>
        </div>

        {/* ── Delivery Info ────────────────────────────────────────────────── */}
        {isDelivery && deliveryAddress && (
          <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Delivery Address</p>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-base">📍</span>
              <p className="text-sm leading-relaxed text-gray-700">{deliveryAddress}</p>
            </div>
          </div>
        )}

        {/* ── Order Again ─────────────────────────────────────────────────── */}
        {isDone && (
          <Link
            href="/"
            className="block w-full rounded-2xl py-4 text-center text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: restaurantColor }}
          >
            Order Again 🍴
          </Link>
        )}
      </div>
    </div>
  )
}
