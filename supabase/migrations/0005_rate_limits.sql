-- Rate limits table for chat API — replaces in-memory map (which resets on cold start)
-- Single row per user: tracks count + window_start for a 60-second sliding window.
-- Upsert atomically checks and increments to be safe across concurrent requests.

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id TEXT NOT NULL PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1
);

-- TTL cleanup: remove stale rows older than 5 minutes (well past any window)
-- Run manually or via a periodic job; rows accumulate slowly (one per active user).
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);
