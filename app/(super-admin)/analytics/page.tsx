import { createClient } from '@/lib/supabase/server'
import AnalyticsCharts, { type TrendData } from '@/components/super-admin/AnalyticsCharts'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Platform Analytics | Super Admin',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

interface SummaryData {
  this_month_orders: number
  this_month_value: number
  last_month_orders: number
  last_month_value: number
}

interface LeaderboardData {
  restaurant_id: string
  restaurant_name: string
  total_orders: number
}

interface AnalyticsPayload {
  summary: SummaryData
  leaderboard: LeaderboardData[]
  onboardingTrend: TrendData[]
  orderTrend: TrendData[]
}

function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function formatPrice(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default async function AnalyticsDashboardPage() {
  const supabase = await createClient()

  // Execute the RPC to fetch the pre-aggregated JSON payload
  const { data, error } = await supabase.rpc('get_super_admin_analytics')

  if (error) {
    console.error('Failed to fetch analytics:', error)
  }

  const payload = (data as unknown as AnalyticsPayload) || {
    summary: { this_month_orders: 0, this_month_value: 0, last_month_orders: 0, last_month_value: 0 },
    leaderboard: [],
    onboardingTrend: [],
    orderTrend: []
  }

  const { summary, leaderboard, onboardingTrend, orderTrend } = payload
  
  const orderChange = calculatePercentChange(summary.this_month_orders, summary.last_month_orders)
  const valueChange = calculatePercentChange(summary.this_month_value, summary.last_month_value)

  return (
    <div className="flex h-full flex-col space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Platform Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Macro-level insights across all tenant storefronts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Orders This Month</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              {summary.this_month_orders.toLocaleString()}
            </span>
            <span className={`flex items-center text-sm font-semibold ${orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {orderChange >= 0 ? '↑' : '↓'} {Math.abs(orderChange).toFixed(1)}%
            </span>
          </dd>
          <p className="mt-1 text-xs text-gray-400">vs {summary.last_month_orders.toLocaleString()} last month</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Order Value This Month</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              {formatPrice(summary.this_month_value)}
            </span>
            <span className={`flex items-center text-sm font-semibold ${valueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {valueChange >= 0 ? '↑' : '↓'} {Math.abs(valueChange).toFixed(1)}%
            </span>
          </dd>
          <p className="mt-1 text-xs text-gray-400">vs {formatPrice(summary.last_month_value)} last month</p>
        </div>
      </div>

      {/* Interactive Charts */}
      <AnalyticsCharts onboardingTrend={onboardingTrend} orderTrend={orderTrend} />

      {/* Leaderboard */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900">Top Restaurants (This Month)</h2>
          <p className="mt-1 text-sm text-gray-500">Highest volume performers across the platform.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Restaurant</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Order Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leaderboard.map((item, index) => (
                <tr key={item.restaurant_id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      #{index + 1}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                    {item.restaurant_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-indigo-600">
                    {item.total_orders.toLocaleString()}
                  </td>
                </tr>
              ))}

              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No order data found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
