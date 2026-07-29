'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function sendPasswordResetOtp(email: string) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (error) {
      console.error('Supabase generateLink error:', error)
      if (error.message.toLowerCase().includes('not found')) {
        return { error: 'No account found with this email. Please go back and sign up.' }
      }
      return { error: error.message }
    }

    const otp = (data.properties as any)?.email_otp
    if (!otp) {
      console.error('No OTP returned from generateLink')
      return { error: 'Failed to generate OTP code' }
    }

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@kolasolution.com',
      to: email,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Here is your 6-digit verification code:</p>
          <h1 style="letter-spacing: 5px; font-size: 32px; color: #4F46E5; margin: 20px 0;">${otp}</h1>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return { error: 'Failed to send email via Resend' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('sendPasswordResetOtp exception:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function sendRiderPasswordResetOtp(phone: string) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const syntheticEmail = `${cleanPhone}@rider.kolasoftware.app`

    // 1. Get the rider to find their user_id
    const { data: rider, error: riderError } = await supabaseAdmin
      .from('delivery_riders')
      .select('user_id')
      .eq('phone', phone)
      .single()

    if (riderError || !rider) {
      return { error: 'No rider found with this phone number.' }
    }

    // 2. Get the auth user to find their real email
    const { data: userAuth, error: authError } = await supabaseAdmin.auth.admin.getUserById(rider.user_id)
    
    if (authError || !userAuth.user) {
      return { error: 'Could not find rider auth profile.' }
    }

    const realEmail = userAuth.user.user_metadata?.real_email

    if (!realEmail) {
      return { error: 'No email address is associated with this rider account. Please ask your administrator to reset your password.' }
    }

    // 3. Generate the OTP for the synthetic email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: syntheticEmail,
    })

    if (error) {
      console.error('Supabase generateLink error:', error)
      return { error: error.message }
    }

    const otp = (data.properties as any)?.email_otp
    if (!otp) {
      return { error: 'Failed to generate OTP code' }
    }

    // 4. Send the OTP to their REAL email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@kolasolution.com',
      to: realEmail,
      subject: 'Your Rider Password Reset Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Reset Your Rider Password</h2>
          <p>We received a request to reset your rider password. Here is your verification code:</p>
          <h1 style="letter-spacing: 5px; font-size: 32px; color: #4F46E5; margin: 20px 0;">${otp}</h1>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return { error: 'Failed to send email via Resend' }
    }

    return { success: true, email: realEmail }
  } catch (err: any) {
    console.error('sendRiderPasswordResetOtp exception:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
