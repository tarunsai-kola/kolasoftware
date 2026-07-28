'use client'

import { useState, useEffect } from 'react'
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
  delivery_address: string | null
  customer_name: string
  customer_phone: string
  delivery_rider_id?: string | null
  rider_name?: string | null
  rider_phone?: string | null
}

interface OrdersBoardProps {
  initialOrders: Order[]
  riders: { id: string; name: string; phone: string; is_active: boolean }[]
  restaurantId: string
  theme: {
    primaryColor: string
  }
}

// =============================================================================
// Kanban Config
// =============================================================================

const COLUMNS: { id: OrderStatus; label: string; next?: OrderStatus; accent: string; dot: string; badge: string }[] = [
  { id: 'new',       label: 'New',       next: 'preparing', accent: 'border-t-blue-500',   dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { id: 'preparing', label: 'Preparing', next: 'ready',     accent: 'border-t-amber-500',  dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { id: 'ready',     label: 'Ready',     next: 'completed', accent: 'border-t-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { id: 'completed', label: 'Completed',                    accent: 'border-t-gray-400',   dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 ring-gray-200' },
]

// =============================================================================
// Helpers
// =============================================================================

function shortOrderId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase()
}

// =============================================================================
// Component
// =============================================================================

export default function OrdersBoard({ initialOrders, riders, restaurantId, theme }: OrdersBoardProps) {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [now, setNow] = useState(new Date())

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [dismissedBanner, setDismissedBanner] = useState(false)

  // Load audio preference on mount
  useEffect(() => {
    const savedPref = localStorage.getItem('kola_audio_pref')
    const savedDismissed = localStorage.getItem('kola_audio_dismissed')

    if (savedPref === 'true') {
      setAudioEnabled(true)
      setDismissedBanner(true)
    } else if (savedDismissed === 'true') {
      setDismissedBanner(true)
    }
  }, [])

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
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Alert Loop (Sound & Title Flash) ──────────────────────────────────────
  const hasUnacknowledged = unacknowledgedIds.size > 0;

  useEffect(() => {
    if (!hasUnacknowledged) return

    const audio = new Audio('/sounds/new-order.mp3')
    audio.loop = true; // Loop the audio continuously until acknowledged

    if (audioEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay prevented:", error);
          if (error.name === 'NotAllowedError') {
            setAudioEnabled(false);
            setDismissedBanner(false);
            localStorage.setItem('kola_audio_pref', 'false');
          }
        });
      }
    }

    const originalTitle = document.title
    let isFlash = false
    const titleInterval = setInterval(() => {
      isFlash = !isFlash
      document.title = isFlash ? `(${unacknowledgedIds.size}) New Order! 🚨` : originalTitle
    }, 1000)

    return () => {
      audio.pause()
      audio.currentTime = 0
      clearInterval(titleInterval)
      document.title = originalTitle
    }
  }, [hasUnacknowledged, unacknowledgedIds.size, audioEnabled])

  // ── Real-time Subscription ────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data, error } = await supabase
              .from('orders')
              .select(`id, status, total_amount, delivery_type, created_at, acknowledged_at, items, delivery_address, customer:customers ( name, phone )`)
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
              if (newOrder.status === 'new' && !newOrder.acknowledged_at) {
                setUnacknowledgedIds((prev) => new Set(prev).add(newOrder.id))
                
                // Show browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('New Order Received! 🚨', {
                    body: `${newOrder.customer_name} ordered for ₹${newOrder.total_amount}. Please acknowledge.`,
                  })
                }
              }
              toast('New order received!', { icon: '🔔' })
            }
          }

          if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id
                  ? { ...o, status: payload.new.status as OrderStatus, acknowledged_at: payload.new.acknowledged_at as string | null }
                  : o
              )
            )
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

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, supabase])

  // ── Action Handlers ───────────────────────────────────────────────────────
  const acknowledgeOrder = async (orderId: string) => {
    setUnacknowledgedIds((prev) => { const next = new Set(prev); next.delete(orderId); return next })
    const nowIso = new Date().toISOString()
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, acknowledged_at: nowIso } : o))
    await supabase.from('orders').update({ acknowledged_at: nowIso }).eq('id', orderId)
  }

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUnacknowledgedIds((prev) => { const next = new Set(prev); next.delete(orderId); return next })
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, acknowledged_at: o.acknowledged_at || new Date().toISOString() } : o)))
    const { error } = await supabase.from('orders').update({ status: nextStatus, acknowledged_at: new Date().toISOString() }).eq('id', orderId)
    if (error) { toast.error('Failed to update status'); window.location.reload() }
  }

  const assignRider = async (orderId: string, riderId: string) => {
    const selectedRider = riders.find(r => r.id === riderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_rider_id: riderId, rider_name: selectedRider?.name, rider_phone: selectedRider?.phone } : o))
    
    const { error } = await supabase.from('orders').update({ delivery_rider_id: riderId }).eq('id', orderId)
    if (error) { toast.error('Failed to assign rider'); window.location.reload() }
    else toast.success('Rider assigned!')
  }

  const handleEnableAudio = () => {
    setAudioEnabled(true)
    setDismissedBanner(true)
    localStorage.setItem('kola_audio_pref', 'true')
    
    // Request browser notification permission
    if ('Notification' in window) {
      Notification.requestPermission()
    }

    const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
    silent.play().catch(console.warn)
  }

  const getOrdersByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status)
  const totalActive = orders.filter(o => o.status !== 'completed').length

  return (
    <div className="flex flex-col flex-1 gap-0 overflow-hidden min-h-0">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Live Orders</h1>
          {totalActive > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              {totalActive} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Banner - compact inline pill */}
          {!audioEnabled && !dismissedBanner && (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 pl-3 pr-1 py-1 text-xs text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="font-medium">Enable sound & notifications</span>
              <button
                onClick={handleEnableAudio}
                className="ml-1 rounded-full bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => {
                  setDismissedBanner(true)
                  localStorage.setItem('kola_audio_dismissed', 'true')
                }}
                className="ml-0.5 rounded-full px-2 py-1 text-amber-600 hover:bg-amber-100 transition-colors font-medium"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Test Sound Button */}
          <button
            onClick={() => {
              const testAudio = new Audio('/sounds/new-order.mp3')
              testAudio.play().catch(console.warn)
            }}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            title="Play sample order sound"
          >
            🎵 Test Sound
          </button>

          {/* Persistent Audio Toggle */}
          <button
            onClick={() => {
              if (audioEnabled) {
                setAudioEnabled(false)
                localStorage.setItem('kola_audio_pref', 'false')
              } else {
                handleEnableAudio()
              }
            }}
            className={`flex items-center justify-center h-8 w-8 rounded-full border ${audioEnabled ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100'} transition-colors`}
            title={audioEnabled ? 'Disable Sound' : 'Enable Sound'}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </div>
        </div>
      </div>

      {/* ── Kanban Grid ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-4 min-h-0">
        {COLUMNS.map((col) => {
          const columnOrders = getOrdersByStatus(col.id)

          return (
            <div
              key={col.id}
              className={`flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50 border-t-2 ${col.accent} overflow-hidden`}
            >
              {/* Lane Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <h2 className="text-sm font-semibold text-gray-800">{col.label}</h2>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${col.badge}`}>
                  {columnOrders.length}
                </span>
              </div>

              {/* Lane Body */}
              <div className="flex flex-col gap-2.5 overflow-y-auto p-3 flex-1">
                {columnOrders.length === 0 ? (
                  <EmptyLane status={col.id} />
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
                      riders={riders}
                      onAssignRider={(riderId) => assignRider(order.id, riderId)}
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
// Empty Lane
// =============================================================================

function EmptyLane({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { icon: string; message: string }> = {
    new:       { icon: '📋', message: 'No new orders yet' },
    preparing: { icon: '👨‍🍳', message: 'Kitchen is clear' },
    ready:     { icon: '🛎️', message: 'Nothing waiting' },
    completed: { icon: '✅', message: 'No completed orders' },
  }
  const { icon, message } = config[status]

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white py-10 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-medium text-gray-400">{message}</p>
    </div>
  )
}

// =============================================================================
// Order Card
// =============================================================================

function OrderCard({
  order,
  nextStatus,
  isUnacknowledged,
  onAcknowledge,
  onMove,
  theme,
  now,
  riders,
  onAssignRider,
}: {
  order: Order
  nextStatus?: OrderStatus
  isUnacknowledged: boolean
  onAcknowledge: () => void
  onMove: () => void
  theme: { primaryColor: string }
  now: Date
  riders?: { id: string; name: string; phone: string; is_active: boolean }[]
  onAssignRider?: (riderId: string) => void
}) {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []

  const nextLabels: Record<string, string> = {
    preparing: 'Start Preparing',
    ready: 'Mark Ready',
    completed: 'Complete',
  }

  const isDelivery = order.delivery_type === 'delivery'
  const canAssignRider = isDelivery && (order.status === 'ready' || order.status === 'preparing') && !order.delivery_rider_id

  return (
    <div
      className={`group relative rounded-lg border bg-white shadow-sm transition-all duration-200 hover:shadow-md
        ${isUnacknowledged
          ? 'border-red-300 ring-1 ring-red-300 shadow-red-100'
          : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      {/* Unacknowledged pulse strip */}
      {isUnacknowledged && (
        <div className="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-red-400 animate-pulse" />
      )}

      <div className="p-3">
        {/* ── Row 1: ID + Time ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[11px] font-bold text-gray-400 tracking-wider">
            #{shortOrderId(order.id)}
          </span>
          <span className={`text-[11px] font-medium ${isUnacknowledged ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            {timeAgo}
          </span>
        </div>

        {/* ── Row 2: Customer Name + Type Badge ─────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {order.customer_name}
          </p>
          <span className={`ml-2 shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide
            ${isDelivery
              ? 'bg-indigo-50 text-indigo-700'
              : 'bg-teal-50 text-teal-700'
            }`}
          >
            {isDelivery ? '🛵 Delivery' : '🏪 Pickup'}
          </span>
        </div>

        {/* ── Items ─────────────────────────────────────────────────────── */}
        <ul className="space-y-1.5 mb-3 pb-3 border-b border-gray-100">
          {items.map((item: any, idx: number) => (
            <li key={idx} className="flex flex-col text-xs">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-700">
                  <span className="font-bold text-gray-400 mr-1">{item.quantity}×</span>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </span>
              </div>
              {(item.selectedVariants?.length > 0 || item.selectedAddons?.length > 0) && (
                <div className="pl-5 mt-0.5 text-[11px] text-gray-500 space-y-0.5">
                  {item.selectedVariants?.map((v: any, vi: number) => (
                    <div key={`v-${vi}`}>• {v.groupName}: {v.variantName}</div>
                  ))}
                  {item.selectedAddons?.map((a: any, ai: number) => (
                    <div key={`a-${ai}`}>+ {a.addonName}</div>
                  ))}
                </div>
              )}
            </li>
          ))}
          <li className="flex justify-end text-xs font-semibold text-gray-500 pt-1">
            ₹{order.total_amount}
          </li>
        </ul>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {/* Address */}
          {isDelivery && order.delivery_address && (
            <div className="flex items-start gap-1.5 rounded-md bg-gray-50 px-2 py-1.5 text-[11px] text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="line-clamp-2 leading-relaxed">{order.delivery_address}</span>
            </div>
          )}

          {/* Assigned Rider Info */}
          {isDelivery && order.delivery_rider_id && (
            <div className="flex items-center justify-between rounded-md bg-indigo-50/50 px-2 py-1.5 border border-indigo-100">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🛵</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide">Assigned Rider</span>
                  <span className="text-xs font-semibold text-indigo-700 truncate">{order.rider_name}</span>
                </div>
              </div>
              <a href={`tel:${order.rider_phone}`} className="shrink-0 rounded-full bg-white p-1 text-indigo-600 shadow-sm border border-indigo-200 hover:bg-indigo-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </a>
            </div>
          )}

          {/* Rider Assignment Dropdown */}
          {canAssignRider && riders && riders.length > 0 && onAssignRider && (
            <div className="mt-1">
              <select 
                className="w-full text-xs rounded-md border border-gray-300 py-1.5 pl-2 pr-8 text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none bg-white"
                onChange={(e) => {
                  if (e.target.value) onAssignRider(e.target.value)
                }}
                value=""
              >
                <option value="" disabled>Assign Delivery Rider...</option>
                {riders.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.phone})</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-1">
            {/* Call */}
            <a
              href={`tel:${order.customer_phone}`}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call
            </a>

            {/* Acknowledge */}
            {isUnacknowledged && (
              <button
                onClick={onAcknowledge}
                className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                Acknowledge
              </button>
            )}

            {/* Move to next status */}
            {nextStatus && !(order.delivery_type === 'delivery' && nextStatus === 'completed' && order.status !== 'ready') && (
              <button
                onClick={onMove}
                className="ml-auto inline-flex items-center rounded-md px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {nextLabels[nextStatus] ?? `→ ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
