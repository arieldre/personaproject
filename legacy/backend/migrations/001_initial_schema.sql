-- =====================================================
-- PERSONA PLATFORM - DATABASE SCHEMA
-- Multi-tenant SaaS for AI-powered persona simulation
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'user');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
CREATE TYPE questionnaire_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE response_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE persona_status AS ENUM ('generating', 'active', 'archived');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- =====================================================
-- COMPANIES (Tenants)
-- =====================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    
    -- Subscription & Licensing
    subscription_status subscription_status DEFAULT 'trial',
    license_count INTEGER DEFAULT 5,
    licenses_used INTEGER DEFAULT 0,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    CONSTRAINT valid_licenses CHECK (licenses_used <= license_count)
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_subscription ON companies(subscription_status);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Auth
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if using OAuth only
    
    -- OAuth
    google_id VARCHAR(255) UNIQUE,
    microsoft_id VARCHAR(255) UNIQUE,
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    
    -- Role & Company
    role user_role DEFAULT 'user',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_google ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_microsoft ON users(microsoft_id) WHERE microsoft_id IS NOT NULL;

-- =====================================================
-- USER INVITATIONS
-- =====================================================

CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    email VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role user_role DEFAULT 'user',
    token VARCHAR(255) UNIQUE NOT NULL,
    
    status invite_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON user_invitations(token);
CREATE INDEX idx_invitations_email ON user_invitations(email);
CREATE INDEX idx_invitations_company ON user_invitations(company_id);

-- =====================================================
-- QUESTIONNAIRE TEMPLATES
-- =====================================================

CREATE TABLE questionnaire_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    
    -- Template questions stored as JSONB
    -- Structure: [{ id, question, type, options?, required, category }]
    questions JSONB NOT NULL DEFAULT '[]',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- COMPANY QUESTIONNAIRES
-- =====================================================

CREATE TABLE questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_id UUID REFERENCES questionnaire_templates(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status questionnaire_status DEFAULT 'draft',
    
    -- Custom questions (merged with template)
    -- Structure: [{ id, question, type, options?, required, category }]
    custom_questions JSONB DEFAULT '[]',
    
    -- Access
    access_code VARCHAR(50) UNIQUE,
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Dates
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    total_responses INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_questionnaires_company ON questionnaires(company_id);
CREATE INDEX idx_questionnaires_access_code ON questionnaires(access_code);
CREATE INDEX idx_questionnaires_status ON questionnaires(status);

-- =====================================================
-- QUESTIONNAIRE RESPONSES
-- =====================================================

CREATE TABLE questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    respondent_email VARCHAR(255), -- NULL if anonymous
    respondent_name VARCHAR(255),
    
    status response_status DEFAULT 'pending',
    
    -- Responses stored as JSONB
    -- Structure: { question_id: answer }
    answers JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);
CREATE INDEX idx_responses_status ON questionnaire_responses(status);

-- =====================================================
-- PERSONAS
-- =====================================================

CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    tagline VARCHAR(500), -- Short description
    
    status persona_status DEFAULT 'generating',
    
    -- Core Persona Data (AI-generated from questionnaire)
    -- This is the "short info" shown on cards
    summary JSONB NOT NULL DEFAULT '{}',
    /*
    Structure:
    {
        "demographics": { "age_range": "25-35", "role": "Manager", ... },
        "communication_style": { "preferred": "direct", "tone": "formal", ... },
        "values": ["efficiency", "transparency", ...],
        "pain_points": ["..."],
        "motivations": ["..."],
        "key_traits": ["analytical", "decisive", ...]
    }
    */
    
    -- Extended Persona Data (for LLM context)
    -- This is the full context for conversations
    extended_profile JSONB NOT NULL DEFAULT '{}',
    /*
    Structure:
    {
        "background_story": "...",
        "detailed_preferences": { ... },
        "communication_examples": [ ... ],
        "topic_opinions": { "topic": "opinion", ... },
        "behavioral_patterns": [ ... ],
        "conversation_guidelines": "..."
    }
    */
    
    -- LLM System Prompt (generated)
    system_prompt TEXT,
    
    -- Clustering Info
    cluster_id INTEGER,
    cluster_size INTEGER, -- How many responses in this cluster
    confidence_score DECIMAL(5,4), -- 0-1 clustering confidence
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_personas_company ON personas(company_id);
CREATE INDEX idx_personas_questionnaire ON personas(questionnaire_id);
CREATE INDEX idx_personas_status ON personas(status);

