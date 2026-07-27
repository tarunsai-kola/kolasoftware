'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils/error'

export default function RiderLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Convert the phone number back to the synthetic email format
    // e.g. 9876543210 -> 9876543210@rider.kolasoftware.app
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const syntheticEmail = `${cleanPhone}@rider.kolasoftware.app`

    const { error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (error) {
      toast.error('Invalid phone number or password.')
      setIsLoading(false)
      return
    }

    toast.success('Logged in successfully')
    router.refresh()
    router.push('/delivery') // Redirect to the delivery dashboard
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Rider Login 🛵
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to view your assigned deliveries
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="phone" className="sr-only">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Phone Number (e.g. 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
