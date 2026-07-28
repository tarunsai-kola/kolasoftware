'use client'

import { useState } from 'react'
import { markAsPaid } from '@/app/(super-admin)/billing/actions'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

interface BillingRestaurantRow {
  id: string
  name: string
  domain: string | null
  subdomain: string
  status: string
  subscription_status: string
  next_billing_date: string | null
}

export default function BillingList({ initialRestaurants }: { initialRestaurants: BillingRestaurantRow[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Filter logic
  const filtered = initialRestaurants.filter((r) => {
    const q = searchQuery.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.subdomain.toLowerCase().includes(q)
  })

  const today = new Date()

  const handleMarkAsPaid = async (id: string, currentBillingDate: string | null) => {
    setLoadingId(id)
    const result = await markAsPaid(id, currentBillingDate)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Payment recorded and billing cycle advanced')
    }
    setLoadingId(null)
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="relative max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tenant
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Subscription Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Next Billing Date
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((restaurant) => {
              const billingDate = restaurant.next_billing_date ? new Date(restaurant.next_billing_date) : null
              const isOverdue = billingDate && billingDate < today && restaurant.subscription_status !== 'cancelled'
              const daysOverdue = isOverdue ? differenceInDays(today, billingDate) : 0
              const isSeverelyOverdue = isOverdue && daysOverdue > 5

              return (
                <tr key={restaurant.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {restaurant.name}
                        {isSeverelyOverdue && (
                          <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800" title="> 5 days overdue">
                            <svg className="mr-1 h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Flagged
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">{restaurant.domain || `${restaurant.subdomain}.kolasolution.com`}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        restaurant.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                        restaurant.subscription_status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        restaurant.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {restaurant.subscription_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                        {billingDate ? format(billingDate, 'MMM d, yyyy') : 'Not Set'}
                      </span>
                      {isOverdue && (
                        <span className="text-xs text-red-500 font-medium mt-0.5">
                          {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleMarkAsPaid(restaurant.id, restaurant.next_billing_date)}
                      disabled={loadingId === restaurant.id || restaurant.subscription_status === 'cancelled'}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingId === restaurant.id ? 'Processing...' : 'Mark Paid (₹2000)'}
                    </button>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  No accounts found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
