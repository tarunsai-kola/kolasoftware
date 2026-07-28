import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/dashboard/SettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restaurant Settings',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { restaurantId } = await getRestaurantContext()
  const supabase = await createClient()

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, domain, subdomain, logo_url, primary_color, font_family, banner_image_url, kitchen_email, status, subscription_status, address, lat, lng, delivery_radius_km, is_cod_enabled, is_online_payment_enabled, razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret')
    .eq('id', restaurantId)
    .single()

  if (error || !restaurant) {
    console.error('[settings] failed to fetch restaurant:', error)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">Failed to load settings. Please refresh.</p>
      </div>
    )
  }

  return <SettingsClient restaurant={restaurant} />
}
