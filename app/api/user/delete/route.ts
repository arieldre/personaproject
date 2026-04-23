import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { user as userTable, session as sessionTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const PURGE_DAYS = 30

export async function POST() {
  const authUser = await requireAuth()

  const now = new Date()
  const purgeAt = new Date(now.getTime() + PURGE_DAYS * 24 * 60 * 60 * 1000)

  // Soft-delete the user record
  await db
    .update(userTable)
    .set({ deletedAt: now })
    .where(eq(userTable.id, authUser.id))

  // Invalidate all active sessions — user is logged out immediately on next request
  await db.delete(sessionTable).where(eq(sessionTable.userId, authUser.id))

  return NextResponse.json({
    ok: true,
    deletedAt: now.toISOString(),
    purgeAt: purgeAt.toISOString(),
  })
}
