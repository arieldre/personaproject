import { notFound, redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { getDefaultPersona } from '@/lib/training/default-personas'
import { db } from '@/lib/db'
import { personas } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import ConsultSession from './consult-session'

interface Props {
  params: Promise<{ personaId: string }>
}

export default async function ConsultPage({ params }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const { personaId: rawId } = await params
  const personaId = decodeURIComponent(rawId)

  const user = session.user as { companyId?: string }

  if (personaId.startsWith('default:')) {
    const persona = getDefaultPersona(personaId)
    if (!persona) notFound()

    return (
      <ConsultSession
        personaId={personaId}
        personaName={persona.name}
        personaRole={persona.role}
        consultTagline={persona.consultTagline}
        avatarColor={persona.avatarColor}
      />
    )
  }

  // Company persona
  if (!user.companyId) redirect('/login')

  const [persona] = await db
    .select()
    .from(personas)
    .where(and(eq(personas.id, personaId), eq(personas.companyId, user.companyId)))
    .limit(1)

  if (!persona) notFound()

  return (
    <ConsultSession
      personaId={personaId}
      personaName={persona.name}
      personaRole={persona.tagline ?? 'Workplace Professional'}
      consultTagline={`Ask ${persona.name} for expert advice in their domain`}
      avatarColor="#6366f1"
    />
  )
}
