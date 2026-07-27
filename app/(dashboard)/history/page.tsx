import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import HistoryClient from '@/components/dashboard/HistoryClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order History',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const { restaurantId } = await getRestaurantContext()
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total_amount,
      delivery_type,
      created_at,
      items,
      delivery_address,
      customer:customers ( name, phone )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Failed to fetch order history:', error)
  }

  const formattedOrders = (orders || []).map((order) => {
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
    return {
      ...order,
      customer_name: customer?.name ?? 'Unknown',
      customer_phone: customer?.phone ?? '',
    }
  })

  return <HistoryClient orders={formattedOrders} />
}
