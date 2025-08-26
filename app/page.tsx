import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs'

export default function HomePage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Redirect authenticated users to dashboard
  redirect('/dashboard')
}