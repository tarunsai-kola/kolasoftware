import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restaurant_id, category_order } = body

    if (!restaurant_id || !Array.isArray(category_order)) {
      return NextResponse.json({ error: 'Missing restaurant_id or invalid category_order' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .update({ category_order })
      .eq('id', restaurant_id)
      .select('category_order')
      .single()

    if (error) {
      console.error('Failed to update category order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category_order: data.category_order })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
