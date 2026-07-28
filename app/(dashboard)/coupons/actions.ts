'use server'

import { revalidatePath } from 'next/cache'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().min(0.01),
  minOrderAmount: z.number().min(0).default(0),
  usageLimit: z.number().nullable().optional(),
  multipleUsesPerCustomer: z.boolean().default(false),
})

export async function createCoupon(formData: FormData) {
  try {
    const { restaurantId } = await getRestaurantContext()
    const supabase = await createClient()

    // Validate inputs
    const usageLimitStr = formData.get('usageLimit') as string
    
    const input = {
      code: (formData.get('code') as string).toUpperCase(),
      discountType: formData.get('discountType') as string,
      discountValue: parseFloat(formData.get('discountValue') as string),
      minOrderAmount: parseFloat((formData.get('minOrderAmount') as string) || '0'),
      usageLimit: usageLimitStr ? parseInt(usageLimitStr) : null,
      multipleUsesPerCustomer: formData.get('multipleUsesPerCustomer') === 'on',
    }

    const parsed = couponSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid input parameters.' }
    }

    const { data } = parsed

    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return { success: false, error: 'Percentage discount cannot exceed 100%.' }
    }

    // Insert coupon
    const { error } = await supabase.from('coupons').insert({
      restaurant_id: restaurantId,
      code: data.code,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      min_order_amount: data.minOrderAmount,
      usage_limit: data.usageLimit,
      multiple_uses_per_customer: data.multipleUsesPerCustomer,
    })

    if (error) {
      if (error.code === '23505') { // unique violation
        return { success: false, error: 'A coupon with this code already exists.' }
      }
      return { success: false, error: 'Failed to create coupon.' }
    }

    revalidatePath('/coupons')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    const { restaurantId } = await getRestaurantContext()
    const supabase = await createClient()

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId)
      .eq('restaurant_id', restaurantId)

    if (error) {
      return { success: false, error: 'Failed to delete coupon.' }
    }

    revalidatePath('/coupons')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
