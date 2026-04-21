import { getServerSession } from '@/lib/auth/server'

export default async function DashboardPage() {
  const session = await getServerSession()

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-neutral-400">
            Welcome back{session?.user.name ? `, ${session.user.name}` : ''}.
          </p>
        </div>

        <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-12 text-center">
          <p className="text-neutral-500 text-sm">
            Phase 1 complete — survey, personas, and chat coming next.
          </p>
        </div>
      </div>
    </div>
  )
}
