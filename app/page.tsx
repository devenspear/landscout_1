import { redirect } from 'next/navigation'
// import { auth } from '@clerk/nextjs/server'

export default function HomePage() {
  // Temporarily bypass authentication
  // const { userId } = auth()
  // 
  // if (!userId) {
  //   redirect('/sign-in')
  // }
  
  // Redirect to dashboard directly for development
  redirect('/dashboard')
}