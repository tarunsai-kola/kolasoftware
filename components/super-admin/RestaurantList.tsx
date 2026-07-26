'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface AdminRestaurantRow {
  id: string
  name: string
  domain: string
  subdomain: string
  status: 'active' | 'suspended' | 'pending_setup'
  subscription_status: string
  next_billing_date: string | null
  created_at: string
  orders_this_month: number
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  pending_setup: 'bg-yellow-100 text-yellow-800',
}

export default function RestaurantList({ initialRestaurants }: { initialRestaurants: AdminRestaurantRow[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter logic: matches name, domain, or subdomain
  const filtered = initialRestaurants.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.domain.toLowerCase().includes(q) ||
      r.subdomain.toLowerCase().includes(q)
    )
  })

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
            placeholder="Search by restaurant name or domain..."
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
                Restaurant
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Domain / Subdomain
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Billing
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Orders (Month)
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{restaurant.name}</span>
                    <span className="text-xs text-gray-500">ID: {restaurant.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{restaurant.domain}</span>
                    <span className="text-xs text-gray-500">{restaurant.subdomain}.yourplatform.com</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      statusColors[restaurant.status]
                    }`}
                  >
                    {restaurant.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${restaurant.subscription_status === 'overdue' ? 'text-orange-600' : 'text-gray-900'}`}>
                      {restaurant.subscription_status.charAt(0).toUpperCase() + restaurant.subscription_status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Next: {restaurant.next_billing_date ? format(new Date(restaurant.next_billing_date), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                  {restaurant.orders_this_month}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Manage<span className="sr-only">, {restaurant.name}</span>
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  No restaurants found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
