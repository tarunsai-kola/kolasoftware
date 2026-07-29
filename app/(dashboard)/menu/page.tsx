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
    .select('id, name, description, price, category, image_url, is_available, sort_order, food_type, cuisine_tags, prep_time_minutes, spice_level, sku, discounted_price, dine_in_price, delivery_price, variant_groups, addon_groups, schedule_type, schedule_slots')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch menu items:', error)
  }

  // Fetch category_order from restaurants
  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('category_order')
    .eq('id', restaurantId)
    .single()

  const categoryOrder: string[] = restaurantData?.category_order || []

  // Extract unique categories for the dropdown in the UI
  let categories = Array.from(new Set((menuItems || []).map((item) => item.category)))
  
  // Sort based on category_order
  categories.sort((a, b) => {
    const idxA = categoryOrder.indexOf(a)
    const idxB = categoryOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <MenuManager 
        initialItems={menuItems || []} 
        categories={categories}
        restaurantId={restaurantId} 
        theme={theme} 
      />
    </div>
  )
}
