import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RestaurantList from '@/components/super-admin/RestaurantList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manage Restaurants | Super Admin',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminRestaurantsPage() {
  const supabase = await createClient()

  // Query the newly created view which aggregates orders_this_month
  const { data: restaurants, error } = await supabase
    .from('vw_admin_restaurant_stats')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch admin restaurant stats:', error)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Platform Tenants</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all restaurants across the platform</p>
        </div>
        <Link href="/restaurants/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
          + Onboard Restaurant
        </Link>
      </div>

      <RestaurantList initialRestaurants={restaurants || []} />
    </div>
  )
}
