-- Migration: 007_training_history.sql
-- Create training sessions table for progress tracking

CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    scenario_id VARCHAR(100) NOT NULL,
    messages JSONB NOT NULL,
    grade_result JSONB,
    overall_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- For efficient progress queries
    CONSTRAINT training_sessions_score_check CHECK (overall_score >= 0 AND overall_score <= 100)
);

-- Indexes for performance
CREATE INDEX idx_training_sessions_user_scenario ON training_sessions(user_id, scenario_id);
CREATE INDEX idx_training_sessions_user_created ON training_sessions(user_id, created_at DESC);
CREATE INDEX idx_training_sessions_persona ON training_sessions(persona_id);

COMMENT ON TABLE training_sessions IS 'Tracks training session attempts for progress monitoring';
COMMENT ON COLUMN training_sessions.scenario_id IS 'Identifier for the training scenario (e.g., hunter-easy)';
COMMENT ON COLUMN training_sessions.messages IS 'Full conversation history as JSON';
COMMENT ON COLUMN training_sessions.grade_result IS 'Complete grading result including scores, feedback, and reasoning';
