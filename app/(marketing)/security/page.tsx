import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security — Persona Platform',
  description: 'How Persona Platform protects your data: infrastructure, encryption, authentication, and incident response.',
}

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Trust &amp; Safety</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Security Overview</h1>
      <p className="text-neutral-400 text-sm mb-12">Last updated: 2026-05-04</p>

      <div className="space-y-10 text-neutral-300 text-sm leading-7">

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Infrastructure</h2>
          <p>
            Persona Platform is hosted entirely within the European Economic Area. Our primary
            database and compute run on Supabase (PostgreSQL, AWS eu-west-1 — Ireland) and Vercel
            (primary region EU). No customer data is stored at rest outside the EEA. Edge compute
            nodes used for static asset delivery do not receive or persist personal data.
          </p>
          <p className="mt-3">
            We rely on infrastructure-grade providers that maintain their own compliance
            programmes including ISO 27001, SOC 2 Type II, and PCI-DSS. Copies of these
            certifications are available on request.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Encryption</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white font-medium mb-1">At rest — AES-256</p>
              <p>
                All data stored in our PostgreSQL database is encrypted at rest using AES-256
                block encryption managed by the underlying cloud provider. This includes survey
                responses, personality vectors, account data, chat transcripts, and audit logs.
                Backups are encrypted with the same standard.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white font-medium mb-1">In transit — TLS 1.3</p>
              <p>
                All connections between clients and our servers, and between our services
                internally, use TLS 1.3. TLS 1.0 and 1.1 are disabled. HSTS is enforced with
                a minimum max-age of one year. We do not support unencrypted HTTP for any
                authenticated route.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Authentication</h2>
          <p>
            Authentication is handled by{' '}
            <span className="text-white font-medium">Better Auth 1.6.x</span>, a
            production-grade auth library with a strong security track record. Key security
            properties:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Session tokens are stored in HTTP-only, Secure, SameSite=Lax cookies — they
              are never accessible to JavaScript running in the browser.
            </li>
            <li>
              Session tokens are rotated on each authenticated request, limiting the window
              of exposure for any intercepted token.
            </li>
            <li>
              Passwords are hashed using bcrypt with a work factor of 12 before storage.
              Plaintext passwords are never logged or persisted.
            </li>
            <li>
              Google OAuth is supported as a second factor pathway. OAuth tokens are never
              stored server-side beyond the initial exchange.
            </li>
            <li>
              Admin-role endpoints are protected by a separate role check enforced at both
              the middleware layer and the database layer via Row Level Security policies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Database Security</h2>
          <p>
            Our PostgreSQL database enforces multi-tenancy at the data layer — not just at the
            application layer. This means a bug in application code cannot expose one
            customer&apos;s data to another.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              <span className="text-white font-medium">Row Level Security (RLS)</span> is
              enabled on every table that holds personal data. Both SELECT and INSERT policies
              are defined for each table.
            </li>
            <li>
              Policies are enforced using JWT claims. The authenticated user&apos;s{' '}
              <code className="text-neutral-400 bg-neutral-800 px-1 rounded text-xs">company_id</code>{' '}
              and{' '}
              <code className="text-neutral-400 bg-neutral-800 px-1 rounded text-xs">role</code>{' '}
              are injected into the JWT at login and validated at the database level on every
              query — not in application code.
            </li>
            <li>
              The service-role key (which bypasses RLS) is used only in background jobs
              running in isolated server environments. It is never exposed to client-side
              code or public API routes.
            </li>
            <li>
              Database connections use Supabase&apos;s Supavisor transaction-mode pooler,
              which prevents connection exhaustion under load and isolates session state.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Data Access Controls</h2>
          <p>
            We operate on a strict need-to-know basis for internal access to customer data:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              No Persona Platform employee accesses production customer data as part of
              normal operations. Database access requires a formal access request with
              justification, and all queries are logged.
            </li>
            <li>
              We do not sell, rent, or share personal data with third parties for marketing
              or advertising purposes — ever.
            </li>
            <li>
              Subprocessors (Supabase, Groq, Vercel, Resend, Inngest) are contractually
              bound by Data Processing Agreements. A full, current list is published at{' '}
              <a
                href="/subprocessors"
                className="text-white underline underline-offset-2 hover:text-neutral-300"
              >
                /subprocessors
              </a>
              .
            </li>
            <li>
              LLM inference (Groq) receives only the content of chat messages — it does not
              receive raw survey responses, names, email addresses, or other PII unless
              explicitly included in a message by the user.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Vulnerability Management</h2>
          <p>
            We welcome responsible disclosure from the security research community. If you
            discover a vulnerability in Persona Platform, please report it to{' '}
            <a
              href="mailto:security@personaplatform.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              security@personaplatform.com
            </a>{' '}
            before publishing or disclosing it publicly.
          </p>
          <p className="mt-3">
            We commit to: acknowledging your report within 2 business days; providing a status
            update within 10 business days; giving credit in our changelog if you wish; not
            pursuing legal action against good-faith researchers who follow this policy.
          </p>
          <p className="mt-3">
            In scope: the Persona Platform web application and API at personaproject-one.vercel.app.
            Out of scope: third-party subprocessor infrastructure, social engineering, physical
            access attacks, and denial-of-service.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">Incident Response</h2>
          <p>
            In the event of a confirmed personal data breach we follow a structured response
            process:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Containment and assessment within 4 hours of confirmed detection.
            </li>
            <li>
              Notification to the Irish Data Protection Commission within 72 hours as
              required by GDPR Art. 33, where the breach is likely to result in a risk to
              individuals&apos; rights and freedoms.
            </li>
            <li>
              Notification to affected customers within 48 hours of the breach being
              confirmed, including: nature of the breach, categories and approximate volume
              of data affected, likely consequences, and measures taken or proposed.
            </li>
            <li>
              A post-incident report is completed within 30 days covering root cause,
              timeline, and corrective actions.
            </li>
          </ul>
        </section>

        {/* Security questionnaire CTA */}
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6 mt-4">
          <h3 className="text-white text-base font-semibold mb-2">Security Questionnaire</h3>
          <p className="text-neutral-400 mb-4">
            Need to complete a vendor security review? We&apos;re happy to respond to
            questionnaires (CAIQ, SIG, custom) and provide additional documentation such
            as penetration test summaries and subprocessor DPAs.
          </p>
          <a
            href="mailto:security@personaplatform.com"
            className="inline-block px-4 py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-100 transition-colors"
          >
            Send questionnaire to security@personaplatform.com
          </a>
        </div>

      </div>
    </main>
  )
}
