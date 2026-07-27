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
      delivery_address,
      delivery_rider_id,
      delivery_riders ( name, phone ),
      customer:customers ( name, phone )
    `
    )
    .eq('restaurant_id', restaurantId)
    .in('status', ['new', 'preparing', 'ready', 'completed'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch initial orders:', error)
  }

  // Fetch riders for assignment dropdown
  const { data: riders } = await supabase
    .from('delivery_riders')
    .select('id, name, phone, is_active')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)

  // Flatten the customer relationship array if Supabase returned an array
  const formattedOrders = (orders || []).map((order) => {
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
    const rider = Array.isArray(order.delivery_riders) ? order.delivery_riders[0] : order.delivery_riders
    return {
      ...order,
      customer_name: customer?.name ?? 'Unknown',
      customer_phone: customer?.phone ?? '',
      rider_name: rider?.name ?? null,
      rider_phone: rider?.phone ?? null,
    }
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <OrdersBoard initialOrders={formattedOrders} riders={riders || []} restaurantId={restaurantId} theme={theme} />
    </div>
  )
}
