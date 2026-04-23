import { notFound, redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { getScenario } from '@/lib/training/scenarios'
import { db } from '@/lib/db'
import { personas } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { TrainingSession } from './training-session'

interface Props {
  params: Promise<{ scenarioId: string }>
}

export default async function TrainingScenarioPage({ params }: Props) {
  const { scenarioId } = await params

  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const user = session.user as { id: string; companyId?: string }

  const scenario = getScenario(scenarioId)
  if (!scenario) {
    notFound()
  }

  // Load company's active personas — scoped to the user's company
  const activePersonas =
    user.companyId
      ? await db
          .select({ id: personas.id, name: personas.name })
          .from(personas)
          .where(and(eq(personas.companyId, user.companyId), eq(personas.status, 'active')))
      : []

  return (
    <TrainingSession scenario={scenario} personas={activePersonas} />
  )
}
