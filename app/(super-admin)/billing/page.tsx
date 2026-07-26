import { createClient } from '@/lib/supabase/server'
import BillingList from '@/components/super-admin/BillingList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Billing | Super Admin',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function BillingDashboardPage() {
  const supabase = await createClient()

  // Fetch all restaurants and their billing dates
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, domain, subdomain, status, subscription_status, next_billing_date')
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch billing info:', error)
  }

  const resList = restaurants || []

  // ── Compute Summary Metrics ────────────────────────────────────────────────
  const activeRestaurants = resList.filter(r => r.status === 'active')
  const totalMRR = activeRestaurants.length * 2000

  const todayStr = new Date().toISOString().split('T')[0]
  const todayDate = new Date(todayStr)
  
  // Count overdue (next_billing_date < today AND status isn't paid/active for this period)
  // We'll define overdue as: next_billing_date is in the past, and subscription isn't cancelled
  const overdueAccounts = resList.filter(r => {
    if (!r.next_billing_date || r.subscription_status === 'cancelled') return false
    const billingDate = new Date(r.next_billing_date)
    return billingDate < todayDate
  })

  // Projected revenue next month (assume active + suspended that might recover)
  const billableAccounts = resList.filter(r => r.status === 'active' || r.status === 'suspended')
  const projectedMRR = billableAccounts.length * 2000

  return (
    <div className="flex h-full flex-col space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Billing Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Manage tenant subscriptions and platform revenue</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total MRR (Active)</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              ₹{totalMRR.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-500">/mo</span>
          </dd>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Overdue Accounts</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${overdueAccounts.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {overdueAccounts.length}
            </span>
          </dd>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Projected Next Month</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              ₹{projectedMRR.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-500">/mo</span>
          </dd>
        </div>
      </div>

      {/* Main List */}
      <BillingList initialRestaurants={resList} />
    </div>
  )
}
