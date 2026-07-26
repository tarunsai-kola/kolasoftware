'use client'

import { useState } from 'react'
import { sendSavingsReport } from './actions'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface SavingsPageClientProps {
  restaurantId: string
  restaurantName: string
  monthName: string
  totalAmount: number
  savings: number
  orderCount: number
}

export default function SavingsPageClient({
  restaurantId,
  restaurantName,
  monthName,
  totalAmount,
  savings,
  orderCount,
}: SavingsPageClientProps) {
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)
    const res = await sendSavingsReport(restaurantId, monthName)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.simulated ? 'Report generated (Simulated - No API Key)' : 'Report sent successfully!')
    }
    setIsSending(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/restaurants/${restaurantId}`} className="text-sm font-medium text-indigo-600 hover:underline mb-2 inline-block">
            &larr; Back to {restaurantName}
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Monthly ROI Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Preview the estimated commission savings for {monthName}.
          </p>
        </div>
        <button
          onClick={handleSend}
          disabled={isSending}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSending ? (
            <span className="animate-pulse">Dispatching...</span>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send to Owner
            </>
          )}
        </button>
      </div>

      {/* Reminder Callout */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-blue-800">Operational Reminder</h3>
            <p className="mt-1 text-sm text-blue-700">
              This report is best sent monthly, around the same date each month (e.g., the 1st), 
              to continually reinforce the value of staying subscribed to the platform.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Email Preview ({monthName})</h2>
        </div>
        
        <div className="p-8 text-center space-y-6">
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            This month, <strong className="text-gray-900">{restaurantName}</strong> processed{' '}
            <strong className="text-gray-900 font-mono">₹{totalAmount.toLocaleString('en-IN')}</strong>{' '}
            in direct orders across <strong className="text-gray-900">{orderCount}</strong> transactions.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-800 mb-2">Estimated Aggregator Commission Saved</h3>
            <div className="text-5xl font-black text-green-600 tracking-tight">
              ₹{savings.toLocaleString('en-IN')}
            </div>
            <p className="mt-4 text-xs text-green-700 font-medium opacity-80">
              *Calculated assuming a standard 25% take-rate from traditional delivery platforms.
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Clicking the dispatch button above will send this summary directly to the owner's inbox.
          </p>
        </div>
      </div>
    </div>
  )
}
