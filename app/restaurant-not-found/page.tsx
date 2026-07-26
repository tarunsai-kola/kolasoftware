import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restaurant Not Found',
  robots: { index: false },
}

export default function RestaurantNotFoundPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-4xl">
          🍽️
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Restaurant not found
        </h1>

        {/* Body */}
        <p className="mt-4 text-base text-white/50 leading-relaxed">
          We couldn&apos;t find a restaurant at this address. The link may be
          incorrect, or this restaurant may not have set up its ordering page
          yet.
        </p>

        {/* Divider */}
        <div className="my-8 h-px bg-white/10" />

        {/* CTA */}
        <p className="text-sm text-white/30">
          If you believe this is a mistake, please contact the restaurant
          directly or check the URL and try again.
        </p>
      </div>
    </main>
  )
}
