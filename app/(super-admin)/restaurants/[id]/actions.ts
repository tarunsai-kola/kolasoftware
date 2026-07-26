'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getErrorMessage } from '@/lib/utils/error'

export async function updateRestaurantStatus(restaurantId: string, newStatus: 'active' | 'suspended') {
  const supabase = await createClient()
  
  // Note: Only platform_admins can execute this due to RLS on the table
  const { error } = await supabase
    .from('restaurants')
    .update({ status: newStatus })
    .eq('id', restaurantId)

  if (error) {
    return { error: getErrorMessage(error) }
  }

  revalidatePath('/restaurants')
  revalidatePath(`/restaurants/${restaurantId}`)
  
  return { success: true }
}
