const { query } = require('../config/database');

/**
 * Save a training session attempt
 */
const saveTrainingSession = async ({ userId, personaId, scenarioId, messages, gradeResult
}) => {
    try {
        const result = await query(
            `INSERT INTO training_sessions (user_id, persona_id, scenario_id, messages, grade_result, overall_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [
                userId,
                personaId,
                scenarioId,
                JSON.stringify(messages),
                JSON.stringify(gradeResult),
                gradeResult.overall_score
            ]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Save training session error:', error);
        throw error;
    }
};

/**
 * Get progress metrics for a specific scenario
 */
const getScenarioProgress = async (userId, scenarioId) => {
    try {
        const result = await query(
            `SELECT 
        COUNT(*) as attempts,
        MAX(overall_score) as best_score,
        AVG(overall_score)::integer as average_score,
        MIN(created_at) as first_attempt,
        MAX(created_at) as last_attempt
       FROM training_sessions
       WHERE user_id = $1 AND scenario_id = $2`,
            [userId, scenarioId]
        );

        const stats = result.rows[0];

        // Get recent sessions for trend analysis
        const recentSessions = await query(
            `SELECT overall_score, created_at
       FROM training_sessions
       WHERE user_id = $1 AND scenario_id = $2
       ORDER BY created_at DESC
       LIMIT 5`,
            [userId, scenarioId]
        );

        return {
            attempts: parseInt(stats.attempts) || 0,
            bestScore: stats.best_score || null,
            averageScore: stats.average_score || null,
            firstAttempt: stats.first_attempt,
            lastAttempt: stats.last_attempt,
            recentScores: recentSessions.rows.map(s => s.overall_score)
        };
    } catch (error) {
        console.error('Get scenario progress error:', error);
        return { attempts: 0, bestScore: null, averageScore: null, recentScores: [] };
    }
};

/**
 * Calculate improvement from previous attempt
 */
const calculateImprovement = (currentScore, progress) => {
    if (!progress || progress.attempts === 0) {
        return { isFirstAttempt: true };
    }

    const previousScore = progress.recentScores[1]; // Second most recent (first is current)
    const improvement = previousScore ? currentScore - previousScore : 0;

    return {
        isFirstAttempt: false,
        previousScore,
        improvement,
        isImprovement: improvement > 0,
        bestScore: progress.bestScore,
        beatsBest: progress.bestScore && currentScore > progress.bestScore
    };
};

/**
 * Get overall user progress across all scenarios
 */
const getUserOverallProgress = async (userId) => {
    try {
        const result = await query(
            `SELECT 
        COUNT(DISTINCT scenario_id) as scenarios_attempted,
        COUNT(*) as total_attempts,
        AVG(overall_score)::integer as overall_average,
        MAX(overall_score) as highest_score
       FROM training_sessions
       WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Get user progress error:', error);
        return null;
    }
};

module.exports = {
    saveTrainingSession,
    getScenarioProgress,
    calculateImprovement,
    getUserOverallProgress
};
