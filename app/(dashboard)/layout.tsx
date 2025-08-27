import { Navigation } from '@/components/layout/navigation'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navigation />
      <main className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        {children}
      </main>
    </div>
  )
}