import type { Metadata } from 'next'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import StorefrontClient from '@/components/storefront/StorefrontClient'
import { getErrorMessage } from '@/lib/utils/error'

// ─── Shared type used by this page and child components ───────────────────────
export type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  sort_order: number
}

// ─── Dynamic metadata per restaurant ──────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { theme } = await getRestaurantContext()
    return {
      title: `${theme.name} — Order Online`,
      description: `Order fresh food online from ${theme.name}. Fast, direct — no middlemen.`,
      openGraph: {
        title: `${theme.name} — Order Online`,
        images: theme.bannerImageUrl ? [{ url: theme.bannerImageUrl }] : [],
      },
    }
  } catch {
    return { title: 'Order Online' }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StorefrontPage() {
  const { restaurantId } = await getRestaurantContext()

  // Use the anon Supabase client — RLS allows public SELECT on is_available items
  const supabase = await createClient()

  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, category, image_url, sort_order')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    // Log server-side; don't surface DB errors to the customer
    console.error('[StorefrontPage] menu fetch error:', getErrorMessage(error))
  }

  return <StorefrontClient menuItems={menuItems ?? []} />
}
