'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  LayoutDashboard,
  Search,
  Map,
  Kanban,
  Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Results', href: '/results', icon: Search },
  { label: 'Map View', href: '/map', icon: Map },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban },
  { label: 'Admin', href: '/admin', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-gray-800/60 bg-gray-900 md:flex">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <Compass className="h-7 w-7 text-emerald-500" />
          <span className="text-lg font-semibold tracking-tight text-gray-100">
            LandScout
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 pt-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'border-l-2 border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-l-2 border-transparent text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Version */}
        <div className="border-t border-gray-800/60 px-5 py-4">
          <p className="text-xs text-gray-600">v2.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-0 flex-1 pb-20 md:ml-60 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-800/60 bg-gray-900/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
