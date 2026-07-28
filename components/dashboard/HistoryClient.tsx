'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'

// =============================================================================
// Types
// =============================================================================

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface HistoryOrder {
  id: string
  status: string
  total_amount: number
  delivery_type: 'delivery' | 'pickup'
  created_at: string
  items: OrderItem[]
  delivery_address: string | null
  customer_name: string
  customer_phone: string
}

// =============================================================================
// Helpers
// =============================================================================

function shortOrderId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase()
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  completed: { label: 'Completed', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  new:       { label: 'New',       badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  preparing: { label: 'Preparing', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ready:     { label: 'Ready',     badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-red-700 ring-red-200' },
}

// =============================================================================
// Main Component
// =============================================================================

export default function HistoryClient({ 
  orders, 
  currentPage = 1,
  totalPages = 1,
  totalOrders = 0
}: { 
  orders: HistoryOrder[];
  currentPage?: number;
  totalPages?: number;
  totalOrders?: number;
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        search === '' ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_phone.includes(search) ||
        shortOrderId(o.id).toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      const matchesType = typeFilter === 'all' || o.delivery_type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [orders, search, statusFilter, typeFilter])

  // Summary stats
  const totalRevenue = filtered.reduce((sum, o) => sum + (o.status === 'completed' ? o.total_amount : 0), 0)
  const completedCount = filtered.filter((o) => o.status === 'completed').length
  const deliveryCount = filtered.filter((o) => o.delivery_type === 'delivery').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Order History</h1>
        <span className="text-xs text-gray-400">{totalOrders} total orders</span>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 px-4 md:px-6 py-4 shrink-0 bg-white border-b border-gray-200">
        <StatCard label="Filtered Orders" value={filtered.length.toString()} icon="📋" />
        <StatCard label="Completed" value={completedCount.toString()} icon="✅" />
        <StatCard label="Revenue (filtered)" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon="💰" />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="new">New</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="all">All Types</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>

        {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all') }}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <span className="text-3xl">🗂️</span>
            <p className="text-sm font-semibold text-gray-500">No orders found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => {
                  const isExpanded = expandedId === order.id
                  const items = Array.isArray(order.items) ? order.items as OrderItem[] : []
                  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, badge: 'bg-gray-100 text-gray-600 ring-gray-200' }

                  return (
                    <>
                      <tr
                        key={order.id}
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {/* Order ID */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <svg className={`h-3 w-3 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                            <span className="font-mono text-xs font-bold text-gray-500 tracking-wider truncate">
                              #{shortOrderId(order.id)}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-gray-400 ml-4 sm:ml-5 mt-0.5 whitespace-nowrap">
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3 max-w-[100px] sm:max-w-none">
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{order.customer_name}</p>
                          <a href={`tel:${order.customer_phone}`} className="text-[10px] sm:text-[11px] text-blue-600 hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
                            {order.customer_phone}
                          </a>
                        </td>

                        {/* Items summary */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap
                            ${order.delivery_type === 'delivery' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'}`}
                          >
                            {order.delivery_type === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${statusCfg.badge}`}>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">₹{order.total_amount.toLocaleString('en-IN')}</span>
                          {/* Status badge moved to Amount column for mobile to save horizontal space */}
                          <div className="sm:hidden mt-1">
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset whitespace-nowrap ${statusCfg.badge}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 whitespace-nowrap">
                          {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`${order.id}-expanded`} className="bg-gray-50">
                          <td colSpan={7} className="px-4 sm:px-8 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Items detail */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items Ordered</p>
                                <ul className="space-y-1">
                                  {items.map((item, i) => (
                                    <li key={i} className="flex justify-between text-xs sm:text-sm">
                                      <span className="text-gray-700">
                                        <span className="font-bold text-gray-400 mr-1">{item.quantity}×</span>
                                        {item.name}
                                      </span>
                                      <span className="text-gray-500 shrink-0 ml-2">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </li>
                                  ))}
                                  <li className="flex justify-between text-xs sm:text-sm font-bold pt-1 border-t border-gray-200 mt-1">
                                    <span className="text-gray-700">Total</span>
                                    <span className="text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</span>
                                  </li>
                                </ul>
                              </div>
                              {/* Delivery info */}
                              {order.delivery_type === 'delivery' && order.delivery_address && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</p>
                                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{order.delivery_address}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
                <div className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/history?page=${Math.max(1, currentPage - 1)}`)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => router.push(`/history?page=${Math.min(totalPages, currentPage + 1)}`)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Stat Card
// =============================================================================

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex flex-1 min-w-[120px] items-center gap-2 sm:gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3">
      <span className="text-lg sm:text-xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-xs sm:text-lg font-bold text-gray-900 leading-tight truncate">{value}</p>
      </div>
    </div>
  )
}
