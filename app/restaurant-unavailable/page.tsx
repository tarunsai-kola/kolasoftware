import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Temporarily Unavailable',
  robots: { index: false },
}

// Reason codes injected by middleware as a query param.
// Used to tailor the message without creating multiple routes.
type Reason = 'suspended' | 'pending_setup' | 'service_error' | (string & {})

interface PageProps {
  searchParams: Promise<{ reason?: Reason }>
}

function getContent(reason: Reason | undefined): {
  emoji: string
  heading: string
  body: string
} {
  switch (reason) {
    case 'suspended':
      return {
        emoji: '🔒',
        heading: "This restaurant's ordering page is temporarily unavailable",
        body: "The restaurant's online ordering is currently paused. Please try again later or contact the restaurant directly to place your order.",
      }
    case 'pending_setup':
      return {
        emoji: '🚧',
        heading: 'Coming soon',
        body: "This restaurant is setting up their online ordering page. Check back in a little while — it'll be ready soon!",
      }
    case 'service_error':
    default:
      return {
        emoji: '⚡',
        heading: 'Temporarily unavailable',
        body: "We're experiencing a technical issue. Our team has been notified and is working to fix it. Please try again in a few minutes.",
      }
  }
}

export default async function RestaurantUnavailablePage({
  searchParams,
}: PageProps) {
  const { reason } = await searchParams
  const { emoji, heading, body } = getContent(reason)

  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-4xl">
          {emoji}
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
          {heading}
        </h1>

        {/* Body */}
        <p className="mt-4 text-base text-white/50 leading-relaxed">{body}</p>

        {/* Divider */}
        <div className="my-8 h-px bg-white/10" />

        {/* Footer note */}
        <p className="text-sm text-white/30">
          If you need help urgently, please reach out to the restaurant by phone.
        </p>
      </div>
    </main>
  )
}
