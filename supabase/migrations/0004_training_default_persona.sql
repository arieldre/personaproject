-- ─── Migration 0004: Training default personas + security + indexes ──────────
-- 1. Add company_id to training_sessions for tenant isolation
-- 2. Make persona_id nullable (default library personas have no DB row)
-- 3. Add default_persona_id for static default library persona tracking
-- 4. Add missing performance indexes

-- Make persona_id nullable to support default library personas
ALTER TABLE training_sessions ALTER COLUMN persona_id DROP NOT NULL;

-- Add company_id for tenant isolation in Inngest grading job
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- Add default_persona_id for static personas (e.g. 'default:hr-partner')
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS default_persona_id varchar(100);

-- Backfill company_id from existing user records for existing sessions
UPDATE training_sessions ts
SET company_id = u.company_id
FROM "user" u
WHERE u.id = ts.user_id
  AND ts.company_id IS NULL;

-- ─── Performance indexes ──────────────────────────────────────────────────────

-- questionnaires: get active questionnaires for a company
CREATE INDEX IF NOT EXISTS idx_questionnaires_company_status
  ON questionnaires(company_id, status);

-- questionnaire_responses: cluster job loads completed vectors
CREATE INDEX IF NOT EXISTS idx_responses_questionnaire_completed
  ON questionnaire_responses(questionnaire_id)
  WHERE personality_vector IS NOT NULL;

-- personas: list active personas for a company
CREATE INDEX IF NOT EXISTS idx_personas_company_status
  ON personas(company_id, status);

-- conversations: history by user + persona
CREATE INDEX IF NOT EXISTS idx_conversations_persona_user
  ON conversations(persona_id, user_id);

-- jobs: real-time polling by company + status
CREATE INDEX IF NOT EXISTS idx_jobs_company_status
  ON jobs(company_id, status, updated_at DESC);

-- training_sessions: company scoped queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_company
  ON training_sessions(company_id);

-- training_sessions: user history
CREATE INDEX IF NOT EXISTS idx_training_sessions_user
  ON training_sessions(user_id);
