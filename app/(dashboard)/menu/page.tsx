import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import MenuManager from '@/components/dashboard/MenuManager'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manage Menu',
  robots: { index: false },
}

export default async function MenuPage() {
  const { restaurantId, theme } = await getRestaurantContext()
  const supabase = await createClient()

  // Fetch all menu items for this restaurant
  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch menu items:', error)
  }

  // Extract unique categories for the dropdown in the UI
  const categories = Array.from(new Set((menuItems || []).map((item) => item.category)))

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Manage Menu</h1>
          <p className="mt-1 text-sm text-gray-500">Add, edit, or reorder your menu items</p>
        </div>
      </div>

      <MenuManager 
        initialItems={menuItems || []} 
        categories={categories}
        restaurantId={restaurantId} 
        theme={theme} 
      />
    </div>
  )
}
