import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import DriverDashboard from '@/components/dashboard/DriverDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delivery Map',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function DeliveryPage() {
  const { restaurantId, theme } = await getRestaurantContext()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check if user is a rider
  const { data: rider } = await supabase
    .from('delivery_riders')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let ordersQuery = supabase
    .from('orders')
    .select(`
      id,
      status,
      total_amount,
      delivery_type,
      delivery_address,
      delivery_lat,
      delivery_lng,
      created_at,
      items,
      customer:customers ( name, phone )
    `)
    .eq('restaurant_id', restaurantId)
    .eq('delivery_type', 'delivery')
    .order('created_at', { ascending: false })

  if (rider) {
    // Rider view: Only show their assigned orders (both active and completed for history)
    ordersQuery = ordersQuery.eq('delivery_rider_id', rider.id)
  } else {
    // Admin/Manager view: Show all ready/preparing delivery orders on the map
    ordersQuery = ordersQuery.in('status', ['ready', 'preparing', 'out_for_delivery'])
  }

  const { data: orders, error } = await ordersQuery

  if (error) {
    console.error('Failed to fetch delivery orders:', error)
  }

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
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Delivery Map</h1>
        <p className="text-sm text-gray-500">Live view of orders ready for delivery</p>
      </div>
      <DriverDashboard initialOrders={formattedOrders as any} restaurantId={restaurantId} theme={theme} />
    </div>
  )
}
