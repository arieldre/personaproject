import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subprocessors — Persona Platform',
  description: 'List of third-party subprocessors used by Persona Platform to deliver the service.',
}

const subprocessors = [
  {
    name: 'Supabase / PostgreSQL',
    purpose: 'Primary database (employee survey responses, personality vectors, account data, audit logs)',
    location: 'EU (Ireland — AWS eu-west-1)',
    data: 'All personal data including name, email, survey responses, personality vectors',
  },
  {
    name: 'Groq',
    purpose: 'LLM inference — powers AI persona chat sessions and training scenario grading',
    location: 'United States (SCCs in place)',
    data: 'Chat messages sent to AI personas; does not receive raw survey responses or PII by default',
  },
  {
    name: 'Inngest',
    purpose: 'Background job orchestration — clustering runs, persona generation, async grading pipelines',
    location: 'United States (SCCs in place)',
    data: 'Job payloads (company ID, questionnaire IDs); no raw personal data unless required for the job',
  },
  {
    name: 'Vercel',
    purpose: 'Hosting and serverless compute — serves the application and all API routes',
    location: 'EU (primary region); edge nodes may be global',
    data: 'HTTP request logs (IP, user-agent, path); no persistent personal data stored by Vercel',
  },
]

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Legal</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Subprocessors</h1>
      <p className="text-neutral-400 text-sm mb-4">Last updated: 2026-04-23</p>

      <p className="text-neutral-300 text-sm leading-7 mb-12">
        Persona Platform uses the following third-party subprocessors to deliver the Service.
        All subprocessors are bound by Data Processing Agreements (DPAs) that comply with
        GDPR. For transfers outside the EEA, Standard Contractual Clauses (SCCs) approved
        by the European Commission are in place. We review subprocessors at least annually
        and notify customers of material changes with 30 days&apos; advance notice.
      </p>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="pb-3 pr-6 text-neutral-400 font-medium w-44">Subprocessor</th>
              <th className="pb-3 pr-6 text-neutral-400 font-medium">Purpose</th>
              <th className="pb-3 pr-6 text-neutral-400 font-medium w-52">Location</th>
              <th className="pb-3 text-neutral-400 font-medium">Data Transferred</th>
            </tr>
          </thead>
          <tbody className="text-neutral-300">
            {subprocessors.map((sp, i) => (
              <tr
                key={sp.name}
                className={`border-b ${i < subprocessors.length - 1 ? 'border-neutral-800' : 'border-transparent'}`}
              >
                <td className="py-5 pr-6 text-white font-medium align-top">{sp.name}</td>
                <td className="py-5 pr-6 align-top leading-6">{sp.purpose}</td>
                <td className="py-5 pr-6 align-top leading-6">{sp.location}</td>
                <td className="py-5 align-top leading-6">{sp.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {subprocessors.map((sp) => (
          <div
            key={sp.name}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 space-y-3 text-sm"
          >
            <p className="text-white font-semibold">{sp.name}</p>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Purpose</p>
              <p className="text-neutral-300 leading-6">{sp.purpose}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Location</p>
              <p className="text-neutral-300">{sp.location}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Data Transferred</p>
              <p className="text-neutral-300 leading-6">{sp.data}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-400">
        <p>
          Questions about subprocessors or data transfers? Contact{' '}
          <a
            href="mailto:privacy@personaplatform.com"
            className="text-white underline underline-offset-2 hover:text-neutral-300"
          >
            privacy@personaplatform.com
          </a>
          .
        </p>
      </div>
    </main>
  )
}
