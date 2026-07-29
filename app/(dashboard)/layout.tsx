import { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { Toaster } from 'react-hot-toast'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {

  // Ensure this is accessed via a restaurant context
  const { restaurantId, theme } = await getRestaurantContext()

  // Verify authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Verify authorization: Is this user staff or rider for THIS restaurant?
  const { data: staffRecord, error: staffError } = await supabase
    .from('restaurant_staff')
    .select('role')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .single()

  let role = staffRecord?.role
  let userLabel = user.email

  if (!staffRecord) {
    const { data: riderRecord } = await supabase
      .from('delivery_riders')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .single()

    if (riderRecord) {
      role = 'rider'
      userLabel = riderRecord.name
    }
  }

  if (!role) {
    // Authenticated, but not authorized for this tenant
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-900">Access Denied</h1>
          <p className="mt-2 text-sm text-red-700">
            Your account isn&apos;t linked to <strong>{theme.name}</strong> yet. 
            Please contact support or the restaurant owner to get access.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-500 hover:underline">
              Sign out and try another account
            </button>
          </form>
        </div>
      </div>
    )
  }

  let navItems = []
  if (role === 'rider') {
    navItems = [
      { label: 'My Deliveries', href: '/delivery' },
    ]
  } else if (role === 'driver') {
    navItems = [
      { label: 'Delivery Map', href: '/delivery' },
    ]
  } else if (role === 'owner') {
    navItems = [
      { label: 'Orders', href: '/orders' },
      { label: 'Analysis', href: '/analysis' },
      { label: 'Delivery Map', href: '/delivery' },
      { label: 'Menu', href: '/menu' },
      { label: 'Coupons', href: '/coupons' },
      { label: 'Riders', href: '/riders' },
      { label: 'History', href: '/history' },
      { label: 'Settings', href: '/settings' },
    ]
  } else {
    // regular staff
    navItems = [
      { label: 'Orders', href: '/orders' },
      { label: 'Analysis', href: '/analysis' },
      { label: 'Menu', href: '/menu' },
      { label: 'Coupons', href: '/coupons' },
      { label: 'History', href: '/history' },
      { label: 'Settings', href: '/settings' },
    ]
  }

  // Render Dashboard Shell
  return (
    <div className="flex h-screen flex-col md:flex-row bg-[#f5f5f7] overflow-hidden">
      
      <DashboardNavigation 
        navItems={navItems} 
        theme={theme} 
        userLabel={userLabel || ''} 
        role={role} 
      />

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {children}
      </main>
      <Toaster position="top-center" />
    </div>
  )
}
