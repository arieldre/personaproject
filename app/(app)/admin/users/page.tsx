import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { activateUser, deactivateUser } from './actions'

const roleBadge: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-400',
  company_admin: 'bg-blue-500/10 text-blue-400',
  user: 'bg-neutral-700 text-neutral-400',
}

export default async function AdminUsersPage() {
  const session = await requireRole('company_admin')
  const me = session as { id: string; companyId?: string }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.companyId, me.companyId!))
    .orderBy(user.createdAt)

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-neutral-400 mt-1">{rows.length} member{rows.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">Email</th>
                <th className="px-6 py-3 text-left font-medium">Role</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rows.map((u) => (
                <tr key={u.id} data-testid="user-row" className="hover:bg-neutral-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-neutral-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge[u.role] ?? roleBadge.user}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {u.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.id === me.id ? (
                      <span className="text-neutral-600 text-xs">—</span>
                    ) : u.isActive ? (
                      <form action={deactivateUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          data-testid="deactivate-btn"
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Deactivate
                        </button>
                      </form>
                    ) : (
                      <form action={activateUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          data-testid="activate-btn"
                          className="text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Activate
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="px-8 py-12 text-center">
              <p className="text-neutral-500 text-sm">No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
