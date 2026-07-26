'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Storefront Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 shadow-sm max-w-md w-full">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-red-900">Oops! Something went wrong.</h2>
        <p className="mt-2 text-sm text-red-700">We hit a snag loading this page. Our team has been notified.</p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
