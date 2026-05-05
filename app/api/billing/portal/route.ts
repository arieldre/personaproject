import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  let user: { id: string; email: string; companyId?: string }
  try {
    user = (await requireRole('company_admin')) as { id: string; email: string; companyId?: string }
  } catch {
    return new Response('Forbidden', { status: 403 })
  }

  if (!user.companyId) {
    return NextResponse.json({ error: 'no company associated with account' }, { status: 400 })
  }

  const [company] = await db
    .select({ stripeCustomerId: companies.stripeCustomerId })
    .from(companies)
    .where(eq(companies.id, user.companyId))
    .limit(1)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // No stripe customer yet — redirect to checkout flow
  if (!company?.stripeCustomerId) {
    return NextResponse.json({ redirect: `${baseUrl}/settings/billing` })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
