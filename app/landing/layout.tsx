export const metadata = {
  title: 'Kola Solutions | Modern Software for Modern Businesses',
  description: 'We build world-class software and SaaS solutions for modern businesses.',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-50 selection:bg-indigo-500/30">
      {children}
    </div>
  )
}
