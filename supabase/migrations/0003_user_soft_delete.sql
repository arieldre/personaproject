-- GDPR soft-delete: nullable deleted_at column on user table.
-- Rows with deleted_at IS NOT NULL are soft-deleted; purged after 30 days by a scheduled job.
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- Index lets the purge job find expired soft-deleted rows efficiently.
CREATE INDEX IF NOT EXISTS idx_user_deleted_at ON "user" (deleted_at)
  WHERE deleted_at IS NOT NULL;
