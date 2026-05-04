import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Processing Agreement — Persona Platform',
  description: 'GDPR-compliant Data Processing Agreement for Persona Platform customers.',
}

const subprocessors = [
  {
    name: 'Supabase Inc.',
    service: 'PostgreSQL database hosting',
    location: 'EU (AWS eu-west-1 — Ireland)',
    transfer: 'No transfer outside EEA',
    data: 'All personal data: names, emails, survey responses, personality vectors, chat transcripts, audit logs',
  },
  {
    name: 'Groq Inc.',
    service: 'LLM inference (AI persona chat)',
    location: 'United States',
    transfer: 'SCCs (Art. 46(2)(c) GDPR)',
    data: 'Chat message content only. Does not receive raw survey responses or PII unless included in a message.',
  },
  {
    name: 'Vercel Inc.',
    service: 'Application hosting and serverless compute',
    location: 'United States (primary EU region)',
    transfer: 'SCCs (Art. 46(2)(c) GDPR)',
    data: 'HTTP request logs (IP address, user-agent, path). No persistent personal data stored.',
  },
  {
    name: 'Resend Inc.',
    service: 'Transactional email delivery',
    location: 'United States',
    transfer: 'SCCs (Art. 46(2)(c) GDPR)',
    data: 'Email address and content of transactional emails (account verification, password reset).',
  },
]

