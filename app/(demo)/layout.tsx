import { Navigation } from '@/components/layout/navigation'

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen-ios bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-hidden pb-safe">
        {children}
      </main>
    </div>
  )
}