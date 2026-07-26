'use client'

import { useEffect } from 'react'

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Super Admin Error:', error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm max-w-md w-full">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Admin Portal Error</h2>
        <p className="mt-2 text-sm text-gray-500">Failed to load platform data. Please verify your connection.</p>
        <div className="mt-6">
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Retry Request
          </button>
        </div>
      </div>
    </div>
  )
}
