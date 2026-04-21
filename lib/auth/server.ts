import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from './index'

/**
 * Get current session server-side. Cached per request via React.cache().
 * Use in layouts to hydrate user context once.
 * Always call getUser() in route handlers for security — not this.
 */
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

/**
 * Get current user server-side, validated against auth server.
 * Use in route handlers and Server Actions — not getSession() (spoofable).
 */
export const getServerUser = cache(async () => {
  const session = await getServerSession()
  return session?.user ?? null
})

/**
 * Require auth in Server Actions / Route Handlers.
 * Throws a Response with 401 if not authenticated.
 */
export async function requireAuth() {
  const user = await getServerUser()
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return user
}

/**
 * Require specific role.
 */
export async function requireRole(role: 'super_admin' | 'company_admin') {
  const user = await requireAuth()
  const userRole = (user as { role?: string }).role ?? ''
  const hierarchy = { super_admin: 3, company_admin: 2, user: 1 }
  const required = hierarchy[role]
  const actual = hierarchy[userRole as keyof typeof hierarchy] ?? 0
  if (actual < required) {
    throw new Response('Forbidden', { status: 403 })
  }
  return user
}
