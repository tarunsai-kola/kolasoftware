'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCustomer } from './CustomerContext'
import toast from 'react-hot-toast'
import { saveCustomerProfile } from '@/app/actions/customer'

// =============================================================================
// Types
// =============================================================================

type Step = 'email' | 'password-login' | 'password-signup' | 'profile' | 'done' | 'check-email'

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
  const [isPending, startTransition] = useTransition()

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
          toast.error('This email is already registered. Please log in.')
          setStep('password-login')
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
        toast.error('Session expired or email not verified. Please check your Supabase Auth settings to ensure "Confirm email" is OFF.')
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

  const btnStyle: CSSProperties = {
    backgroundColor: primaryColor,
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl sm:mx-4">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* ── EMAIL STEP ──────────────────────────────────────────────────── */}
        {step === 'email' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sign in or Create Account</h2>
              <p className="mt-1 text-sm text-gray-500">Enter your email to get started</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckEmail()}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={handleCheckEmail}
                disabled={isPending}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={btnStyle}
              >
                {isPending ? 'Checking…' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASSWORD LOGIN STEP ─────────────────────────────────────────── */}
        {step === 'password-login' && (
          <div>
            <button onClick={() => setStep('email')} className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              ← Back
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Welcome back!</h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter your password for <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={isPending || !password}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={btnStyle}
              >
                {isPending ? 'Logging in…' : 'Log In →'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASSWORD SIGNUP STEP ────────────────────────────────────────── */}
        {step === 'password-signup' && (
          <div>
            <button onClick={() => setStep('email')} className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              ← Back
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create an Account</h2>
              <p className="mt-1 text-sm text-gray-500">
                Set a password for <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                  placeholder="At least 6 characters"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={handleSignUp}
                disabled={isPending || password.length < 6}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={btnStyle}
              >
                {isPending ? 'Creating account…' : 'Create Account →'}
              </button>
            </div>
          </div>
        )}

        {/* ── CHECK EMAIL STEP ────────────────────────────────────────────── */}
        {step === 'check-email' && (
          <div className="text-center py-6">
            <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: `${primaryColor}20` }}>
              ✉️
            </div>
            <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              We've sent a verification link to <span className="font-semibold text-gray-700">{email}</span>.<br />
              Please verify your email to continue.
            </p>
            <button
              onClick={onClose}
              className="mt-8 w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={btnStyle}
            >
              Close
            </button>
          </div>
        )}

        {/* ── PROFILE STEP ────────────────────────────────────────────────── */}
        {step === 'profile' && (
          <div>
            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${primaryColor}20` }}>
                👋
              </div>
              <h2 className="text-xl font-bold text-gray-900">Complete your profile</h2>
              <p className="mt-1 text-sm text-gray-500">This is saved for faster checkout next time</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tarun Sai"
                  autoComplete="name"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone number <span className="text-red-500">*</span></label>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 transition-all">
                  <span className="flex items-center border-r border-gray-200 bg-white px-3 text-sm font-semibold text-gray-500">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                    placeholder="9876543210"
                    autoComplete="tel"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isPending}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={btnStyle}
              >
                {isPending ? 'Saving…' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
