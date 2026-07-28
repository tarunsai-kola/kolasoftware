import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import HistoryClient from '@/components/dashboard/HistoryClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order History',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined } }) {
  const { restaurantId } = await getRestaurantContext()
  const supabase = await createClient()

  const resolvedSearchParams = await Promise.resolve(searchParams)
  const pageParam = resolvedSearchParams?.page
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1
  const currentPage = isNaN(page) || page < 1 ? 1 : page
  const PAGE_SIZE = 30
  
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: orders, count, error } = await supabase
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
    `, { count: 'exact' })
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .range(from, to)

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

  const totalOrders = count || 0
  const totalPages = Math.ceil(totalOrders / PAGE_SIZE)

  return (
    <HistoryClient 
      orders={formattedOrders} 
      currentPage={currentPage} 
      totalPages={totalPages} 
      totalOrders={totalOrders} 
    />
  )
}
