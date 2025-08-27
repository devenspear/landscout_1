'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { User } from 'lucide-react'
import { 
  Home, 
  Search, 
  MapPin, 
  Kanban, 
  Settings, 
  Activity,
  Database,
  Bug
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LandScoutLogo } from '@/components/landscout-logo'
import { ThemeToggle } from '@/components/theme-toggle'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Results', href: '/results', icon: Search },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Saved Searches', href: '/saved-searches', icon: MapPin },
  { name: 'Admin', href: '/admin', icon: Settings },
  { name: 'Scraper Debug', href: '/scraper-debug', icon: Bug },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 transition-all duration-200">
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <LandScoutLogo size="md" showText={false} />
      </div>
      
      {/* Navigation Links */}
      <div className="mt-6">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-out',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-105"
                  )} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      
      {/* Bottom Section with User Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}