-- =====================================================
-- PERSONA CONVERSATIONS
-- =====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255),
    
    -- Whether this conversation is saved for training
    is_saved BOOLEAN DEFAULT false,
    saved_by UUID REFERENCES users(id),
    saved_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback for persona improvement
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_conversations_persona ON conversations(persona_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_saved ON conversations(is_saved) WHERE is_saved = true;

-- =====================================================
-- CONVERSATION MESSAGES
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Token usage (for analytics)
    tokens_used INTEGER,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- =====================================================
-- PERSONA SIMILARITY SEARCH (Find My Persona)
-- =====================================================

CREATE TABLE similarity_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Search input
    description TEXT NOT NULL,
    
    -- Results (ordered by similarity score)
    results JSONB NOT NULL DEFAULT '[]',
    /*
    Structure:
    [
        { "persona_id": "uuid", "similarity_score": 0.85, "matching_traits": [...] },
        ...
    ]
    */
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_similarity_company ON similarity_searches(company_id);
CREATE INDEX idx_similarity_user ON similarity_searches(user_id);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- What
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- =====================================================
-- SESSIONS (for JWT refresh tokens)
-- =====================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    refresh_token_hash VARCHAR(255) NOT NULL,
    
    -- Device info
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    
    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_questionnaires_updated_at
    BEFORE UPDATE ON questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update license count when user added/removed
CREATE OR REPLACE FUNCTION update_license_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.company_id IS NOT NULL THEN
        UPDATE companies SET licenses_used = licenses_used + 1 WHERE id = NEW.company_id;
    ELSIF TG_OP = 'DELETE' AND OLD.company_id IS NOT NULL THEN
        UPDATE companies SET licenses_used = licenses_used - 1 WHERE id = OLD.company_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id THEN
        IF OLD.company_id IS NOT NULL THEN
            UPDATE companies SET licenses_used = licenses_used - 1 WHERE id = OLD.company_id;
        END IF;
        IF NEW.company_id IS NOT NULL THEN
            UPDATE companies SET licenses_used = licenses_used + 1 WHERE id = NEW.company_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_license_count
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION update_license_count();

-- Update questionnaire response count
CREATE OR REPLACE FUNCTION update_response_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE questionnaires SET total_responses = total_responses + 1 WHERE id = NEW.questionnaire_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE questionnaires SET total_responses = total_responses - 1 WHERE id = OLD.questionnaire_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_questionnaire_response_count
    AFTER INSERT OR DELETE ON questionnaire_responses
    FOR EACH ROW EXECUTE FUNCTION update_response_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies would be applied based on the application's auth context
-- For now, we'll handle authorization in the application layer

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default questionnaire template
INSERT INTO questionnaire_templates (id, name, description, is_default, questions) VALUES
(uuid_generate_v4(), 'Standard Persona Discovery', 'Comprehensive questionnaire for building detailed personas', true, '[
    {
        "id": "comm_style",
        "question": "How do you prefer to communicate at work?",
        "type": "single_choice",
        "options": ["Direct and to the point", "Detailed and thorough", "Casual and friendly", "Formal and professional"],
        "required": true,
        "category": "communication"
    },
    {
        "id": "feedback_pref",
        "question": "How do you prefer to receive feedback?",
        "type": "single_choice",
        "options": ["Immediately and directly", "In private, with context", "Written, so I can process it", "Through regular scheduled reviews"],
        "required": true,
        "category": "communication"
    },
    {
        "id": "conflict_approach",
        "question": "How do you typically handle workplace conflicts?",
        "type": "single_choice",
        "options": ["Address them head-on immediately", "Take time to cool down first", "Seek mediation from others", "Avoid confrontation if possible"],
        "required": true,
        "category": "behavior"
    },
    {
        "id": "decision_making",
        "question": "How do you make important decisions?",
        "type": "single_choice",
        "options": ["Trust my gut instinct", "Analyze all available data", "Consult with others first", "Follow established procedures"],
        "required": true,
        "category": "behavior"
    },
    {
        "id": "work_motivation",
        "question": "What motivates you most at work?",
        "type": "multiple_choice",
        "options": ["Recognition and praise", "Financial rewards", "Learning new skills", "Making an impact", "Work-life balance", "Team collaboration", "Autonomy and independence"],
        "required": true,
        "category": "motivation"
    },
    {
        "id": "stress_response",
        "question": "How do you typically respond to high-pressure situations?",
        "type": "single_choice",
        "options": ["I thrive under pressure", "I stay calm but prefer less stress", "I need time to decompress", "I prefer to avoid high-pressure situations"],
        "required": true,
        "category": "behavior"
    },
    {
        "id": "meeting_pref",
        "question": "What is your preferred meeting style?",
        "type": "single_choice",
        "options": ["Quick stand-ups", "Structured with clear agenda", "Open discussion format", "Prefer async communication over meetings"],
        "required": true,
        "category": "communication"
    },
    {
        "id": "work_values",
        "question": "Which values are most important to you in the workplace?",
        "type": "multiple_choice",
        "options": ["Transparency", "Innovation", "Efficiency", "Collaboration", "Quality", "Speed", "Creativity", "Stability"],
        "required": true,
        "category": "values"
    },
    {
        "id": "learning_style",
        "question": "How do you prefer to learn new things?",
        "type": "single_choice",
        "options": ["Hands-on experimentation", "Reading documentation", "Video tutorials", "One-on-one mentoring", "Group training sessions"],
        "required": true,
        "category": "behavior"
    },
    {
        "id": "change_attitude",
        "question": "How do you feel about organizational changes?",
        "type": "single_choice",
        "options": ["I embrace change enthusiastically", "I am cautiously optimistic", "I need time to adapt", "I prefer stability"],
        "required": true,
        "category": "behavior"
    },
    {
        "id": "pain_points",
        "question": "What frustrates you most at work?",
        "type": "multiple_choice",
        "options": ["Lack of clear direction", "Micromanagement", "Poor communication", "Inefficient processes", "Lack of recognition", "Too many meetings", "Unclear expectations", "Limited growth opportunities"],
        "required": true,
        "category": "challenges"
    },
    {
        "id": "team_role",
        "question": "What role do you naturally take in a team?",
        "type": "single_choice",
        "options": ["Leader who drives direction", "Coordinator who organizes", "Contributor who executes", "Innovator who generates ideas", "Supporter who helps others"],
        "required": true,
        "category": "behavior"
    },
    {
        "id": "success_definition",
        "question": "How do you define success in your role?",
        "type": "text",
        "required": true,
        "category": "values"
    },
    {
        "id": "ideal_workday",
        "question": "Describe your ideal workday:",
        "type": "text",
        "required": false,
        "category": "preferences"
    },
    {
        "id": "communication_topics",
        "question": "What topics are you most comfortable discussing?",
        "type": "multiple_choice",
        "options": ["Technical/work details", "Career development", "Team dynamics", "Company strategy", "Personal interests", "Industry trends"],
        "required": true,
        "category": "communication"
    }
]');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE companies IS 'Multi-tenant companies (customers)';
COMMENT ON TABLE users IS 'All users across the platform with role-based access';
COMMENT ON TABLE personas IS 'AI-generated personas from questionnaire clustering';
COMMENT ON TABLE conversations IS 'Chat sessions between users and personas';
COMMENT ON COLUMN personas.summary IS 'Short persona info for display cards';
COMMENT ON COLUMN personas.extended_profile IS 'Full context for LLM conversations';
COMMENT ON COLUMN personas.system_prompt IS 'Pre-generated LLM system prompt for this persona';
