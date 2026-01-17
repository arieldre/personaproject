const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { gradeWithMultiPass } = require('../services/llm.service');
const { saveTrainingSession, getScenarioProgress, calculateImprovement } = require('../services/progress.service');
const db = require('../config/database');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/training/grade
 * Grade a training session using multi-pass grading and track progress
 */
router.post('/grade', async (req, res) => {
    try {
        const { personaId, scenarioId, messages } = req.body;

        if (!personaId || !messages || messages.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'personaId and messages are required'
            });
        }

        // Get persona with grading rubric
        const personaResult = await db.query(
            'SELECT * FROM personas WHERE id = $1',
            [personaId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Persona not found'
            });
        }

        const persona = personaResult.rows[0];

        // Format messages for grading
        const conversation = messages.map(m => ({
            role: m.role || 'user',
            content: m.content
        }));

        // Use multi-pass grading for improved accuracy
        const gradingResult = await gradeWithMultiPass(persona, conversation, { scenarioId });

        // Get progress before saving new session
        const previousProgress = await getScenarioProgress(req.user.id, scenarioId);

        // Save training session for progress tracking
        await saveTrainingSession({
            userId: req.user.id,
            personaId,
            scenarioId,
            messages: conversation,
            gradeResult: gradingResult
        });

        // Calculate improvement metrics
        const improvement = calculateImprovement(gradingResult.overall_score, previousProgress);

        // Add progress metrics to response
        const response = {
            ...gradingResult,
            progress: {
                attempts: previousProgress.attempts + 1,
                previousBest: previousProgress.bestScore,
                ...improvement
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Training grade error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to grade training session'
        });
    }
});

/**
 * POST /api/training/chat
 * Send a message in a training scenario and get LLM response
 */
router.post('/chat', async (req, res) => {
    try {
        const { personaId, messages, scenario } = req.body;

        if (!personaId || !messages || !scenario) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'personaId, messages, and scenario are required'
            });
        }

        // Get persona
        const personaResult = await db.query(
            'SELECT * FROM personas WHERE id = $1',
            [personaId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Persona not found'
            });
        }

        const persona = personaResult.rows[0];

        // Format conversation history
        const conversation = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        // Generate response with scenario context
        const { chatWithPersona } = require('../services/llm.service');
        const response = await chatWithPersona(persona, conversation, { scenario });

        res.json({
            message: response.content,
            tokens: response.tokens
        });
    } catch (error) {
        console.error('Training chat error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate response'
        });
    }
});

/**
 * GET /api/training/scenarios
 * Get all available training scenarios
 */
router.get('/scenarios', async (req, res) => {
    try {
        // Get default personas for training
        const result = await db.query(
            'SELECT id, name, tagline, vector_profile, grading_rubric FROM personas WHERE is_default = true'
        );

        const scenarios = result.rows.map(persona => ({
            persona_id: persona.id,
            persona_name: persona.name,
            persona_tagline: persona.tagline,
            archetype: persona.vector_profile?.archetype,
            grading_focus: persona.grading_rubric?.criteria?.[0]?.name || 'Communication',
            scenarios: getPersonaScenarios(persona.vector_profile?.archetype)
        }));

        res.json({ scenarios });
    } catch (error) {
        console.error('Get scenarios error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get training scenarios'
        });
    }
});

/**
 * GET /api/training/sessions
 * Get user's training history
 */
router.get('/sessions', async (req, res) => {
    try {
        // For now, return empty history (can be expanded with a training_sessions table)
        res.json({ sessions: [] });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get training sessions'
        });
    }
});

// Helper function to get scenarios for a persona archetype
function getPersonaScenarios(archetype) {
    const scenariosMap = {
        'The Hunter': [
            { id: 'hunter-easy', difficulty: 'easy', title: 'Late CRM Update', description: 'Jordan hasn\'t updated their big deals in weeks' },
            { id: 'hunter-medium', difficulty: 'medium', title: 'Commission Dispute', description: 'Jordan claims quota was unfair this quarter' },
            { id: 'hunter-hard', difficulty: 'hard', title: 'Top Performer Leaving', description: 'Jordan got a competing offer, wants counteroffer' },
        ],
        'The Craftsman': [
            { id: 'craft-easy', difficulty: 'easy', title: 'Meeting Overload', description: 'Alex refuses to attend standups' },
            { id: 'craft-medium', difficulty: 'medium', title: 'Documentation Resistance', description: 'Alex won\'t document critical system' },
            { id: 'craft-hard', difficulty: 'hard', title: 'Production Outage Blame', description: 'Alex\'s code caused downtime, being defensive' },
        ],
        'The Diplomat': [
            { id: 'diplo-easy', difficulty: 'easy', title: 'Feature Prioritization', description: 'Maya overwhelmed by conflicting requests' },
            { id: 'diplo-medium', difficulty: 'medium', title: 'Stakeholder Conflict', description: 'Engineering and Sales disagree on roadmap' },
            { id: 'diplo-hard', difficulty: 'hard', title: 'Product Launch Crisis', description: 'Major bug found day before launch' },
        ],
        'The Guardian': [
            { id: 'guard-easy', difficulty: 'easy', title: 'Benefits Confusion', description: 'Employee frustrated about policy' },
            { id: 'guard-medium', difficulty: 'medium', title: 'Harassment Complaint', description: 'Sensitive report requiring investigation' },
            { id: 'guard-hard', difficulty: 'hard', title: 'Mass Layoff Announcement', description: 'Preparing managers for reductions' },
        ],
        'The Oracle': [
            { id: 'oracle-easy', difficulty: 'easy', title: 'Data Access Request', description: 'David needs database permissions urgently' },
            { id: 'oracle-medium', difficulty: 'medium', title: 'Strategy Disagreement', description: 'David\'s analysis contradicts exec decision' },
            { id: 'oracle-hard', difficulty: 'hard', title: 'Model Bias Discovery', description: 'AI model has discriminatory patterns' },
        ],
    };

    return scenariosMap[archetype] || [];
}

module.exports = router;
