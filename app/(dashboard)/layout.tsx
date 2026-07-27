import { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

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
      { label: 'Delivery Map', href: '/delivery' },
      { label: 'Menu', href: '/menu' },
      { label: 'Riders', href: '/riders' },
      { label: 'History', href: '/history' },
      { label: 'Settings', href: '/settings' },
    ]
  } else {
    // regular staff
    navItems = [
      { label: 'Orders', href: '/orders' },
      { label: 'Menu', href: '/menu' },
      { label: 'History', href: '/history' },
      { label: 'Settings', href: '/settings' },
    ]
  }

  // Render Dashboard Shell
  return (
    <div className="flex h-screen flex-col md:flex-row bg-[#f5f5f7] overflow-hidden">
      
      {/* ── Mobile Header (Visible only on small screens) ────────────────── */}
      <header className="md:hidden flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
          )}
          <span className="font-bold text-gray-900">{theme.name} Dashboard</span>
        </div>
        {/* Simple hamburger placeholder for MVP */}
        <button className="p-2 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </header>

      {/* ── Sidebar (Hidden on mobile by default in this MVP) ────────────── */}
      <aside className="hidden md:flex w-52 flex-col border-r border-gray-200 bg-white h-screen sticky top-0 shrink-0">
        <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-4">
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="Logo" className="h-7 w-7 rounded-full object-cover" />
          )}
          <span className="font-bold text-gray-900 text-sm truncate">{theme.name}</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/orders' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={isActive ? { backgroundColor: theme.primaryColor || '#D85A30' } : {}}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-800 truncate">{userLabel}</span>
              <span className="text-[11px] text-gray-400 capitalize">{role}</span>
            </div>
            <form action="/auth/signout" method="post">
              <button 
                type="submit" 
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
