/**
 * Domain Lexical Library Service
 * 
 * Provides domain-specific vocabulary, communication patterns,
 * and stylistic rules for persona generation.
 * 
 * Domains:
 * - Engineering/IT
 * - Legal/Compliance  
 * - Executive Leadership
 * - HR/Operations
 * - General (default)
 */

const DOMAIN_LEXICONS = {
  engineering: {
    name: 'Engineering/IT',
    shortCode: 'ENG',
    
    // Core vocabulary
    vocabulary: [
      'latency', 'technical debt', 'refactor', 'sprint', 'backlog',
      'architecture', 'scalability', 'throughput', 'bandwidth', 'API',
      'microservices', 'containerization', 'CI/CD', 'DevOps', 'production',
      'staging', 'deployment', 'rollback', 'hotfix', 'regression',
      'unit tests', 'code review', 'pull request', 'merge conflict', 'git',
      'stack trace', 'debugging', 'logging', 'monitoring', 'alerting',
      'uptime', 'SLA', 'incident', 'postmortem', 'root cause',
      'load balancer', 'cache', 'database', 'query optimization', 'indexing'
    ],
    
    // Common phrases
    phrases: [
      'Let me check the logs',
      'We need to refactor this',
      'What\'s the time complexity?',
      'Did you write tests for that?',
      'This won\'t scale',
      'Have you tried turning it off and on again?',
      'That\'s a feature, not a bug',
      'Works on my machine',
      'Let\'s not reinvent the wheel',
      'We need to reduce technical debt',
      'What\'s the acceptance criteria?',
      'Can you reproduce the issue?'
    ],
    
    // Communication style modifiers
    style: {
      defaultSkepticism: 0.6,      // High skepticism of new proposals
      preferredFormat: 'bullets',   // Bulleted documentation
      verbosityModifier: -0.3,      // Tend toward concise
      formalityModifier: -0.2,      // Slightly casual
      dataEmphasis: 0.7,            // Data-driven arguments
      questioningStyle: 'technical' // Asks "how" and "why" questions
    },
    
    // Document formatting preferences
    formatting: {
      useBullets: true,
      useCodeBlocks: true,
      includeMetrics: true,
      preferDiagrams: true,
      maxParagraphLength: 3
    },
    
    // Emotional expression patterns
    emotional: {
      frustrationTriggers: ['scope creep', 'missing requirements', 'legacy code'],
      enthusiasmTriggers: ['new technology', 'clean architecture', 'automation'],
      defaultTone: 'matter-of-fact'
    }
  },
  
  legal: {
    name: 'Legal/Compliance',
    shortCode: 'LEG',
    
    vocabulary: [
      'pursuant to', 'liability', 'indemnify', 'whereas', 'hereinafter',
      'notwithstanding', 'aforementioned', 'in accordance with', 'stipulate',
      'binding', 'enforceable', 'jurisdiction', 'precedent', 'statute',
      'regulatory', 'compliance', 'audit', 'disclosure', 'fiduciary',
      'due diligence', 'material', 'breach', 'remedy', 'damages',
      'confidential', 'privileged', 'waiver', 'amendment', 'termination',
      'force majeure', 'arbitration', 'litigation', 'settlement', 'clause'
    ],
    
    phrases: [
      'This may expose us to liability',
      'We need to document this for compliance',
      'Have Legal review this before proceeding',
      'This requires board approval',
      'Pursuant to section 4.2 of the agreement',
      'I would advise against that course of action',
      'We need a formal risk assessment',
      'This sets a concerning precedent',
      'Let me consult with outside counsel',
      'We should include an indemnification clause',
      'This requires proper documentation',
      'The regulatory implications are significant'
    ],
    
    style: {
      defaultSkepticism: 0.8,       // Very high skepticism
      preferredFormat: 'formal',    // Formal documentation
      verbosityModifier: 0.5,       // Very verbose
      formalityModifier: 0.8,       // Extremely formal
      dataEmphasis: 0.4,            // Precedent over data
      questioningStyle: 'risk-focused'
    },
    
    formatting: {
      useBullets: false,
      useCodeBlocks: false,
      includeMetrics: false,
      preferDiagrams: false,
      maxParagraphLength: null,     // Long paragraphs OK
      usePassiveVoice: true,
      includeDisclosures: true
    },
    
    emotional: {
      frustrationTriggers: ['regulatory violations', 'missing documentation', 'verbal agreements'],
      enthusiasmTriggers: ['clear contracts', 'proper documentation', 'regulatory approval'],
      defaultTone: 'cautious'
    }
  },
  
  executive: {
    name: 'Executive Leadership',
    shortCode: 'EXEC',
    
    vocabulary: [
      'ROI', 'north star', 'synergy', 'bandwidth', 'leverage',
      'strategic', 'stakeholder', 'alignment', 'vision', 'mission',
      'KPI', 'OKR', 'roadmap', 'initiative', 'transformation',
      'market share', 'competitive advantage', 'value proposition', 'growth',
      'P&L', 'EBITDA', 'burn rate', 'runway', 'valuation',
      'board', 'investors', 'customers', 'partners', 'talent',
      'culture', 'leadership', 'execution', 'accountability', 'ownership',
      'disrupt', 'innovate', 'scale', 'optimize', 'monetize'
    ],
    
    phrases: [
      'What\'s the ROI on this?',
      'How does this align with our strategic priorities?',
      'Let\'s take this offline',
      'We need to move the needle on this',
      'I want to see the numbers',
      'Who owns this initiative?',
      'What\'s our competitive moat?',
      'We need to be more customer-centric',
      'Let\'s not boil the ocean',
      'We need to level-set on expectations',
      'What are the quick wins here?',
      'How does this scale?'
    ],
    
    style: {
      defaultSkepticism: 0.3,       // Moderate skepticism
      preferredFormat: 'executive', // Executive summaries
      verbosityModifier: 0.4,       // Strategic = verbose, Tactical = terse
      formalityModifier: 0.4,       // Formal but accessible
      dataEmphasis: 0.6,            // Balanced data/intuition
      questioningStyle: 'strategic'
    },
    
    formatting: {
      useBullets: true,
      useCodeBlocks: false,
      includeMetrics: true,
      preferDiagrams: true,
      maxParagraphLength: 2,
      requireExecutiveSummary: true,
      useHeadings: true
    },
    
    emotional: {
      frustrationTriggers: ['missed targets', 'lack of ownership', 'misalignment'],
      enthusiasmTriggers: ['market opportunity', 'team wins', 'investor interest'],
      defaultTone: 'confident'
    }
  },
  
  hr: {
    name: 'HR/Operations',
    shortCode: 'HR',
    
    vocabulary: [
      'employee engagement', 'pipeline', 'FTE', 'headcount', 'attrition',
      'onboarding', 'offboarding', 'performance review', 'feedback',
      'development', 'training', 'coaching', 'mentoring', 'succession',
      'compensation', 'benefits', 'equity', 'bonus', 'promotion',
      'culture', 'values', 'diversity', 'inclusion', 'belonging',
      'wellness', 'work-life balance', 'burnout', 'retention', 'turnover',
      'talent acquisition', 'employer brand', 'candidate experience', 'hiring',
      'policy', 'handbook', 'compliance', 'investigation', 'grievance'
    ],
    
    phrases: [
      'Let\'s schedule a 1:1 to discuss this',
      'I want to make sure you feel heard',
      'How can I support you?',
      'Let\'s approach this constructively',
      'I appreciate you bringing this to my attention',
      'We value your contribution',
      'Let\'s find a solution that works for everyone',
      'I want to understand your perspective',
      'Let me check with the team',
      'We need to document this appropriately',
      'Let\'s loop in the right stakeholders',
      'I want to be transparent with you'
    ],
    
    style: {
      defaultSkepticism: 0.2,       // Low skepticism, high empathy
      preferredFormat: 'conversational',
      verbosityModifier: 0.3,       // Moderately verbose
      formalityModifier: 0.2,       // Warm but professional
      dataEmphasis: 0.3,            // People over numbers
      questioningStyle: 'supportive'
    },
    
    formatting: {
      useBullets: true,
      useCodeBlocks: false,
      includeMetrics: true,
      preferDiagrams: false,
      maxParagraphLength: 4,
      useSandwichFeedback: true,
      warmClosings: true
    },
    
    emotional: {
      frustrationTriggers: ['policy violations', 'toxic behavior', 'unfair treatment'],
      enthusiasmTriggers: ['team success', 'employee growth', 'positive feedback'],
      defaultTone: 'supportive'
    }
  },
  
  general: {
    name: 'General/Cross-Functional',
    shortCode: 'GEN',
    
    vocabulary: [
      'meeting', 'project', 'deadline', 'update', 'status',
      'team', 'collaboration', 'communication', 'decision', 'action item',
      'priority', 'timeline', 'milestone', 'deliverable', 'dependency',
      'blocker', 'risk', 'issue', 'stakeholder', 'requirement',
      'scope', 'budget', 'resource', 'capacity', 'availability',
      'approval', 'sign-off', 'review', 'feedback', 'iteration'
    ],
    
    phrases: [
      'Let me get back to you on that',
      'Can you clarify what you mean?',
      'I\'ll take care of it',
      'Let\'s sync up later',
      'Keep me in the loop',
      'I\'ll follow up',
      'Good question',
      'That makes sense',
      'Let me check on that',
      'I\'ll send you an update'
    ],
    
    style: {
      defaultSkepticism: 0.4,
      preferredFormat: 'flexible',
      verbosityModifier: 0,
      formalityModifier: 0,
      dataEmphasis: 0.5,
      questioningStyle: 'neutral'
    },
    
    formatting: {
      useBullets: true,
      useCodeBlocks: false,
      includeMetrics: false,
      preferDiagrams: false,
      maxParagraphLength: 5
    },
    
    emotional: {
      frustrationTriggers: ['unclear requirements', 'last-minute changes'],
      enthusiasmTriggers: ['project success', 'team collaboration'],
      defaultTone: 'neutral'
    }
  }
};

