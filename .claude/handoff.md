# Handoff — Persona Platform
Updated: 2026-04-25

## Completed This Session
### Phase 11: Consult Agents
- Each persona (default + company) now has "Consult" mode alongside "Train"
- `/consult/[personaId]` page — free expert chat, no grading, violet UI
- Training page: "Consult →" button on each default persona card
- Personas page: "Chat →" and "Consult →" buttons side by side
- Chat route: `?mode=consult` loads consultSystemPrompt, skips scenario injection
- Company personas: auto-derived consult prompt from tagline + systemPrompt (no migration)

### Persona Enrichment
- All 6 default personas enriched with age, family, personal quirks, speech patterns
- `PERSONA_GROUNDING_HEADER`: injected into all training systemPrompts — enforces organic details, no breaking character
- `persistentReminder`: appended to system prompt when conversation ≥4 turns (anti-drift, replaces fragile fake user/assistant injection)
- Removed 6 legacy scenarios (conflict-resolution, performance-feedback) — superseded by default library

### Critical Bug Fixes
- **Stream parsing fix**: training-session.tsx was filtering for `0:` prefix (dataStream) but route returns plain text → empty responses in training chat. Fixed to read raw bytes.

### Security Fixes (from independent review agent)
- **P1**: export route missing `try/catch` on requireAuth (500 instead of 401) — fixed
- **P1**: export route spreading full user row including internal fields — now allowlists id/name/email/createdAt
- **P1**: chat route sanitizing only last message, not history — now strips XML from all turns
- **P1**: rate-limit failing open on DB error (→ unbounded LLM spend) — now fails closed
- **P1**: match POST responseId lookup missing company join — fixed
- **P1**: export trainingSessions missing companyId filter — fixed
- **P2**: persistentReminder via fake user/assistant exchange → moved to system prompt append
- **P2**: grade route messages not validated — now filtered (role, length 10k, max 100 msgs)
- **P2**: rate-limit SQL interval used string concat → replaced with `make_interval(secs =>)`
- **P2**: DB-backed rate limiter (migration 0005) — replaces in-memory map that resets on cold start

### E2E Verification (all green)
- Training chat: stream fix confirmed, responses non-empty, Jordan Hayes responds naturally
- Consult: violet badge visible, expert HR advice returned for PIP vs written warning question
- Personas page: Chat + Consult buttons confirmed on all company persona cards
- Cross-tenant isolation API probes: spec written

## Last Commits (in order)
- `12432682` — test: E2E verification — training chat + consult feature confirmed working
- `7b615431` — fix: security review P1s + P2s
- `27677151` — fix: P1/P2 security — tenant isolation + DB rate limiter
- `d6d19e02` — feat: persona anti-drift — persistentReminder
- `d98d2838` — feat: Phase 11 — consult agents + enriched personas
Branch: `phase/1-foundation` (pushed ✅)

## Deploy Status
**LIVE** → https://personaproject-one.vercel.app
Latest: `personaproject-no0pd05nk-arararar34-gmailcoms-projects.vercel.app` (promoted ✅)
GitHub auto-deploy: NOT connected — vercel.com/…/settings/git (one-click)

## Demo / Test Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@acme-demo.com | AcmeDemo123! | company_admin |

**Note:** Only the admin account has a password. Employee accounts (alice@, dave@, grace@, carol@, emma@, bob@, frank@ @acme-demo.com) are survey respondents only — no login. Re-seed: `npm run seed` in `C:/Users/ArielD/personaproject`.

## Architecture — Key Patterns

### Consult vs Train mode
- URL: `/training/[scenarioId]` = train, `/consult/[personaId]` = consult
- API: `/api/chat/[personaId]?mode=consult` switches system prompt
- Default personas: hardcoded `consultSystemPrompt` + `consultTagline` per persona
- Company personas: derived from `persona.tagline` + `persona.systemPrompt`

### Anti-drift architecture
- `PERSONA_GROUNDING_HEADER` in `lib/training/default-personas.ts` — prepended to every training prompt at export time
- `persistentReminder` appended to `systemPrompt` when `conversationHistory.length >= 4`
- Personal details (age, family) in base system prompt — marked organic-only, not intro

### Stream pattern
Route: `result.toTextStreamResponse()` → plain bytes  
Client (training-session.tsx + consult-session.tsx): `decoder.decode(value, { stream: true })` — raw bytes  
**Never** filter for `0:` prefix — that's `toDataStreamResponse()` format only

## Remaining Gaps — Security (P2 only, P1s all fixed)
- Cross-tenant E2E test: spec written, `test.fixme()` for full two-company test
- Rate limiter: fails closed but has no in-process fallback for DB-down warmth
- JWT claims: not validated against DB on every request (P2, unchanged)

## Remaining Gaps — Features
- **INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY**: set on Vercel dashboard → grading + clustering fire in production (grading shows "failed" locally without Inngest running)
- Google OAuth: GOOGLE_CLIENT_ID/SECRET not set (email/pw works ✅)
- Billing/Stripe: Phase 12, not started
- RAG for consult: needs embedding API key (OpenAI/Voyage/Cohere) — Groq doesn't support embeddings
- GitHub auto-deploy: one-click at vercel.com/…/settings/git

## Next Actions (priority order)
1. **Set INNGEST keys on Vercel** → grading fires in production (manual dashboard action)
2. **GitHub auto-deploy** → vercel.com/…/settings/git (manual)
3. **Phase 12: Billing/Stripe** — requires Stripe keys from user
4. **RAG for consult** — requires embedding API key from user

## Phase Status
1 Foundation ✅ · 2 Survey ✅ · 3 Inngest ✅ · 4 Admin ✅ · 5 Clustering ✅
6 Chat ✅ · 7 Hero Match ✅ · 8 Training ✅ · 9 Sales Enablement ✅ · 10 Training Library ✅ · 11 Consult Agents ✅
