import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials, createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 },
      )
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    const token = await createSession()
    await setSessionCookie(token)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Authentication service error' },
      { status: 500 },
    )
  }
}
