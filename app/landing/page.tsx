'use client'

import React from 'react'
import { ArrowRight, Code, Rocket, Smartphone, Server, MessageCircle, ChevronRight, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const whatsappNumber = '8088766989'
  const whatsappLink = `https://wa.me/91${whatsappNumber}?text=Hi%20Kola%20Solutions!%20I'm%20interested%20in%20working%20together.`

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden text-slate-300">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              K
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Kola Solutions
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#mission" className="hover:text-white transition-colors">Mission</a>
            <a href="#work" className="hover:text-white transition-colors">Our Work</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition-all hover:scale-105 hidden sm:flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Say Hello
            </a>
            <Link 
              href="/admin/login" 
              className="px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-105"
            >
              Partner Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="pt-32 pb-24 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Building the Future of Digital Commerce
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              We build <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">world-class</span><br className="hidden md:block" /> software for modern businesses.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              From high-performance restaurant ordering platforms to scalable SaaS architectures. We engineer digital experiences that drive growth and delight users.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-950 font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Let's Work Together
              </a>
              <a 
                href="#work"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                View Our Work
                <ChevronRight className="w-5 h-5 opacity-50" />
              </a>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="py-24 px-6 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Our Mission</h2>
                <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                  At Kola Solutions, we believe that powerful software shouldn't be limited to giant tech companies. Our mission is to democratise world-class technology, providing local businesses and ambitious startups with the tools they need to compete on a global scale.
                </p>
                <ul className="space-y-4">
                  {[
                    'Zero compromises on performance and design',
                    'Direct-to-consumer models that bypass middlemen',
                    'Scalable architectures that grow with your business'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Empowering Growth</h3>
                  <p className="text-slate-400 mb-8">We don't just write code; we build engines for growth. Our platforms process thousands of transactions reliably, securely, and beautifully.</p>
                  
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                    Talk to our engineering team
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services & Work */}
        <section id="services" className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">What We Do</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">Full-stack engineering, beautiful interfaces, and robust backend systems.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-indigo-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                  <Code className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Custom SaaS Platforms</h3>
                <p className="text-slate-400 text-sm leading-relaxed">End-to-end development of multi-tenant SaaS applications with complex logic, real-time features, and beautiful dashboards.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-violet-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all">
                    <Smartphone className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Commerce & Ordering</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Direct-to-consumer ordering systems (like Kola Software's restaurant platform) designed for high conversion and seamless user experience.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-fuchsia-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all">
                  <Server className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Cloud Architecture</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Scalable serverless backends using Next.js, Supabase, and Edge computing to ensure your app stays fast globally.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 relative text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/50" />
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to build something extraordinary?</h2>
            <p className="text-xl text-indigo-200 mb-10">Let's discuss your project. We're currently taking on new clients for Q3.</p>
            
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
            >
              <MessageCircle className="w-6 h-6" />
              Chat on WhatsApp ({whatsappNumber})
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 relative z-10 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center font-bold text-white text-xs">K</div>
            <span>© {new Date().getFullYear()} Kola Solutions. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
