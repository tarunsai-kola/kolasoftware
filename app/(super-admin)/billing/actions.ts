'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAsPaid(restaurantId: string, currentBillingDate: string | null) {
  const supabase = await createClient()
  
  // 1. Calculate Period Start & End (Current Month)
  const today = new Date()
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  // 2. Insert into billing_payments
  const { error: paymentError } = await supabase
    .from('billing_payments')
    .insert({
      restaurant_id: restaurantId,
      amount: 2000,
      status: 'paid',
      paid_at: new Date().toISOString(),
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
    })

  if (paymentError) {
    return { error: `Failed to insert payment: ${paymentError.message}` }
  }

  // 3. Advance next_billing_date by one month in restaurants table
  // If they didn't have one, start them from exactly one month from today
  let nextDate = new Date()
  if (currentBillingDate) {
    nextDate = new Date(currentBillingDate)
    nextDate.setMonth(nextDate.getMonth() + 1)
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }

  const { error: restError } = await supabase
    .from('restaurants')
    .update({ 
      next_billing_date: nextDate.toISOString().split('T')[0],
      subscription_status: 'active'
    })
    .eq('id', restaurantId)

  if (restError) {
    return { error: `Failed to update billing date: ${restError.message}` }
  }

  revalidatePath('/billing')
  return { success: true }
}