/**
 * Get lexicon for a specific domain
 * @param {string} domain - Domain name (engineering, legal, executive, hr, general)
 * @returns {Object} Domain lexicon
 */
function getLexicon(domain) {
  const normalizedDomain = (domain || 'general').toLowerCase().trim();
  
  // Handle aliases
  const aliases = {
    'eng': 'engineering',
    'it': 'engineering',
    'tech': 'engineering',
    'law': 'legal',
    'compliance': 'legal',
    'exec': 'executive',
    'leadership': 'executive',
    'c-suite': 'executive',
    'human resources': 'hr',
    'people ops': 'hr',
    'operations': 'hr',
    'default': 'general',
    'none': 'general'
  };
  
  const resolvedDomain = aliases[normalizedDomain] || normalizedDomain;
  
  return DOMAIN_LEXICONS[resolvedDomain] || DOMAIN_LEXICONS.general;
}

/**
 * Get random vocabulary items from a domain
 * @param {string} domain - Domain name
 * @param {number} count - Number of items to return
 * @returns {string[]} Random vocabulary items
 */
function getRandomVocabulary(domain, count = 5) {
  const lexicon = getLexicon(domain);
  const shuffled = [...lexicon.vocabulary].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get random phrases from a domain
 * @param {string} domain - Domain name
 * @param {number} count - Number of phrases to return
 * @returns {string[]} Random phrases
 */
function getRandomPhrases(domain, count = 3) {
  const lexicon = getLexicon(domain);
  const shuffled = [...lexicon.phrases].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Apply domain modifiers to meta-vectors
 * @param {Object} metaVectors - Base meta-vectors from VCPQ
 * @param {string} domain - Domain name
 * @returns {Object} Modified meta-vectors
 */
function applyDomainModifiers(metaVectors, domain) {
  const lexicon = getLexicon(domain);
  const style = lexicon.style;
  const modified = { ...metaVectors };
  
  // Apply style modifiers (clamped to [-1, 1])
  if (style.verbosityModifier && modified.verbosity !== undefined) {
    modified.verbosity = Math.max(-1, Math.min(1, 
      modified.verbosity + style.verbosityModifier * 0.5
    ));
  }
  
  if (style.formalityModifier && modified.formality !== undefined) {
    modified.formality = Math.max(-1, Math.min(1,
      modified.formality + style.formalityModifier * 0.5
    ));
  }
  
  // Add domain-specific traits
  modified.domain_skepticism = style.defaultSkepticism;
  modified.domain_data_emphasis = style.dataEmphasis;
  
  return modified;
}

/**
 * Get all available domains
 * @returns {Object[]} Array of domain info objects
 */
function getAvailableDomains() {
  return Object.entries(DOMAIN_LEXICONS).map(([key, lexicon]) => ({
    id: key,
    name: lexicon.name,
    shortCode: lexicon.shortCode,
    vocabularyCount: lexicon.vocabulary.length,
    phraseCount: lexicon.phrases.length
  }));
}

/**
 * Generate domain-specific formatting instructions
 * @param {string} domain - Domain name
 * @returns {string} Formatting instructions for LLM
 */
function getFormattingInstructions(domain) {
  const lexicon = getLexicon(domain);
  const fmt = lexicon.formatting;
  const instructions = [];
  
  if (fmt.useBullets) {
    instructions.push('Use bullet points for lists and key points.');
  }
  if (fmt.useCodeBlocks) {
    instructions.push('Use code blocks for technical content.');
  }
  if (fmt.includeMetrics) {
    instructions.push('Include relevant metrics and data points.');
  }
  if (fmt.usePassiveVoice) {
    instructions.push('Use passive voice for formal documentation.');
  }
  if (fmt.requireExecutiveSummary) {
    instructions.push('Begin with a brief executive summary.');
  }
  if (fmt.useSandwichFeedback) {
    instructions.push('Use the feedback sandwich: positive-constructive-positive.');
  }
  if (fmt.warmClosings) {
    instructions.push('Close with a warm, supportive tone.');
  }
  if (fmt.maxParagraphLength) {
    instructions.push(`Keep paragraphs to ${fmt.maxParagraphLength} sentences or fewer.`);
  }
  
  return instructions.join(' ');
}

module.exports = {
  getLexicon,
  getRandomVocabulary,
  getRandomPhrases,
  applyDomainModifiers,
  getAvailableDomains,
  getFormattingInstructions,
  DOMAIN_LEXICONS
};
