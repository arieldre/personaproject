import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { getStripe, PRICE_IDS, type PriceTier } from '@/lib/stripe'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const VALID_TIERS: PriceTier[] = ['starter', 'growth', 'enterprise']

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  let user: { id: string; email: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; email: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  let tier: PriceTier
  try {
    const body = await req.json()
    tier = body.tier
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'invalid tier — must be starter, growth, or enterprise' }, { status: 400 })
  }

  if (!user.companyId) {
    return NextResponse.json({ error: 'account not associated with a company' }, { status: 400 })
  }

  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    return NextResponse.json({ error: `price ID not configured for tier: ${tier}` }, { status: 503 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Reuse existing Stripe customer to avoid duplicate customer objects on repeat purchase
  const [company] = await db
    .select({ stripeCustomerId: companies.stripeCustomerId })
    .from(companies)
    .where(eq(companies.id, user.companyId))
    .limit(1)

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(company?.stripeCustomerId
        ? { customer: company.stripeCustomerId }
        : { customer_email: user.email }),
      allow_promotion_codes: true,
      // company_id stored in metadata so webhook can identify which company to update
      metadata: { company_id: user.companyId ?? '', user_id: user.id },
      success_url: `${baseUrl}/settings/billing?success=1`,
      cancel_url: `${baseUrl}/settings/billing`,
    })
  } catch (err) {
    console.error('[billing/checkout] Stripe session create failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 503 })
  }

  return NextResponse.json({ url: session.url })
}
