'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { WelcomeOwnerEmail } from '@/lib/email/templates/WelcomeOwnerEmail'
import React from 'react'

export interface OnboardData {
  name: string
  subdomain: string
  domain: string | null
  logo_url: string | null
  primary_color: string
  font_family: string
  kitchen_email: string
  owner_email: string
  owner_name: string
}

export async function onboardRestaurant(data: OnboardData) {
  // We use the regular server client for normal operations
  const supabase = await createClient()
  
  // We MUST use the Admin API to create users without requiring email confirmation loops
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let newRestaurantId: string | null = null
  let newUserId: string | null = null

  try {
    // 1. Insert Restaurant as pending_setup
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .insert({
        name: data.name,
        subdomain: data.subdomain,
        domain: data.domain || null,
        logo_url: data.logo_url,
        primary_color: data.primary_color,
        font_family: data.font_family,
        kitchen_email: data.kitchen_email,
        status: 'pending_setup',
        subscription_status: 'trialing',
      })
      .select('id')
      .single()

    if (restError) throw new Error(`Restaurant creation failed: ${restError.message}`)
    newRestaurantId = restaurant.id

    // 2. Generate Temp Password & Create User
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4)
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.owner_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: data.owner_name }
    })

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`)
    newUserId = authData.user.id

    // 3. Link User to Restaurant via restaurant_staff
    const { error: staffError } = await supabaseAdmin
      .from('restaurant_staff')
      .insert({
        restaurant_id: newRestaurantId,
        user_id: newUserId,
        role: 'owner'
      })

    if (staffError) throw new Error(`Staff linking failed: ${staffError.message}`)

    // 4. Update the Restaurant to set the owner_id and mark active
    const { error: updateError } = await supabaseAdmin
      .from('restaurants')
      .update({ owner_id: newUserId, status: 'active' })
      .eq('id', newRestaurantId)

    if (updateError) throw new Error(`Failed to activate restaurant: ${updateError.message}`)

    // 5. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
          : 'https://kolasoftware.com/login'

        const html = await render(
          React.createElement(WelcomeOwnerEmail, {
            ownerName: data.owner_name,
            restaurantName: data.name,
            loginUrl,
            temporaryPassword: tempPassword
          })
        )

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@kolasoftware.com',
            to: data.owner_email,
            subject: `Welcome to the Platform - ${data.name}`,
            html,
          }),
        })
      } catch (err) {
        console.error('Failed to send welcome email, but continuing:', err)
      }
    }

    // 6. Vercel Domains API (Optional)
    if (data.domain && process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: data.domain }),
        })
      } catch (err) {
        console.error('Failed to register domain with Vercel, but continuing:', err)
      }
    }

    return { 
      success: true, 
      restaurantId: newRestaurantId,
      ownerEmail: data.owner_email,
      tempPassword 
    }

  } catch (error: unknown) {
    console.error('Onboarding Transaction Failed:', error)
    
    // Attempt rollback if we failed mid-way
    if (newUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
      } catch {
        // ignore
      }
    }
    if (newRestaurantId) {
      try {
        await supabaseAdmin.from('restaurants').delete().eq('id', newRestaurantId)
      } catch {
        // ignore
      }
    }

    return { error: error instanceof Error ? error.message : 'An unknown error occurred during onboarding.' }
  }
}
