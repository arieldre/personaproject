const express = require('express');
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const { query, transaction } = require('../config/database');
const { authenticate, requireCompanyAccess, requireAdminAccess } = require('../middleware/auth');
const { validateUUIDParams, questionnaireLimiter } = require('../middleware/security');
const { generatePersonasFromResponses } = require('../services/llm.service');
const audit = require('../services/audit.service');

const router = express.Router();

/**
 * GET /api/questionnaires/templates
 * Get available questionnaire templates
 */
router.get('/templates', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, is_default, 
              jsonb_array_length(questions) as question_count,
              created_at
       FROM questionnaire_templates
       ORDER BY is_default DESC, created_at DESC`
    );
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

/**
 * GET /api/questionnaires/templates/:id
 * Get template with questions
 */
router.get('/templates/:id', authenticate, validateUUIDParams('id'), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM questionnaire_templates WHERE id = $1',
      [req.params.id]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

/**
 * GET /api/questionnaires
 * List company questionnaires
 */
router.get('/', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin' ? req.query.companyId : req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE company_id = $1';
    const params = [companyId];

    if (status) {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT q.*, t.name as template_name,
              (SELECT COUNT(*) FROM questionnaire_responses WHERE questionnaire_id = q.id AND status = 'completed') as completed_responses
       FROM questionnaires q
       LEFT JOIN questionnaire_templates t ON q.template_id = t.id
       ${whereClause}
       ORDER BY q.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ questionnaires: result.rows });
  } catch (error) {
    console.error('List questionnaires error:', error);
    res.status(500).json({ error: 'Failed to list questionnaires' });
  }
});

/**
 * POST /api/questionnaires
 * Create a new questionnaire
 */
router.post(
  '/',
  authenticate,
  requireAdminAccess,
  [
    body('name').trim().isLength({ min: 2, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('templateId').optional().isUUID(),
    body('customQuestions').optional().isArray(),
    body('isAnonymous').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const companyId = req.user.role === 'super_admin' ? req.body.companyId : req.user.company_id;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID required' });
      }

      const { name, description, templateId, customQuestions = [], isAnonymous = false } = req.body;

      // Generate unique access code
      const accessCode = nanoid(10).toUpperCase();

      const result = await query(
        `INSERT INTO questionnaires (company_id, template_id, name, description, custom_questions, is_anonymous, access_code, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [companyId, templateId || null, name, description, JSON.stringify(customQuestions), isAnonymous, accessCode, req.user.id]
      );

      await audit.log({
        userId: req.user.id,
        companyId,
        action: audit.ACTIONS.QUESTIONNAIRE_CREATE,
        entityType: 'questionnaire',
        entityId: result.rows[0].id,
        newValues: result.rows[0],
        req,
      });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create questionnaire error:', error);
      res.status(500).json({ error: 'Failed to create questionnaire' });
    }
  }
);

/**
 * GET /api/questionnaires/:id
 * Get questionnaire details
 */
