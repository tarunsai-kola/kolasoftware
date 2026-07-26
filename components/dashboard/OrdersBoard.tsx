'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

// =============================================================================
// Types
// =============================================================================

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  status: OrderStatus
  total_amount: number
  delivery_type: 'delivery' | 'pickup'
  created_at: string
  acknowledged_at: string | null
  items: OrderItem[]
  customer_name: string
  customer_phone: string
}

interface OrdersBoardProps {
  initialOrders: Order[]
  restaurantId: string
  theme: {
    primaryColor: string
  }
}

// =============================================================================
// Kanban Config
// =============================================================================

const COLUMNS: { id: OrderStatus; label: string; next?: OrderStatus; color: string }[] = [
  { id: 'new', label: 'New', next: 'preparing', color: 'bg-blue-100 text-blue-800' },
  { id: 'preparing', label: 'Preparing', next: 'ready', color: 'bg-orange-100 text-orange-800' },
  { id: 'ready', label: 'Ready', next: 'completed', color: 'bg-green-100 text-green-800' },
  { id: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
]

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

function shortOrderId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase()
}

// =============================================================================
// Component
// =============================================================================

export default function OrdersBoard({ initialOrders, restaurantId, theme }: OrdersBoardProps) {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [now, setNow] = useState(new Date())
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [dismissedBanner, setDismissedBanner] = useState(false)
  
  // Track unacknowledged order IDs to manage the sound loop
  const [unacknowledgedIds, setUnacknowledgedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    initialOrders.forEach(o => {
      if (o.status === 'new' && !o.acknowledged_at) {
        ids.add(o.id)
      }
    })
    return ids
  })

  // ── Timers ────────────────────────────────────────────────────────────────
  // Update time every minute to keep "X min ago" fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Alert Loop (Sound & Title Flash) ──────────────────────────────────────
  useEffect(() => {
    if (unacknowledgedIds.size === 0) return

    // Note: You must add a real audio file at /public/sounds/new-order.mp3
    const audio = new Audio('/sounds/new-order.mp3')

    // Play immediately once if enabled
    if (audioEnabled) {
      audio.play().catch(console.warn)
    }

    // Loop sound every 4 seconds
    const soundInterval = setInterval(() => {
      if (audioEnabled) {
        audio.currentTime = 0
        audio.play().catch(console.warn)
      }
    }, 4000)

    // Flash tab title
    const originalTitle = document.title
    let isFlash = false
    const titleInterval = setInterval(() => {
      isFlash = !isFlash
      document.title = isFlash ? '(1) New Order! 🚨' : originalTitle
    }, 1000)

    return () => {
      clearInterval(soundInterval)
      clearInterval(titleInterval)
      document.title = originalTitle
    }
  }, [unacknowledgedIds.size, audioEnabled])

  // ── Real-time Subscription ────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          // INSERT: Fetch complete order with customer relation to get name/phone
          if (payload.eventType === 'INSERT') {
            const { data, error } = await supabase
              .from('orders')
              .select(`
                id, status, total_amount, delivery_type, created_at, acknowledged_at, items,
                customer:customers ( name, phone )
              `)
              .eq('id', payload.new.id)
              .single()

            if (!error && data && data.status !== 'cancelled') {
              const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer
              const newOrder: Order = {
                ...data,
                status: data.status as OrderStatus,
                items: data.items as OrderItem[],
                customer_name: customer?.name ?? 'Unknown',
                customer_phone: customer?.phone ?? '',
              }
              
              setOrders((prev) => [newOrder, ...prev])
              
              // Automatically mark as unacknowledged to trigger alarms
              if (newOrder.status === 'new' && !newOrder.acknowledged_at) {
                setUnacknowledgedIds((prev) => new Set(prev).add(newOrder.id))
              }
              
              toast('New order received!', { icon: '🔔' })
            }
          }

          // UPDATE: Update local state without network request (optimistic)
          if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id
                  ? { 
                      ...o, 
                      status: payload.new.status as OrderStatus,
                      acknowledged_at: payload.new.acknowledged_at as string | null
                    }
                  : o
              )
            )
            
            // If another client acknowledged it or moved it out of 'new', stop alerting
            if (payload.new.acknowledged_at || payload.new.status !== 'new') {
              setUnacknowledgedIds((prev) => {
                if (prev.has(payload.new.id)) {
                  const next = new Set(prev)
                  next.delete(payload.new.id)
                  return next
                }
                return prev
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase])

  // ── Action Handlers ───────────────────────────────────────────────────────
  const acknowledgeOrder = async (orderId: string) => {
    // 1. Clear from local alert state instantly
    setUnacknowledgedIds((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })

    // 2. Persist to Supabase so other clients also see it as acknowledged
    const nowIso = new Date().toISOString()
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, acknowledged_at: nowIso } : o))
    
    await supabase.from('orders').update({ acknowledged_at: nowIso }).eq('id', orderId)
  }

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // Implicitly acknowledge if moving to next status
    setUnacknowledgedIds((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, acknowledged_at: o.acknowledged_at || new Date().toISOString() } : o))
    )

    // Persist to Supabase
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: nextStatus,
        acknowledged_at: new Date().toISOString() // ensuring it's set
      })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to update status')
      window.location.reload()
    }
  }

  const handleEnableAudio = () => {
    setAudioEnabled(true)
    setDismissedBanner(true)
    
    // Play a silent 1-second WAV file to satisfy the browser's autoplay policy for the session
    const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
    silent.play().catch(console.warn)
  }

  // ── Render Helpers ────────────────────────────────────────────────────────
  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status)

  return (
    <div className="flex flex-col flex-1 gap-4 overflow-hidden">
      {/* Audio permission banner */}
      {!audioEnabled && !dismissedBanner && (
        <div 
          onClick={handleEnableAudio}
          className="cursor-pointer bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-lg flex items-center justify-between hover:bg-indigo-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="text-sm font-medium">Tap anywhere here to enable order sound alerts</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setDismissedBanner(true) }}
            className="text-indigo-500 hover:text-indigo-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnOrders = getOrdersByStatus(col.id)

          return (
            <div
              key={col.id}
              className="flex w-80 shrink-0 flex-col rounded-xl bg-gray-100 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{col.label}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${col.color}`}>
                  {columnOrders.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
                {columnOrders.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                    <span className="text-sm text-gray-400">No orders</span>
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      nextStatus={col.next}
                      isUnacknowledged={unacknowledgedIds.has(order.id)}
                      onAcknowledge={() => acknowledgeOrder(order.id)}
                      onMove={() => col.next && updateStatus(order.id, col.next)}
                      theme={theme}
                      now={now}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Subcomponents
// =============================================================================

function OrderCard({
  order,
  nextStatus,
  isUnacknowledged,
  onAcknowledge,
  onMove,
  theme,
  now,
}: {
  order: Order
  nextStatus?: OrderStatus
  isUnacknowledged: boolean
  onAcknowledge: () => void
  onMove: () => void
  theme: { primaryColor: string }
  now: Date
}) {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${isUnacknowledged ? 'border-red-400 ring-1 ring-red-400 animate-pulse' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            #{shortOrderId(order.id)}
          </span>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
            {order.customer_name.split(' ')[0]}
          </p>
        </div>
        <div className="text-right">
          <span className={`whitespace-nowrap text-xs font-medium ${isUnacknowledged ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
            {timeAgo}
          </span>
          <div className="mt-1">
            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 uppercase tracking-wide">
              {order.delivery_type}
            </span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <ul className="mb-4 space-y-1.5 border-t border-b border-gray-50 py-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span className="text-gray-700">
              <span className="mr-1.5 font-bold text-gray-400">{item.quantity}x</span>
              {item.name}
            </span>
          </li>
        ))}
      </ul>

      {/* Footer / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={`tel:${order.customer_phone}`}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Call
        </a>
        
        <div className="flex items-center gap-2">
          {isUnacknowledged && (
            <button
              onClick={onAcknowledge}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 transition-colors"
            >
              Acknowledge
            </button>
          )}

          {nextStatus && (
            <button
              onClick={onMove}
              className="rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Move to {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
