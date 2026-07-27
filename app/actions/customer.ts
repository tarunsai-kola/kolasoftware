'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function saveCustomerProfile(name: string, phone: string) {
  try {
    const supabase = await createClient()
    
    // 1. Verify authenticated user securely via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Session expired. Please log in again.' }
    }

    // 2. Use service role to bypass RLS restrictions
    // This allows us to see guest profiles (user_id is null) which RLS hides from the authenticated user
    const adminClient = createServiceRoleClient()
    const cleanPhone = phone.trim().replace(/\D/g, '')

    // Check if this user_id already has a profile
    const { data: existingUser } = await adminClient
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingUser) {
      // Update existing profile
      const { error: updateError } = await adminClient
        .from('customers')
        .update({
          name: name.trim(),
          phone: cleanPhone,
          email: user.email,
        })
        .eq('id', existingUser.id)

      if (updateError) {
        return { error: 'This phone number is already registered to another account.' }
      }
      
      return { success: true }
    }

    // Check if the phone number already exists (e.g. from a past guest order)
    const { data: existingPhone } = await adminClient
      .from('customers')
      .select('id, user_id')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (existingPhone) {
      if (existingPhone.user_id && existingPhone.user_id !== user.id) {
        return { error: 'This phone number is already registered to another account.' }
      }
      
      // Claim the guest profile
      const { error: claimError } = await adminClient
        .from('customers')
        .update({
          user_id: user.id,
          name: name.trim(),
          email: user.email,
        })
        .eq('id', existingPhone.id)
        
      if (claimError) {
        return { error: claimError.message || 'Could not claim guest profile.' }
      }
      
      return { success: true }
    }

    // Create entirely new profile
    const { error: insertError } = await adminClient
      .from('customers')
      .insert({
        user_id: user.id,
        name: name.trim(),
        email: user.email,
        phone: cleanPhone,
      })

    if (insertError) {
      return { error: insertError.message || 'Could not create new profile.' }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
