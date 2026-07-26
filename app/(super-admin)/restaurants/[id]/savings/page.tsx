import { createClient } from '@/lib/supabase/server'
import { calculateSavings } from '@/lib/calculate-savings'
import { notFound } from 'next/navigation'
import SavingsPageClient from './SavingsPageClient'

export default async function SavingsPageServer({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // 1. Fetch Restaurant Info
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', params.id)
    .single()

  if (error || !restaurant) {
    notFound()
  }

  // 2. Calculate Dates (Current Month)
  const today = new Date()
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' })
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()

  // 3. Fetch Savings Data
  const stats = await calculateSavings(params.id, startDate, endDate)

  return (
    <SavingsPageClient 
      restaurantId={params.id}
      restaurantName={restaurant.name}
      monthName={monthName}
      totalAmount={stats.totalAmount}
      savings={stats.savings}
      orderCount={stats.orderCount}
    />
  )
}
