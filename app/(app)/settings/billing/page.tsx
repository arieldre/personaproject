import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getStripe, PRICE_IDS, type PriceTier } from '@/lib/stripe'

const VALID_TIERS: PriceTier[] = ['starter', 'growth', 'enterprise']

const TIER_INFO = {
  starter: { label: 'Starter', price: '$199/mo', seats: 'Up to 25 employees', personas: 'Up to 5 personas' },
  growth: { label: 'Growth', price: '$499/mo', seats: 'Up to 100 employees', personas: 'Up to 20 personas' },
  enterprise: { label: 'Enterprise', price: '$999/mo', seats: 'Unlimited employees', personas: 'Unlimited personas' },
} as const

async function startCheckout(formData: FormData): Promise<void> {
  'use server'
  const stripe = getStripe()
  if (!stripe) redirect('/settings/billing')

  let user: { id: string; email: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; email: string; companyId?: string }
  } catch {
    redirect('/login')
  }

  const tier = formData.get('tier') as PriceTier
  if (!VALID_TIERS.includes(tier)) redirect('/settings/billing')

  const priceId = PRICE_IDS[tier]
  if (!priceId) redirect('/settings/billing')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    allow_promotion_codes: true,
    metadata: { company_id: user.companyId ?? '', user_id: user.id },
    success_url: `${baseUrl}/settings/billing?success=1`,
    cancel_url: `${baseUrl}/settings/billing`,
  })

  if (session.url) redirect(session.url)
}

async function openPortal(): Promise<void> {
  'use server'
  const stripe = getStripe()
  if (!stripe) redirect('/settings/billing')

  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    redirect('/login')
  }

  if (!user.companyId) redirect('/settings/billing')

  const [company] = await db
    .select({ stripeCustomerId: companies.stripeCustomerId })
    .from(companies)
    .where(eq(companies.id, user.companyId))
    .limit(1)

  if (!company?.stripeCustomerId) redirect('/settings/billing')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  })

  redirect(portalSession.url)
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    redirect('/login')
  }

  const params = await searchParams
  const showSuccess = params.success === '1'

  const [company] = user.companyId
    ? await db
        .select({
          subscriptionStatus: companies.subscriptionStatus,
          stripeCustomerId: companies.stripeCustomerId,
        })
        .from(companies)
        .where(eq(companies.id, user.companyId))
        .limit(1)
    : []

  const status = company?.subscriptionStatus ?? 'trial'

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage your subscription</p>
        </div>

        {/* Success banner */}
        {showSuccess && (
          <div
            data-testid="billing-success-banner"
            className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300"
          >
            Subscription activated. You now have full access.
          </div>
        )}

        {/* Suspended — payment failed */}
        {status === 'suspended' && (
          <div
            data-testid="billing-suspended-banner"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 space-y-3"
          >
            <p className="text-sm font-medium text-red-300">Payment failed</p>
            <p className="text-xs text-red-400/80">
              Your last invoice could not be collected. Update your payment method to restore access.
            </p>
            <form action={openPortal}>
              <button
                type="submit"
                data-testid="billing-manage-btn"
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-400 transition-colors"
              >
                Update payment method
              </button>
            </form>
          </div>
        )}

        {/* Active subscription */}
        {status === 'active' && (
          <div
            data-testid="billing-active-section"
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-5 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Current plan</p>
              <p className="text-sm font-medium text-green-400">Active</p>
            </div>
            <form action={openPortal}>
              <button
                type="submit"
                data-testid="billing-manage-btn"
                className="px-4 py-2 rounded-lg border border-neutral-700 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
              >
                Manage billing
              </button>
            </form>
          </div>
        )}

        {/* Trial / inactive — show upgrade tiers */}
        {(status === 'trial' || status === 'inactive') && (
          <div data-testid="billing-upgrade-section" className="space-y-4">
            <p className="text-sm text-neutral-400">
              {status === 'trial'
                ? 'You are on a free trial. Choose a plan to activate your subscription.'
                : 'Your subscription is inactive. Reactivate to restore access.'}
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {(['starter', 'growth', 'enterprise'] as const).map((tier) => {
                const info = TIER_INFO[tier]
                const isPopular = tier === 'growth'
                return (
                  <div
                    key={tier}
                    data-testid={`billing-tier-${tier}`}
                    className={`rounded-2xl border p-5 flex flex-col ${
                      isPopular ? 'border-white/20 bg-white/5' : 'border-neutral-800 bg-neutral-900'
                    }`}
                  >
                    {isPopular && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-2">
                        Most popular
                      </span>
                    )}
                    <p className="text-sm font-semibold">{info.label}</p>
                    <p className="text-2xl font-bold mt-1">{info.price}</p>
                    <p className="text-xs text-neutral-500 mt-1 mb-2">{info.seats}</p>
                    <p className="text-xs text-neutral-400 mb-5">{info.personas}</p>

                    {tier === 'enterprise' ? (
                      <a
                        href="mailto:sales@personaplatform.com"
                        data-testid="billing-cta-enterprise"
                        className="text-center py-2 rounded-lg text-xs font-semibold border border-neutral-700 text-white hover:bg-neutral-800 transition-colors"
                      >
                        Contact sales
                      </a>
                    ) : (
                      <form action={startCheckout}>
                        <input type="hidden" name="tier" value={tier} />
                        <button
                          type="submit"
                          data-testid={`billing-cta-${tier}`}
                          className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                            isPopular
                              ? 'bg-white text-neutral-950 hover:bg-neutral-100'
                              : 'border border-neutral-700 text-white hover:bg-neutral-800'
                          }`}
                        >
                          Start subscription
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
