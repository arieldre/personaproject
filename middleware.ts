import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/personas', '/chat', '/training', '/admin', '/settings']
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for session cookie (fast — no DB call)
  const sessionCookie = getSessionCookie(request)
  const isAuthenticated = Boolean(sessionCookie)

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip static files, images, _next internals
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
