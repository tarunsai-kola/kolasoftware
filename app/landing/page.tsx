'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowRight, ShieldCheck, Cog, Building2, Workflow, MessageCircle, 
  CheckCircle2, Globe, Server, Code2, Play, Utensils, ShoppingBag, 
  LayoutDashboard, ChevronDown, Users, Stethoscope, Smartphone, BarChart3, Settings
} from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const whatsappNumber = '8088766989'
  const whatsappLink = `https://wa.me/91${whatsappNumber}?text=Hi%20Kola%20Solutions!%20I'm%20interested%20in%20discussing%20a%20project.`

  const [activeIndustry, setActiveIndustry] = useState('healthcare')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] overflow-hidden text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* 1. Global Navigation - Extremely minimal, asymmetrical */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${scrolled ? 'h-16' : 'h-24'}`}>
          <div className="flex items-center gap-3 group cursor-pointer w-1/4">
            <div className="hidden md:flex w-10 h-10 bg-emerald-600 items-center justify-center font-bold text-white shadow-sm border border-emerald-500">
              K
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-serif italic">
              Kola Solutions.
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-xs tracking-widest uppercase text-slate-400 font-mono w-2/4 justify-center">
            <a href="#solutions" className="hover:text-emerald-400 transition-colors">Solutions</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
            <a href="#standards" className="hover:text-emerald-400 transition-colors">Standards</a>
          </div>
          <div className="flex items-center justify-end gap-6 w-1/4">
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-sm font-medium hover:text-emerald-400 transition-colors hidden sm:block"
            >
              Discuss Project
            </a>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section (Editorial Engineering) */}
      <main className="relative z-10 pt-20">
        <section className="pt-40 pb-32 px-6 relative border-b border-white/5">
          {/* Subtle architectural grid background */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Text Column */}
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-[#121212] border border-white/10 text-slate-400 text-xs font-mono uppercase tracking-widest mb-10">
                <div className="w-2 h-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                Enterprise-Grade Engineering
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-serif text-white leading-[1.05] mb-10 tracking-tight">
                The Infrastructure<br/><span className="italic text-slate-400">That Runs Your</span><br/>Business.
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-12 leading-relaxed">
                We design, build, and deploy custom CRMs, intelligent WhatsApp automation, and complex management systems tailored entirely to your standard operating procedures.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:translate-y-1 hover:translate-x-1"
                >
                  Schedule Technical Consultation
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#solutions"
                  className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white font-medium text-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
                >
                  Explore Capabilities
                  <ChevronDown className="w-5 h-5 opacity-50" />
                </a>
              </div>
            </div>

            {/* Right Visual Column (Command Center Mockup) */}
            <div className="hidden lg:block lg:col-span-6 relative">
              <div className="relative bg-[#121212] border border-white/10 p-5 shadow-2xl">
                {/* Window Controls */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-none bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-none bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-none bg-white/20" />
                  </div>
                  <div className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase">system_status: optimal</div>
                </div>
                
                <div className="grid grid-cols-12 gap-5">
                  {/* Sidebar */}
                  <div className="col-span-4 flex flex-col gap-4">
                    <div className="h-24 bg-[#0A0A0A] border border-emerald-900/30 p-4 flex flex-col justify-between">
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">WhatsApp API</div>
                      <div className="h-1 bg-emerald-900/50 w-full"><div className="h-1 bg-emerald-500 w-3/4"></div></div>
                    </div>
                    <div className="h-16 bg-[#0A0A0A] border border-white/5"></div>
                    <div className="h-32 bg-[#0A0A0A] border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%,rgba(255,255,255,0.02)_100%)] bg-[length:20px_20px]"></div>
                    </div>
                  </div>
                  
                  {/* Main Area */}
                  <div className="col-span-8 flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1 bg-[#0A0A0A] border border-white/5 p-4">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Active Users</div>
                        <div className="text-2xl font-serif text-white">12,450</div>
                      </div>
                      <div className="flex-1 bg-emerald-900/10 border border-emerald-900/30 p-4">
                        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">Uptime</div>
                        <div className="text-2xl font-serif text-emerald-400">99.99%</div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[180px] bg-[#0A0A0A] border border-white/5 p-5 flex flex-col">
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-6">Pipeline Execution</div>
                      {/* Fake pipeline nodes */}
                      <div className="flex items-center gap-0 mt-auto">
                        <div className="w-10 h-10 bg-[#121212] border border-white/10 flex items-center justify-center"><div className="w-2 h-2 bg-emerald-500"></div></div>
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                        <div className="w-10 h-10 bg-[#121212] border border-white/10 flex items-center justify-center"><div className="w-2 h-2 bg-emerald-500"></div></div>
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                        <div className="w-10 h-10 bg-emerald-900/20 border border-emerald-500/50 flex items-center justify-center"><div className="w-2 h-2 bg-emerald-400"></div></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Pills */}
                <div className="absolute -right-8 top-16 bg-[#0A0A0A] border border-emerald-900/50 px-4 py-2 text-[10px] text-emerald-500 font-mono shadow-2xl">
                  > SYSTEM_SYNCED
                </div>
                <div className="absolute -left-10 bottom-16 bg-[#0A0A0A] border border-white/10 px-4 py-2 text-[10px] text-slate-400 font-mono shadow-2xl">
                  > DEPLOYING_WORKFLOW
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Logo Garden */}
        <section className="py-16 border-b border-white/5 bg-[#0A0A0A] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[10px] font-mono text-slate-500 mb-10 uppercase tracking-widest">Trusted by forward-thinking companies</p>
            <div className="overflow-hidden whitespace-nowrap relative w-full flex">
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none"></div>
              <div className="animate-marquee gap-24 opacity-40 grayscale flex items-center pr-24">
                <div className="text-2xl font-bold font-serif flex items-center gap-3"><div className="w-6 h-6 bg-slate-400" /> ACME Corp</div>
                <div className="text-xl font-bold font-serif flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-slate-400" /> Global Health</div>
                <div className="text-xl font-bold flex items-center gap-3"><div className="w-6 h-6 rotate-45 bg-slate-400" /> Nexus Retail</div>
                <div className="text-xl font-bold font-mono flex items-center gap-3"><div className="w-6 h-2 bg-slate-400" /> OmniFlow</div>
                {/* Duplicated for smooth loop */}
                <div className="text-2xl font-bold font-serif flex items-center gap-3"><div className="w-6 h-6 bg-slate-400" /> ACME Corp</div>
                <div className="text-xl font-bold font-serif flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-slate-400" /> Global Health</div>
                <div className="text-xl font-bold flex items-center gap-3"><div className="w-6 h-6 rotate-45 bg-slate-400" /> Nexus Retail</div>
                <div className="text-xl font-bold font-mono flex items-center gap-3"><div className="w-6 h-2 bg-slate-400" /> OmniFlow</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Comprehensive Solutions Section (The 10 Cards) */}
        <section id="solutions" className="py-40 px-6 relative bg-[#121212]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 className="text-5xl md:text-6xl font-serif text-white mb-6">Comprehensive Solutions.</h2>
              <p className="text-lg text-slate-400 font-light max-w-2xl">We do not offer generic templates or off-the-shelf SaaS. We engineer highly specific software architecture across 10 core disciplines.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              
              {/* Service 1: Custom CRM */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Custom CRM Development</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Unify your data. Empower your workforce.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  Stop forcing your team to adapt to rigid, off-the-shelf software. We engineer highly secure, custom Customer Relationship Management systems tailored precisely to your internal data structures and standard operating procedures.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Eliminate data silos and reduce manual data entry overhead.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Discuss Custom CRM <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 2: WhatsApp Automation */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">WhatsApp Automation</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Intelligent interactions at massive scale.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  Deploy sophisticated WhatsApp bots that integrate directly with your backend systems. Automate customer support, lead qualification, and order processing without relying on human intervention.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Handle thousands of concurrent customer queries with zero latency.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Automate WhatsApp <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 3: Business Websites */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Business Website Development</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Your digital flagship.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  We don't use generic templates. We develop high-speed, SEO-optimized corporate websites using modern edge-computing frameworks. We deliver a digital presence that instantly communicates your market authority.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Establish immediate credibility and capture high-intent leads.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Upgrade Your Presence <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 4: Ecommerce */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Custom Ecommerce Development</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">High-performance commerce architecture.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  When Shopify limits your growth, we engineer fully custom, headless e-commerce solutions. Designed to handle complex product variants, multi-vendor support, and real-time inventory synchronization under intense traffic.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">A scalable retail engine built for high-conversion and rapid load times.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Architect Your Store <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 5: Workflow Automation */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Workflow className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Workflow Automation Software</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Eliminate friction. Accelerate operations.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  We transform complex operational bottlenecks into elegant, automated software pipelines. Connect disparate APIs and legacy systems to ensure your business data flows seamlessly from front-end to back-office.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Remove human error from critical repetitive tasks.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Streamline Workflows <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 6: Hospital Management */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Hospital Management Software</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Robust architecture for modern healthcare.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  We architect secure, HIPAA-compliant patient portals, doctor scheduling systems, and digital health records. Streamline your hospital's administration so your staff can focus entirely on patient care.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">100% compliant data infrastructure with zero downtime.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Explore Healthcare Tech <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 7: Restaurant Management */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Restaurant Management Software</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Total operational control for hospitality.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  Modernize your front-of-house and back-of-house operations simultaneously. We build comprehensive restaurant management platforms covering reservations, inventory tracking, and multi-location analytics.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Reduce food waste and optimize staff allocation in real-time.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Modernize Operations <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 8: Online Ordering */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Online Ordering Systems</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Bypass the middlemen. Own your data.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  Reclaim your margins from third-party delivery apps. We build bespoke online ordering platforms and robust Kitchen Display Systems (KDS) designed specifically for high-volume dispatch.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Increase direct-to-consumer revenue and control the guest experience.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Deploy Ordering System <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 9: Dashboards */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Admin Dashboard Development</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">The command center for your enterprise.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  We build secure, high-performance internal portals that give executives absolute control over organizational data. Replace fragmented reporting tools with a single source of truth.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">Real-time visibility across your entire operational infrastructure.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Build Your Dashboard <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Service 10: Custom Internal Software */}
              <div className="bg-[#0A0A0A] border border-white/5 p-10 hover:border-emerald-900/50 transition-colors group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="w-12 h-12 bg-emerald-900/20 border border-emerald-900/50 flex items-center justify-center mb-8 relative z-10">
                  <Settings className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2 relative z-10">Custom Internal Software</h3>
                <p className="text-sm text-emerald-500 font-mono uppercase tracking-widest mb-6 relative z-10">Software engineered for your business reality.</p>
                <p className="text-slate-400 leading-relaxed font-light mb-8 flex-grow relative z-10">
                  Stop running your enterprise on spreadsheets. We design and deploy bespoke software solutions tailored precisely to your company's unique standard operating procedures and scale requirements.
                </p>
                <div className="bg-[#121212] border border-white/5 p-4 mb-8 relative z-10">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Key Outcome</div>
                  <div className="text-slate-300 font-medium">A proprietary technological advantage over your competitors.</div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 relative z-10 mt-auto">
                  Discuss Custom Software <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* 5. Visual Demonstration Section */}
        <section id="architecture" className="py-40 px-6 bg-[#0A0A0A] border-y border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h2 className="text-5xl font-serif text-white mb-8">Built for Scale & Speed.</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-20 font-light">
              A glimpse into the robust architecture we deploy. Clean interfaces powered by secure, serverless backends and edge computing.
            </p>
            
            {/* Massive Architecture Mockup */}
            <div className="hidden md:block relative mx-auto max-w-5xl bg-[#121212] border border-white/10 p-2 shadow-2xl">
              <div className="aspect-[21/9] bg-[#0A0A0A] border border-white/5 p-8 flex flex-col">
                 <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <div className="font-mono text-xs text-slate-500 uppercase tracking-widest">System Architecture Overview</div>
                    <div className="font-mono text-xs text-emerald-500">[ 🟢 LIVE ]</div>
                 </div>
                 
                 <div className="flex-1 flex gap-8">
                    {/* Database Node */}
                    <div className="w-1/3 border border-white/5 bg-[#121212] p-6 flex flex-col justify-between">
                       <DatabaseIcon className="w-8 h-8 text-slate-400" />
                       <div>
                         <div className="font-mono text-xs text-slate-500 mb-2">DB_CLUSTER_01</div>
                         <div className="text-white font-serif text-2xl">PostgreSQL Serverless</div>
                       </div>
                    </div>
                    {/* Connecting Line */}
                    <div className="flex-1 flex items-center justify-center">
                       <div className="w-full h-[1px] bg-emerald-900/50 relative overflow-hidden">
                          <div className="absolute top-1/2 -translate-y-1/2 w-16 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)] animate-data-pulse"></div>
                       </div>
                    </div>
                    {/* Edge Node */}
                    <div className="w-1/3 border border-emerald-900/30 bg-emerald-900/10 p-6 flex flex-col justify-between">
                       <Server className="w-8 h-8 text-emerald-500" />
                       <div>
                         <div className="font-mono text-xs text-emerald-500 mb-2">EDGE_NETWORK</div>
                         <div className="text-emerald-50 text-serif text-2xl">Global CDN & API</div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Industry Solutions (Interactive) */}
        <section id="industries" className="py-40 px-6 relative bg-[#121212]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 className="text-5xl md:text-6xl font-serif text-white mb-6">Industry Solutions.</h2>
              <p className="text-lg text-slate-400 font-light max-w-2xl">We do not believe in one-size-fits-all software. We architect deeply integrated systems tailored to the exact operational bottlenecks of specific sectors.</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
              {/* Sidebar Tabs */}
              <div className="lg:col-span-4 flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
                <button 
                  onClick={() => setActiveIndustry('healthcare')}
                  className={`px-8 py-5 text-left transition-all border ${activeIndustry === 'healthcare' ? 'bg-[#0A0A0A] border-emerald-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest block mb-2">Sector 01</span>
                  <span className="font-serif text-2xl">Healthcare</span>
                </button>
                <button 
                  onClick={() => setActiveIndustry('hospitality')}
                  className={`px-8 py-5 text-left transition-all border ${activeIndustry === 'hospitality' ? 'bg-[#0A0A0A] border-emerald-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest block mb-2">Sector 02</span>
                  <span className="font-serif text-2xl">Hospitality</span>
                </button>
                <button 
                  onClick={() => setActiveIndustry('retail')}
                  className={`px-8 py-5 text-left transition-all border ${activeIndustry === 'retail' ? 'bg-[#0A0A0A] border-emerald-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest block mb-2">Sector 03</span>
                  <span className="font-serif text-2xl">Retail & E-commerce</span>
                </button>
                <button 
                  onClick={() => setActiveIndustry('services')}
                  className={`px-8 py-5 text-left transition-all border ${activeIndustry === 'services' ? 'bg-[#0A0A0A] border-emerald-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest block mb-2">Sector 04</span>
                  <span className="font-serif text-2xl">Service Businesses</span>
                </button>
                <button 
                  onClick={() => setActiveIndustry('startups')}
                  className={`px-8 py-5 text-left transition-all border ${activeIndustry === 'startups' ? 'bg-[#0A0A0A] border-emerald-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest block mb-2">Sector 05</span>
                  <span className="font-serif text-2xl">Startups & Growth</span>
                </button>
              </div>

              {/* Content Area */}
              <div className="lg:col-span-8 bg-[#0A0A0A] border border-white/5 p-12 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
                {activeIndustry === 'healthcare' && (
                  <div className="animate-fade-in-up relative z-10 flex flex-col h-full">
                    <h3 className="text-4xl font-serif text-white mb-4">Healthcare Architecture & Compliance</h3>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed font-light">
                      Healthcare requires precision. We architect secure, compliant software that eliminates administrative bottlenecks. From automated patient onboarding via WhatsApp to complex, centralized data portals, we build systems that let your staff focus entirely on clinical outcomes.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-[#121212] border border-white/5 p-5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Core Problem</div>
                        <div className="text-sm text-slate-300 font-medium">Fragmented data and strict HIPAA compliance slowing operations.</div>
                      </div>
                      <div className="bg-[#121212] border border-emerald-900/50 p-5">
                        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">Business Outcome</div>
                        <div className="text-sm text-white font-medium">100% compliant data infrastructure and maximized face-to-face patient time.</div>
                      </div>
                    </div>
                    
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 mt-auto">
                      Explore Healthcare Tech <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
                
                {activeIndustry === 'hospitality' && (
                  <div className="animate-fade-in-up relative z-10 flex flex-col h-full">
                    <h3 className="text-4xl font-serif text-white mb-4">Hospitality Operating Systems</h3>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed font-light">
                      Stop renting your customers from delivery apps. We build proprietary ordering platforms that keep your margins intact and your data in-house. Coupled with our custom Kitchen Display Systems, we streamline operations from the front door to the back of the house.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-[#121212] border border-white/5 p-5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Core Problem</div>
                        <div className="text-sm text-slate-300 font-medium">Bleeding margins to delivery apps and chaotic kitchen communication.</div>
                      </div>
                      <div className="bg-[#121212] border border-emerald-900/50 p-5">
                        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">Business Outcome</div>
                        <div className="text-sm text-white font-medium">Reclaimed profit margins and optimized staff allocation.</div>
                      </div>
                    </div>
                    
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 mt-auto">
                      Modernize Operations <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {activeIndustry === 'retail' && (
                  <div className="animate-fade-in-up relative z-10 flex flex-col h-full">
                    <h3 className="text-4xl font-serif text-white mb-4">High-Volume Commerce Engines</h3>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed font-light">
                      When generic templates throttle your growth, we engineer custom commerce infrastructure. We build headless storefronts that load instantly, handle infinite product permutations, and synchronize complex global inventories in real-time.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-[#121212] border border-white/5 p-5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Core Problem</div>
                        <div className="text-sm text-slate-300 font-medium">Outgrowing off-the-shelf platforms and failing during traffic spikes.</div>
                      </div>
                      <div className="bg-[#121212] border border-emerald-900/50 p-5">
                        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">Business Outcome</div>
                        <div className="text-sm text-white font-medium">A highly scalable, high-conversion retail engine capable of handling massive traffic.</div>
                      </div>
                    </div>
                    
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 mt-auto">
                      Architect Your Store <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {activeIndustry === 'services' && (
                  <div className="animate-fade-in-up relative z-10 flex flex-col h-full">
                    <h3 className="text-4xl font-serif text-white mb-4">Service & Workflow Automation</h3>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed font-light">
                      Scale your service capacity without scaling your headcount. We deploy custom CRMs and WhatsApp bots that automatically capture leads, qualify prospects, and route critical data directly to your sales team, creating a frictionless client experience.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-[#121212] border border-white/5 p-5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Core Problem</div>
                        <div className="text-sm text-slate-300 font-medium">Scaling is bottlenecked by manual client onboarding and invoicing.</div>
                      </div>
                      <div className="bg-[#121212] border border-emerald-900/50 p-5">
                        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">Business Outcome</div>
                        <div className="text-sm text-white font-medium">Automated client lifecycle management and faster deal velocity.</div>
                      </div>
                    </div>
                    
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 mt-auto">
                      Streamline Services <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {activeIndustry === 'startups' && (
                  <div className="animate-fade-in-up relative z-10 flex flex-col h-full">
                    <h3 className="text-4xl font-serif text-white mb-4">Scalable Technical Infrastructure</h3>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed font-light">
                      Duct-tape solutions don't scale. We replace fragile software stacks with unified, custom-built infrastructure. Gain total visibility over your operations with centralized executive dashboards engineered specifically for your business logic.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-[#121212] border border-white/5 p-5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Core Problem</div>
                        <div className="text-sm text-slate-300 font-medium">Relying on a patched-together stack of SaaS tools that breaks at scale.</div>
                      </div>
                      <div className="bg-[#121212] border border-emerald-900/50 p-5">
                        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-2">Business Outcome</div>
                        <div className="text-sm text-white font-medium">A stable technological foundation providing a single source of truth.</div>
                      </div>
                    </div>
                    
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 mt-auto">
                      Build Your Foundation <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
                
                {/* Background decorative element */}
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* 7. Engineering Standards */}
        <section id="standards" className="py-40 px-6 border-t border-white/5 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
             <div className="mb-20 text-center">
                <h2 className="text-5xl font-serif text-white mb-6">Engineering Standards.</h2>
                <p className="text-lg text-slate-400 font-light">A rigorous, transparent technical process acting as an extension of your team.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
               <div className="bg-[#121212] p-10 border border-white/5">
                 <div className="font-mono text-xs text-slate-600 mb-6">01</div>
                 <h4 className="text-2xl font-serif text-white mb-4">Secure Architecture</h4>
                 <p className="text-slate-400 font-light leading-relaxed">Built on enterprise-grade infrastructure. Systems are designed for high availability, deep security, and strict data compliance from day one.</p>
               </div>
               <div className="bg-[#121212] p-10 border border-white/5">
                 <div className="font-mono text-xs text-slate-600 mb-6">02</div>
                 <h4 className="text-2xl font-serif text-white mb-4">Seamless Integration</h4>
                 <p className="text-slate-400 font-light leading-relaxed">We connect new custom software with your existing legacy infrastructure, ensuring zero disruption to your daily operations during deployment.</p>
               </div>
               <div className="bg-[#121212] p-10 border border-white/5">
                 <div className="font-mono text-xs text-slate-600 mb-6">03</div>
                 <h4 className="text-2xl font-serif text-white mb-4">Scalable Performance</h4>
                 <p className="text-slate-400 font-light leading-relaxed">Engineered using Next.js and serverless databases to handle thousands of concurrent users and transactions without breaking a sweat.</p>
               </div>
            </div>
          </div>
        </section>

        {/* 8. Testimonials / Proof Section */}
        <section className="py-32 px-6 border-t border-white/5 bg-emerald-900/5">
          <div className="max-w-7xl mx-auto text-center">
            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              <div className="p-6">
                <div className="text-6xl font-serif text-emerald-400 mb-4"><AnimatedCounter end={10} suffix="k+" /></div>
                <div className="text-sm font-mono text-white uppercase tracking-widest mb-2">Automated Interactions</div>
                <p className="text-slate-500 text-sm">Processed monthly via our custom WhatsApp Automation tools.</p>
              </div>
              <div className="p-6 md:border-x border-white/10">
                <div className="text-6xl font-serif text-emerald-400 mb-4"><AnimatedCounter end={99.9} suffix="%" isFloat={true} /></div>
                <div className="text-sm font-mono text-white uppercase tracking-widest mb-2">Platform Uptime</div>
                <p className="text-slate-500 text-sm">Reliable architecture ensuring your business never stops running.</p>
              </div>
              <div className="p-6">
                <div className="text-6xl font-serif text-emerald-400 mb-4"><AnimatedCounter end={40} suffix="%" /></div>
                <div className="text-sm font-mono text-white uppercase tracking-widest mb-2">Overhead Reduction</div>
                <p className="text-slate-500 text-sm">Average time saved by replacing manual entry with our custom CRMs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8.5. FAQ Section (SEO Optimized) */}
        <section className="py-32 px-6 border-t border-white/5 bg-[#0A0A0A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-serif text-white mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-[#121212] border border-white/5 p-8 hover:border-emerald-900/50 transition-colors">
                <h3 className="text-xl font-serif text-white mb-3">Do you build custom software for specific industries?</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  Yes, we provide deeply integrated industry solutions, including secure clinic management software for healthcare providers and robust restaurant management software for the hospitality sector.
                </p>
              </div>

              <div className="bg-[#121212] border border-white/5 p-8 hover:border-emerald-900/50 transition-colors">
                <h3 className="text-xl font-serif text-white mb-3">Can you integrate WhatsApp automation into our existing CRM?</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  Absolutely. Our WhatsApp automation services are designed to connect directly via API to both off-the-shelf and custom-built CRMs, allowing for seamless lead qualification and customer support.
                </p>
              </div>

              <div className="bg-[#121212] border border-white/5 p-8 hover:border-emerald-900/50 transition-colors">
                <h3 className="text-xl font-serif text-white mb-3">Are your business websites optimized for high traffic?</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  As a leading business website development company, we build all our platforms—from corporate sites to custom ecommerce website development—using modern, scalable edge-computing architecture to ensure 99.9% uptime during massive traffic spikes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Final CTA Section */}
        <section className="py-40 px-6 relative bg-[#121212] border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-serif text-white mb-8">Ready to Build?</h2>
            <p className="text-xl text-slate-400 mb-16 font-light">
              Partner with a technical team that understands business. Replace generic solutions with software designed precisely for how you operate.
            </p>
            
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 px-10 py-5 bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 transition-colors shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:translate-y-1 hover:translate-x-1"
            >
              Discuss Your Project
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>

      {/* 10. Fat Footer */}
      <footer className="pt-24 pb-12 px-6 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center font-bold text-white">K</div>
              <span className="text-xl font-serif italic text-white">Kola Solutions.</span>
            </div>
            <p className="text-slate-500 mb-10 max-w-lg leading-relaxed font-light text-sm">
              Kola Solutions is a premier custom software development company headquartered in Bangalore. We engineer proprietary digital infrastructure tailored to your exact operational needs. Our core capabilities span from custom CRM software development that eliminates data silos, to highly intelligent WhatsApp automation services designed for scale. Whether architecting high-volume custom ecommerce website development, deploying secure hospital management software, or building streamlined restaurant management software, our team ensures total system reliability. By integrating bespoke workflow automation solutions and centralized admin dashboard development, we provide the technical foundation your business needs to accelerate growth.
            </p>
          </div>
          
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-white mb-8">Capabilities</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Custom CRM & ERPs</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">WhatsApp Automation</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Business Automation</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Admin Dashboards</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">E-Commerce Platforms</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-white mb-8">Industries</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Healthcare Software</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Restaurant Management</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Retail & Commerce</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">B2B Services</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-white mb-8">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><a href="#architecture" className="hover:text-emerald-400 transition-colors">Engineering Architecture</a></li>
              <li><a href="#standards" className="hover:text-emerald-400 transition-colors">Our Standards</a></li>
              <li><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5 text-xs font-mono text-slate-600 uppercase tracking-widest">
          <span>© {new Date().getFullYear()} Kola Solutions.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DatabaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}

function AnimatedCounter({ end, suffix = '', isFloat = false }: { end: number, suffix?: string, isFloat?: boolean }) {
  const [count, setCount] = useState(0)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    let start = 0;
    const duration = 1200;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(isFloat ? Number(start.toFixed(1)) : Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, isFloat]);
  
  return <span ref={ref}>{count}{suffix}</span>
}
