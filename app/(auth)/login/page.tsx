'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils/error'
import { sendPasswordResetOtp } from '@/app/actions/auth'

type Step = 'login' | 'forgot-password' | 'verify-otp' | 'new-password'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 1. Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(getErrorMessage(error))
      setIsLoading(false)
      return
    }

    toast.success('Logged in successfully')
    router.refresh()
    router.push('/orders')
  }

  // 2. Handle sending OTP
  const handleSendResetOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    startTransition(async () => {
      const result = await sendPasswordResetOtp(email.trim().toLowerCase())
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Reset code sent to your email')
      setStep('verify-otp')
    })
  }

  // 3. Handle verifying OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error('Please enter a valid verification code')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'magiclink' // Or 'recovery' depending on supabase settings, magiclink works for standard OTP generateLink
    })

    if (error) {
      toast.error('Invalid or expired code')
      setIsLoading(false)
      return
    }

    toast.success('Code verified!')
    setStep('new-password')
    setIsLoading(false)
  }

  // 4. Handle saving new password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      toast.error(getErrorMessage(error))
      setIsLoading(false)
      return
    }

    toast.success('Password updated successfully!')
    router.refresh()
    router.push('/orders')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            {step === 'login' && 'Staff Sign In'}
            {step === 'forgot-password' && 'Reset Password'}
            {step === 'verify-otp' && 'Verify Email'}
            {step === 'new-password' && 'New Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'login' && 'Sign in to manage your restaurant'}
            {step === 'forgot-password' && 'Enter your email to receive a reset code'}
            {step === 'verify-otp' && 'Enter the verification code sent to your email'}
            {step === 'new-password' && 'Create a strong new password'}
          </p>
        </div>

        {/* ── STEP 1: LOGIN ──────────────────────────────────────────────────────── */}
        {step === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setStep('forgot-password')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: 'var(--restaurant-primary)' }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: FORGOT PASSWORD ──────────────────────────────────────────── */}
        {step === 'forgot-password' && (
          <form className="mt-8 space-y-6" onSubmit={handleSendResetOtp}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="reset-email" className="sr-only">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
                style={{ backgroundColor: 'var(--restaurant-primary)' }}
              >
                {isPending ? 'Sending...' : 'Send Verification Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 text-center py-2"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: VERIFY OTP ──────────────────────────────────────────────── */}
        {step === 'verify-otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="otp" className="sr-only">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength={8}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl tracking-[0.5em] font-mono text-gray-900 placeholder-gray-300 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
                style={{ backgroundColor: 'var(--restaurant-primary)' }}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('forgot-password')}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 text-center py-2"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4: NEW PASSWORD ────────────────────────────────────────────── */}
        {step === 'new-password' && (
          <form className="mt-8 space-y-6" onSubmit={handleSaveNewPassword}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="new-password" className="sr-only">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading || newPassword.length < 6}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
                style={{ backgroundColor: 'var(--restaurant-primary)' }}
              >
                {isLoading ? 'Saving...' : 'Save & Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
