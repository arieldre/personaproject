/**
 * Persona Validation Service
 * 
 * Implements the "Self-Turing Test" for persona validation.
 * Sends the 28 VCPQ questions to the generated persona and
 * checks if the response vectors correlate with input vectors.
 * 
 * Threshold: correlation >= 0.8 indicates valid persona
 */

const vectorService = require('./vector.service');

/**
 * Calculate Pearson correlation coefficient between two vectors
 * @param {number[]} x - First vector
 * @param {number[]} y - Second vector
 * @returns {number} Correlation coefficient (-1 to 1)
 */
function pearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Vectors must have the same non-zero length');
  }
  
  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  // Calculate standard deviations and covariance
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  
  if (denominator === 0) {
    return 0; // No variance in at least one vector
  }
  
  return numerator / denominator;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} x - First vector
 * @param {number[]} y - Second vector
 * @returns {number} Cosine similarity (-1 to 1)
 */
function cosineSimilarity(x, y) {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Vectors must have the same non-zero length');
  }
  
  let dotProduct = 0;
  let normX = 0;
  let normY = 0;
  
  for (let i = 0; i < x.length; i++) {
    dotProduct += x[i] * y[i];
    normX += x[i] * x[i];
    normY += y[i] * y[i];
  }
  
  const denominator = Math.sqrt(normX) * Math.sqrt(normY);
  
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

/**
 * Calculate mean absolute error between two vectors
 * @param {number[]} x - First vector
 * @param {number[]} y - Second vector
 * @returns {number} Mean absolute error (0 to 2 for normalized vectors)
 */
function meanAbsoluteError(x, y) {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Vectors must have the same non-zero length');
  }
  
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += Math.abs(x[i] - y[i]);
  }
  
  return sum / x.length;
}

/**
 * Convert meta-vectors object to array for comparison
 * @param {Object} metaVectors - Meta-vector object
 * @returns {Object} Keys array and values array
 */
function metaVectorsToArray(metaVectors) {
  const keys = Object.keys(metaVectors).sort();
  const values = keys.map(k => metaVectors[k]);
  return { keys, values };
}

/**
 * Generate VCPQ self-assessment questions for persona
 * @returns {Object[]} Array of questions for persona to answer
 */
function generateSelfAssessmentQuestions() {
  const questionMeta = vectorService.getQuestionMeta();
  const questions = [];
  
  for (const [id, meta] of Object.entries(questionMeta)) {
    questions.push({
      id,
      // Questions are phrased in second person for self-assessment
      prompt: getSecondPersonQuestion(id),
      meta_vector: meta.meta,
      reversed: meta.reversed
    });
  }
  
  return questions;
}

/**
 * Convert third-person VCPQ questions to second-person for self-assessment
 */
function getSecondPersonQuestion(questionId) {
  const questions = {
    A1: 'Do you actively seek out unproven, novel technologies?',
    A2: 'Do you prefer established workflows and legacy protocols?',
    A3: 'Do you double-check every figure and insist on perfection?',
    A4: 'Do you prioritize speed over absolute accuracy?',
    A5: 'Are you energized by group brainstorming and meetings?',
    A6: 'Do you prefer solitary, focused work?',
    A7: 'Do you prioritize team harmony over being "right"?',
    A8: 'Do you challenge colleagues aggressively to ensure excellence?',
    B1: 'When providing feedback, are you blunt and imperative?',
    B2: 'Do you often "sandwich" feedback with praise to soften the blow?',
    B3: 'Do you communicate via long, narrative-style emails?',
    B4: 'Do you use telegraphic bullet points and fragments?',
    B5: 'Do you avoid contractions and use strictly formal address?',
    B6: 'Do you use slang and a casual, active voice?',
    B7: 'Is your communication saturated with industry-specific buzzwords?',
    B8: 'Do you explain complex concepts in plain, accessible English?',
    C1: 'Do you comply immediately with superior directives?',
    C2: 'Do you push back publicly if a plan is flawed?',
    C3: 'Do you require step-by-step supervision?',
    C4: 'Do you work independently, reporting only results?',
    C5: 'Do you frequently use flattery to gain influence?',
    C6: 'Are you openly skeptical of your leadership\'s motives?',
    D1: 'In disagreements, do you try to win at all costs?',
    D2: 'In disagreements, do you yield to keep the peace?',
    D3: 'Are your decisions driven by data and spreadsheet analysis?',
    D4: 'Are your decisions driven by gut feeling and intuition?',
    D5: 'Do you remain stoic and unflappable during a crisis?',
    D6: 'Do you become visibly anxious under heavy pressure?'
  };
  
  return questions[questionId] || `How would you rate yourself on ${questionId}?`;
}

/**
 * Build validation prompt for LLM
 * @returns {string} System prompt for validation
 */
function buildValidationPrompt() {
  return `You are being tested on your personality consistency. 
You will be asked 28 questions about your work behavior and preferences.
For each question, respond with a number from 1 to 5:
1 = Strongly Disagree
2 = Disagree
3 = Neutral
4 = Agree
5 = Strongly Agree

IMPORTANT: Answer based on your established personality and behavioral patterns.
Respond ONLY with a JSON object mapping question IDs to scores.
Example: {"A1": 4, "A2": 2, "A3": 5, ...}

Do not explain your answers. Just provide the JSON object.`;
}

