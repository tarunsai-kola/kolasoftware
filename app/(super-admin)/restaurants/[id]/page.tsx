import { createClient } from '@/lib/supabase/server'
import { updateRestaurantStatus } from './actions'
import { format } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const statusColors = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  pending_setup: 'bg-yellow-100 text-yellow-800',
}

function formatPrice(price: number): string {
  return `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !restaurant) {
    notFound()
  }

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, total_amount, status, payment_status, created_at, customer:customers(name)')
    .eq('restaurant_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Construct impersonation URL
  const impersonationUrl = restaurant.domain
    ? `https://${restaurant.domain}`
    : `https://${restaurant.subdomain}.kolasolution.com`

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} className="h-20 w-20 rounded-full border border-gray-100 object-cover shadow-sm" alt="" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              Logo
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{restaurant.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusColors[restaurant.status as keyof typeof statusColors]}`}>
                {restaurant.status.replace('_', ' ')}
              </span>
              <a href={impersonationUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
                {impersonationUrl}
              </a>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {restaurant.status === 'active' ? (
            <form action={async () => {
              'use server'
              await updateRestaurantStatus(restaurant.id, 'suspended')
            }}>
              <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100">
                Suspend
              </button>
            </form>
          ) : (
            <form action={async () => {
              'use server'
              await updateRestaurantStatus(restaurant.id, 'active')
            }}>
              <button className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-600 hover:bg-green-100">
                Activate
              </button>
            </form>
          )}
          <Link
            href={`/restaurants/${restaurant.id}/savings`}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 shadow-sm"
          >
            Savings Report
          </Link>
          <a
            href={impersonationUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-gray-800"
          >
            View Store
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="col-span-1 space-y-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Tenant Details</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500">Kitchen Email</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{restaurant.kitchen_email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Theme Details</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: restaurant.primary_color }} />
                    {restaurant.primary_color}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 font-mono">{restaurant.font_family}</div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Subscription Status</dt>
                <dd className="mt-1 text-sm font-semibold capitalize text-gray-900">
                  {restaurant.subscription_status}
                </dd>
              </div>
              {restaurant.next_billing_date && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Next Billing Date</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {format(new Date(restaurant.next_billing_date), 'MMMM d, yyyy')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500">Razorpay Account ID</dt>
                <dd className="mt-1 font-mono text-xs text-gray-900">{restaurant.razorpay_account_id || 'Not linked'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="col-span-1 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-500">Last 10 orders placed at this restaurant.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(recentOrders || []).map((order) => {
                    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-mono text-sm text-gray-900">{order.id.slice(0, 8)}</span>
                          <div className="text-xs text-gray-500">{format(new Date(order.created_at), 'MMM d, h:mm a')}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{customer?.name || 'Unknown'}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 capitalize">
                              {order.status}
                            </span>
                            {order.payment_status === 'paid' && (
                              <span className="text-[10px] font-bold text-green-600">PAID</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </td>
                      </tr>
                    )
                  })}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
