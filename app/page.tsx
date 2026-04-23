import Link from 'next/link'

const TIERS = [
  {
    name: 'Starter',
    price: '$199',
    period: '/mo',
    seats: 'Up to 25 employees',
    features: [
      'Unlimited survey responses',
      'Up to 5 AI personas',
      'Employee–persona matching',
      'Chat with personas',
    ],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$499',
    period: '/mo',
    seats: 'Up to 100 employees',
    features: [
      'Everything in Starter',
      'Up to 20 AI personas',
      'Manager training scenarios',
      'Audit log',
      'Priority support',
    ],
    cta: 'Get started',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$999',
    period: '/mo',
    seats: 'Unlimited employees',
    features: [
      'Everything in Growth',
      'Unlimited personas',
      'SSO / SAML',
      'Custom domain',
      'SLA + dedicated CSM',
      'DPA included',
    ],
    cta: 'Contact sales',
    highlight: false,
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Employees take a 5-min survey',
    body: '28 questions across cognition, communication, hierarchy, and operations — no right or wrong answers.',
  },
  {
    n: '02',
    title: 'AI clusters responses into personas',
    body: 'K-means++ groups employees by personality profile. Groq generates named, described personas in seconds.',
  },
  {
    n: '03',
    title: 'Match any employee to their personas',
    body: 'Cosine similarity finds which AI persona best represents each employee — shown as a compatibility score.',
  },
  {
    n: '04',
    title: 'Chat and train with personas',
    body: 'Managers practise difficult conversations. Training scenarios grade communication effectiveness in real time.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-semibold text-sm tracking-tight">Persona Platform</span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-xs text-neutral-500 hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="text-xs text-neutral-500 hover:text-white transition-colors">Terms</Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-xs text-neutral-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Now available · EU-hosted · GDPR compliant
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Know your team.
          <br />
          <span className="text-neutral-400">Train smarter.</span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Persona Platform turns employee survey responses into AI personas your managers can actually talk to — to practise difficult conversations, understand communication styles, and build stronger teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            Request a demo
          </Link>
          <a
            href="#how-it-works"
            className="px-6 py-3 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Match preview */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
          <p className="text-xs text-neutral-600 uppercase tracking-widest mb-4">Employee–Persona Match</p>
          <div className="space-y-3">
            {[
              { name: 'The Autonomous Director', tagline: 'Decisive leader', pct: 97, color: 'text-green-400' },
              { name: 'The Collaborative Diplomat', tagline: 'Team-focused and tactful', pct: 62, color: 'text-yellow-400' },
              { name: 'The Innovative Free Spirit', tagline: 'Disrupts norms with creative solutions', pct: 27, color: 'text-neutral-400' },
            ].map((m, i) => (
              <div key={m.name} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-neutral-600 w-4 shrink-0">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{m.tagline}</p>
                  </div>
                </div>
                <span className={`text-lg font-bold tabular-nums shrink-0 ${m.color}`}>{m.pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-neutral-700 mt-4 text-center">
            Compatibility scores — cosine similarity mapped to 0–100%
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-neutral-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center mb-14">How it works</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <span className="text-xs font-mono text-neutral-600">{s.n}</span>
                <h3 className="mt-2 text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center mb-3">Simple, flat-fee pricing</h2>
          <p className="text-sm text-neutral-500 text-center mb-14">No per-seat surprises. Pay for the plan, use it for the whole team.</p>

          <div className="grid sm:grid-cols-3 gap-4">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  t.highlight
                    ? 'border-white/20 bg-white/5'
                    : 'border-neutral-800 bg-neutral-900'
                }`}
              >
                {t.highlight && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-3">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold">{t.name}</p>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold">{t.price}</span>
                  <span className="text-sm text-neutral-500">{t.period}</span>
                </div>
                <p className="text-xs text-neutral-500 mb-5">{t.seats}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`text-center py-2 rounded-lg text-xs font-semibold transition-colors ${
                    t.highlight
                      ? 'bg-white text-neutral-950 hover:bg-neutral-100'
                      : 'border border-neutral-700 text-white hover:bg-neutral-800'
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-neutral-600">© 2026 Persona Platform. EU-hosted. GDPR compliant.</span>
          <div className="flex items-center gap-5 text-xs text-neutral-600">
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-neutral-400 transition-colors">Terms</Link>
            <Link href="/subprocessors" className="hover:text-neutral-400 transition-colors">Subprocessors</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
