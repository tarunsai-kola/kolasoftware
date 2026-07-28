'use client'

import { useState, useTransition } from 'react'
import { createCoupon, deleteCoupon } from '@/app/(dashboard)/coupons/actions'
import toast from 'react-hot-toast'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  min_order_amount: number
  usage_limit: number | null
  usage_count: number
  multiple_uses_per_customer: boolean
  expires_at: string | null
  created_at: string
}

export default function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    
    startTransition(async () => {
      const result = await deleteCoupon(id)
      if (result.success) {
        setCoupons(prev => prev.filter(c => c.id !== id))
        toast.success('Coupon deleted.')
      } else {
        toast.error(result.error || 'Failed to delete coupon.')
      }
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await createCoupon(formData)
      if (result.success) {
        toast.success('Coupon created successfully!')
        setIsModalOpen(false)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to create coupon.')
      }
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Coupons</h1>
          <p className="text-sm text-gray-500">Create and manage discount codes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          <span>+</span> Create Coupon
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {coupons.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
              <span className="text-3xl mb-3 block">🎫</span>
              <h3 className="text-sm font-medium text-gray-900">No coupons yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new discount code.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="relative rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20 uppercase tracking-widest">
                      {coupon.code}
                    </span>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete coupon"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500 font-medium">Discount</span>
                      <span className="text-xl font-black text-gray-900">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF`
                          : `₹${coupon.discount_value} OFF`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Min Order:</span>
                      <span className="font-semibold text-gray-900">₹{coupon.min_order_amount}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Usage:</span>
                      <span className="font-semibold text-gray-900">
                        {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rule:</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {coupon.multiple_uses_per_customer ? 'Multiple uses/person' : '1 per person'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Create Coupon</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input 
                    name="code" 
                    required 
                    placeholder="e.g. FESTIVAL20" 
                    className="w-full uppercase rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">Customers will enter this code at checkout.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select 
                      name="discountType" 
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:ring-gray-900"
                    >
                      <option value="fixed_amount">Fixed Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                    <input 
                      name="discountValue" 
                      type="number" 
                      step="any" 
                      required 
                      min="0.01"
                      placeholder="e.g. 50" 
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₹)</label>
                  <input 
                    name="minOrderAmount" 
                    type="number" 
                    step="any" 
                    defaultValue={0}
                    min={0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <input 
                    name="usageLimit" 
                    type="number" 
                    min={1}
                    placeholder="Leave empty for unlimited" 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">Max number of times this coupon can be used across all customers.</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="multipleUsesPerCustomer" 
                    name="multipleUsesPerCustomer" 
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <label htmlFor="multipleUsesPerCustomer" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Allow multiple uses per customer
                    <span className="block text-xs text-gray-500 font-normal mt-0.5">If unchecked, a person can only use this code once.</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isPending ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
