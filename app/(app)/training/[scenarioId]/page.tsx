import { notFound, redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { getScenario } from '@/lib/training/scenarios'
import { getDefaultPersona } from '@/lib/training/default-personas'
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

  // scenarioId may be URL-encoded (e.g. 'default%3Ahr-partner%3Aeasy')
  const decodedId = decodeURIComponent(scenarioId)
  const scenario = getScenario(decodedId)
  if (!scenario) {
    notFound()
  }

  // Default persona scenario — use static persona, no DB lookup needed
  if (scenario.personaId?.startsWith('default:')) {
    const defaultPersona = getDefaultPersona(scenario.personaId)
    if (!defaultPersona) {
      notFound()
    }

    return (
      <TrainingSession
        scenario={scenario}
        personas={[]}
        defaultPersona={{ id: defaultPersona.id, name: defaultPersona.name, role: defaultPersona.role, avatarColor: defaultPersona.avatarColor }}
      />
    )
  }

  // Legacy scenario — load company's active personas for the picker
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
