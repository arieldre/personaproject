import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

// Common action types surfaced in the filter bar
const ACTION_FILTERS = [
  { label: 'All', value: null },
  { label: 'invite.send', value: 'invite.send' },
  { label: 'invite.accept', value: 'invite.accept' },
  { label: 'user.deactivate', value: 'user.deactivate' },
] as const

interface PageProps {
  searchParams: Promise<{ action?: string }>
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const authUser = await requireRole('company_admin')

  // companyId is an extended field on Better Auth user
  const companyId = (authUser as { companyId?: string }).companyId

  if (!companyId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight mb-4">Audit Log</h1>
          <p className="text-neutral-400">No company associated with your account.</p>
        </div>
      </div>
    )
  }

  const params = await searchParams
  const actionFilter = params.action?.trim() || null

  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      actionFilter
        ? and(
            eq(auditLogs.companyId, companyId),
            eq(auditLogs.action, actionFilter),
          )
        : eq(auditLogs.companyId, companyId),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(100)

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">Audit Log</h1>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          {ACTION_FILTERS.map((filter) => {
            const isActive = filter.value === null
              ? !actionFilter
              : actionFilter === filter.value

            const href = filter.value
              ? `/admin/audit-log?action=${filter.value}`
              : '/admin/audit-log'

            return (
              <Link
                key={filter.label}
                href={href}
                className={[
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-neutral-950'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700',
                ].join(' ')}
              >
                {filter.label}
              </Link>
            )
          })}
        </div>

        {/* Log entries */}
        {logs.length === 0 ? (
          <p className="text-neutral-500 text-sm">No log entries yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((entry) => {
              const metaStr = entry.metadata
                ? JSON.stringify(entry.metadata).slice(0, 100)
                : null

              const truncatedUserId = entry.userId
                ? entry.userId.slice(0, 8)
                : '—'

              return (
                <div
                  key={entry.id}
                  data-testid="log-row"
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 flex flex-col gap-1"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Timestamp */}
                    <span className="text-xs text-neutral-500 tabular-nums">
                      {entry.createdAt.toISOString()}
                    </span>

                    {/* Action badge */}
                    <span className="font-mono text-xs bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded">
                      {entry.action}
                    </span>

                    {/* Entity type */}
                    {entry.entityType && (
                      <span className="text-xs text-neutral-400">
                        {entry.entityType}
                      </span>
                    )}

                    {/* User ID (truncated) */}
                    <span className="text-xs text-neutral-500 font-mono">
                      uid:{truncatedUserId}
                    </span>
                  </div>

                  {/* Metadata (truncated) */}
                  {metaStr && (
                    <p className="text-xs text-neutral-600 font-mono truncate">
                      {metaStr}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
