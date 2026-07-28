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
  
  const address = (formData.get('address') as string)?.trim() || null
  const latStr = (formData.get('lat') as string)?.trim()
  const lngStr = (formData.get('lng') as string)?.trim()
  const radiusStr = (formData.get('delivery_radius_km') as string)?.trim()
  
  const lat = latStr ? parseFloat(latStr) : null
  const lng = lngStr ? parseFloat(lngStr) : null
  const delivery_radius_km = radiusStr ? parseFloat(radiusStr) : null

  // Payment fields
  const is_cod_enabled = formData.get('is_cod_enabled') === 'true'
  const is_online_payment_enabled = formData.get('is_online_payment_enabled') === 'true'
  const razorpay_key_id = (formData.get('razorpay_key_id') as string)?.trim() || null
  const razorpay_key_secret = (formData.get('razorpay_key_secret') as string)?.trim() || null
  const razorpay_webhook_secret = (formData.get('razorpay_webhook_secret') as string)?.trim() || null

  const whatsapp_number = (formData.get('whatsapp_number') as string)?.trim() || null
  const is_accepting_orders = formData.get('is_accepting_orders') === 'true'
  const announcement_message = (formData.get('announcement_message') as string)?.trim() || null
  const opening_time = (formData.get('opening_time') as string)?.trim() || '09:00:00'
  const closing_time = (formData.get('closing_time') as string)?.trim() || '22:00:00'

  if (!name || !kitchen_email) {
    return { success: false, error: 'Name and Kitchen Email are required.' }
  }

  const { error } = await supabase
    .from('restaurants')
    .update({ 
      name, kitchen_email, primary_color, font_family, logo_url, banner_image_url,
      address, lat, lng, delivery_radius_km,
      is_cod_enabled, is_online_payment_enabled,
      razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret,
      whatsapp_number, is_accepting_orders, announcement_message,
      opening_time, closing_time
    })
    .eq('id', restaurantId)

  if (error) {
    console.error('[settings] update failed:', error)
    return { success: false, error: 'Failed to save settings. Please try again.' }
  }

  revalidatePath('/', 'layout')
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
