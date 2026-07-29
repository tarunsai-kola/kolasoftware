import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import AnalysisDashboard from '@/components/dashboard/AnalysisDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orders Analysis',
  robots: { index: false },
}

export default async function AnalysisPage({ searchParams }: { searchParams: { month?: string } }) {
  const { restaurantId, theme } = await getRestaurantContext()
  const supabase = await createClient()

  // 1. Fetch completed orders for the restaurant
  // For a production app, you might want to paginate or filter by date range.
  // We'll fetch the last 1000 completed orders for a solid analysis.
  const selectedMonth = searchParams.month || 'all'

  let query = supabase
    .from('orders')
    .select('id, created_at, total_amount, items, delivery_rider_id')
    .eq('restaurant_id', restaurantId)
    .neq('status', 'cancelled')

  if (selectedMonth !== 'all') {
    // selectedMonth is expected in 'YYYY-MM' format
    const [year, month] = selectedMonth.split('-').map(Number)
    if (year && month) {
      const startDate = new Date(Date.UTC(year, month - 1, 1))
      const endDate = new Date(Date.UTC(year, month, 1)) // 1st of next month
      query = query
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
    }
  }

  const { data: orders, error: ordersError } = await query
    .order('created_at', { ascending: false })
    .limit(5000)

  if (ordersError) {
    console.error('Failed to fetch orders for analysis:', ordersError)
  }

  // 2. Fetch delivery riders for this restaurant to map rider names
  const { data: riders, error: ridersError } = await supabase
    .from('delivery_riders')
    .select('id, name')
    .eq('restaurant_id', restaurantId)

  if (ridersError) {
    console.error('Failed to fetch riders for analysis:', ridersError)
  }

  const validOrders = orders || []
  const validRiders = riders || []

  // 3. Process Data for the Dashboard
  
  // A. Premium Metrics
  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const totalOrders = validOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // B. Peak Ordering Times (Orders by hour of the day)
  const hourCounts = new Array(24).fill(0)
  validOrders.forEach(order => {
    const date = new Date(order.created_at)
    const hour = date.getHours() // 0 to 23 (local time)
    hourCounts[hour]++
  })

  const peakHoursData = hourCounts.map((count, hour) => {
    // Format hour as "12 AM", "1 PM", etc.
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return {
      time: `${displayHour} ${ampm}`,
      orders: count
    }
  })

  // C. Top Selling Items
  const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {}
  validOrders.forEach(order => {
    const items = order.items as any[]
    if (Array.isArray(items)) {
      items.forEach(item => {
        const id = item.menu_item_id || item.id || item.name // fallback to name if id is missing
        if (!itemStats[id]) {
          itemStats[id] = { name: item.name, quantity: 0, revenue: 0 }
        }
        itemStats[id].quantity += Number(item.quantity)
        // Some snapshots might have price_at_order or just price
        const price = Number(item.price_at_order || item.price || 0)
        itemStats[id].revenue += (price * Number(item.quantity))
      })
    }
  })

  const topItemsData = Object.values(itemStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10) // Top 10 items

  // D. Best Drivers
  const driverStats: Record<string, { name: string; deliveries: number }> = {}
  validRiders.forEach(r => {
    driverStats[r.id] = { name: r.name, deliveries: 0 }
  })
  
  validOrders.forEach(order => {
    if (order.delivery_rider_id && driverStats[order.delivery_rider_id]) {
      driverStats[order.delivery_rider_id].deliveries++
    }
  })

  const bestDriversData = Object.values(driverStats)
    .filter(d => d.deliveries > 0)
    .sort((a, b) => b.deliveries - a.deliveries)

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col overflow-y-auto">
      <AnalysisDashboard 
        theme={theme}
        currentMonth={selectedMonth}
        metrics={{
          totalRevenue,
          totalOrders,
          averageOrderValue
        }}
        peakHoursData={peakHoursData}
        topItemsData={topItemsData}
        bestDriversData={bestDriversData}
      />
    </div>
  )
}
