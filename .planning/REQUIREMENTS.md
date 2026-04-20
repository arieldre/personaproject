# Requirements: Persona Platform

**Defined:** 2026-04-20
**Core Value:** A manager can understand any employee's work personality in minutes and practice difficult conversations with their persona — without uncomfortable real-life rehearsals.

---

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign in with Google OAuth (HTTP-only cookie session, no token in URL)
- [ ] **AUTH-02**: User can reset password via email link (currently missing entirely)
- [ ] **AUTH-03**: User session persists across browser refresh and tab close
- [ ] **AUTH-04**: User can sign out from any page, session fully invalidated
- [ ] **AUTH-05**: Unauthenticated users are redirected to /login; protected routes inaccessible

### Company & Multi-Tenant

- [ ] **COMP-01**: Super admin can create a new company with name, industry, employee count
- [ ] **COMP-02**: Company admin can view their company's subscription status and seat usage
- [ ] **COMP-03**: All data (users, personas, conversations, training) is isolated per company_id — no cross-tenant reads possible
- [ ] **COMP-04**: Company admin can update company name, industry, employee count

### User Management & Invitations

- [ ] **USER-01**: Company admin can invite users by email — single or bulk (CSV/paste list)
- [ ] **USER-02**: Invited user receives email with custom sender name + editable body + 7-day expiring link
- [ ] **USER-03**: Admin can view invitation status (pending / accepted / expired) and resend or revoke
- [ ] **USER-04**: Admin can activate / deactivate user accounts
- [ ] **USER-05**: Role-based access control (super_admin / company_admin / user) enforced on all routes, surfaced in UI with role badge

### Survey (VCPQ)

- [ ] **SURV-01**: Company admin can create a questionnaire instance with a shareable access code
- [ ] **SURV-02**: Employee can complete 28-question VCPQ survey via access code on mobile or desktop
- [ ] **SURV-03**: Survey supports anonymous mode (no name/email collected)
- [ ] **SURV-04**: Admin can view questionnaire completion rate and list of who has/hasn't responded
- [ ] **SURV-05**: Admin can send reminder emails to non-respondents from dashboard

### Vector Pipeline

- [ ] **VECT-01**: VCPQ answers are transformed into 14-dimension personality vector (Likert 1-5 → -1 to +1)
- [ ] **VECT-02**: Personality vectors are stored as pgvector `vector(14)` with HNSW index (not JSONB)
- [ ] **VECT-03**: Raw survey answers are preserved in JSONB for audit; computed vector stored separately

### Background Jobs

- [ ] **JOBS-01**: Long-running operations (clustering, persona generation, grading) execute via Inngest durable workflows with retry semantics
- [ ] **JOBS-02**: Job status (queued / running / complete / failed) is visible to admin in real-time via Supabase Realtime channel
- [ ] **JOBS-03**: Failed jobs surface actionable error messages to admin (not raw stack traces)

### Clustering & Persona Generation

- [ ] **CLUS-01**: Admin can trigger clustering on a questionnaire's collected responses
- [ ] **CLUS-02**: K-means++ clustering groups responses into representative persona centroids (optimal k calculated automatically)
- [ ] **CLUS-03**: Each cluster generates a named AI persona via Groq LLM with deterministic prompt compilation from vectors
- [ ] **CLUS-04**: Persona passes Self-Turing Test (Pearson correlation ≥ 0.8) before being marked active
- [ ] **CLUS-05**: Admin sees clustering progress live; personas appear as they're generated (not all at once)
- [ ] **CLUS-06**: LLM model used for generation is configurable via env var (not hardcoded) to handle Groq deprecations

### Personas

- [ ] **PERS-01**: Admin can view list of all company personas with name, tagline, cluster size, confidence score, status
- [ ] **PERS-02**: User can view persona detail page: personality vector visualization, strengths, growth areas, communication style
- [ ] **PERS-03**: Admin can update persona name, tagline, summary and activate/deactivate
- [ ] **PERS-04**: Admin can see persona coverage map (% of employee vectors each persona represents)

### Chat

- [ ] **CHAT-01**: Authenticated user can start a conversation with any active company persona
- [ ] **CHAT-02**: Persona responses stream in real-time via SSE (not polling, not WebSocket)
- [ ] **CHAT-03**: Full conversation history is preserved and paginated
- [ ] **CHAT-04**: User can delete their own conversations
- [ ] **CHAT-05**: User messages are sanitized against prompt injection before reaching LLM (delimiter wrapping + input filter for known attack patterns)
- [ ] **CHAT-06**: Per-user rate limit enforced: 20 messages/minute, 200/day (Upstash Redis or Supabase)
- [ ] **CHAT-07**: Hard token cap per conversation turn; history truncated to last N turns to prevent cost runaway

### Employee-to-Persona Matching (Hero Feature)

