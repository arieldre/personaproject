import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { questionnaires } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SurveyForm } from './survey-form'

interface Props {
  params: Promise<{ code: string }>
}

export default async function SurveyPage({ params }: Props) {
  const { code } = await params

  const [questionnaire] = await db
    .select()
    .from(questionnaires)
    .where(eq(questionnaires.accessCode, code))
    .limit(1)

  if (!questionnaire) notFound()
  if (questionnaire.status !== 'active') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-white">Survey not available</h1>
          <p className="text-sm text-neutral-400">This survey is no longer accepting responses.</p>
        </div>
      </div>
    )
  }

  return (
    <SurveyForm
      questionnaireId={questionnaire.id}
      anonymous={questionnaire.isAnonymous ?? false}
      domainContext={questionnaire.domainContext ?? 'General'}
    />
  )
}
