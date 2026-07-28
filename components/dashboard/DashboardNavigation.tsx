'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SidebarNav from './SidebarNav'

interface NavItem {
  label: string
  href: string
}

interface DashboardNavigationProps {
  navItems: NavItem[]
  theme: any
  userLabel: string
  role: string
}

export default function DashboardNavigation({ navItems, theme, userLabel, role }: DashboardNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* ── Mobile Header ────────────────────────────────────────── */}
      <header className="md:hidden flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0">
        <div className="flex items-center gap-2">
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
          )}
          <span className="font-bold text-gray-900">{theme.name} Dashboard</span>
        </div>
        <button 
          className="p-2 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-inset"
          style={{ focusRingColor: theme.primaryColor || '#D85A30' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </header>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────── */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop & Mobile) ───────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out
        md:static md:w-52 md:shrink-0 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-14 md:h-14 items-center gap-2.5 border-b border-gray-100 px-4">
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="Logo" className="h-7 w-7 rounded-full object-cover" />
          )}
          <span className="font-bold text-gray-900 text-sm truncate">{theme.name}</span>
          
          {/* Close button inside sidebar for mobile */}
          <button 
            className="md:hidden ml-auto p-1 text-gray-500 rounded-md"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav navItems={navItems} primaryColor={theme.primaryColor || '#D85A30'} />
        </div>

        <div className="border-t border-gray-100 p-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-800 truncate">{userLabel}</span>
              <span className="text-[11px] text-gray-400 capitalize">{role}</span>
            </div>
            <form action="/auth/signout" method="post">
              <button 
                type="submit" 
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
