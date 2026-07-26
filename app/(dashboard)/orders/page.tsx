import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import OrdersBoard from '@/components/dashboard/OrdersBoard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Orders Queue',
  robots: { index: false },
}

// Ensure this page is not statically cached since it fetches live database state
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const { restaurantId, theme } = await getRestaurantContext()
  const supabase = await createClient()

  // Fetch initial orders
  // - Only paid orders
  // - Exclude cancelled orders (they aren't relevant for the active kitchen board)
  // - Order by newest first
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      total_amount,
      delivery_type,
      created_at,
      acknowledged_at,
      items,
      customer:customers ( name, phone )
    `
    )
    .eq('restaurant_id', restaurantId)
    .eq('payment_status', 'paid')
    .in('status', ['new', 'preparing', 'ready', 'completed'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch initial orders:', error)
  }

  // Flatten the customer relationship array if Supabase returned an array
  const formattedOrders = (orders || []).map((order) => {
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
    return {
      ...order,
      customer_name: customer?.name ?? 'Unknown',
      customer_phone: customer?.phone ?? '',
    }
  })

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Live Orders</h1>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-600">Live updates active</span>
        </div>
      </div>

      <OrdersBoard initialOrders={formattedOrders} restaurantId={restaurantId} theme={theme} />
    </div>
  )
}
