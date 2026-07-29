import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, vehicle_info, password, restaurant_id, email } = body

    if (!name || !phone || !password || !restaurant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize Supabase Admin Client using the Service Role Key
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

    // Create a synthetic email for the rider to log in with
    // e.g. 9876543210@rider.kolasoftware.app
    const syntheticEmail = `${phone.replace(/[^0-9]/g, '')}@rider.kolasoftware.app`

    // 1. Create the Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'rider',
        name: name
      }
    })

    if (authError) {
      console.error('Rider Auth Creation Error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Insert into delivery_riders table
    const { data: riderData, error: dbError } = await supabaseAdmin
      .from('delivery_riders')
      .insert({
        restaurant_id,
        user_id: userId,
        name,
        phone,
        vehicle_info,
        is_active: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Rider DB Insert Error:', dbError)
      // Cleanup auth user if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to save rider profile: ${dbError.message || dbError.details || JSON.stringify(dbError)}` }, { status: 500 })
    }

    // 3. Send Credentials via Resend if email is provided
    if (email && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: 'Your Delivery Rider Credentials',
          html: `
            <h2>Welcome, ${name}!</h2>
            <p>You have been added as a delivery rider. Here are your login credentials:</p>
            <ul>
              <li><strong>Phone Number (Login ID):</strong> ${phone}</li>
              <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Please download the rider app and log in with these credentials.</p>
          `
        })
      } catch (emailErr) {
        console.error('Failed to send credentials email:', emailErr)
        // We do not fail the request if the email fails, since the rider was successfully created
      }
    }

    return NextResponse.json({ rider: riderData })

  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
