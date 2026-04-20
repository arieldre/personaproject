# Feature Landscape — Persona Platform (HR/L&D SaaS)

**Domain:** AI-powered persona simulation SaaS for HR + L&D teams
**Target:** 50–2000 employee companies, demo-led sales, flat fee $199–$999/mo
**Researched:** 2026-04-20
**Confidence:** MEDIUM-HIGH (current ecosystem well-documented; AI-L&D category is newer, recommendations are evidence-driven but opinionated)

---

## Executive Summary

HR/L&D buyers evaluate tools on three axes, in this priority order: **(1) security/compliance posture**, **(2) admin ergonomics** (how painful is it to roll this out to 200 people), and **(3) outcome visibility** (can I prove to my CHRO this was worth the budget).

For a $199–$999/mo flat-fee product, buyers will NOT tolerate per-seat math, hand-holding onboarding, or "we'll have SSO by Q3." They WILL tolerate "Google SSO only" and "SAML on the Enterprise tier" if it's stated up front.

The hero feature (employee-to-persona matching) is strong because no competitor (DISC, 16Personalities, CliftonStrengths, PI, TeamDynamics) does it. Table-stakes features below exist primarily to **avoid losing deals**, not to win them. Demo discipline is where deals are actually won.

---

## Table Stakes (must have — customers churn or refuse to buy without these)

These are the "we'd love to buy but..." blockers. Missing any = dead deal.

### T1. Google SSO (minimum) + provision for SAML on Enterprise
- **Why expected:** 70%+ of enterprise RFPs ask about SSO by name. Already-scoped (Better Auth + Google OAuth) — just make sure the UI for company admin clearly states "SSO supported via Google Workspace." Add a placeholder "SAML available on Enterprise tier" to cut off the objection.
- **Complexity:** Low (already in roadmap)
- **Source confidence:** HIGH

### T2. Bulk employee invite (CSV upload + copy-paste list)
- **Why expected:** No HR admin is adding 200 people one at a time. Minimum viable: paste list of emails → system sends invites with 7-day expiry (already built) → admin sees pending/accepted status in a table.
- **Complexity:** Low–Medium
- **Must include:** Column mapping for name/email/department/manager, validation before send, ability to re-send expired invites, undo/remove pending invites.
- **Source confidence:** HIGH

### T3. Company admin dashboard with completion visibility
- **Why expected:** The #1 question an HR admin asks is "who hasn't done the survey yet?" Response-rate visibility is the top-tracked L&D metric in 2026 surveys. Must show: total employees invited, % completed VCPQ, % completed at least one training scenario, last-activity timestamp.
- **Complexity:** Medium
- **Must include:** Filter by department/manager, export to CSV, "nudge" button that re-sends a reminder email to incompletes.
- **Source confidence:** HIGH

### T4. Role-based access control (already built — surface it clearly)
- **Why expected:** Multi-tenant isolation + super_admin/company_admin/user roles already exist. Table stakes = the UX makes it obvious who can see what. Add a visible "You are viewing as: Company Admin" badge; add a permissions matrix in docs.
- **Complexity:** Low (already built, needs UX surfacing)
- **Source confidence:** HIGH

### T5. Audit log visible to company admins
- **Why expected:** Already exists in DB. Enterprise buyers ask "can we see who accessed what?" — the answer must be yes, and it must have a UI (not just a table in the DB). Minimum: "Who invited whom, who took the survey when, who viewed persona match results."
- **Complexity:** Low (exists in DB, need read-only UI)
- **Source confidence:** HIGH

### T6. GDPR-minimum data controls
- **Why expected:** 4% of global revenue fine ceiling. Any company with a single EU employee is in scope. Must have: (a) data export per user, (b) account deletion that actually deletes survey responses + conversation logs, (c) a privacy policy that names subprocessors (Groq, Vercel, Supabase), (d) DPA (Data Processing Agreement) available on request.
- **Complexity:** Low–Medium (the hard part is the DPA template, not the engineering)
- **Must include:** Cookie consent banner (EU only is fine), "Export my data" button in user profile, "Delete my account" button that triggers a 30-day soft-delete.
- **Source confidence:** HIGH

### T7. Password reset / magic-link recovery
- **Why expected:** Currently missing entirely (flagged in PROJECT.md). Any product without this is DOA in enterprise demos. With Google-only OAuth this is partially solved (Google handles password reset), but you still need an "I can't log in" fallback — most likely a magic-link email flow for edge cases (company changed SSO providers, etc.).
- **Complexity:** Low
- **Source confidence:** HIGH

