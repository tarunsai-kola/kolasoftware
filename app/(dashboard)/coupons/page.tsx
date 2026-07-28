import type { Metadata } from 'next'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import CouponsClient from '@/components/dashboard/CouponsClient'

export const metadata: Metadata = {
  title: 'Coupons | KolaSoftware',
}

export default async function CouponsPage() {
  const { restaurantId } = await getRestaurantContext()
  const supabase = await createClient()

  // Fetch existing coupons
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  return <CouponsClient initialCoupons={coupons || []} />
}
