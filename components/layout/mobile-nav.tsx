"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { LandScoutLogo } from '@/components/landscout-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { navigation } from './navigation'
import { cn } from '@/lib/utils'

export function MobileNavigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Close drawer on route change
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 pt-safe">
        <div className="h-14 flex items-center justify-between px-4">
          <button aria-label="Open menu" className="p-2 -ml-2" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <LandScoutLogo size="sm" showText={false} />
          <ThemeToggle />
        </div>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-800 shadow-xl pt-safe">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              <LandScoutLogo size="sm" showText={false} />
              <button aria-label="Close menu" className="p-2 -mr-2" onClick={() => setOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="py-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' as any }}>
              <ul className="space-y-1 px-3">
                {navigation.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-4 py-3 rounded-xl text-base',
                          isActive
                            ? 'bg-blue-500 text-white shadow-blue-500/25 shadow'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                        )}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
