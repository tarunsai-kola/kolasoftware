// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js"
import { render } from "npm:@react-email/render"
import * as React from "npm:react"
import { format } from "npm:date-fns"

// Import React templates via the import map alias defined in deno.json
import { OrderConfirmationEmail } from "@/lib/email/templates/OrderConfirmationEmail.tsx"
import { KitchenOrderAlertEmail } from "@/lib/email/templates/KitchenOrderAlertEmail.tsx"

// ── Types ──────────────────────────────────────────────────────────────────
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: unknown
  schema: string
  old_record: unknown
}

// ── Resend API Wrapper ──────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL')

async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  retries = 1
): Promise<boolean> {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.error('[send-order-emails] Missing Resend environment variables')
    return false
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to,
          subject,
          html,
        }),
      })

      if (res.ok) {
        return true
      }

      const errorData = await res.text()
      console.error(`[send-order-emails] Resend API error (Attempt ${attempt + 1}):`, res.status, errorData)
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error(`[send-order-emails] Network error (Attempt ${attempt + 1}):`, err)
    }
  }

  return false
}

// ── Edge Function Handler ───────────────────────────────────────────────────

serve(async (req) => {
  try {
    // 1. Verify Request
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = (await req.json()) as WebhookPayload
    const order = payload.record

    // 2. Validate Event
    // We only process if payment_status is 'paid'. The webhook trigger should theoretically
    // handle this, but it's safe to check here in case the webhook fires broadly.
    if (order.payment_status !== 'paid') {
      console.log(`[send-order-emails] Order ${order.id} payment_status is '${order.payment_status}', skipping emails.`)
      return new Response('OK - Skipped', { status: 200 })
    }

    // Initialize Supabase Service Role Client to fetch related data bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[send-order-emails] Missing Supabase environment variables')
      // Return 200 so Webhook doesn't endlessly retry an impossible config error
      return new Response('Configuration Error', { status: 200 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Fetch Related Data (Restaurant and Customer)
    const [restaurantRes, customerRes] = await Promise.all([
      supabase.from('restaurants').select('name, logo_url, primary_color, kitchen_email').eq('id', order.restaurant_id).single(),
      supabase.from('customers').select('name, email, phone').eq('id', order.customer_id).single()
    ])

    if (restaurantRes.error) {
      console.error(`[send-order-emails] Error fetching restaurant ${order.restaurant_id}:`, restaurantRes.error)
      return new Response('Data Fetch Error', { status: 200 })
    }

    if (customerRes.error) {
      console.error(`[send-order-emails] Error fetching customer ${order.customer_id}:`, customerRes.error)
      return new Response('Data Fetch Error', { status: 200 })
    }

    const restaurant = restaurantRes.data
    const customer = customerRes.data
    const items = Array.isArray(order.items) ? order.items : []

    // 4. Render & Send Emails

    // A. Kitchen Alert Email (Always send)
    if (restaurant.kitchen_email) {
      console.log(`[send-order-emails] Rendering Kitchen Alert for ${restaurant.kitchen_email}`)
      const kitchenHtml = await render(
        React.createElement(KitchenOrderAlertEmail, {
          orderId: order.id,
          orderTime: format(new Date(order.created_at), 'hh:mm a'),
          items: items,
          customerName: customer.name,
          customerPhone: customer.phone,
          deliveryType: order.delivery_type,
          deliveryAddress: order.delivery_address,
          totalAmount: order.total_amount
        })
      )
      
      const kSent = await sendEmailWithRetry(
        restaurant.kitchen_email,
        `🚨 New Order #${order.id.slice(0, 6).toUpperCase()} - ${customer.name}`,
        kitchenHtml
      )
      console.log(`[send-order-emails] Kitchen Alert status: ${kSent ? 'Success' : 'Failed'}`)
    }

    // B. Customer Confirmation Email (Only if they provided an email)
    if (customer.email) {
      console.log(`[send-order-emails] Rendering Customer Confirmation for ${customer.email}`)
      const customerHtml = await render(
        React.createElement(OrderConfirmationEmail, {
          restaurantName: restaurant.name,
          restaurantLogo: restaurant.logo_url,
          orderId: order.id,
          items: items,
          totalAmount: order.total_amount,
          deliveryType: order.delivery_type,
          deliveryAddress: order.delivery_address
        })
      )
      
      const cSent = await sendEmailWithRetry(
        customer.email,
        `Your order from ${restaurant.name} is confirmed!`,
        customerHtml
      )
      console.log(`[send-order-emails] Customer Confirmation status: ${cSent ? 'Success' : 'Failed'}`)
    }

    // 5. Always Return 200 OK
    // Webhooks should not retry if Resend is down. Email is non-critical path.
    return new Response('Emails processed successfully', {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error(`[send-order-emails] Unhandled exception:`, err)
    // Always return 200 to acknowledge receipt and prevent webhook retries
    return new Response('Exception Caught', { status: 200 })
  }
})
