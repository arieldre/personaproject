'use server'

import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userInvitations } from '@/lib/db/schema'
import { sendInvitationEmail } from '@/lib/email'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

export async function sendInvite(email: string, role: 'user' | 'company_admin') {
  const rawUser = await requireRole('company_admin')
  const user = rawUser as { id: string; companyId?: string; name?: string }

  if (!user.companyId) throw new Error('No company associated with this account')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) throw new Error('Invalid email address')

  const existing = await db
    .select({ id: userInvitations.id })
    .from(userInvitations)
    .where(
      and(
        eq(userInvitations.email, email),
        eq(userInvitations.companyId, user.companyId),
        eq(userInvitations.status, 'pending'),
      )
    )
    .limit(1)

  if (existing.length > 0) throw new Error('A pending invitation already exists for this email')

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const [invite] = await db
    .insert(userInvitations)
    .values({
      email,
      companyId: user.companyId,
      invitedBy: user.id,
      role,
      token,
      status: 'pending',
      expiresAt,
    })
    .returning({ id: userInvitations.id })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`

  await sendInvitationEmail({
    to: email,
    inviterName: user.name ?? 'A team member',
    companyName: '',
    inviteUrl,
    expiresAt,
  })

  return { id: invite.id }
}

export async function resendInvite(id: string) {
  const rawUser = await requireRole('company_admin')
  const user = rawUser as { id: string; companyId?: string; name?: string }

  if (!user.companyId) throw new Error('No company associated with this account')

  const [invite] = await db
    .select()
    .from(userInvitations)
    .where(and(eq(userInvitations.id, id), eq(userInvitations.companyId, user.companyId)))
    .limit(1)

  if (!invite) throw new Error('Invitation not found')

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db
    .update(userInvitations)
    .set({ token, expiresAt, status: 'pending' })
    .where(eq(userInvitations.id, id))

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`

  await sendInvitationEmail({
    to: invite.email,
    inviterName: user.name ?? 'A team member',
    companyName: '',
    inviteUrl,
    expiresAt,
  })

}

export async function revokeInvite(id: string) {
  const rawUser = await requireRole('company_admin')
  const user = rawUser as { id: string; companyId?: string }

  if (!user.companyId) throw new Error('No company associated with this account')

  const [invite] = await db
    .select({ id: userInvitations.id })
    .from(userInvitations)
    .where(and(eq(userInvitations.id, id), eq(userInvitations.companyId, user.companyId)))
    .limit(1)

  if (!invite) throw new Error('Invitation not found')

  await db
    .update(userInvitations)
    .set({ status: 'revoked' })
    .where(eq(userInvitations.id, id))
}
