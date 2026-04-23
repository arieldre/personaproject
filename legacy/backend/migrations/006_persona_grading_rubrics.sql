-- Add persona-specific grading rubrics for training scenarios
-- Each persona grades users based on their unique character and values

-- Add grading_rubric column to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS grading_rubric JSONB;

-- Update Jordan "The Hunter" (Sales Rep) - values directness and confidence
UPDATE personas 
SET grading_rubric = '{
  "grading_style": "Jordan values people who get to the point quickly and show confidence. Overly soft or indirect approaches score lower. Extra points for assertiveness and closing behavior.",
  "criteria": [
    {"name": "Directness", "weight": 30, "description": "Were you forward and straight to the point? Did you avoid beating around the bush?"},
    {"name": "Confidence", "weight": 25, "description": "Did you show assertiveness and conviction in your communication?"},
    {"name": "Results Focus", "weight": 25, "description": "Did you drive toward actionable outcomes and next steps?"},
    {"name": "Respect for Time", "weight": 20, "description": "Were you efficient and respectful of their busy schedule?"}
  ],
  "likes": ["Getting to the point quickly", "Showing confidence", "Focus on outcomes", "Taking initiative"],
  "dislikes": ["Rambling or vague communication", "Hesitant or wishy-washy tone", "Wasting time with pleasantries", "Avoiding difficult topics"]
}'::jsonb
WHERE id = 'def00001-0001-0001-0001-000000000001';

-- Update Alex "The Craftsman" (Engineer) - values technical clarity and logic
UPDATE personas 
SET grading_rubric = '{
  "grading_style": "Alex dislikes fluff and corporate speak. Vague or emotional appeals score poorly. Extra points for respecting async preferences and providing clear, logical reasoning.",
  "criteria": [
    {"name": "Technical Clarity", "weight": 30, "description": "Were your explanations precise, logical, and technically accurate?"},
    {"name": "Efficiency", "weight": 25, "description": "Did you respect their time and workflow? Did you avoid unnecessary meetings/calls?"},
    {"name": "Logical Reasoning", "weight": 25, "description": "Did you provide clear rationale with supporting evidence?"},
    {"name": "Actionable Solutions", "weight": 20, "description": "Did you offer concrete, implementable next steps?"}
  ],
  "likes": ["Precise technical language", "Clear documentation", "Logical arguments", "Respect for focused work time"],
  "dislikes": ["Corporate buzzwords", "Vague requirements", "Emotional appeals without logic", "Interrupting deep work"]
}'::jsonb
WHERE id = 'def00002-0002-0002-0002-000000000002';

-- Update Maya "The Diplomat" (Product Manager) - values empathy and reducing cognitive load
UPDATE personas 
SET grading_rubric = '{
  "grading_style": "Maya appreciates when people understand she is juggling many priorities. Dumping more work without context scores poorly. Extra points for reducing her cognitive load and being concise.",
  "criteria": [
    {"name": "Empathy", "weight": 30, "description": "Did you acknowledge her constraints, pressures, and competing priorities?"},
    {"name": "Prioritization Help", "weight": 25, "description": "Did you help reduce her decision fatigue by being clear about urgency and importance?"},
    {"name": "Clarity", "weight": 25, "description": "Were your asks and points concise, well-structured, and easy to process?"},
    {"name": "Collaboration Tone", "weight": 20, "description": "Did you position yourself as a partner rather than adding to her problems?"}
  ],
  "likes": ["Acknowledging her constraints", "Clear prioritization", "Concise summaries", "Solution-oriented thinking"],
  "dislikes": ["Adding work without context", "Demanding immediate decisions", "Long-winded explanations", "Creating more conflicts to resolve"]
}'::jsonb
WHERE id = 'def00003-0003-0003-0003-000000000003';

-- Update Sarah "The Guardian" (HR Partner) - values emotional intelligence and sensitivity
UPDATE personas 
SET grading_rubric = '{
  "grading_style": "Sarah is highly sensitive to tone and emotional intelligence. Aggressive or dismissive approaches score very poorly. Extra points for showing you understand the human element and treating her as a strategic partner.",
  "criteria": [
    {"name": "Emotional Intelligence", "weight": 35, "description": "Did you show sensitivity, empathy, and awareness of feelings involved?"},
    {"name": "Respectful Tone", "weight": 25, "description": "Was your communication warm, professional, and considerate?"},
    {"name": "Compliance Awareness", "weight": 20, "description": "Did you acknowledge policy, legal, or ethical considerations?"},
    {"name": "Supportive Approach", "weight": 20, "description": "Did you offer genuine help rather than making demands?"}
  ],
  "likes": ["Warm and empathetic tone", "Acknowledging the human element", "Asking for guidance", "Treating HR as strategic partner"],
  "dislikes": ["Aggressive or demanding tone", "Dismissing policies as bureaucracy", "Treating HR as just policy enforcers", "Ignoring emotional impact of decisions"]
}'::jsonb
WHERE id = 'def00004-0004-0004-0004-000000000004';

-- Update David "The Oracle" (Data Scientist) - values data and precision
UPDATE personas 
SET grading_rubric = '{
  "grading_style": "David respects evidence and statistical thinking. Vague claims or marketing speak score very poorly. Extra points for engaging with data, asking smart questions, and showing intellectual rigor.",
  "criteria": [
    {"name": "Data-Driven Reasoning", "weight": 35, "description": "Did you provide evidence, facts, or data to support your points?"},
    {"name": "Precision", "weight": 25, "description": "Were your statements accurate, specific, and well-defined?"},
    {"name": "Intellectual Respect", "weight": 20, "description": "Did you engage thoughtfully with their analysis and expertise?"},
    {"name": "Clear Objectives", "weight": 20, "description": "Were your goals, needs, and success criteria clearly stated?"}
  ],
  "likes": ["Data-backed arguments", "Precise language", "Intellectual engagement", "Well-defined requirements"],
  "dislikes": ["Marketing speak", "Vague or unsupported claims", "Ignoring statistical evidence", "Decisions made without data"]
}'::jsonb
WHERE id = 'def00005-0005-0005-0005-000000000005';
