import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { questionnaires, personas, user as userTable } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import DataPrivacySection from './_components/DataPrivacySection'

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  // Better Auth infers a narrow user type — cast to access extended fields
  const sessionUser = session.user as { companyId?: string; name?: string }
  const companyId = sessionUser.companyId

  type Stats = {
    activeSurveys: number
    totalResponses: number
    activePersonas: number
    activeUsers: number
  }

  let stats: Stats | null = null

  if (companyId) {
    const [surveysResult, personasResult, usersResult] = await Promise.all([
      // Active questionnaires + sum of totalResponses
      db
        .select({
          activeSurveys: count(),
          totalResponses: sql<number>`COALESCE(SUM(${questionnaires.totalResponses}), 0)`,
        })
        .from(questionnaires)
        .where(
          and(
            eq(questionnaires.companyId, companyId),
            eq(questionnaires.status, 'active'),
          ),
        ),

      // Active personas
      db
        .select({ activePersonas: count() })
        .from(personas)
        .where(
          and(
            eq(personas.companyId, companyId),
            eq(personas.status, 'active'),
          ),
        ),

      // Active users in the company
      db
        .select({ activeUsers: count() })
        .from(userTable)
        .where(
          and(
            eq(userTable.companyId, companyId),
            eq(userTable.isActive, true),
          ),
        ),
    ])

    stats = {
      activeSurveys: Number(surveysResult[0]?.activeSurveys ?? 0),
      totalResponses: Number(surveysResult[0]?.totalResponses ?? 0),
      activePersonas: Number(personasResult[0]?.activePersonas ?? 0),
      activeUsers: Number(usersResult[0]?.activeUsers ?? 0),
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-neutral-400">
            Welcome back{session.user.name ? `, ${session.user.name}` : ''}.
          </p>
        </div>

        {stats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div
              data-testid="stat-card"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4"
            >
              <p className="text-sm text-neutral-400">Active Surveys</p>
              <p className="text-2xl font-bold">{stats.activeSurveys}</p>
            </div>

            <div
              data-testid="stat-card"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4"
            >
              <p className="text-sm text-neutral-400">Total Responses</p>
              <p className="text-2xl font-bold">{stats.totalResponses}</p>
            </div>

            <div
              data-testid="stat-card"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4"
            >
              <p className="text-sm text-neutral-400">Personas</p>
              <p className="text-2xl font-bold">{stats.activePersonas}</p>
            </div>

            <div
              data-testid="stat-card"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4"
            >
              <p className="text-sm text-neutral-400">Active Users</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        )}

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link
            href="/admin/personas"
            className="rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors px-6 py-5 group"
          >
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Manage</p>
            <p className="font-semibold group-hover:text-white">Personas</p>
            <p className="text-sm text-neutral-400 mt-1">View all AI personas, descriptions, and trait profiles</p>
          </Link>

          <Link
            href="/match"
            className="rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors px-6 py-5 group"
          >
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Hero feature</p>
            <p className="font-semibold group-hover:text-white">Employee Match</p>
            <p className="text-sm text-neutral-400 mt-1">Find which persona best represents any employee</p>
          </Link>

          <Link
            href="/training"
            className="rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors px-6 py-5 group"
          >
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Practice</p>
            <p className="font-semibold group-hover:text-white">Training Scenarios</p>
            <p className="text-sm text-neutral-400 mt-1">Run graded manager conversations with personas</p>
          </Link>

          <Link
            href="/personas"
            className="rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors px-6 py-5 group"
          >
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Chat</p>
            <p className="font-semibold group-hover:text-white">Talk to a Persona</p>
            <p className="text-sm text-neutral-400 mt-1">Open any persona and start a free-form conversation</p>
          </Link>
        </div>

        <DataPrivacySection />
      </div>
    </div>
  )
}