/**
 * Parse LLM validation response
 * @param {string} response - Raw LLM response
 * @returns {Object} Parsed scores or error
 */
function parseValidationResponse(response) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'No JSON found in response' };
    }
    
    const scores = JSON.parse(jsonMatch[0]);
    
    // Validate that we have all 28 questions
    const questionMeta = vectorService.getQuestionMeta();
    const missing = [];
    
    for (const id of Object.keys(questionMeta)) {
      if (scores[id] === undefined) {
        missing.push(id);
      } else {
        // Validate score range
        if (scores[id] < 1 || scores[id] > 5) {
          return { 
            success: false, 
            error: `Invalid score for ${id}: ${scores[id]} (must be 1-5)` 
          };
        }
      }
    }
    
    if (missing.length > 0) {
      return { 
        success: false, 
        error: `Missing answers for: ${missing.join(', ')}`,
        partial_scores: scores
      };
    }
    
    return { success: true, scores };
  } catch (e) {
    return { success: false, error: `Parse error: ${e.message}` };
  }
}

/**
 * Validate a persona by comparing input and self-assessed vectors
 * @param {Object} inputMetaVectors - Original meta-vectors used to create persona
 * @param {Object} assessedScores - Raw scores from persona self-assessment
 * @param {number} threshold - Minimum correlation for pass (default 0.8)
 * @returns {Object} Validation result
 */
function validatePersona(inputMetaVectors, assessedScores, threshold = 0.8) {
  // Process the self-assessment scores
  const assessedResult = vectorService.processVCPQResponses(assessedScores);
  const assessedMetaVectors = assessedResult.meta_vectors;
  
  // Convert to arrays for comparison
  const input = metaVectorsToArray(inputMetaVectors);
  const assessed = metaVectorsToArray(assessedMetaVectors);
  
  // Ensure same keys
  if (JSON.stringify(input.keys) !== JSON.stringify(assessed.keys)) {
    return {
      valid: false,
      error: 'Meta-vector keys do not match',
      input_keys: input.keys,
      assessed_keys: assessed.keys
    };
  }
  
  // Calculate correlation metrics
  const correlation = pearsonCorrelation(input.values, assessed.values);
  const cosine = cosineSimilarity(input.values, assessed.values);
  const mae = meanAbsoluteError(input.values, assessed.values);
  
  // Check individual dimension accuracy
  const dimensionAnalysis = [];
  for (let i = 0; i < input.keys.length; i++) {
    const key = input.keys[i];
    const inputVal = input.values[i];
    const assessedVal = assessed.values[i];
    const diff = Math.abs(inputVal - assessedVal);
    
    dimensionAnalysis.push({
      dimension: key,
      input: inputVal,
      assessed: assessedVal,
      difference: Math.round(diff * 100) / 100,
      accurate: diff < 0.5
    });
  }
  
  // Sort by difference to find biggest mismatches
  dimensionAnalysis.sort((a, b) => b.difference - a.difference);
  
  const isValid = correlation >= threshold;
  
  return {
    valid: isValid,
    correlation: Math.round(correlation * 1000) / 1000,
    cosine_similarity: Math.round(cosine * 1000) / 1000,
    mean_absolute_error: Math.round(mae * 1000) / 1000,
    threshold,
    dimension_analysis: dimensionAnalysis,
    worst_dimensions: dimensionAnalysis.slice(0, 3).map(d => d.dimension),
    assessed_meta_vectors: assessedMetaVectors,
    recommendation: isValid 
      ? 'Persona is consistent with input vectors' 
      : `Consider increasing instruction intensity for: ${dimensionAnalysis.slice(0, 3).map(d => d.dimension).join(', ')}`
  };
}

/**
 * Generate recommendations for improving persona consistency
 * @param {Object} validationResult - Result from validatePersona
 * @returns {Object} Recommendations
 */
function generateRecommendations(validationResult) {
  const recommendations = [];
  
  if (!validationResult.valid) {
    // Analyze which dimensions need work
    for (const dim of validationResult.dimension_analysis) {
      if (!dim.accurate) {
        const direction = dim.input > dim.assessed 
          ? 'increase' 
          : 'decrease';
        
        recommendations.push({
          dimension: dim.dimension,
          action: `${direction} intensity in prompts`,
          current_gap: dim.difference,
          suggestion: `Add stronger behavioral instructions for ${dim.dimension}`
        });
      }
    }
  }
  
  return {
    needs_adjustment: !validationResult.valid,
    recommendations,
    overall_quality: validationResult.correlation >= 0.9 
      ? 'excellent'
      : validationResult.correlation >= 0.8 
        ? 'good'
        : validationResult.correlation >= 0.6 
          ? 'fair'
          : 'poor'
  };
}

module.exports = {
  pearsonCorrelation,
  cosineSimilarity,
  meanAbsoluteError,
  metaVectorsToArray,
  generateSelfAssessmentQuestions,
  getSecondPersonQuestion,
  buildValidationPrompt,
  parseValidationResponse,
  validatePersona,
  generateRecommendations
};
