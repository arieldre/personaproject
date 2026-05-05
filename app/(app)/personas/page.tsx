import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { personas } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import PersonasList from './personas-list'

export default async function PersonasPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')

  const user = session.user as { companyId?: string }

  const activePersonas = user.companyId
    ? await db
        .select({
          id: personas.id,
          name: personas.name,
          tagline: personas.tagline,
          clusterSize: personas.clusterSize,
          domainContext: personas.domainContext,
          summary: personas.summary,
          personalityVector: personas.personalityVector,
        })
        .from(personas)
        .where(and(eq(personas.companyId, user.companyId), eq(personas.status, 'active')))
        .orderBy(desc(personas.createdAt))
    : []

  return <PersonasList personas={activePersonas} />
}
