'use server'

import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRestaurantSettings(formData: FormData) {
  const { restaurantId } = await getRestaurantContext()
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const kitchen_email = (formData.get('kitchen_email') as string)?.trim()
  const primary_color = (formData.get('primary_color') as string)?.trim()
  const font_family = (formData.get('font_family') as string)?.trim()
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  const banner_image_url = (formData.get('banner_image_url') as string)?.trim() || null

  if (!name || !kitchen_email) {
    return { success: false, error: 'Name and Kitchen Email are required.' }
  }

  const { error } = await supabase
    .from('restaurants')
    .update({ name, kitchen_email, primary_color, font_family, logo_url, banner_image_url })
    .eq('id', restaurantId)

  if (error) {
    console.error('[settings] update failed:', error)
    return { success: false, error: 'Failed to save settings. Please try again.' }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()

  const newPassword = (formData.get('new_password') as string)?.trim()
  const confirmPassword = (formData.get('confirm_password') as string)?.trim()

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    console.error('[settings] password change failed:', error)
    return { success: false, error: 'Failed to change password. Please try again.' }
  }

  return { success: true }
}
