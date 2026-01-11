/**
 * VCPQ Vector Service
 * 
 * Handles normalization of raw survey scores to personality vectors
 * and aggregation into meta-vectors for deterministic persona generation.
 * 
 * Formula: V = (S - 3) / 2
 * Where S is the Likert score (1-5), producing V in range [-1, 1]
 * Reversed items are multiplied by -1
 */

// Question metadata with reversal flags
const QUESTION_META = {
  // Module A: Cognition
  A1: { meta: 'innovation', reversed: false },
  A2: { meta: 'innovation', reversed: true },
  A3: { meta: 'diligence', reversed: false },
  A4: { meta: 'diligence', reversed: true },
  A5: { meta: 'social_energy', reversed: false },
  A6: { meta: 'social_energy', reversed: true },
  A7: { meta: 'agreeableness', reversed: false },
  A8: { meta: 'agreeableness', reversed: true },
  
  // Module B: Communication
  B1: { meta: 'directness', reversed: false },
  B2: { meta: 'directness', reversed: true },
  B3: { meta: 'verbosity', reversed: false },
  B4: { meta: 'verbosity', reversed: true },
  B5: { meta: 'formality', reversed: false },
  B6: { meta: 'formality', reversed: true },
  B7: { meta: 'jargon_density', reversed: false },
  B8: { meta: 'jargon_density', reversed: true },
  
  // Module C: Hierarchy
  C1: { meta: 'deference', reversed: false },
  C2: { meta: 'deference', reversed: true },
  C3: { meta: 'autonomy', reversed: true },  // "Requires supervision" = LOW autonomy, so reversed
  C4: { meta: 'autonomy', reversed: false }, // "Works independently" = HIGH autonomy, forward
  C5: { meta: 'sycophancy', reversed: false },
  C6: { meta: 'sycophancy', reversed: true },
  
  // Module D: Operational
  D1: { meta: 'conflict_mode', reversed: false },  // Competing
  D2: { meta: 'conflict_mode', reversed: true },   // Avoiding
  D3: { meta: 'decision_basis', reversed: false }, // Analytical
  D4: { meta: 'decision_basis', reversed: true },  // Intuitive
  D5: { meta: 'stress_resilience', reversed: false },
  D6: { meta: 'stress_resilience', reversed: true }
};

// Meta-vector labels for human-readable output
const META_VECTOR_LABELS = {
  innovation: { low: 'Traditional/Conservative', high: 'Innovative/Risk-Taking' },
  diligence: { low: 'Speed-Focused', high: 'Detail-Oriented/Perfectionist' },
  social_energy: { low: 'Introverted/Solitary', high: 'Extroverted/Collaborative' },
  agreeableness: { low: 'Challenging/Confrontational', high: 'Harmonious/Agreeable' },
  directness: { low: 'Indirect/Diplomatic', high: 'Direct/Blunt' },
  verbosity: { low: 'Telegraphic/Concise', high: 'Verbose/Narrative' },
  formality: { low: 'Casual/Informal', high: 'Formal/Professional' },
  jargon_density: { low: 'Plain Language', high: 'Jargon-Heavy' },
  deference: { low: 'Autonomous/Challenging', high: 'Deferential/Compliant' },
  autonomy: { low: 'Needs Supervision', high: 'Self-Directed' },
  sycophancy: { low: 'Skeptical/Critical', high: 'Flattering/Agreeable' },
  conflict_mode: { low: 'Avoiding/Yielding', high: 'Competing/Assertive' },
  decision_basis: { low: 'Intuitive/Gut-Based', high: 'Analytical/Data-Driven' },
  stress_resilience: { low: 'Stress-Reactive', high: 'Stoic/Resilient' }
};

/**
 * Normalize a single Likert score to vector value
 * @param {number} score - Raw Likert score (1-5)
 * @param {boolean} reversed - Whether this is a reversed item
 * @returns {number} Normalized value between -1 and 1
 */
function normalizeScore(score, reversed = false) {
  // Validate input
  if (score < 1 || score > 5) {
    throw new Error(`Invalid Likert score: ${score}. Must be between 1 and 5.`);
  }
  
  // Apply normalization formula: V = (S - 3) / 2
  let normalized = (score - 3) / 2;
  
  // Apply reversal if needed
  if (reversed) {
    normalized = normalized * -1;
  }
  
  // Round to 2 decimal places
  return Math.round(normalized * 100) / 100;
}

/**
 * Process all 28 raw survey scores into normalized values
 * @param {Object} rawScores - Object with keys A1-D6 and Likert values 1-5
 * @returns {Object} Normalized scores with same keys
 */
