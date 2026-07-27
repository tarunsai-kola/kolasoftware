import { headers } from 'next/headers'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import RidersClient from './RidersClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function RidersPage() {
  const { restaurantId, theme } = await getRestaurantContext()
  const supabase = await createClient()

  // Verify owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffRecord } = await supabase
    .from('restaurant_staff')
    .select('role')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!staffRecord || staffRecord.role !== 'owner') {
    redirect('/orders')
  }

  // Fetch riders
  const { data: riders, error } = await supabase
    .from('delivery_riders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  return <RidersClient initialRiders={riders || []} restaurantId={restaurantId} theme={theme} />
}
