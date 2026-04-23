import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'

const roleLabel: Record<string, string | null> = {
  company_admin: 'Admin',
  super_admin: 'Super Admin',
  user: null,
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const u = session.user as { name?: string; role?: string }
  const label = roleLabel[u.role ?? ''] ?? null

  return (
    <>
      <nav className="border-b border-neutral-800 bg-neutral-950 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-white font-semibold text-sm">Persona</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/match" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Match
            </Link>
            {(u.role === 'company_admin' || u.role === 'super_admin') && (
              <Link href="/admin/personas" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {u.name && <span className="text-neutral-400 text-sm">{u.name}</span>}
          {label && (
            <span
              data-testid="role-badge"
              className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400"
            >
              {label}
            </span>
          )}
        </div>
      </nav>
      {children}
    </>
  )
}
