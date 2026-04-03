import { cookies } from 'next/headers'

const COOKIE_NAME = 'ls_session'
const MAX_AGE = 60 * 60 * 24 // 24 hours

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET environment variable is required')
  return secret
}

async function sign(value: string): Promise<string> {
  const secret = getSecret()
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value),
  )
  const sig = Buffer.from(signature).toString('base64url')
  return `${value}.${sig}`
}

async function verify(token: string): Promise<string | null> {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = token.slice(0, lastDot)
  const expected = await sign(value)
  if (token !== expected) return null
  return value
}

export async function createSession(): Promise<string> {
  const payload = JSON.stringify({ ts: Date.now() })
  return sign(payload)
}

export async function verifySession(token: string): Promise<boolean> {
  const payload = await verify(token)
  if (!payload) return false
  try {
    const { ts } = JSON.parse(payload)
    return Date.now() - ts < MAX_AGE * 1000
  } catch {
    return false
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function validateCredentials(username: string, password: string): boolean {
  const validUser = process.env.AUTH_USERNAME
  const validPass = process.env.AUTH_PASSWORD
  if (!validUser || !validPass) {
    throw new Error('AUTH_USERNAME and AUTH_PASSWORD environment variables are required')
  }
  return username === validUser && password === validPass
}
