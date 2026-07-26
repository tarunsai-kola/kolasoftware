import { createClient } from '@/lib/supabase/server'

export interface SavingsResult {
  totalAmount: number
  estimatedAggregatorCost: number
  savings: number
  orderCount: number
}

export async function calculateSavings(
  restaurantId: string,
  startDate: string, // ISO format (e.g., '2023-10-01')
  endDate: string    // ISO format
): Promise<SavingsResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, total_amount')
    .eq('restaurant_id', restaurantId)
    .eq('payment_status', 'paid')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) {
    console.error('Error calculating savings:', error)
    return {
      totalAmount: 0,
      estimatedAggregatorCost: 0,
      savings: 0,
      orderCount: 0
    }
  }

  const orders = data || []
  const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  
  // 25% aggregator commission model
  const estimatedAggregatorCost = totalAmount * 0.25
  const savings = estimatedAggregatorCost // Exact savings vs 3rd party commission

  return {
    totalAmount,
    estimatedAggregatorCost,
    savings,
    orderCount: orders.length
  }
}
