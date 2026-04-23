-- Migration: Add demographic questions to questionnaire template
-- Date: 2026-01-11

-- Update the default questionnaire template to include demographic questions
UPDATE questionnaire_templates 
SET questions = '[
    {
        "id": "age_range",
        "question": "What is your age range?",
        "type": "single_choice",
        "options": ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"],
        "required": true,
        "category": "demographics"
    },
    {
        "id": "region",
        "question": "What region are you located in?",
        "type": "single_choice",
        "options": ["North America", "South America", "Europe", "Middle East", "Africa", "Asia Pacific", "Australia/New Zealand"],
        "required": true,
        "category": "demographics"
    },
    {
        "id": "job_title",
        "question": "What is your job title/role?",
        "type": "text",
        "required": true,
        "category": "demographics"
    },
    {
        "id": "department",
        "question": "Which department do you work in?",
        "type": "single_choice",
        "options": ["Engineering/IT", "Product", "Design", "Marketing", "Sales", "Finance", "HR/People", "Operations", "Customer Success", "Executive/Leadership", "Other"],
        "required": true,
        "category": "demographics"
    },
    {
        "id": "experience_years",
        "question": "How many years of professional experience do you have?",
        "type": "single_choice",
        "options": ["0-2 years", "3-5 years", "6-10 years", "11-15 years", "15+ years"],
        "required": true,
        "category": "demographics"
    },
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
]'::jsonb
WHERE is_default = true;
