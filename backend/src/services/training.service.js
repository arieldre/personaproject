/**
 * Training Service
 * Handles training scenarios and persona-specific grading
 */

const { gradeWithPersona, getDefaultRubric } = require('./llm.service');

/**
 * Grade a training session using the persona's specific rubric
 * Each persona evaluates users differently based on their character
 * 
 * @param {Object} session - The training session with conversation history
 * @param {Object} persona - The persona doing the grading
 * @param {Object} scenario - Optional scenario context
 * @returns {Object} Grading results with persona-flavored feedback
 */
const gradeSession = async (session, persona, scenario = null) => {
    if (!session.messages || session.messages.length === 0) {
        throw new Error('Session has no messages to grade');
    }

    // Get the grading from the LLM with persona-specific rubric
    const gradingResult = await gradeWithPersona(persona, session.messages, scenario);

    return {
        session_id: session.id,
        ...gradingResult,
        graded_at: new Date().toISOString()
    };
};

/**
 * Get the grading rubric for a persona
 * Returns persona-specific rubric or default if none defined
 * 
 * @param {Object} persona - The persona to get rubric for
 * @returns {Object} The grading rubric
 */
const getPersonaRubric = (persona) => {
    return persona.grading_rubric || getDefaultRubric();
};

/**
 * Calculate weighted score from individual criteria scores
 * 
 * @param {Array} criteriaScores - Array of {name, score, weight} objects
 * @returns {number} Weighted average score 0-100
 */
const calculateWeightedScore = (criteriaScores) => {
    if (!criteriaScores || criteriaScores.length === 0) {
        return 0;
    }

    let totalWeight = 0;
    let weightedSum = 0;

    for (const criterion of criteriaScores) {
        const weight = criterion.weight || 25;
        weightedSum += criterion.score * weight;
        totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
};

/**
 * Generate comparative feedback showing how different personas
 * would have graded the same conversation differently
 * 
 * @param {Array} gradingResults - Array of grading results from different personas
 * @returns {Object} Comparative analysis
 */
const generateComparativeAnalysis = (gradingResults) => {
    if (!gradingResults || gradingResults.length < 2) {
        throw new Error('Need at least 2 grading results to compare');
    }

    const scoreRange = {
        highest: { persona: null, score: 0 },
        lowest: { persona: null, score: 100 }
    };

    for (const result of gradingResults) {
        if (result.overall_score > scoreRange.highest.score) {
            scoreRange.highest = {
                persona: result.graded_by.persona_name,
                score: result.overall_score
            };
        }
        if (result.overall_score < scoreRange.lowest.score) {
            scoreRange.lowest = {
                persona: result.graded_by.persona_name,
                score: result.overall_score
            };
        }
    }

    return {
        score_range: scoreRange,
        variance: scoreRange.highest.score - scoreRange.lowest.score,
        insights: generateVarianceInsights(gradingResults, scoreRange)
    };
};

/**
 * Generate insights about score variance between personas
 */
const generateVarianceInsights = (gradingResults, scoreRange) => {
    const insights = [];

    if (scoreRange.variance > 20) {
        insights.push(`Your communication style resonated much better with ${scoreRange.highest.persona} than ${scoreRange.lowest.persona}.`);
    }

    if (scoreRange.variance < 10) {
        insights.push('Your communication was fairly consistent across different personality types.');
    }

    return insights;
};

/**
 * Format grading result for display
 * Converts raw grading data into user-friendly format
 * 
 * @param {Object} gradingResult - Raw grading result from gradeWithPersona
 * @returns {Object} Formatted result for UI display
 */
const formatGradingResult = (gradingResult) => {
    return {
        score: gradingResult.overall_score,
        grade: getLetterGrade(gradingResult.overall_score),
        feedback: gradingResult.overall_feedback,
        criteria: gradingResult.criteria_scores.map(c => ({
            name: c.name,
            score: c.score,
            grade: getLetterGrade(c.score),
            feedback: c.feedback
        })),
        tips: gradingResult.tips || [],
        grader: {
            name: gradingResult.graded_by.persona_name,
            style: gradingResult.graded_by.grading_style
        }
    };
};

/**
 * Convert numeric score to letter grade
 */
const getLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
};

module.exports = {
    gradeSession,
    getPersonaRubric,
    calculateWeightedScore,
    generateComparativeAnalysis,
    formatGradingResult,
    getLetterGrade
};
