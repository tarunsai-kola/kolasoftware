import { getRestaurantContext } from '@/lib/get-restaurant-context'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

import ProfileDropdown from '@/components/storefront/ProfileDropdown'

export const dynamic = 'force-dynamic'

export default async function CustomerOrdersPage() {
  const { restaurantId, theme } = await getRestaurantContext()
  const supabase = await createClient()

  // 1. Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 font-brand">
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
          <span className="text-sm font-bold text-gray-900">My Orders</span>
        </header>

        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <span className="mb-4 text-4xl block">👤</span>
          <p className="text-lg font-bold text-gray-900">Please sign in</p>
          <p className="mt-1 text-sm text-gray-500">You need to be logged in to view your past orders.</p>
          <Link
            href="/?login=true"
            className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primaryColor || '#000' }}
          >
            Sign In / Create Account
          </Link>
        </main>
      </div>
    )
  }

  // 2. Fetch the customer profile (don't fail if they don't have one yet)
  let { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, email, phone')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fallback: If no customer found by user_id, try to find by user.email
  if (!customer && user.email) {
    const { data: emailCustomer } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('email', user.email)
      .maybeSingle()
    
    if (emailCustomer) {
      customer = emailCustomer
      // Optionally, we could link the user_id here to self-heal
      await supabase.from('customers').update({ user_id: user.id }).eq('id', customer.id)
    }
  }

  let defaultAddress = null
  if (customer) {
    const { data: address } = await supabase
      .from('customer_addresses')
      .select('address_line')
      .eq('customer_id', customer.id)
      .eq('is_default', true)
      .maybeSingle()
      
    if (address) {
      defaultAddress = address.address_line
    }
  }

  if (customerError) {
    console.error('Error fetching customer profile:', customerError)
  }

  // 3. Fetch orders for this customer at this restaurant (if they have a profile)
  let orders: any[] = []
  if (customer) {
    const { data: fetchedOrders, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, items')
      .eq('customer_id', customer.id)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customer orders:', error)
    } else if (fetchedOrders) {
      orders = fetchedOrders
    }
  } else if (user.email) {
    // If we STILL don't have a customer profile, we can fetch orders directly by customer_email as a last resort
    const { data: fetchedOrders, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, items')
      .eq('customer_email', user.email)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      
    if (fetchedOrders) {
      orders = fetchedOrders
    }
  }

  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'refunded'].includes(o.status))
  const pastOrders = orders.filter(o => ['completed', 'cancelled', 'refunded'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-brand">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
          <span className="text-sm font-bold text-gray-900">My Orders</span>
        </div>
        
        <ProfileDropdown 
          name={customer?.name || user.email?.split('@')[0] || ''}
          email={customer?.email || user.email || ''}
          phone={customer?.phone || ''}
          address={defaultAddress}
        />
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-6 text-2xl font-extrabold text-gray-900">
          Hello, {customer?.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'}!
        </h1>

        {/* ── Active Orders ─────────────────────────────────────────────────── */}
        {activeOrders.length > 0 && (
          <div className="mb-10 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-green-600">Active Orders</h2>
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} primaryColor={theme.primaryColor || '#000'} />
            ))}
          </div>
        )}

        {/* ── Past Orders ───────────────────────────────────────────────────── */}
        {pastOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Past Orders</h2>
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} primaryColor={theme.primaryColor || '#000'} isPast />
            ))}
          </div>
        )}

        {orders?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-4xl">🍽️</span>
            <p className="text-lg font-bold text-gray-900">No orders yet</p>
            <p className="mt-1 text-sm text-gray-500">When you place an order, it will appear here.</p>
            <Link
              href="/"
              className="mt-6 rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primaryColor || '#000' }}
            >
              Browse Menu
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order, primaryColor, isPast = false }: { order: any, primaryColor: string, isPast?: boolean }) {
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })

  const isCancelled = order.status === 'cancelled'
  const displayStatus = isCancelled ? 'Cancelled' : order.status === 'completed' ? 'Delivered' : 'In Progress'

  return (
    <Link
      href={`/order-tracking/${order.id}`}
      className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isCancelled ? 'bg-red-50 text-red-600' :
            isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
          }`}>
            {displayStatus}
          </span>
          <p className="mt-1.5 text-xs font-medium text-gray-400">{date}</p>
        </div>
        <span className="text-sm font-extrabold text-gray-900">₹{order.total_amount}</span>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {Array.isArray(order.items) 
            ? order.items.map((item: any) => `${item.quantity}× ${item.name}`).join(', ') 
            : 'Items in order'}
        </p>
      </div>

      {!isPast && (
        <div className="mt-4 flex items-center justify-center rounded-xl bg-gray-50 py-2.5 text-xs font-bold transition-colors hover:bg-gray-100" style={{ color: primaryColor }}>
          Track Order →
        </div>
      )}
    </Link>
  )
}
