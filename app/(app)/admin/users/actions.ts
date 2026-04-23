'use server'

import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function activateUser(userId: string) {
  const session = await requireRole('company_admin')
  const { companyId } = session as { id: string; companyId?: string }

  const [target] = await db.select({ companyId: user.companyId }).from(user).where(eq(user.id, userId))
  if (!target || target.companyId !== companyId) {
    throw new Response('Forbidden', { status: 403 })
  }

  await db.update(user).set({ isActive: true }).where(eq(user.id, userId))
}

export async function deactivateUser(userId: string) {
  const session = await requireRole('company_admin')
  const { companyId } = session as { id: string; companyId?: string }

  const [target] = await db.select({ companyId: user.companyId }).from(user).where(eq(user.id, userId))
  if (!target || target.companyId !== companyId) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Session invalidation requires Better Auth API — middleware checks isActive on each request
  await db.update(user).set({ isActive: false }).where(eq(user.id, userId))
}