router.get('/:id', authenticate, validateUUIDParams('id'), requireCompanyAccess, async (req, res) => {
  try {
    const result = await query(
      `SELECT q.*, t.questions as template_questions, t.name as template_name
       FROM questionnaires q
       LEFT JOIN questionnaire_templates t ON q.template_id = t.id
       WHERE q.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    const questionnaire = result.rows[0];

    // Verify company access
    if (req.user.role !== 'super_admin' && questionnaire.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Merge template questions with custom questions
    const allQuestions = [
      ...(questionnaire.template_questions || []),
      ...(questionnaire.custom_questions || []),
    ];

    res.json({
      ...questionnaire,
      questions: allQuestions,
    });
  } catch (error) {
    console.error('Get questionnaire error:', error);
    res.status(500).json({ error: 'Failed to get questionnaire' });
  }
});

/**
 * PUT /api/questionnaires/:id
 * Update questionnaire
 */
router.put(
  '/:id',
  authenticate,
  validateUUIDParams('id'),
  requireAdminAccess,
  [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('customQuestions').optional().isArray(),
    body('status').optional().isIn(['draft', 'active', 'closed']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [req.params.id]);
      if (!questionnaire.rows[0]) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }

      // Verify company access
      if (req.user.role !== 'super_admin' && questionnaire.rows[0].company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { name, description, customQuestions, status } = req.body;
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (customQuestions) {
        updates.push(`custom_questions = $${paramIndex++}`);
        values.push(JSON.stringify(customQuestions));
      }
      if (status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);

        if (status === 'active') {
          updates.push(`starts_at = COALESCE(starts_at, NOW())`);
        } else if (status === 'closed') {
          updates.push(`ends_at = NOW()`);
        }
      }

      if (updates.length === 0) {
        return res.json(questionnaire.rows[0]);
      }

      values.push(req.params.id);
      const result = await query(
        `UPDATE questionnaires SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      const action = status === 'active' ? audit.ACTIONS.QUESTIONNAIRE_PUBLISH 
                   : status === 'closed' ? audit.ACTIONS.QUESTIONNAIRE_CLOSE 
                   : audit.ACTIONS.QUESTIONNAIRE_UPDATE;

      await audit.log({
        userId: req.user.id,
        companyId: questionnaire.rows[0].company_id,
        action,
        entityType: 'questionnaire',
        entityId: req.params.id,
        oldValues: questionnaire.rows[0],
        newValues: result.rows[0],
        req,
      });

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update questionnaire error:', error);
      res.status(500).json({ error: 'Failed to update questionnaire' });
    }
  }
);

/**
 * GET /api/questionnaires/access/:code
 * Get questionnaire by access code (public - for respondents)
 */
router.get('/access/:code', async (req, res) => {
  try {
    const result = await query(
      `SELECT q.id, q.name, q.description, q.is_anonymous, q.status,
              t.questions as template_questions, q.custom_questions,
              c.name as company_name
       FROM questionnaires q
       LEFT JOIN questionnaire_templates t ON q.template_id = t.id
       JOIN companies c ON q.company_id = c.id
       WHERE q.access_code = $1`,
      [req.params.code.toUpperCase()]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    const questionnaire = result.rows[0];

    if (questionnaire.status !== 'active') {
      return res.status(400).json({ error: 'Questionnaire is not active' });
    }

    const allQuestions = [
      ...(questionnaire.template_questions || []),
      ...(questionnaire.custom_questions || []),
    ];

    res.json({
      id: questionnaire.id,
      name: questionnaire.name,
      description: questionnaire.description,
      companyName: questionnaire.company_name,
      isAnonymous: questionnaire.is_anonymous,
      questions: allQuestions,
    });
  } catch (error) {
    console.error('Get questionnaire by code error:', error);
    res.status(500).json({ error: 'Failed to get questionnaire' });
  }
});

/**
 * POST /api/questionnaires/:id/responses
 * Submit questionnaire response (public)
 */
router.post(
  '/:id/responses',
  validateUUIDParams('id'),
  questionnaireLimiter,
  [
    body('answers').isObject(),
    body('respondentEmail').optional().isEmail(),
    body('respondentName').optional().trim().isLength({ max: 255 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get questionnaire
      const questionnaire = await query(
        'SELECT * FROM questionnaires WHERE id = $1 AND status = $2',
        [req.params.id, 'active']
      );

      if (!questionnaire.rows[0]) {
        return res.status(404).json({ error: 'Questionnaire not found or not active' });
      }

      const { answers, respondentEmail, respondentName } = req.body;

      const result = await query(
        `INSERT INTO questionnaire_responses 
         (questionnaire_id, respondent_email, respondent_name, answers, status, completed_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, 'completed', NOW(), $5, $6)
         RETURNING id`,
        [
          req.params.id,
          questionnaire.rows[0].is_anonymous ? null : respondentEmail,
          questionnaire.rows[0].is_anonymous ? null : respondentName,
          JSON.stringify(answers),
          req.ip,
          req.get('user-agent'),
        ]
      );

      await audit.log({
        companyId: questionnaire.rows[0].company_id,
        action: audit.ACTIONS.RESPONSE_SUBMIT,
        entityType: 'questionnaire_response',
        entityId: result.rows[0].id,
        req,
      });

      res.status(201).json({ 
        message: 'Response submitted successfully',
        responseId: result.rows[0].id,
      });
    } catch (error) {
      console.error('Submit response error:', error);
      res.status(500).json({ error: 'Failed to submit response' });
    }
  }
);

/**
 * GET /api/questionnaires/:id/responses
 * Get questionnaire responses (admin only)
 */
router.get('/:id/responses', authenticate, validateUUIDParams('id'), requireAdminAccess, async (req, res) => {
  try {
    const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [req.params.id]);
    if (!questionnaire.rows[0]) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && questionnaire.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, respondent_email, respondent_name, status, answers, completed_at, created_at
       FROM questionnaire_responses
       WHERE questionnaire_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM questionnaire_responses WHERE questionnaire_id = $1',
      [req.params.id]
    );

    res.json({
      responses: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to get responses' });
  }
});

/**
 * POST /api/questionnaires/:id/generate-personas
 * Generate personas from questionnaire responses
 */
router.post(
  '/:id/generate-personas',
  authenticate,
  validateUUIDParams('id'),
  requireAdminAccess,
  [body('numPersonas').optional().isInt({ min: 3, max: 10 })],
  async (req, res) => {
    try {
      const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [req.params.id]);
      if (!questionnaire.rows[0]) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }

      // Verify company access
      if (req.user.role !== 'super_admin' && questionnaire.rows[0].company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get completed responses
      const responses = await query(
        `SELECT answers FROM questionnaire_responses 
         WHERE questionnaire_id = $1 AND status = 'completed'`,
        [req.params.id]
      );

      if (responses.rows.length < 5) {
        return res.status(400).json({ 
          error: 'Not enough responses',
          message: 'Need at least 5 completed responses to generate personas',
          current: responses.rows.length,
        });
      }

      const numPersonas = req.body.numPersonas || Math.min(Math.max(Math.floor(responses.rows.length / 5), 3), 10);

      // Generate personas using LLM
      const generatedPersonas = await generatePersonasFromResponses(
        responses.rows.map(r => ({ answers: r.answers })),
        numPersonas
      );

      // Save personas to database
      const savedPersonas = [];
      for (let i = 0; i < generatedPersonas.length; i++) {
        const p = generatedPersonas[i];
        const result = await query(
          `INSERT INTO personas 
           (company_id, questionnaire_id, name, tagline, status, summary, extended_profile, system_prompt, cluster_id, cluster_size, confidence_score, generated_at)
           VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $9, $10, NOW())
           RETURNING *`,
          [
            questionnaire.rows[0].company_id,
            req.params.id,
            p.name,
            p.tagline,
            JSON.stringify(p.summary),
            JSON.stringify(p.extended_profile),
            p.system_prompt,
            i,
            p.cluster_size,
            p.confidence_score,
          ]
        );
        savedPersonas.push(result.rows[0]);
      }

      await audit.log({
        userId: req.user.id,
        companyId: questionnaire.rows[0].company_id,
        action: audit.ACTIONS.PERSONA_GENERATE,
        entityType: 'questionnaire',
        entityId: req.params.id,
        metadata: { personaCount: savedPersonas.length },
        req,
      });

      res.status(201).json({
        message: 'Personas generated successfully',
        personas: savedPersonas,
      });
    } catch (error) {
      console.error('Generate personas error:', error);
      res.status(500).json({ error: 'Failed to generate personas' });
    }
  }
);

/**
 * DELETE /api/questionnaires/:id
 * Delete questionnaire
 */
router.delete('/:id', authenticate, validateUUIDParams('id'), requireAdminAccess, async (req, res) => {
  try {
    const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [req.params.id]);
    if (!questionnaire.rows[0]) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && questionnaire.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM questionnaires WHERE id = $1', [req.params.id]);

    await audit.log({
      userId: req.user.id,
      companyId: questionnaire.rows[0].company_id,
      action: audit.ACTIONS.QUESTIONNAIRE_DELETE,
      entityType: 'questionnaire',
      entityId: req.params.id,
      oldValues: questionnaire.rows[0],
      req,
    });

    res.json({ message: 'Questionnaire deleted' });
  } catch (error) {
    console.error('Delete questionnaire error:', error);
    res.status(500).json({ error: 'Failed to delete questionnaire' });
  }
});

module.exports = router;
