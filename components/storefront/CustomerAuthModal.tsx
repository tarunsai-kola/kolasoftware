'use client'

import { useState, useTransition, useEffect, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCustomer } from './CustomerContext'
import toast from 'react-hot-toast'
import { saveCustomerProfile } from '@/app/actions/customer'
import { sendPasswordResetOtp } from '@/app/actions/auth'

// =============================================================================
// Types
// =============================================================================

type Step = 'email' | 'password-login' | 'password-signup' | 'profile' | 'done' | 'check-email' | 'forgot-password' | 'verify-otp' | 'new-password'

interface CustomerAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void   // called when auth + profile complete
  primaryColor?: string
}

// =============================================================================
// Component
// =============================================================================

export default function CustomerAuthModal({ isOpen, onClose, onSuccess, primaryColor = '#D85A30' }: CustomerAuthModalProps) {
  const supabase = createClient()
  const { refreshCustomer } = useCustomer()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('email')
      setPassword('')
      setOtp('')
      setNewPassword('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── Step 1: Check Email ────────────────────────────────────────────────────
  const handleCheckEmail = () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    startTransition(async () => {
      // Check if this email exists in our customers table
      const { data } = await supabase
        .from('customers')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      if (data) {
        // User exists, ask for password to login
        setStep('password-login')
      } else {
        // User doesn't exist in customers table, ask to create a password
        setStep('password-signup')
      }
    })
  }

  // ── Step 2a: Log In ────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    startTransition(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error || !data.user) {
        toast.error('Incorrect password. Please try again.')
        return
      }

      // Check if they have a complete profile
      const { data: profile } = await supabase
        .from('customers')
        .select('name, phone')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!profile || !profile.name || !profile.phone) {
        // Missing profile info, redirect to profile step
        const guessedName = data.user.email?.split('@')[0]?.replace(/[._]/g, ' ') ?? ''
        setName(guessedName.charAt(0).toUpperCase() + guessedName.slice(1))
        setStep('profile')
        return
      }

      await refreshCustomer()
      onSuccess()
    })
  }

  // ── Step 2b: Sign Up ───────────────────────────────────────────────────────
  const handleSignUp = () => {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        if (error.message.includes('already registered')) {
          // Gracefully handle the case where they are in auth.users but not in customers table
          toast.success('Welcome back! Please log in instead.', { icon: '👋' })
          setStep('password-login')
          setPassword('')
        } else {
          toast.error(error.message)
        }
        return
      }

      if (!data.user) return

      // If email confirmation is ON, Supabase returns the user but no session.
      // They must click the link in their email to log in.
      if (!data.session) {
        setStep('check-email')
        return
      }

      // Pre-fill name from email if available
      const guessedName = data.user.email?.split('@')[0]?.replace(/[._]/g, ' ') ?? ''
      setName(guessedName.charAt(0).toUpperCase() + guessedName.slice(1))
      setStep('profile')
    })
  }

  // ── Step 3: Save profile ──────────────────────────────────────────────────
  const handleSaveProfile = () => {
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) { toast.error('Please enter a valid 10-digit phone number'); return }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expired. Please check your Supabase Auth settings.')
        return
      }

      const cleanPhone = phone.trim().replace(/\D/g, '')

      const result = await saveCustomerProfile(name.trim(), cleanPhone)

      if (result.error) {
        toast.error(result.error)
        return
      }

      // Fallback: save to localStorage to guarantee checkout form pre-fills immediately
      try {
        localStorage.setItem('checkout_guest_info', JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          email: user.email,
        }))
      } catch (e) {
        // ignore quota errors
      }

      await refreshCustomer()
      toast.success('Welcome! Your profile is saved.')
      onSuccess()
    })
  }

  // ── Step 4: Forgot Password ───────────────────────────────────────────────
  const handleSendResetOtp = () => {
    startTransition(async () => {
      const result = await sendPasswordResetOtp(email.trim().toLowerCase())
      if (result.error) {
        if (result.error.includes('No account found')) {
          toast.error("You haven't set up a password yet. Let's create one!")
          setStep('password-signup')
        } else {
          toast.error(result.error)
        }
        return
      }
      toast.success('Reset code sent to your email')
      setStep('verify-otp')
    })
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error('Please enter a valid verification code')
      return
    }
    startTransition(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: 'recovery',
      })
      if (error) {
        toast.error('Invalid or expired code')
        return
      }
      setStep('new-password')
    })
  }

  const handleUpdatePassword = () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) {
        toast.error(error.message)
        return
      }
      
      toast.success('Password updated successfully')
      
      // Check if profile is complete
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('customers')
          .select('name, phone')
          .eq('user_id', user.id)
          .maybeSingle()
  
        if (!profile || !profile.name || !profile.phone) {
          setStep('profile')
          return
        }
      }
      
      await refreshCustomer()
      onSuccess()
    })
  }

  const btnStyle: CSSProperties = {
    backgroundColor: primaryColor,
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[420px] transform overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-white/95 backdrop-blur-xl p-8 shadow-2xl sm:mx-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col">

          {/* ── EMAIL STEP ──────────────────────────────────────────────────── */}
          {step === 'email' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Let's get started</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Enter your email to sign in or create a new account.</p>
              </div>

              <div className="space-y-5">
                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 transition-colors group-focus-within:text-gray-900">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckEmail()}
                    placeholder="hello@example.com"
                    autoComplete="email"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <button
                  onClick={handleCheckEmail}
                  disabled={isPending}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* ── PASSWORD LOGIN STEP ─────────────────────────────────────────── */}
          {step === 'password-login' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('email')} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Back to email
              </button>
              
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Welcome back</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Enter your password for <br/><span className="text-gray-900">{email}</span>
                </p>
              </div>

              <div className="space-y-5">
                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 transition-colors group-focus-within:text-gray-900">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isPending || !password}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Signing in...' : 'Sign In'}
                </button>
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => setStep('forgot-password')}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          {/* ── PASSWORD SIGNUP STEP ────────────────────────────────────────── */}
          {step === 'password-signup' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('email')} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Back to email
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Secure your account</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Create a password for <br/><span className="text-gray-900">{email}</span>
                </p>
              </div>

              <div className="space-y-5">
                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 transition-colors group-focus-within:text-gray-900">Create Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    placeholder="Minimum 6 characters"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <button
                  onClick={handleSignUp}
                  disabled={isPending || password.length < 6}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          {/* ── CHECK EMAIL STEP ────────────────────────────────────────────── */}
          {step === 'check-email' && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-[24px] shadow-sm" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Check your inbox</h2>
              <p className="mt-3 text-sm font-medium text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                We've sent a verification link to <br/><span className="text-gray-900">{email}</span>
              </p>
              <button
                onClick={onClose}
                className="mt-8 w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={btnStyle}
              >
                Done
              </button>
            </div>
          )}

          {/* ── PROFILE STEP ────────────────────────────────────────────────── */}
          {step === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Almost done!</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Complete your profile for faster checkout.</p>
              </div>

              <div className="space-y-5">
                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 transition-colors group-focus-within:text-gray-900">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    autoComplete="name"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 z-10 transition-colors group-focus-within:text-gray-900">Phone Number</label>
                  <div className="flex overflow-hidden rounded-2xl border-2 border-gray-200 focus-within:border-gray-900 transition-all bg-transparent">
                    <span className="flex items-center border-r-2 border-gray-100 bg-gray-50/50 px-4 text-sm font-bold text-gray-500">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                      placeholder="9876543210"
                      autoComplete="tel"
                      className="flex-1 bg-transparent px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  className="w-full mt-2 rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Saving Profile...' : 'Complete Profile'}
                </button>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD STEP ──────────────────────────────────────── */}
          {step === 'forgot-password' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('password-login')} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Back to login
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Reset Password</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  We'll send a 6 or 8-digit verification code to <br/><span className="text-gray-900">{email}</span>
                </p>
              </div>

              <div className="space-y-5">
                <button
                  onClick={handleSendResetOtp}
                  disabled={isPending}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── VERIFY OTP STEP ─────────────────────────────────────────────── */}
          {step === 'verify-otp' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('forgot-password')} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Back
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Enter Code</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Enter the 6 or 8-digit code sent to <br/><span className="text-gray-900">{email}</span>
                </p>
              </div>

              <div className="space-y-5">
                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 transition-colors group-focus-within:text-gray-900">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp(e as any)}
                    placeholder="123456"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-center tracking-[0.5em] text-2xl font-bold text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isPending || otp.length < 6}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── NEW PASSWORD STEP ───────────────────────────────────────────── */}
          {step === 'new-password' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">New Password</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Create a new strong password for your account.
                </p>
              </div>

              <div className="space-y-5">
                <div className="group relative">
                  <label className="absolute -top-2.5 left-3 inline-block bg-white px-1.5 text-xs font-semibold text-gray-500 transition-colors group-focus-within:text-gray-900">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
                    placeholder="Minimum 6 characters"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <button
                  onClick={handleUpdatePassword}
                  disabled={isPending || newPassword.length < 6}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={btnStyle}
                >
                  {isPending ? 'Updating...' : 'Save & Log In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
