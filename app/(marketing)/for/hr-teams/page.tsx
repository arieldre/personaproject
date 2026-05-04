import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Persona Simulation for L&D Teams — Persona Platform',
  description: 'Help L&D teams deploy personalised manager training with AI personas derived from actual employee data.',
}

const features = [
  {
    title: 'Survey management',
    desc: 'Create a survey, generate a unique link, and track completion rates from a single admin dashboard. No chasing spreadsheets.',
  },
  {
    title: 'Automatic persona clustering',
    desc: 'Once responses reach your minimum threshold, Inngest runs K-means++ clustering and Groq generates persona names and descriptions. No manual categorisation.',
  },
  {
    title: 'Employee–persona matching',
    desc: 'Every employee is automatically matched to their closest persona using cosine similarity. L&D teams can see the distribution across the organisation.',
  },
  {
    title: 'Training analytics',
    desc: 'Track which managers have completed sessions, average scores across the five dimensions, and improvement over time. Identify who needs support.',
  },
  {
    title: 'Audit log',
    desc: 'Full audit trail of all admin actions: survey sends, persona regenerations, access changes. Required for enterprise compliance reviews.',
  },
  {
    title: 'GDPR-ready from day one',
    desc: 'Ireland-incorporated. EU-hosted. DPA available at /dpa. Subprocessor list at /subprocessors. No legal review triage required.',
  },
]

export default function ForHrTeamsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Use Case</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-4">
        AI Persona Simulation for L&amp;D Teams
      </h1>
      <p className="text-neutral-400 text-sm leading-7 mb-6 max-w-2xl">
        Generic training doesn&apos;t stick. A 45-minute e-learning module on &ldquo;giving feedback
        effectively&rdquo; doesn&apos;t prepare a manager for their specific direct report&apos;s reaction
        — and there&apos;s no way to measure whether anything changed.
      </p>
      <div className="flex gap-3 mb-16">
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          Request a demo
        </Link>
        <Link
          href="/dpa"
          className="px-5 py-2.5 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
        >
          Review DPA
        </Link>
      </div>

      {/* Pain */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">The problem with generic training</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'It\'s not personalised', text: 'A &ldquo;difficult conversation&rdquo; scenario designed for a generic employee doesn\'t account for the fact that your employees have distinct, measurable personality patterns.' },
            { label: 'You can\'t measure improvement', text: 'A manager completes a workshop. Did they get better? You don\'t know. There\'s no before-and-after score, no replay, no evidence.' },
            { label: 'It doesn\'t transfer', text: 'Watching a video of someone else\'s difficult conversation doesn\'t build the muscle memory needed to have that conversation yourself.' },
            { label: 'It\'s expensive to run again', text: 'Bringing in an external trainer for every cohort of new managers doesn\'t scale. The cost per manager skyrockets as the company grows.' },
          ].map((p) => (
            <div key={p.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-white text-sm font-semibold mb-2">{p.label}</p>
              <p className="text-neutral-400 text-xs leading-6"
                dangerouslySetInnerHTML={{ __html: p.text }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-3">Personalised AI training from your own employee data</h2>
        <p className="text-neutral-400 text-sm leading-7 mb-6">
          Persona Platform starts with a 28-question VCPQ personality assessment. L&amp;D teams
          send one survey link — employees complete it in 5 minutes. The platform automatically
          clusters responses into AI personas that represent the communication patterns in your
          specific organisation. Not archetypes from a textbook. Patterns from your data.
        </p>
        <p className="text-neutral-400 text-sm leading-7">
          Managers then practise conversations with those personas. Every session is graded
          across five dimensions. L&amp;D teams can see who&apos;s improving and who needs coaching
          support — without having to observe every conversation.
        </p>
      </section>

      {/* Features grid */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-6">Everything L&amp;D teams need to run it</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-white text-sm font-semibold mb-2">{f.title}</p>
              <p className="text-neutral-400 text-xs leading-6">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing callout */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">Pricing designed for L&amp;D budgets</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { plan: 'Starter', price: '$199/mo', size: 'Up to 25 employees', note: 'Up to 5 personas' },
            { plan: 'Growth', price: '$499/mo', size: 'Up to 100 employees', note: 'Up to 20 personas + audit log', highlight: true },
            { plan: 'Enterprise', price: '$999/mo', size: 'Unlimited employees', note: 'Unlimited personas + DPA + SLA' },
          ].map((p) => (
            <div
              key={p.plan}
              className={`rounded-xl border p-5 ${p.highlight ? 'border-neutral-600 bg-neutral-900' : 'border-neutral-800 bg-neutral-900'}`}
            >
              {p.highlight && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 block mb-2">Most popular</span>
              )}
              <p className="text-white font-semibold text-sm">{p.plan}</p>
              <p className="text-2xl font-bold mt-1 mb-0.5">{p.price}</p>
              <p className="text-neutral-500 text-xs mb-2">{p.size}</p>
              <p className="text-neutral-400 text-xs">{p.note}</p>
            </div>
          ))}
        </div>
        <p className="text-neutral-600 text-xs mt-4">
          Flat fee — no per-seat billing. One price for the whole team.
        </p>
      </section>

      {/* Compliance callout */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">Built for L&amp;D teams in regulated environments</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'GDPR compliant', text: 'Ireland-incorporated controller. Full DPA available. Subprocessors listed.' },
            { label: 'EU AI Act aware', text: 'Explicit Terms clause: not for hiring or employment decisions. Audit-ready.' },
            { label: 'Data stays in EU', text: 'Primary database in AWS eu-west-1 (Ireland). No EEA-exit for core data.' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white text-xs font-semibold mb-1.5">{c.label}</p>
              <p className="text-neutral-400 text-xs leading-5">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-8 text-center">
        <h2 className="text-white font-semibold text-lg mb-3">
          Deploy personalised manager training this week
        </h2>
        <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
          Send the survey link, get your personas, and give every manager a place to practise.
          No vendor onboarding. No trainer scripting. No per-seat surprises.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          Get started free
        </Link>
        <p className="text-neutral-600 text-xs mt-3">
          Enterprise? Email{' '}
          <a href="mailto:sales@personaplatform.com" className="text-neutral-500 hover:text-neutral-400 transition-colors">
            sales@personaplatform.com
          </a>{' '}
          for a custom demo and DPA review.
        </p>
      </div>
    </main>
  )
}
