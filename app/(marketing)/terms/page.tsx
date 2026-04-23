import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Persona Platform',
  description: 'Terms governing your use of the Persona Platform service.',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Legal</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-neutral-400 text-sm mb-12">Last updated: 2026-04-23</p>

      <div className="space-y-10 text-neutral-300 text-sm leading-7">

        <section>
          <h2 className="text-white text-base font-semibold mb-3">1. Agreement</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of the Persona Platform
            service (&ldquo;Service&rdquo;), provided by Persona Platform Ltd., incorporated in Ireland
            (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing or using the Service, you agree to
            these Terms on behalf of your organisation (&ldquo;Customer&rdquo;). If you do not agree,
            do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">2. Service Description</h2>
          <p>
            Persona Platform is an AI-powered persona simulation tool designed for HR and
            Learning &amp; Development teams. Employees complete a personality assessment; the
            Service generates AI personas from those responses; managers interact with personas
            via chat to improve communication and develop coaching skills.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">3. Acceptable Use</h2>
          <p>You agree to use the Service only for its intended purpose. You must not:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Use the Service to process personal data for any purpose other than employee
              training and development.
            </li>
            <li>
              Attempt to reverse-engineer, scrape, or extract underlying model weights, prompt
              templates, or proprietary algorithms.
            </li>
            <li>
              Introduce malicious inputs designed to manipulate AI outputs (prompt injection).
            </li>
            <li>
              Share access credentials with individuals outside your organisation.
            </li>
            <li>
              Use the Service in any manner that violates applicable laws, including data
              protection laws.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">
            4. EU AI Act Disclosure — Prohibited Use for Employment Decisions
          </h2>

          {/* High-contrast warning block — critical compliance clause */}
          <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 p-5 mb-4">
            <p className="text-amber-300 font-semibold mb-2">
              Important: This tool is NOT permitted for use in hiring, promotion, or employment
              decisions.
            </p>
            <p className="text-neutral-300">
              Persona Platform is designed and licensed exclusively as a <strong className="text-white">
              training and development tool</strong>. In accordance with the EU AI Act (Regulation
              2024/1689) and its provisions on high-risk AI systems in employment contexts
              (Annex III, Point 4), the Service must not be used, directly or indirectly, to:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside marker:text-amber-700">
              <li>Screen, rank, or filter job applicants or candidates.</li>
              <li>Inform, support, or contribute to decisions about hiring or recruitment.</li>
              <li>Influence decisions about promotion, demotion, or termination of employees.</li>
              <li>
                Assess, score, or profile individuals in ways that affect their employment
                status or conditions.
              </li>
            </ul>
          </div>

          <p>
            Customers are solely responsible for ensuring their internal use of the Service
            complies with this restriction. The Company expressly disclaims all liability for
            any harm arising from use of the Service in prohibited employment decision contexts.
            Breach of this clause constitutes a material breach of these Terms and may result
            in immediate termination of access.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">5. Accounts and Access</h2>
          <p>
            Each subscription is granted to a single legal entity. You are responsible for
            maintaining the confidentiality of credentials and for all activity under your
            account. Notify us immediately at{' '}
            <a
              href="mailto:privacy@personaplatform.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              privacy@personaplatform.com
            </a>{' '}
            if you suspect unauthorised access.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">6. Subscription and Payment</h2>
          <p>
            Subscriptions are billed monthly or annually in advance. Fees are non-refundable
            except as required by Irish consumer law or where the Service experiences sustained
            unavailability (&gt;99.0% monthly uptime SLA breach). Pricing is set out in the order
            form or pricing page applicable at the time of subscription.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">7. Intellectual Property</h2>
          <p>
            The Company retains all rights in the Service, including underlying models, software,
            and platform infrastructure. Customers retain ownership of their input data (employee
            survey responses) and may request export at any time per the Privacy Policy.
          </p>
          <p className="mt-3">
            AI-generated persona outputs are provided as a service deliverable. The Company grants
            Customers a non-exclusive, non-transferable licence to use those outputs for internal
            training and development purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">8. AI Output Disclaimer</h2>
          <p>
            AI persona outputs are probabilistic and may be inaccurate, incomplete, or
            unrepresentative of any individual. They are generated for illustrative and training
            purposes only. The Company makes no warranty regarding the accuracy, reliability,
            or fitness for purpose of AI-generated content. Customers must apply human judgment
            before acting on any AI output.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              The Company&apos;s total aggregate liability to a Customer in any 12-month period is
              limited to the fees paid by that Customer in the same period.
            </li>
            <li>
              The Company is not liable for any indirect, incidental, special, consequential,
              or punitive damages, including loss of profits, data loss, or business interruption,
              regardless of the cause of action.
            </li>
            <li>
              Nothing in these Terms limits liability for death or personal injury caused by
              negligence, fraud, or any other liability that cannot be excluded under Irish law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">10. Termination</h2>
          <p>
            Either party may terminate the subscription at the end of the current billing period
            with written notice. The Company may suspend or terminate access immediately where a
            Customer materially breaches these Terms (including the prohibited-use clause in
            Section 4), fails to pay, or engages in conduct that poses a security or legal risk
            to the Service or other customers.
          </p>
          <p className="mt-3">
            Upon termination, the 30-day soft-delete data retention process described in the
            Privacy Policy applies.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">11. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of Ireland. Any dispute arising out of or in
            connection with these Terms shall be subject to the exclusive jurisdiction of the
            courts of Ireland, except where mandatory EU consumer protection laws provide
            otherwise.
          </p>
          <p className="mt-3">
            For disputes that cannot be resolved through good-faith negotiation, parties agree
            to attempt mediation before commencing litigation, using a mutually agreed mediator
            based in Ireland.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">12. Changes to Terms</h2>
          <p>
            We may update these Terms with 30 days&apos; notice for material changes. Notice will
            be given by email to the registered account holder. Continued use of the Service
            after the effective date constitutes acceptance of the revised Terms.
          </p>
        </section>

      </div>
    </main>
  )
}
