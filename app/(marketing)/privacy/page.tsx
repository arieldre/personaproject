import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Persona Platform',
  description: 'How Persona Platform collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Legal</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-neutral-400 text-sm mb-12">Last updated: 2026-04-23</p>

      <div className="space-y-10 text-neutral-300 text-sm leading-7">

        <section>
          <h2 className="text-white text-base font-semibold mb-3">1. Who We Are</h2>
          <p>
            Persona Platform (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an AI-powered persona simulation
            SaaS product operated by Persona Platform Ltd., incorporated in Ireland. We are the
            data controller for personal data processed through this service.
          </p>
          <p className="mt-3">
            Contact for privacy matters:{' '}
            <a
              href="mailto:privacy@personaplatform.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              privacy@personaplatform.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              <span className="text-white font-medium">Account data:</span> Full name and email
              address provided at registration or via Google OAuth.
            </li>
            <li>
              <span className="text-white font-medium">Survey responses:</span> Answers to the
              28-question VCPQ personality assessment. These are used exclusively to generate
              AI persona vectors for your organisation.
            </li>
            <li>
              <span className="text-white font-medium">Personality vectors:</span> A 14-dimension
              numerical embedding derived from survey responses. This is a derived data point, not
              raw psychometric data.
            </li>
            <li>
              <span className="text-white font-medium">Usage data:</span> Chat session transcripts
              (between managers and AI personas), training scenario results, and feature
              interaction logs for service improvement.
            </li>
            <li>
              <span className="text-white font-medium">Technical data:</span> IP address, browser
              user-agent, and session tokens required for authentication and security.
            </li>
          </ul>
          <p className="mt-3">
            We do not collect special category data (health, biometric, political views, etc.)
            and have no intention to do so.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">3. Legal Basis for Processing</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white font-medium mb-1">Contract performance (Art. 6(1)(b) GDPR)</p>
              <p>
                Processing your name, email, and survey responses is necessary to deliver the
                contracted service — generating personas and enabling manager chat sessions.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white font-medium mb-1">Legitimate interests (Art. 6(1)(f) GDPR)</p>
              <p>
                We process usage data and technical logs to ensure platform security, prevent
                abuse, and improve service quality. We have assessed that these interests are not
                overridden by your fundamental rights.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white font-medium mb-1">Legal obligation (Art. 6(1)(c) GDPR)</p>
              <p>
                Certain data may be retained where required by applicable Irish or EU law
                (e.g., tax records, security incident logs).
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">4. Data Retention</h2>
          <ul className="space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Active account data is retained for the duration of the subscription plus 90 days.
            </li>
            <li>
              When an account is deleted, a <span className="text-white font-medium">30-day
              soft-delete</span> period applies. Data is marked for deletion but not immediately
              purged, allowing recovery in case of accidental deletion. After 30 days, all
              personal data (name, email, survey responses, personality vectors, chat transcripts)
              is permanently erased.
            </li>
            <li>
              Anonymised aggregate statistics (e.g., total response counts) may be retained
              indefinitely as they cannot identify individuals.
            </li>
            <li>
              Security and audit logs are retained for 12 months.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">5. Data Sharing and Subprocessors</h2>
          <p>
            We do not sell personal data. We share data only with subprocessors necessary to
            operate the service. A full list of subprocessors — including their purpose, location,
            and what data they receive — is published at{' '}
            <a
              href="/subprocessors"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              /subprocessors
            </a>
            .
          </p>
          <p className="mt-3">
            All subprocessors are contractually bound by Data Processing Agreements (DPAs)
            that comply with GDPR Chapter V requirements for international transfers where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">6. International Transfers</h2>
          <p>
            Our primary infrastructure operates within the European Economic Area (EEA). Where
            subprocessors are located outside the EEA (e.g., LLM inference providers), transfers
            are governed by Standard Contractual Clauses (SCCs) approved by the European Commission
            under Art. 46(2)(c) GDPR.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">7. Your Rights</h2>
          <p>Under GDPR, you have the following rights:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              <span className="text-white font-medium">Right of access (Art. 15):</span> Request a
              copy of all personal data we hold about you.
            </li>
            <li>
              <span className="text-white font-medium">Right to erasure (Art. 17):</span> Request
              deletion of your personal data. Account deletion triggers the 30-day soft-delete
              process described above.
            </li>
            <li>
              <span className="text-white font-medium">Right to portability (Art. 20):</span>{' '}
              Receive your survey responses and personality vector in a machine-readable format
              (JSON). Contact us at the email below.
            </li>
            <li>
              <span className="text-white font-medium">Right to rectification (Art. 16):</span>{' '}
              Correct inaccurate personal data held about you.
            </li>
            <li>
              <span className="text-white font-medium">Right to object (Art. 21):</span> Object to
              processing based on legitimate interests. We will assess and respond within 30 days.
            </li>
            <li>
              <span className="text-white font-medium">Right to restriction (Art. 18):</span>{' '}
              Request that we restrict processing of your data in certain circumstances.
            </li>
          </ul>
          <p className="mt-4">
            To exercise any right, email{' '}
            <a
              href="mailto:privacy@personaplatform.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              privacy@personaplatform.com
            </a>
            . We will respond within 30 days. If you are not satisfied with our response, you
            have the right to lodge a complaint with the Irish Data Protection Commission (DPC)
            at{' '}
            <a
              href="https://www.dataprotection.ie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              dataprotection.ie
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">8. Security</h2>
          <p>
            We implement industry-standard security measures including encryption at rest and
            in transit (TLS 1.2+), row-level security on all database tables, role-based access
            controls, and regular access audits. Authentication is handled via Better Auth with
            session token rotation.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">9. Automated Decision-Making</h2>
          <p>
            Personality vector generation from survey responses is an automated process. However,
            this output is intended solely as a training and development tool for HR teams — it
            does not constitute an automated decision with legal or similarly significant effects
            as defined under Art. 22 GDPR. See our Terms of Service for the full acceptable use
            restriction.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this policy as the platform evolves. Material changes will be notified
            by email and the &ldquo;Last updated&rdquo; date at the top of this page will be revised.
            Continued use of the service after the effective date constitutes acceptance.
          </p>
        </section>

      </div>
    </main>
  )
}