function normalizeAllScores(rawScores) {
  const normalized = {};
  
  for (const [questionId, meta] of Object.entries(QUESTION_META)) {
    const rawScore = rawScores[questionId];
    
    if (rawScore === undefined || rawScore === null) {
      throw new Error(`Missing required score for question: ${questionId}`);
    }
    
    normalized[questionId] = normalizeScore(rawScore, meta.reversed);
  }
  
  return normalized;
}

/**
 * Aggregate normalized scores into meta-vectors
 * @param {Object} normalizedScores - Object with normalized values for A1-D6
 * @returns {Object} Meta-vector object with 14 dimensions
 */
function calculateMetaVectors(normalizedScores) {
  const metaVectors = {};
  
  // Group scores by meta-vector
  const grouped = {};
  for (const [questionId, score] of Object.entries(normalizedScores)) {
    const meta = QUESTION_META[questionId].meta;
    if (!grouped[meta]) {
      grouped[meta] = [];
    }
    grouped[meta].push(score);
  }
  
  // Calculate average for each meta-vector
  for (const [meta, scores] of Object.entries(grouped)) {
    const sum = scores.reduce((a, b) => a + b, 0);
    metaVectors[meta] = Math.round((sum / scores.length) * 100) / 100;
  }
  
  return metaVectors;
}

/**
 * Generate human-readable personality profile from meta-vectors
 * @param {Object} metaVectors - Meta-vector values
 * @returns {Object} Profile with descriptions and intensity levels
 */
function generateProfile(metaVectors) {
  const profile = {};
  
  for (const [meta, value] of Object.entries(metaVectors)) {
    const labels = META_VECTOR_LABELS[meta];
    const absValue = Math.abs(value);
    
    // Determine intensity
    let intensity;
    if (absValue >= 0.8) intensity = 'extreme';
    else if (absValue >= 0.5) intensity = 'strong';
    else if (absValue >= 0.25) intensity = 'moderate';
    else intensity = 'neutral';
    
    // Determine direction
    const direction = value >= 0 ? 'high' : 'low';
    const label = labels[direction];
    
    profile[meta] = {
      value,
      intensity,
      direction,
      label,
      description: `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} ${label}`
    };
  }
  
  return profile;
}

/**
 * Full pipeline: raw scores → normalized → meta-vectors → profile
 * @param {Object} rawScores - Raw survey responses (A1-D6 with values 1-5)
 * @returns {Object} Complete vector analysis
 */
function processVCPQResponses(rawScores) {
  // Step 1: Normalize all scores
  const normalizedScores = normalizeAllScores(rawScores);
  
  // Step 2: Calculate meta-vectors
  const metaVectors = calculateMetaVectors(normalizedScores);
  
  // Step 3: Generate profile
  const profile = generateProfile(metaVectors);
  
  return {
    raw_scores: rawScores,
    normalized_scores: normalizedScores,
    meta_vectors: metaVectors,
    profile,
    version: 'vcpq-v1',
    processed_at: new Date().toISOString()
  };
}

/**
 * Validate that all required questions are answered
 * @param {Object} rawScores - Survey responses
 * @returns {Object} Validation result with errors if any
 */
function validateResponses(rawScores) {
  const errors = [];
  const warnings = [];
  
  for (const questionId of Object.keys(QUESTION_META)) {
    const value = rawScores[questionId];
    
    if (value === undefined || value === null) {
      errors.push(`Missing response for ${questionId}`);
    } else if (typeof value !== 'number') {
      errors.push(`Invalid response type for ${questionId}: expected number, got ${typeof value}`);
    } else if (value < 1 || value > 5) {
      errors.push(`Invalid value for ${questionId}: ${value} (must be 1-5)`);
    } else if (!Number.isInteger(value)) {
      warnings.push(`Non-integer value for ${questionId}: ${value} (will be used as-is)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    questionCount: Object.keys(QUESTION_META).length,
    answeredCount: Object.keys(rawScores).filter(k => 
      rawScores[k] !== undefined && rawScores[k] !== null
    ).length
  };
}

/**
 * Get question metadata
 * @returns {Object} Full question metadata
 */
function getQuestionMeta() {
  return { ...QUESTION_META };
}

/**
 * Get meta-vector labels
 * @returns {Object} Labels for all meta-vectors
 */
function getMetaVectorLabels() {
  return { ...META_VECTOR_LABELS };
}

module.exports = {
  normalizeScore,
  normalizeAllScores,
  calculateMetaVectors,
  generateProfile,
  processVCPQResponses,
  validateResponses,
  getQuestionMeta,
  getMetaVectorLabels,
  QUESTION_META,
  META_VECTOR_LABELS
};