### T8. Email invitations with custom sender name
- **Why expected:** The invite email is the FIRST thing every employee sees. If it says "no-reply@personaplatform.io" with generic copy, response rates tank. Must: use the company's name in the From field, allow the admin to edit the invite copy, allow a custom intro paragraph ("Hi team — CEO asked us to roll this out...").
- **Complexity:** Low
- **Source confidence:** MEDIUM (inferred from general survey best practices + HR admin behavior patterns)

### T9. Mobile-responsive survey-taker UX
- **Why expected:** Employees take surveys on phones. Admin UI can be desktop-first (the ICP is HR at a laptop), but the VCPQ questionnaire MUST work on iOS/Android browsers. Not a native app — just a responsive web page.
- **Complexity:** Low (already a constraint for Next.js app)
- **Source confidence:** HIGH

### T10. Data residency statement (even if it's just US)
- **Why expected:** Procurement asks "where is our data stored?" The answer must be a single sentence: "All data is stored in [AWS us-east-1 / Supabase US region]. EU data residency available on Enterprise tier." Not having an answer loses deals. Having a clear answer (even one that's not what they want) usually does not.
- **Complexity:** Zero (it's a documentation artifact, not a feature)
- **Source confidence:** HIGH

---

## Differentiators (wins deals — these are reasons buyers say yes)

These are where competitive advantage lives. Pick 2–3 to invest deeply in; do the rest lightly.

### D1. Employee-to-persona matching (HERO — already identified)
- **Value:** No competitor does this. DISC/16Personalities give an employee a label; Persona Platform gives a *manager* an actionable tool: "here's who this person resembles, here's what to expect, here's how to practice a hard conversation with them." This is the demo's climax.
- **Complexity:** Medium (algorithm exists in spirit — cosine similarity between VCPQ vector and persona centroids; UI is where the craft lives)
- **Demo impact:** Massive. The "pick an employee → see the persona card with similarity score and trait comparison" moment is the screenshot that ends up in the CHRO's pitch deck.
- **Source confidence:** HIGH

### D2. Practice-a-conversation (role-play with AI persona)
- **Value:** Already built (training scenarios + multi-pass grading). This is differentiated vs. every personality tool on the market. DISC tells you someone is a "D" — Persona Platform lets the manager rehearse giving hard feedback to a D-type without embarrassing themselves in real life.
- **Complexity:** Already built; polish the UX (voice? streaming? transcript export?)
- **Demo impact:** High, but second to D1. D1 is the "aha" moment; D2 is the "and then..." moment.
- **Source confidence:** HIGH

### D3. "Self-Turing Test" validation score (already built)
- **Value:** Every competitor in AI-HR is under a shadow of "is this AI actually accurate?" You have a Pearson correlation ≥ 0.8 validation built in. Surface this number in the admin dashboard. Let the HR admin say to their CHRO: "we validated this scientifically."
- **Complexity:** Low (surface existing metric in UI + one-paragraph explainer)
- **Demo impact:** Medium. Kills the "is this real or just vibes" objection.
- **Source confidence:** HIGH

### D4. Custom LLM API key (already in roadmap)
- **Value:** Enterprise buyers with an existing Anthropic or OpenAI contract will insist on using it — for data privacy, billing, and model-quality reasons. Allowing "bring your own API key" per company is a differentiator vs. locked-in tools.
- **Complexity:** Medium (key storage, per-company routing, billing edge cases)
- **Demo impact:** Low at demo time; high at procurement. Procurement asks "can we use our own OpenAI key?" — yes wins, no loses.
- **Source confidence:** MEDIUM

### D5. Persona coverage map
- **Value:** A visual showing "your company has 4 personas. Persona A covers 40% of employees. Persona D covers only 3 employees — outliers." HR leaders love this because it tells a story. Combine with hiring diversity narrative.
- **Complexity:** Low (already have the clusters; need a viz)
- **Demo impact:** High. Demos with a "map of your company" land better than demos with rows of data.
- **Source confidence:** MEDIUM

### D6. Manager-specific dashboard ("your direct reports")
- **Value:** A manager logs in, sees only their direct reports, sees each one's matched persona, one-click to start a practice conversation. Turns the product from "HR tool" into "a thing managers actually use weekly."
- **Complexity:** Medium (requires a manager-report org structure in the data model)
- **Demo impact:** High. Moves the story from "HR buys this" to "managers love this" — the retention argument.
- **Source confidence:** MEDIUM

---

## Anti-Features (deliberate exclusions — do NOT build)

Every anti-feature below was considered and rejected. Documenting the reasoning so future-you doesn't re-litigate.

### A1. Free self-serve tier / trial signup
- **Why avoid:** Already decided in PROJECT.md. Reinforcing: self-serve signups at sub-$500 ACV generate support load (password resets, "how do I invite my team", billing questions) that a solo builder cannot sustain. Demo-led sales is the right call for this motion.
- **Do instead:** "Request a demo" CTA → Calendly → 15-min demo → annual invoice.

### A2. Per-seat pricing
- **Why avoid:** HR buyers hate per-seat math. Flat fee by employee-count bucket ($199/$499/$999) is faster to sell, faster to invoice, and removes "what if we hire 5 people next month" objections.
- **Do instead:** Flat fee by bucket. When a company crosses a bucket threshold, tell them at renewal, not mid-cycle.

### A3. Full-blown HRIS integrations (Workday, BambooHR, UKG)
- **Why avoid:** Every HRIS integration is a 4–8 week project per vendor. Workday certification alone is 6 months. Solo builder cannot do this. Even if you could, it's a distraction from the hero.
- **Do instead:** CSV import + (later) a single Zapier/Make webhook. "We don't integrate with your HRIS yet, but here's a 5-minute CSV flow."

### A4. Video conferencing inside the product
- **Why avoid:** Some competitors have tried to build "practice conversations with video of an AI face." This is a UX/technical rabbit hole (WebRTC, avatar generation, lip sync). Text chat is 95% of the learning value at 5% of the complexity.
- **Do instead:** Text chat with optional voice input (browser speech recognition, free) later. Avatar generation stays out of scope permanently.

### A5. 360-degree feedback / peer review modules
- **Why avoid:** Massive scope creep into performance management territory. Competes with CultureAmp/Lattice. Out of scope and out of lane.
- **Do instead:** Stay in the "understand your team + practice hard conversations" lane.

### A6. Gamification (badges, leaderboards, points)
- **Why avoid:** HR admins ask for it; employees hate it; CHROs roll their eyes. Gamification in L&D has been repeatedly debunked as a driver of actual behavior change (vs. short-term engagement metrics vanity).
- **Do instead:** Show completion progress as a simple progress bar. Let the value of the content drive engagement.

### A7. AI persona generates novel advice / "ask the AI anything"
- **Why avoid:** Your LLM is Groq/Llama. Letting managers ask arbitrary questions ("how do I fire this person?") is a liability nightmare — hallucinations become HR advice become lawsuits. The AI must stay scoped to persona roleplay.
- **Do instead:** Hard-code the AI's role: "you are [persona], respond in character." No open-ended "give me HR advice" mode. Document this constraint publicly.

### A8. Mobile app (iOS/Android)
- **Why avoid:** Already decided in PROJECT.md. HR buyers are on laptops. Employees take the survey on mobile web, which is fine. Native apps = App Store review purgatory + push notification infra + double the surface area.
- **Do instead:** Responsive web.

### A9. White-label / reseller program
- **Why avoid:** Solo builder. White-labeling is a support nightmare. Comes up only at Enterprise tier and should be "contact us" — not a product feature.

### A10. In-product live chat / support widget
- **Why avoid:** Solo builder cannot staff a live chat SLA. Intercom is $99/mo and creates an expectation you can't meet.
- **Do instead:** Email support, help docs, a public Loom walkthrough. Set expectations: "Support is Mon–Fri, 24-hour response."

### A11. Advanced branching / conditional survey logic beyond VCPQ
- **Why avoid:** The VCPQ is the validated instrument. Letting companies customize the 28 questions destroys the science. Custom surveys = different product = out of scope.
- **Do instead:** Lock the VCPQ. Allow companies to add one optional open-text "anything else?" field post-survey if they want. That's the ceiling.

### A12. Multi-language UI beyond English (pre-v1)
- **Why avoid:** Each language adds a translation maintenance burden. For 50–2000 employee companies in ICP, English is fine for admin; VCPQ instrument may need translation later but that's a research project (validity must be re-established per language).
- **Do instead:** Ship English only. Flag "localization available for Enterprise on request."

---

## Demo Requirements (what a winning 15-min demo looks like)

Demo conversion from HR SaaS sits at 20–30% close rate for competent teams, 60–80% demo-to-opportunity for strong operators. Below is the opinionated structure for THIS product based on demo best practices + hero-feature positioning.

### Pre-demo (before the call)
- **Discovery call ran:** 15–30 min prior. Know their company size, pain point, and current solution (nothing? DISC? 16Personalities? exit interviews?).
- **Demo tenant pre-seeded:** You MUST have a fake "Acme Corp" demo tenant with 50+ synthetic employees, 4 pre-generated personas, and a realistic "match this employee to a persona" flow. No company will sit through you clustering live.
- **Demo link pre-loaded in browser:** Never share-screen while logging in. Never.

### The 15-minute demo (tight structure)

**Minutes 0–2 — Restate their problem back to them**
Not a company overview. Not your origin story. One sentence: "You said you have 200 employees, 25 managers, most of whom have never had manager training, and you want to help them understand their teams better without sending everyone to a $3k offsite. Correct?" Let them confirm or correct. Now you're aligned.

**Minutes 2–5 — Walk the admin's path**
Log in as company admin → show the employee list (50 synthetic people) → show who completed the VCPQ, who hasn't → click "remind incompletes." This is the HR ops ergonomics sell. Fast, no dwelling.

**Minutes 5–9 — Walk the manager's path (THE DEMO CLIMAX)**
Switch to manager login → show direct reports → click on "Sarah" → **persona match card appears: "Sarah matches Persona 3 — The Methodical Collaborator, 87% similarity."** Show the trait comparison. This is the moment. Land it. Let silence sit for 3 seconds after the reveal.

**Minutes 9–13 — The practice conversation**
Click "Practice giving Sarah feedback on a missed deadline." AI persona responds in character. Run 2–3 turns. Show the grading screen at the end: "You scored 7/10. Here's what went well. Here's what to try differently."

**Minutes 13–14 — The "why this is defensible" beat**
Point out: "We validate every persona with a statistical Self-Turing Test — Pearson correlation ≥ 0.8 against the actual employees it represents. This isn't vibes; it's validated." (Differentiator D3 earns its keep.)

**Minute 14–15 — The close**
Not "what do you think?" Instead: "For a 200-person company, this is the $499 tier. I can have your instance set up by Friday. What's your CHRO going to ask that would block that?" Hear the real objection. Handle it. Don't demo more features — END HERE.

### What to NOT show in the demo
- Settings pages
- Billing page
- "Look at all these configuration options"
- Every persona archetype (pick one, go deep)
- Technical architecture diagrams
- The 28 VCPQ questions (show 2–3, skip the rest)

### Demo tooling recommendation
- Live demo for qualified leads only (time is the constraint)
- Storylane or Arcade interactive demo on the landing page for top-of-funnel (catch the 73% of buyers who self-educate before talking to sales)
- Record the live demo (Gong/Grain/Loom) — best coaching asset

**Source confidence:** MEDIUM-HIGH (structure is opinionated but backed by SaaS demo best-practice research; specific beats tuned to this product)

---

## Compliance Minimum (what procurement will ask about)

Ranked by "likelihood they ask at the $499/mo tier." At Enterprise tier, assume they ask for everything.

### C1. SOC 2 Type II (roadmap item — 70% of enterprise RFPs require it)
- **When needed:** Not on day 1. By the time you cross $10k ARR with a single customer, or when you first hear "please fill out this 40-page security questionnaire," start the process.
- **How to start:** Vanta ($12k/yr) or Drata ($15k/yr). Auditor ($8–15k). Total ~$25–30k, 6 months.
- **Interim:** "SOC 2 in progress, report expected [date]" is acceptable for sub-$2k-MRR deals. "We don't do compliance" is not.
- **Source confidence:** HIGH

### C2. GDPR Data Processing Agreement (DPA)
- **When needed:** First EU customer. Draft now (template available from most legal counsel for ~$1500). Name subprocessors: Supabase, Vercel, Groq, Better Auth (if self-hosted), Stripe.
- **Complexity:** Legal doc only; no engineering.
- **Source confidence:** HIGH

### C3. Privacy policy + terms of service (public on marketing site)
- **When needed:** Before landing page goes live. Use Termly or iubenda (~$99/yr) — don't write from scratch.
- **Source confidence:** HIGH

### C4. AI-specific disclosures (EU AI Act — in force now)
- **When needed:** If the product influences employment decisions, it may fall under "high-risk AI" classification. Persona matching that's used for hiring = high risk. Persona matching that's used for manager training = likely not.
- **What to do:** Add to Terms: "This product is not intended for use in hiring, promotion, or termination decisions. It is a training and development tool." This one sentence dramatically reduces regulatory exposure.
- **Source confidence:** MEDIUM (legal advice recommended before launch in EU)

### C5. Data export + account deletion (GDPR Art. 15 + Art. 17)
- **When needed:** Before any EU customer. Build as part of T6 (table stakes).
- **Source confidence:** HIGH

### C6. Encryption at rest + in transit
- **When needed:** Day 1. Supabase (Postgres) does at-rest by default. Vercel TLS does in-transit. Document both in a one-page "security overview" PDF.
- **Source confidence:** HIGH

### C7. Subprocessor list (public page)
- **When needed:** First procurement questionnaire. Just a markdown page: "We use Supabase (database), Vercel (hosting), Groq (LLM inference), Stripe (payments), Better Auth (auth). Each has their own SOC 2 / GDPR posture linked here."
- **Source confidence:** HIGH

### Intentionally deferred (say "roadmap" not "no")
- **SAML/SSO beyond Google:** Enterprise tier only. Use WorkOS when needed (~$125/mo per enterprise customer, handles SAML complexity).
- **HIPAA:** Out of scope unless targeting healthcare specifically. Say "not currently HIPAA-compliant; contact us for enterprise roadmap."
- **ISO 27001:** After SOC 2. Overlaps ~70%.
- **FedRAMP:** Never, unless selling to US government (out of ICP).

---

## Billing UX (minimum viable for $200–$1000/mo B2B)

For a solo-builder demo-led sales motion at this ACV band, the billing UX should be as BORING as possible. Every creative billing feature costs you hours of support later.

### B1. Stripe Checkout (hosted) — NOT Stripe Elements
- **Why:** Hosted checkout handles PCI compliance, card updates, 3DS, tax calculation, and 99% of edge cases for free. Stripe Elements (embedded) saves 2 seconds of UX at the cost of weeks of engineering and PCI scope.
- **Complexity:** Low (copy-paste integration)
- **Source confidence:** HIGH

### B2. Stripe Billing for subscriptions (0.7% fee — worth it)
- **Why:** Handles proration, dunning, failed-payment retries, invoice numbering, tax — things you will get wrong if you build yourself. 0.7% on $499 = $3.50/mo per customer. Cheap insurance.
- **Source confidence:** HIGH

### B3. Invoice (ACH) as a first-class option — not just card
- **Why:** Companies paying $499/mo from a card on file is fine. $999/mo often wants to pay by invoice + ACH (NET 30, sometimes NET 60). Stripe Invoicing supports this. ACH is 0.8% capped at $5 vs. 2.9% + $0.30 on card — on $999, that's $8 vs. $29/mo.
- **Must include:** "Pay by invoice" option at checkout for ≥$499 tier. Auto-generate a PDF invoice with company address for procurement.
- **Source confidence:** HIGH

### B4. Annual billing discount (2 months free = 16.7% off)
- **Why:** Locks in cash flow, reduces churn, HR budgets are annual anyway. Offer "$499/mo or $4,990/yr" — the math is visible, the customer feels smart.
- **Complexity:** Low (Stripe coupon codes or price_id for annual)
- **Source confidence:** HIGH

### B5. Self-serve plan changes (upgrade only; downgrade = email us)
- **Why:** Upgrades are painless automation. Downgrades surface churn signals that need a human conversation. Let upgrades auto-process; require a support email for downgrades (and use it as a save opportunity).
- **Complexity:** Low
- **Source confidence:** MEDIUM

### B6. Receipts + invoices sent to a configurable billing email
- **Why:** The person who bought it (HR director) is NOT the person who needs the invoice (AP clerk). Let companies set a "billing email" separate from the admin email.
- **Complexity:** Low (one form field + Stripe customer metadata)
- **Source confidence:** HIGH

### B7. Tax — use Stripe Tax ($120/yr or 0.5%)
- **Why:** Do not build sales tax logic. It's a compliance minefield. Stripe Tax handles US sales tax + EU VAT. Worth every penny.
- **Source confidence:** HIGH

### Intentionally NOT in scope for billing
- **Usage-based billing:** Flat fee pricing already decided. Don't build metering.
- **Quote-to-cash automation:** Manual for Enterprise tier. Send a quote PDF, they send a PO, you send an invoice. Fine at this volume.
- **Multi-currency:** USD only. EU customers pay in USD. Revisit at $1M ARR.
- **In-app billing portal (heavy):** Use Stripe Billing Portal (free, hosted) — "Manage Billing" button deep-links to Stripe. Don't build your own.
- **Coupons/promo code system:** One annual discount code is fine. Don't build a promo engine.

### Billing UX flow (minimum viable)
1. **Demo closes** → sales sends Stripe Checkout link (not a form — a Checkout link) matched to their tier/annual choice.
2. **They pay** → Stripe webhook creates a company + sends welcome email with admin signup link.
3. **Company admin signs up** → Google OAuth → lands on "invite your team" page (T2).
4. **Ongoing** → "Manage Billing" button in company admin settings → Stripe Billing Portal handles card updates, invoices, cancellation.

This entire flow is ~2 days of engineering with Stripe's standard integrations. Don't over-engineer it.

**Source confidence:** HIGH

---

## Feature Dependencies (build order implications)

```
Auth (Better Auth + Google OAuth) [in progress]
    ↓
Company admin dashboard + RBAC surfacing [T3, T4]
    ↓
Bulk invite [T2] ← Email invitations with custom sender [T8]
    ↓
Response-rate visibility [T3 analytics slice]
    ↓
Hero: Employee-to-persona matching [D1] ← Existing clustering + similarity
    ↓
Practice conversation UX polish [D2]
    ↓
Billing (Stripe Checkout + Billing Portal) [B1–B7]
    ↓
Landing page + demo request flow
    ↓
First paid customer
    ↓
[Trigger] SOC 2 process start [C1]
    ↓
Enterprise tier features (SAML, data residency, custom LLM key) [D4]
```

**Critical path insight:** The hero feature (D1) is NOT the first thing to build. You first need admin ergonomics (T2, T3) so a real customer can onboard their team and take the VCPQ — otherwise you have no employee vectors to match against personas during a demo.

However, a **pre-seeded demo tenant** short-circuits this for sales demos specifically. Build the demo tenant in parallel with admin features.

---

## MVP Recommendation (prioritized build order)

**Phase 1 — Foundations (cannot demo without these)**
1. T1 Google SSO (in progress)
2. T7 Password reset / magic link fallback
3. T4 RBAC surfacing (already exists in DB)
4. Fix: OAuth tokens in URL → cookies (security debt from PROJECT.md)
5. Fix: Debug logging stripping (security debt)

**Phase 2 — Admin ergonomics (cannot onboard customers without these)**
6. T2 Bulk invite
7. T8 Email invitations with custom sender/copy
8. T3 Company admin dashboard (completion visibility)
9. T5 Audit log UI

**Phase 3 — Hero moment (this is why anyone buys)**
10. D1 Employee-to-persona matching (hero feature)
11. D5 Persona coverage map (visual companion to D1)
12. D3 Self-Turing Test validation score surfaced

**Phase 4 — Sales enablement**
13. Pre-seeded demo tenant (Acme Corp fixture)
14. Landing page with "Request demo" CTA
15. T10 Data residency statement + subprocessor list (markdown page)
16. C2 GDPR DPA template
17. C3 Privacy policy + ToS

**Phase 5 — Billing + first paid customer**
18. B1 Stripe Checkout
19. B2 Stripe Billing subscriptions
20. B3 Invoice/ACH option
21. B5 Plan upgrade flow
22. B6 Billing email config

**Phase 6 — Post-first-customer**
23. D6 Manager-specific dashboard
24. D2 Practice conversation UX polish (voice, transcript export)
25. D4 Custom LLM API key (when first enterprise asks)
26. C1 SOC 2 Type II process start

**Defer indefinitely:** A1–A12 anti-features. If a customer asks for one of them, the answer is "not on our roadmap" — and that's a feature, not a bug.

---

## Sources

- [10 SaaS HR Software Essentials for 2026 (Ringover)](https://www.ringover.com/blog/saas-hr-software) — admin features, SSO expectations
- [SAML SSO in B2B SaaS: the complete guide (Scalekit)](https://www.scalekit.com/blog/saml-sso-in-b2b-saas-the-complete-guide-for-developers-and-enterprise-buyers) — enterprise SSO patterns, WorkOS reference
- [10 Essential Admin Panel Features (DronaHQ)](https://www.dronahq.com/admin-panel-features/) — admin dashboard table stakes
- [OneSchema for HR Tech](https://www.oneschema.co/use-cases/hr-tech) — bulk import patterns
- [SOC 2 Compliance Checklist for SaaS (SecureLeap)](https://www.secureleap.tech/blog/soc-2-compliance-checklist-saas) — 70% of enterprise RFPs require SOC 2 Type II
- [SaaS Compliance Checklist 2026 (SaaSCity)](https://saascity.io/blog/saas-compliance-checklist-2026-soc2-gdpr-ai-act) — GDPR + EU AI Act implications
- [SaaS Privacy Compliance 2025 Guide (SecurePrivacy)](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide) — DPA requirements, subprocessor lists
- [SOC 2, GDPR, HIPAA SaaS Checklist (CloudEagle)](https://www.cloudeagle.ai/blogs/soc2-gdpr-hipaa-saas-checklist) — compliance framework overlaps
- [Slack 101: Onboarding (Slack)](https://slack.com/blog/collaboration/slack-101-onboarding) — survey-in-flow patterns (referenced; not recommending Slack integration yet)
- [42 Essential Onboarding Survey Questions (Formbricks)](https://formbricks.com/blog/onboarding-survey-questions) — response-rate patterns, cadence
- [14 L&D Metrics That Matter (TalentLMS)](https://www.talentlms.com/blog/learning-and-development-metrics/) — completion rate targets (80–90%), hours benchmarks
- [People Analytics Metrics 2026 (Workhuman)](https://www.workhuman.com/blog/people-analytics-metrics/) — engagement + strategic HR KPIs
- [HR Dashboard Examples (AIHR)](https://www.aihr.com/blog/hr-dashboard/) — admin dashboard patterns
- [SaaS Product Demo Guide 2026 (Howdygo)](https://www.howdygo.com/blog/saas-product-demo) — 15-min demo best practice
- [B2B SaaS Conversion Benchmarks 2026 (Growthspree)](https://www.growthspreeofficial.com/blogs/b2b-saas-conversion-rate-benchmarks-2026-funnel-stage-vertical) — HR Tech 3–6% visitor-to-lead, demo-to-opp 60–80%
- [SaaS Demo Best Practices (Arcade)](https://www.arcade.software/post/saas-demo-best-practices) — interactive demo patterns
- [Free Trial vs Demo vs Freemium Decision Framework (Supademo)](https://supademo.com/blog/free-trial-vs-demo) — demo-led vs self-serve trade-offs; Workday as reference for live-demo-only enterprise HR
- [Stripe Invoicing Fees for B2B SaaS 2026 (FeeTrace)](https://feetrace.com/blog/stripe-invoicing-fees-for-b2b-saas-in-2026) — real cost math for $499 invoices
- [Stripe Billing Pricing (Stripe)](https://stripe.com/billing/pricing) — 0.7% recurring fee, invoice $2 cap
- [Stripe ACH Direct Debit docs (Stripe)](https://docs.stripe.com/invoicing/ach-direct-debit) — ACH for invoice payment
- [HR Software Buying Mistakes to Avoid (TechTarget)](https://www.techtarget.com/searchhrsoftware/tip/13-HR-software-buying-mistakes-to-avoid) — feature-quantity-over-quality anti-pattern
- [Evaluating HR Software: Biggest Mistakes (Outsail)](https://www.outsail.co/post/evaluating-hr-software-biggest-mistakes-to-avoid) — buyer-side perspective on bloat
- [Personality Test Guide for HR 2026 (MBTIQuiz)](https://www.mbtiquiz.com/blog/personality-test-guide-for-hr-best-assessment-tools-in-2026) — competitive landscape (DISC, 16P, CliftonStrengths, PI, TeamDynamics)
- [13 Top Personality Tests for HR Teams (AssessCandidates)](https://www.assesscandidates.com/types-of-personality-tests-for-employment/) — competitor feature-set comparison
- [Privacy Computing for AI+SaaS (Phala)](https://phala.com/posts/privacy-computing-ai-saas-whitepaper-enterprise-implementation) — enterprise LLM data-privacy posture
