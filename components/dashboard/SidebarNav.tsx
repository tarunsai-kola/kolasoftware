'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

interface SidebarNavProps {
  navItems: NavItem[]
  primaryColor: string
}

export default function SidebarNav({ navItems, primaryColor }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/orders' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            style={isActive ? { backgroundColor: primaryColor || '#D85A30' } : {}}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
