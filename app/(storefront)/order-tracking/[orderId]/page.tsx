import { createClient } from '@/lib/supabase/server'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import OrderTrackingClient from '@/components/storefront/OrderTrackingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Order',
}

export const dynamic = 'force-dynamic'

export default async function OrderTrackingPage({ params }: { params: { orderId: string } }) {
  const supabase = await createClient()
  const { restaurantId, theme } = await getRestaurantContext()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, status, delivery_type, delivery_address, total_amount,
      items, created_at,
      customer:customers ( name, phone )
    `)
    .eq('id', params.orderId)
    .eq('restaurant_id', restaurantId)
    .single()

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">Order not found</p>
          <p className="mt-2 text-gray-500">This order link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer

  return (
    <OrderTrackingClient
      orderId={params.orderId}
      initialStatus={order.status}
      deliveryType={order.delivery_type}
      deliveryAddress={order.delivery_address}
      totalAmount={order.total_amount}
      items={order.items as { name: string; quantity: number; price: number }[]}
      customerName={customer?.name ?? 'Customer'}
      createdAt={order.created_at}
      restaurantName={theme.name}
      restaurantColor={theme.primaryColor}
    />
  )
}
