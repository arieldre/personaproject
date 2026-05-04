import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Master Service Agreement — Persona Platform',
  description: 'Master Service Agreement governing enterprise subscriptions to Persona Platform.',
}

export default function MsaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Legal</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Master Service Agreement</h1>
      <p className="text-neutral-400 text-sm mb-12">Version 1.0 · Effective: 2026-05-04</p>

      <div className="space-y-10 text-neutral-300 text-sm leading-7">

        <p>
          This Master Service Agreement (&ldquo;MSA&rdquo; or &ldquo;Agreement&rdquo;) is entered into between
          Persona Platform Ltd., a company incorporated in Ireland with registered number [CRO
          number] and having its registered office at [address], Ireland (&ldquo;Provider&rdquo;), and the
          entity identified in the applicable Order Form (&ldquo;Customer&rdquo;). This Agreement governs
          Customer&apos;s access to and use of the Persona Platform service. In the event of conflict,
          the Order Form prevails over this MSA.
        </p>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">1. Definitions</h2>
          <ul className="space-y-3 list-disc list-inside marker:text-neutral-600">
            <li>
              <span className="text-white font-medium">&ldquo;Service&rdquo;</span> means the Persona
              Platform software-as-a-service product, including all features, updates, and
              documentation made available to Customer under an Order Form.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Order Form&rdquo;</span> means a written or
              electronic document executed by both parties that specifies the subscription plan,
              fees, term, and any special terms applicable to Customer.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Customer Data&rdquo;</span> means all data
              — including employee survey responses, personality vectors, and chat transcripts —
              submitted to or generated through the Service by or on behalf of Customer.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Authorised Users&rdquo;</span> means
              Customer&apos;s employees, contractors, and agents who are permitted by Customer to
              access the Service under Customer&apos;s account.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Documentation&rdquo;</span> means all
              technical and functional documentation made available by Provider describing the
              operation and use of the Service.
            </li>
            <li>
              <span className="text-white font-medium">&ldquo;Confidential Information&rdquo;</span> means
              any information disclosed by one party to the other that is designated as
              confidential or that reasonably should be understood to be confidential given the
              nature of the information and circumstances of disclosure.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">2. Service Description and SLA</h2>
          <p>
            Provider will make the Service available to Customer pursuant to this Agreement and
            the applicable Order Form. Provider will use commercially reasonable efforts to make
            the Service available with a monthly uptime percentage of at least{' '}
            <span className="text-white font-medium">99.0%</span>, measured as:
          </p>
          <div className="my-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 font-mono text-xs text-neutral-400">
            Uptime % = ((Total Minutes &minus; Downtime Minutes) / Total Minutes) &times; 100
          </div>
          <p>
            &ldquo;Downtime&rdquo; means the Service is completely unavailable to Authorised Users due to
            Provider&apos;s systems, excluding: (a) scheduled maintenance with at least 24 hours&apos;
            notice; (b) Customer-caused outages; (c) force majeure events; (d) third-party
            infrastructure failures outside Provider&apos;s reasonable control.
          </p>
          <p className="mt-3">
            If monthly uptime falls below 99.0%, Customer&apos;s sole remedy is a service credit
            equal to 10% of the monthly fee for each full percentage point below 99.0%, up to a
            maximum of 30% of that month&apos;s fees. Credits are applied to the next invoice.
            Credits are not available where Customer is in breach of payment obligations.
          </p>
          <p className="mt-3">
            Provider may modify the Service from time to time, including adding, changing, or
            removing features. Provider will provide at least 30 days&apos; written notice of any
            change that materially reduces the core functionality available to Customer.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">3. Customer Obligations</h2>
          <p>Customer is responsible for:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              Ensuring all Authorised Users comply with this Agreement and the Acceptable Use
              Policy set out in the Service&apos;s Terms of Service.
            </li>
            <li>
              Obtaining all necessary consents from employees before collecting survey responses
              and generating AI personas from those responses.
            </li>
            <li>
              Not using the Service for any purpose prohibited under Section 4 of the Terms of
              Service, including hiring or employment decisions.
            </li>
            <li>
              Maintaining the confidentiality of account credentials and promptly notifying
              Provider of any unauthorised access.
            </li>
            <li>
              Providing accurate billing information and paying all fees when due.
            </li>
            <li>
              Ensuring Customer&apos;s use of the Service complies with all applicable laws,
              including the EU AI Act, GDPR, and any applicable employment law in Customer&apos;s
              jurisdiction.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">4. Fees and Payment</h2>
          <p>
            Customer will pay the fees set out in the Order Form in advance for each billing
            period (monthly or annual). All fees are exclusive of VAT and other applicable taxes,
            which Customer is responsible for. Invoices are due within 30 days of issue.
          </p>
          <p className="mt-3">
            Overdue amounts bear interest at the rate of 2% per month (or the maximum rate
            permitted by applicable law, whichever is lower). Provider may suspend access to
            the Service if payment is more than 15 days overdue, after providing 7 days&apos; written
            notice. Except as expressly stated in this Agreement, all fees are non-refundable.
          </p>
          <p className="mt-3">
            Provider may increase fees by giving at least 60 days&apos; written notice prior to the
            start of the next renewal term. If Customer does not accept the new fees, Customer
            may terminate at the end of the current term by providing written notice before the
            end of the then-current term.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">5. Intellectual Property</h2>
          <p>
            <span className="text-white font-medium">Provider IP.</span> Provider retains all
            right, title, and interest in and to the Service, including all underlying software,
            models, algorithms, interfaces, documentation, and improvements thereto.
            This Agreement does not transfer any ownership interest in the Service to Customer.
            Provider grants Customer a limited, non-exclusive, non-transferable, non-sublicensable
            licence to access and use the Service solely for Customer&apos;s internal business purposes
            during the term of the applicable Order Form.
          </p>
          <p className="mt-3">
            <span className="text-white font-medium">Customer Data.</span> Customer retains all
            right, title, and interest in and to Customer Data. Customer grants Provider a
            limited, worldwide licence to process Customer Data solely to the extent necessary
            to provide and improve the Service. Provider will not use Customer Data to train
            machine learning models without Customer&apos;s express written consent.
          </p>
          <p className="mt-3">
            <span className="text-white font-medium">Feedback.</span> If Customer provides
            suggestions or feedback regarding the Service, Provider may use such feedback without
            restriction and without obligation to Customer.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">6. Confidentiality</h2>
          <p>
            Each party agrees to: (a) hold the other party&apos;s Confidential Information in strict
            confidence using at least the same degree of care it uses for its own confidential
            information (but not less than reasonable care); (b) not disclose Confidential
            Information to third parties without the disclosing party&apos;s prior written consent,
            except to employees or contractors who need to know and are bound by equivalent
            confidentiality obligations; and (c) use Confidential Information only for purposes
            of this Agreement.
          </p>
          <p className="mt-3">
            These obligations survive termination of this Agreement for a period of{' '}
            <span className="text-white font-medium">two (2) years</span> from the date of
            termination or expiry. Exceptions apply where information: (i) is or becomes publicly
            known without breach; (ii) was rightfully known before disclosure; (iii) is
            independently developed without use of Confidential Information; or (iv) is required
            to be disclosed by applicable law, provided the receiving party gives prompt written
            notice where permitted.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">7. Data Protection</h2>
          <p>
            To the extent Provider processes personal data on Customer&apos;s behalf, the parties
            will execute Provider&apos;s standard Data Processing Agreement (&ldquo;DPA&rdquo;), which is
            available at{' '}
            <a
              href="/dpa"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              /dpa
            </a>{' '}
            and is incorporated into this Agreement by reference. The DPA governs all processing
            of personal data in connection with the Service.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">8. Warranties and Disclaimer</h2>
          <p>
            Provider warrants that: (a) it has the right to enter into this Agreement; (b) the
            Service will perform materially in accordance with the Documentation; and (c) it will
            implement commercially reasonable security measures as described in its Security
            Overview.
          </p>
          <p className="mt-3">
            EXCEPT AS EXPRESSLY SET OUT IN THIS SECTION, THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo;.
            PROVIDER DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            PROVIDER DOES NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, UNINTERRUPTED, OR
            THAT AI-GENERATED OUTPUTS WILL BE ACCURATE OR FIT FOR ANY PARTICULAR PURPOSE.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">9. Limitation of Liability</h2>
          <p>
            <span className="text-white font-medium">Cap.</span> To the maximum extent permitted
            by applicable law, Provider&apos;s total aggregate liability to Customer arising out of
            or in connection with this Agreement — whether in contract, tort (including
            negligence), or otherwise — is limited to the total fees paid by Customer in the
            twelve (12) months immediately preceding the event giving rise to the claim.
          </p>
          <p className="mt-3">
            <span className="text-white font-medium">Exclusions.</span> In no event will either
            party be liable for any indirect, incidental, special, consequential, or punitive
            damages, including but not limited to loss of revenue, loss of profits, loss of
            data, loss of goodwill, or business interruption, even if advised of the possibility
            of such damages.
          </p>
          <p className="mt-3">
            <span className="text-white font-medium">Exceptions.</span> Nothing in this Agreement
            limits liability for: (a) death or personal injury caused by negligence; (b) fraud
            or fraudulent misrepresentation; (c) a party&apos;s wilful misconduct; or (d) any
            liability that cannot be excluded or limited under applicable Irish or EU law.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">10. Indemnification</h2>
          <p>
            <span className="text-white font-medium">By Provider.</span> Provider will defend,
            indemnify, and hold harmless Customer from and against third-party claims alleging
            that the Service, as provided and used in accordance with this Agreement, infringes
            a third party&apos;s intellectual property rights. Provider&apos;s obligation does not apply
            to claims arising from: (a) Customer&apos;s modification of the Service; (b) use of the
            Service in combination with third-party products; or (c) Customer&apos;s continued use
            after Provider notifies Customer of a required modification to avoid infringement.
          </p>
          <p className="mt-3">
            <span className="text-white font-medium">By Customer.</span> Customer will defend,
            indemnify, and hold harmless Provider from and against third-party claims arising from:
            (a) Customer&apos;s use of the Service in breach of this Agreement; (b) Customer Data,
            including any failure to obtain required consents; or (c) Customer&apos;s violation of
            applicable law.
          </p>
          <p className="mt-3">
            Each party&apos;s indemnification obligations are conditioned on the indemnified party: (i)
            giving prompt written notice of the claim; (ii) granting the indemnifying party sole
            control of the defence; and (iii) providing reasonable cooperation at the indemnifying
            party&apos;s expense.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">11. Term and Termination</h2>
          <p>
            This Agreement commences on the date of the first Order Form and continues until
            terminated. Each Order Form has the subscription term specified therein, renewing
            automatically for successive equal periods unless either party provides written
            notice of non-renewal at least{' '}
            <span className="text-white font-medium">30 days</span> before the end of the
            then-current term.
          </p>
          <p className="mt-3">
            Either party may terminate this Agreement or any Order Form immediately by written
            notice if the other party: (a) materially breaches this Agreement and fails to cure
            such breach within 30 days of receiving written notice; (b) becomes insolvent,
            makes a general assignment for the benefit of creditors, or is subject to
            insolvency proceedings; or (c) in the case of Customer, uses the Service in a
            prohibited manner as defined in Section 3 of the Terms of Service.
          </p>
          <p className="mt-3">
            Upon termination: (a) all licences granted hereunder immediately terminate; (b)
            Customer must cease use of the Service; (c) Provider will make Customer Data
            available for export for 30 days post-termination, after which it will be
            permanently deleted in accordance with the Privacy Policy and DPA; and (d) all
            accrued payment obligations survive termination.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">12. Governing Law and Dispute Resolution</h2>
          <p>
            This Agreement is governed by and construed in accordance with the laws of Ireland,
            without regard to conflict of laws principles. The parties submit to the exclusive
            jurisdiction of the courts of Ireland for resolution of any dispute arising under or
            in connection with this Agreement, except where mandatory EU consumer protection law
            provides otherwise.
          </p>
          <p className="mt-3">
            Before commencing litigation, the parties agree to attempt to resolve any dispute
            through good-faith negotiation for a period of 30 days after written notice of the
            dispute. If negotiation fails, the parties agree to attempt mediation with a
            mutually agreed, independent mediator based in Ireland before filing any court
            proceeding.
          </p>
        </section>

        <section>
          <h2 className="text-white text-base font-semibold mb-3">13. General</h2>
          <ul className="space-y-2 list-disc list-inside marker:text-neutral-600">
            <li>
              <span className="text-white font-medium">Entire Agreement.</span> This Agreement,
              together with all Order Forms and the DPA, constitutes the entire agreement between
              the parties with respect to its subject matter and supersedes all prior agreements,
              representations, and understandings.
            </li>
            <li>
              <span className="text-white font-medium">Amendments.</span> No amendment to this
              Agreement is effective unless made in writing and signed by authorised
              representatives of both parties.
            </li>
            <li>
              <span className="text-white font-medium">Assignment.</span> Neither party may assign
              this Agreement without the other&apos;s prior written consent, except that Provider may
              assign this Agreement in connection with a merger, acquisition, or sale of all or
              substantially all of its assets, without consent.
            </li>
            <li>
              <span className="text-white font-medium">Severability.</span> If any provision of
              this Agreement is held invalid or unenforceable, the remaining provisions will
              continue in full force.
            </li>
            <li>
              <span className="text-white font-medium">Waiver.</span> Failure to enforce any
              provision of this Agreement does not constitute a waiver of the right to enforce
              it subsequently.
            </li>
            <li>
              <span className="text-white font-medium">Notices.</span> Legal notices must be in
              writing and sent to the addresses on the applicable Order Form or to{' '}
              <a
                href="mailto:legal@personaplatform.com"
                className="text-white underline underline-offset-2 hover:text-neutral-300"
              >
                legal@personaplatform.com
              </a>
              .
            </li>
            <li>
              <span className="text-white font-medium">Force Majeure.</span> Neither party is
              liable for delays caused by circumstances beyond its reasonable control, including
              natural disasters, acts of government, or widespread internet disruption, provided
              the affected party gives prompt notice and uses reasonable efforts to mitigate.
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
