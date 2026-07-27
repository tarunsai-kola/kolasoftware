'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'


export default function DriverDashboard({ initialOrders, restaurantId, theme }: { initialOrders: any[], restaurantId: string, theme: any }) {
  const supabase = createClient()
  const [orders, setOrders] = useState(initialOrders)
  const [confirmingOrder, setConfirmingOrder] = useState<any>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`delivery-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data, error } = await supabase
              .from('orders')
              .select(`id, status, total_amount, delivery_type, delivery_address, delivery_lat, delivery_lng, created_at, items, customer:customers(name, phone)`)
              .eq('id', payload.new.id)
              .single()

            if (!error && data && data.delivery_type === 'delivery' && ['ready', 'preparing'].includes(data.status)) {
              const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer
              const newOrder = {
                ...data,
                customer_name: customer?.name ?? 'Unknown',
                customer_phone: customer?.phone ?? '',
              }
              setOrders((prev) => [newOrder, ...prev])
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            if (['ready', 'preparing'].includes(updated.status)) {
              setOrders((prev) => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o))
            } else if (updated.status === 'completed') {
              setOrders((prev) => prev.filter(o => o.id !== updated.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase])

  const markCompleted = async (orderId: string) => {
    // Optimistic update
    setOrders((prev) => prev.filter(o => o.id !== orderId))
    setConfirmingOrder(null)
    
    // DB Update
    await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Order List */}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 overflow-y-auto pr-2 pb-8">
        <h2 className="font-bold text-gray-900 mb-2">Pending Deliveries ({orders.length})</h2>
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-xl border-gray-200">
            <span className="text-gray-400 text-sm">No active deliveries</span>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative group"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button, a')) return;
                if (order.delivery_lat && order.delivery_lng) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`, '_blank');
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${order.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {order.status}
                  </span>
                  <h3 className="font-bold mt-1 text-gray-900">{order.customer_name}</h3>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{order.total_amount}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="flex items-start gap-1.5 mt-1 group-hover:text-blue-700 transition-colors">
                  <span className="mt-0.5">📍</span>
                  <span className="line-clamp-2">{order.delivery_address || 'No address provided'}</span>
                  <span className="opacity-0 group-hover:opacity-100 ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex-shrink-0 transition-opacity">
                    Navigate
                  </span>
                </p>
                <p className="flex items-center gap-1.5 mt-1">
                  <span>📞</span>
                  <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">{order.customer_phone}</a>
                </p>
              </div>

              {order.status === 'ready' && (
                <button
                  onClick={() => setConfirmingOrder(order)}
                  className="mt-2 w-full bg-black hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Mark Delivered
                </button>
              )}
            </div>
          ))
        )}
      </div>



      {/* Handover Confirmation Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setConfirmingOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <div className="flex justify-center mb-4 text-4xl">🛍️</div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-1">Confirm Handover</h3>
            <p className="text-sm text-center text-gray-500 mb-6">Verify the customer and order details before handing over.</p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</p>
                <p className="font-bold text-gray-900 text-lg">{confirmingOrder.customer_name}</p>
                <p className="text-sm text-gray-600">📞 {confirmingOrder.customer_phone}</p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Order Items</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {confirmingOrder.items?.map((item: any, i: number) => (
                    <li key={i} className="flex flex-col mb-2">
                      <div className="flex justify-between">
                        <span><span className="font-bold text-gray-400 mr-1">{item.quantity}×</span> <span className="font-medium text-gray-900">{item.name}</span></span>
                      </div>
                      {(item.selectedVariants?.length > 0 || item.selectedAddons?.length > 0) && (
                        <div className="pl-6 text-xs text-gray-500 mt-0.5 space-y-0.5">
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
                </ul>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <p className="text-sm font-bold text-gray-900">Total to Collect (COD)</p>
                <p className="text-lg font-extrabold text-green-700">₹{confirmingOrder.total_amount}</p>
              </div>
            </div>

            <button
              onClick={() => markCompleted(confirmingOrder.id)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-green-200"
            >
              Confirm Handover ✅
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
