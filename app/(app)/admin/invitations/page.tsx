import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userInvitations } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { resendInvite, revokeInvite } from './actions'

export default async function AdminInvitationsPage() {
  const rawUser = await requireRole('company_admin')
  const user = rawUser as { id: string; companyId?: string }

  if (!user.companyId) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">No company associated with this account.</p>
      </div>
    )
  }

  const rows = await db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.companyId, user.companyId))
    .orderBy(desc(userInvitations.createdAt))
    .limit(100)

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Invitations</h1>
            <p className="text-sm text-neutral-400 mt-1">{rows.length} invitation{rows.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/admin/invitations/new"
            className="px-4 py-2 bg-white text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Invite someone
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-12 text-center">
            <p className="text-neutral-500 text-sm">No invitations yet. Invite someone to get started.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900">
                  <th className="text-left px-4 py-3 text-neutral-400 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-neutral-400 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-neutral-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-neutral-400 font-medium">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {rows.map((invite) => (
                  <tr key={invite.id} data-testid="invite-row" className="bg-neutral-950 hover:bg-neutral-900 transition-colors">
                    <td className="px-4 py-3 text-white">{invite.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300">
                        {invite.role ?? 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        invite.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : invite.status === 'accepted'
                            ? 'bg-green-500/10 text-green-400'
                            : invite.status === 'revoked'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-neutral-700 text-neutral-400'
                      }`}>
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {invite.expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {invite.status === 'pending' && (
                        <div className="flex items-center gap-2 justify-end">
                          <form action={resendInvite.bind(null, invite.id)}>
                            <button
                              type="submit"
                              data-testid="resend-invite"
                              className="text-xs text-neutral-400 hover:text-white transition-colors"
                            >
                              Resend
                            </button>
                          </form>
                          <form action={revokeInvite.bind(null, invite.id)}>
                            <button
                              type="submit"
                              data-testid="revoke-invite"
                              className="text-xs text-red-500 hover:text-red-400 transition-colors"
                            >
                              Revoke
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