- [ ] **MATCH-01**: Manager can select any employee who has completed the VCPQ and see which company persona they most resemble
- [ ] **MATCH-02**: Match result shows: closest persona name, similarity score (0-100%), and trait delta visualization (employee vs persona on 14 dimensions)
- [ ] **MATCH-03**: Similarity calculated as `1 - cosine_distance` via pgvector RPC with `SECURITY DEFINER` + company_id isolation
- [ ] **MATCH-04**: Match result includes direct "Chat with this persona" link
- [ ] **MATCH-05**: Manager can run match for any employee in their company (not just direct reports)

### Training Scenarios

- [ ] **TRAIN-01**: User can browse and start training scenarios (5 archetypes × 3 difficulty levels = 15 scenarios)
- [ ] **TRAIN-02**: Training conversation is graded by multi-pass LLM rubric (Communication, Empathy, Problem Solving, Professionalism)
- [ ] **TRAIN-03**: Grading results are persisted to database (currently endpoint returns empty array — fix required)
- [ ] **TRAIN-04**: User can view their training history: all attempts, best scores, improvement over time
- [ ] **TRAIN-05**: Admin can view aggregate training completion stats across company

### Admin Dashboard & Audit

- [ ] **ADMN-01**: Company admin dashboard shows: active personas, survey completion %, training participation %, recent activity
- [ ] **ADMN-02**: Admin can view read-only audit log (all user, persona, questionnaire actions with timestamps)
- [ ] **ADMN-03**: All security-sensitive debug logging removed from production code (currently leaks bcrypt hashes)

### Security & Compliance

- [ ] **SECU-01**: RLS enabled on all tables; two-factory pattern enforced (user-scoped vs service-role clients never swapped)
- [ ] **SECU-02**: CSRF protection on all state-changing routes
- [ ] **SECU-03**: GDPR: user can request data export and account deletion (30-day soft-delete)
- [ ] **SECU-04**: Privacy policy and Terms of Service pages with EU AI Act disclosure
- [ ] **SECU-05**: Subprocessor list and DPA template available for procurement

### Demo & Sales

- [ ] **DEMO-01**: Pre-seeded "Acme Corp" demo tenant with realistic personas, employees, and training history — available for sales demos without real customer data
- [ ] **DEMO-02**: Landing page with request-demo CTA (Calendly or equivalent) and product overview

---

## v2 Requirements

### Billing

- **BILL-01**: Company admin can subscribe via Stripe Checkout (hosted, not embedded)
- **BILL-02**: Company admin can manage subscription via Stripe Billing Portal (upgrades, cancellation)
- **BILL-03**: Annual billing with discount option
- **BILL-04**: Invoice/ACH payment for ≥$499/mo tiers
- **BILL-05**: Plan enforcement (seat limits, feature gating by tier)

### Advanced Features

- **ADV-01**: Manager dashboard showing team member persona matches and training progress
- **ADV-02**: Custom LLM API key per company (BYO Groq/OpenAI key)
- **ADV-03**: Training conversation voice mode + transcript export
- **ADV-04**: Slack/email notifications for survey completion and training milestones

### Compliance

- **COMP2-01**: SOC 2 Type II certification process initiated (triggered at $10k ARR)
- **COMP2-02**: EU data residency option (Supabase EU region)
- **COMP2-03**: SAML/SSO placeholder for enterprise tier

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Microsoft OAuth | Dropped to simplify auth surface; Google covers 90% of HR buyers |
| Free tier / self-serve signup | Demo-only motion reduces ops burden for solo builder |
| Per-seat pricing | HR buyers hate per-seat math; flat fee chosen |
| Mobile app | HR admins use desktop; survey is mobile-responsive (sufficient) |
| Docker / self-hosting | Eliminated; Vercel + Supabase handles infra |
| HRIS integrations (Workday, BambooHR) | High complexity; email invite covers MVP |
| Video conferencing | Out of domain |
| 360-degree feedback | Separate product category |
| Gamification | Anti-feature for enterprise HR buyers |
| Custom VCPQ questions | Validated 28-question instrument is the IP; customization dilutes it |
| White-label / reseller | Future enterprise tier only |
| Non-English UI | v1 English only |
| Open-ended "ask the AI" mode | Prompt injection surface; structured scenarios sufficient |
| WebSockets | Vercel serverless incompatible; SSE achieves same UX |
| Supabase Edge Functions for clustering | 2s CPU hard cap — disqualified |

---

## Traceability

*(Populated by roadmap agent)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01–05 | Phase 1 | Pending |
| COMP-01–04 | Phase 1 | Pending |
| USER-01–05 | Phase 4 | Pending |
| SURV-01–05 | Phase 2 | Pending |
| VECT-01–03 | Phase 2 | Pending |
| JOBS-01–03 | Phase 3 | Pending |
| CLUS-01–06 | Phase 5 | Pending |
| PERS-01–04 | Phase 5 | Pending |
| CHAT-01–07 | Phase 6 | Pending |
| MATCH-01–05 | Phase 7 | Pending |
| TRAIN-01–05 | Phase 8 | Pending |
| ADMN-01–03 | Phase 1+4 | Pending |
| SECU-01–05 | Phase 1+9 | Pending |
| DEMO-01–02 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after initial definition*
