'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Failed to load dashboard</h2>
        <p className="mt-2 text-sm text-gray-500">There was a problem communicating with the server.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-200"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
