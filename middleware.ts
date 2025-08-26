import { NextRequest, NextResponse } from 'next/server'

export default function middleware(request: NextRequest) {
  // In development with placeholder keys, skip all auth checks
  if (process.env.NODE_ENV === 'development' && 
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_placeholder') {
    return NextResponse.next()
  }
  
  // Production auth will be handled by Clerk middleware when keys are configured
  // For now, allow all requests in development
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}