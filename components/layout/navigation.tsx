'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { 
  Home, 
  Search, 
  MapPin, 
  Kanban, 
  Settings, 
  Activity,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Results', href: '/results', icon: Search },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Saved Searches', href: '/saved-searches', icon: MapPin },
  { name: 'Admin', href: '/admin', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900">
          ThriveMore Land Intelligence
        </h1>
      </div>
      
      <div className="mt-8">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center justify-between">
          <UserButton />
        </div>
      </div>
    </nav>
  )
}