export default function DpaPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Legal</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Data Processing Agreement</h1>
      <p className="text-neutral-400 text-sm mb-12">Version 1.0 · Effective: 2026-05-04</p>

      <div className="space-y-10 text-neutral-300 text-sm leading-7">

        <p>
          This Data Processing Agreement (&ldquo;DPA&rdquo;) is entered into between Persona Platform Ltd.,
          incorporated in Ireland (&ldquo;Processor&rdquo; / &ldquo;Provider&rdquo;), and the Customer identified in
          the applicable Order Form or subscription (&ldquo;Controller&rdquo; / &ldquo;Customer&rdquo;). This DPA
          forms part of the Master Service Agreement (&ldquo;MSA&rdquo;) between the parties and governs
          all processing of personal data by Provider on Customer&apos;s behalf. In the event of
          conflict between this DPA and the MSA, this DPA prevails with respect to data
          protection matters.
        </p>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">1. Definitions</h2>
          <ul className="space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              <span className="text-white font-medium">&ldquo;GDPR&rdquo;</span> means Regulation (EU)
              2016/679 of the European Parliament and of the Council (General Data Protection
              Regulation), as supplemented by applicable national implementing law.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Personal Data&rdquo;</span> has the meaning
              given in Article 4(1) GDPR and means any information relating to an identified
              or identifiable natural person processed by Provider on Customer&apos;s behalf in
              connection with the Service.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Processing&rdquo;</span> has the meaning
              given in Article 4(2) GDPR.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Data Subject&rdquo;</span> means any
              individual whose Personal Data is processed under this DPA — primarily Customer&apos;s
              employees and managers who use the Service.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Sub-processor&rdquo;</span> means any
              third party engaged by Provider to process Personal Data in connection with the
              Service.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;SCCs&rdquo;</span> means the Standard
              Contractual Clauses adopted by the European Commission under Commission
              Implementing Decision 2021/914/EU for transfers of Personal Data to third
              countries.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">2. Controller / Processor Relationship</h2>
          <p>
            The parties acknowledge and agree that, for the purposes of this DPA and GDPR:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Customer is the <span className="text-white font-medium">data controller</span>{' '}
              — it determines the purposes and means of processing Personal Data relating to
              its employees in connection with the Service.
            </li>
            <li>
              Provider is the <span className="text-white font-medium">data processor</span>{' '}
              — it processes Personal Data only on documented instructions from Customer and
              only to the extent necessary to deliver the Service.
            </li>
          </ul>
          <p className="mt-3">
            Provider will not process Personal Data for any purpose other than as set out in
            this DPA or as required by applicable EU or Member State law. Where processing is
            required by law, Provider will inform Customer prior to such processing unless
            prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">3. Purpose and Scope of Processing</h2>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 space-y-4">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Subject Matter</p>
              <p>
                Provision of an AI-powered persona simulation platform for HR and Learning &amp;
                Development purposes, including survey collection, AI persona generation, employee-persona
                matching, and manager training chat sessions.
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Purpose</p>
              <p>
                Manager and employee training and development — specifically, generating AI personas
                from personality survey data so that managers can practise difficult conversations.
                No other purpose is permitted. Personal Data must not be used for hiring, promotion,
                performance assessment, or any employment decision.
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Categories of Personal Data</p>
              <p>
                Names, email addresses, 28-question VCPQ survey responses, 14-dimension personality
                vectors derived from those responses, AI persona chat transcripts, and technical
                session data (IP address, user-agent, session identifiers).
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Categories of Data Subjects</p>
              <p>
                Customer&apos;s employees (survey respondents), managers (platform users), and
                administrators.
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Duration</p>
              <p>
                For the term of the MSA and applicable Order Form, plus 30 days post-termination
                (data export window), after which Personal Data is permanently deleted.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">4. Processor Obligations</h2>
          <p>Provider undertakes to:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Process Personal Data only on documented instructions from Customer, including
              with regard to transfers of Personal Data to third countries.
            </li>
            <li>
              Ensure that persons authorised to process the Personal Data are bound by
              appropriate confidentiality obligations.
            </li>
            <li>
              Implement and maintain appropriate technical and organisational security measures
              in accordance with GDPR Article 32, as described in the Security Overview at{' '}
              <a
                href="/security"
                className="text-white underline underline-offset-2 hover:text-neutral-300"
              >
                /security
              </a>
              .
            </li>
            <li>
              Respect the conditions for engaging Sub-processors set out in Section 6 of this
              DPA.
            </li>
            <li>
              Assist Customer in fulfilling its obligations to respond to requests for exercising
              Data Subjects&apos; rights under GDPR Chapter III.
            </li>
            <li>
              Assist Customer in ensuring compliance with GDPR Articles 32–36 (security,
              breach notification, DPIAs, prior consultation), taking into account the nature
              of processing and the information available to Provider.
            </li>
            <li>
              Delete or return all Personal Data to Customer at the end of the service
              relationship, and delete existing copies unless EU or Member State law requires
              storage.
            </li>
            <li>
              Make available to Customer all information necessary to demonstrate compliance
              with this DPA, and allow and contribute to audits as described in Section 9.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">5. Data Subject Rights</h2>
          <p>
            Provider will promptly notify Customer of any Data Subject request received directly
            by Provider (including requests for access, erasure, portability, rectification, or
            objection). Provider will not respond to such requests directly unless instructed by
            Customer or required by applicable law.
          </p>
          <p className="mt-3">
            Provider will provide Customer with reasonable technical assistance to respond to
            Data Subject requests, including: exporting a Data Subject&apos;s survey responses and
            personality vector in machine-readable format; deleting a Data Subject&apos;s records on
            Customer&apos;s instruction; and providing a record of processing activities relevant to
            the Data Subject&apos;s request.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">6. Sub-processors</h2>
          <p>
            Customer provides general authorisation for Provider to engage the Sub-processors
            listed below. Provider will inform Customer of any intended changes (additions or
            replacements) to this list with at least{' '}
            <span className="text-white font-medium">30 days&apos; notice</span>, giving Customer the
            opportunity to object. If Customer objects on reasonable data protection grounds,
            the parties will work in good faith to resolve the concern. If no resolution is
            reached within 30 days, Customer may terminate the applicable Order Form without
            penalty.
          </p>
          <p className="mt-3 mb-5">
            All Sub-processors are bound by written Data Processing Agreements that impose data
            protection obligations at least equivalent to those in this DPA. For Sub-processors
            located outside the EEA, transfers are governed by Standard Contractual Clauses.
          </p>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="pb-3 pr-4 text-neutral-400 font-medium w-36">Sub-processor</th>
                  <th className="pb-3 pr-4 text-neutral-400 font-medium">Service</th>
                  <th className="pb-3 pr-4 text-neutral-400 font-medium w-44">Location</th>
                  <th className="pb-3 pr-4 text-neutral-400 font-medium w-44">Transfer Mechanism</th>
                  <th className="pb-3 text-neutral-400 font-medium">Data Received</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {subprocessors.map((sp, i) => (
                  <tr
                    key={sp.name}
                    className={`border-b ${i < subprocessors.length - 1 ? 'border-neutral-800' : 'border-transparent'}`}
                  >
                    <td className="py-4 pr-4 text-white font-medium align-top text-xs">{sp.name}</td>
                    <td className="py-4 pr-4 align-top leading-6 text-xs">{sp.service}</td>
                    <td className="py-4 pr-4 align-top leading-6 text-xs">{sp.location}</td>
                    <td className="py-4 pr-4 align-top leading-6 text-xs">{sp.transfer}</td>
                    <td className="py-4 align-top leading-6 text-xs">{sp.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {subprocessors.map((sp) => (
              <div key={sp.name} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-2 text-xs">
                <p className="text-white font-semibold">{sp.name}</p>
                <p className="text-neutral-400">{sp.service} · {sp.location}</p>
                <p className="text-neutral-500">Transfer: {sp.transfer}</p>
                <p className="text-neutral-300 leading-5">{sp.data}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">7. International Transfers</h2>
          <p>
            Provider will not transfer Personal Data to a country outside the EEA unless: (a)
            the European Commission has issued an adequacy decision for that country; (b) the
            transfer is governed by SCCs entered into between Provider and the relevant
            Sub-processor; or (c) another lawful transfer mechanism under GDPR Chapter V applies.
            All current third-country Sub-processors are covered by SCCs as noted in the table
            in Section 6.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">8. Security and Breach Notification</h2>
          <p>
            Provider will implement appropriate technical and organisational measures to protect
            Personal Data against accidental or unlawful destruction, loss, alteration,
            unauthorised disclosure, or access. These measures include AES-256 encryption at
            rest, TLS 1.3 in transit, Row Level Security on all database tables, HTTP-only
            session cookies with token rotation, and access restricted on a need-to-know basis.
          </p>
          <p className="mt-3">
            In the event of a personal data breach, Provider will:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Notify Customer without undue delay and, where feasible, within{' '}
              <span className="text-white font-medium">48 hours</span> of becoming aware of
              the breach.
            </li>
            <li>
              Provide Customer with sufficient information to enable Customer to notify the
              relevant supervisory authority within the 72-hour window required by GDPR
              Article 33.
            </li>
            <li>
              Include in the notification: (a) nature of the breach; (b) categories and
              approximate number of Data Subjects and records affected; (c) likely consequences;
              (d) measures taken or proposed.
            </li>
            <li>
              Cooperate with Customer in the breach investigation and any required notifications
              to Data Subjects.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">9. Audit Rights</h2>
          <p>
            Customer may, at its own expense and with at least 30 days&apos; written notice, conduct
            or commission an audit of Provider&apos;s data processing activities relevant to this DPA.
            Audits are limited to once per calendar year unless a confirmed data breach has
            occurred. Provider may object to any auditor that is a competitor of Provider.
          </p>
          <p className="mt-3">
            Provider will respond to reasonable written questionnaires within 30 days and will
            make available relevant documentation, including security policies, penetration test
            summaries (redacted where necessary), and subprocessor DPAs. Provider may charge
            for audit assistance that requires more than 8 hours of staff time.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">10. Return and Deletion of Data</h2>
          <p>
            Upon termination or expiry of the MSA: (a) Customer may request an export of
            Customer Data in JSON format within 30 days of termination; (b) after the 30-day
            window, Provider will permanently delete all Personal Data, including copies held
            by Sub-processors, within a further 30 days, except where retention is required
            by applicable law; and (c) upon Customer&apos;s written request, Provider will issue a
            written certification of deletion within 15 business days.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">11. Governing Law</h2>
          <p>
            This DPA is governed by the laws of Ireland and subject to the exclusive jurisdiction
            of the courts of Ireland. Where GDPR mandates a specific supervisory authority, the
            Irish Data Protection Commission is the lead supervisory authority for Provider as
            an Ireland-incorporated entity.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">12. Contact</h2>
          <p>
            For all data protection matters, contact Provider&apos;s privacy team at{' '}
            <a
              href="mailto:privacy@personaplatform.com"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              privacy@personaplatform.com
            </a>
            .
          </p>
        </section>

      </div>
    </main>
  )
}
