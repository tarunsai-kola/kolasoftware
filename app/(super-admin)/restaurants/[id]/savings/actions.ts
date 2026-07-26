'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { SavingsReportEmail } from '@/lib/email/templates/SavingsReportEmail'
import { calculateSavings } from '@/lib/calculate-savings'
import React from 'react'

export async function sendSavingsReport(restaurantId: string, monthName: string) {
  const supabase = await createClient()
  
  // We need the admin client to look up the owner's email address from auth.users
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Fetch restaurant and owner_id
    const { data: restaurant, error: rError } = await supabase
      .from('restaurants')
      .select('name, owner_id, kitchen_email')
      .eq('id', restaurantId)
      .single()

    if (rError || !restaurant) throw new Error('Restaurant not found.')

    // 2. Resolve owner email
    let targetEmail = restaurant.kitchen_email
    let ownerName = 'Restaurant Owner'

    if (restaurant.owner_id) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(restaurant.owner_id)
      if (!authError && authUser.user.email) {
        targetEmail = authUser.user.email
        ownerName = authUser.user.user_metadata?.name || ownerName
      }
    }

    // 3. Calculate this month's savings dynamically
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()
    
    const stats = await calculateSavings(restaurantId, startDate, endDate)

    // 4. Render Email
    const html = await render(
      React.createElement(SavingsReportEmail, {
        ownerName,
        restaurantName: restaurant.name,
        monthName,
        totalAmount: `₹${stats.totalAmount.toLocaleString('en-IN')}`,
        savings: `₹${stats.savings.toLocaleString('en-IN')}`,
        orderCount: stats.orderCount
      })
    )

    // 5. Dispatch via Resend
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY missing. Simulating email send.')
      return { success: true, simulated: true }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'reports@kolasoftware.com',
        to: targetEmail,
        subject: `Your ${monthName} Savings Report - ${restaurant.name}`,
        html,
      }),
    })

    if (!res.ok) {
      const errTxt = await res.text()
      throw new Error(`Resend API Error: ${errTxt}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send savings report:', error)
    return { error: error.message || 'Failed to send report.' }
  }
}
