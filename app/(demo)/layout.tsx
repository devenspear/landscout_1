import { Navigation } from '@/components/layout/navigation'

import dynamic from 'next/dynamic'
import { MobileNavigation } from '@/components/layout/mobile-nav'

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MobileNavigation />
      <div className="flex min-h-screen-ios bg-gray-50">
        <Navigation />
        <main className="flex-1 overflow-hidden pb-safe pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </>
  )
}
