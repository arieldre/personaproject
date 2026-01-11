const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, requireCompanyAccess, requireAdminAccess } = require('../middleware/auth');
const { validateUUIDParams, llmLimiter } = require('../middleware/security');
const { chatWithPersona, streamChatWithPersona, findSimilarPersona } = require('../services/llm.service');
const audit = require('../services/audit.service');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/personas
 * List company personas
 */
router.get('/', requireCompanyAccess, async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin' ? req.query.companyId : req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const { status = 'active' } = req.query;

    const result = await query(
      `SELECT p.id, p.name, p.avatar_url, p.tagline, p.status, p.summary,
              p.cluster_size, p.confidence_score, p.created_at, p.generated_at,
              q.name as questionnaire_name
       FROM personas p
       LEFT JOIN questionnaires q ON p.questionnaire_id = q.id
       WHERE p.company_id = $1 AND p.status = $2
       ORDER BY p.created_at DESC`,
      [companyId, status]
    );

    res.json({ personas: result.rows });
  } catch (error) {
    console.error('List personas error:', error);
    res.status(500).json({ error: 'Failed to list personas' });
  }
});

/**
 * GET /api/personas/:id
 * Get persona details
 */
router.get('/:id', validateUUIDParams('id'), requireCompanyAccess, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, q.name as questionnaire_name
       FROM personas p
       LEFT JOIN questionnaires q ON p.questionnaire_id = q.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const persona = result.rows[0];

    // Verify company access
    if (req.user.role !== 'super_admin' && persona.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get conversation count
    const convCount = await query(
      'SELECT COUNT(*) FROM conversations WHERE persona_id = $1',
      [req.params.id]
    );

    res.json({
      ...persona,
      conversationCount: parseInt(convCount.rows[0].count),
    });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({ error: 'Failed to get persona' });
  }
});

/**
 * PUT /api/personas/:id
 * Update persona
 */
router.put(
  '/:id',
  validateUUIDParams('id'),
  requireAdminAccess,
  [
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('tagline').optional().trim().isLength({ max: 500 }),
    body('summary').optional().isObject(),
    body('extendedProfile').optional().isObject(),
    body('status').optional().isIn(['active', 'archived']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const persona = await query('SELECT * FROM personas WHERE id = $1', [req.params.id]);
      if (!persona.rows[0]) {
        return res.status(404).json({ error: 'Persona not found' });
      }

      // Verify company access
      if (req.user.role !== 'super_admin' && persona.rows[0].company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { name, tagline, summary, extendedProfile, status } = req.body;
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (tagline !== undefined) {
        updates.push(`tagline = $${paramIndex++}`);
        values.push(tagline);
      }
      if (summary) {
        updates.push(`summary = $${paramIndex++}`);
        values.push(JSON.stringify(summary));
      }
      if (extendedProfile) {
        updates.push(`extended_profile = $${paramIndex++}`);
        values.push(JSON.stringify(extendedProfile));
      }
      if (status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (updates.length === 0) {
        return res.json(persona.rows[0]);
      }

      values.push(req.params.id);
      const result = await query(
        `UPDATE personas SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      await audit.log({
        userId: req.user.id,
        companyId: persona.rows[0].company_id,
        action: audit.ACTIONS.PERSONA_UPDATE,
        entityType: 'persona',
        entityId: req.params.id,
        oldValues: persona.rows[0],
        newValues: result.rows[0],
        req,
      });

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update persona error:', error);
      res.status(500).json({ error: 'Failed to update persona' });
    }
  }
);

/**
 * POST /api/personas/find-similar
 * Find personas similar to a description
 */
router.post(
  '/find-similar',
  requireCompanyAccess,
  [body('description').trim().isLength({ min: 10, max: 2000 })],
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

      const { description } = req.body;

      // Get company personas
      const personas = await query(
        `SELECT id, name, tagline, summary
         FROM personas
         WHERE company_id = $1 AND status = 'active'`,
        [companyId]
      );

      if (personas.rows.length === 0) {
        return res.status(404).json({ error: 'No personas found for this company' });
      }

      // Find similar personas
      const results = await findSimilarPersona(description, personas.rows);

      // Save search
      await query(
        `INSERT INTO similarity_searches (company_id, user_id, description, results)
         VALUES ($1, $2, $3, $4)`,
        [companyId, req.user.id, description, JSON.stringify(results)]
      );

      // Enrich results with full persona data
      const enrichedResults = results.map(r => {
        const persona = personas.rows.find(p => p.id === r.persona_id);
        return {
          ...r,
          persona: persona ? {
            id: persona.id,
            name: persona.name,
            tagline: persona.tagline,
            summary: persona.summary,
          } : null,
        };
      });

      res.json({ results: enrichedResults });
    } catch (error) {
      console.error('Find similar error:', error);
      res.status(500).json({ error: 'Failed to find similar personas' });
    }
  }
);

/**
 * DELETE /api/personas/:id
 * Delete persona
 */
router.delete('/:id', validateUUIDParams('id'), requireAdminAccess, async (req, res) => {
  try {
    const persona = await query('SELECT * FROM personas WHERE id = $1', [req.params.id]);
    if (!persona.rows[0]) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && persona.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM personas WHERE id = $1', [req.params.id]);

    await audit.log({
      userId: req.user.id,
      companyId: persona.rows[0].company_id,
      action: audit.ACTIONS.PERSONA_DELETE,
      entityType: 'persona',
      entityId: req.params.id,
      oldValues: persona.rows[0],
      req,
    });

    res.json({ message: 'Persona deleted' });
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({ error: 'Failed to delete persona' });
  }
});

// ============================================
// CONVERSATION ROUTES
// ============================================

/**
 * GET /api/personas/:id/conversations
 * Get conversations with a persona
 */
router.get('/:id/conversations', validateUUIDParams('id'), async (req, res) => {
  try {
    const persona = await query('SELECT company_id FROM personas WHERE id = $1', [req.params.id]);
    if (!persona.rows[0]) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && persona.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Users see only their conversations, admins see all
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'company_admin';
    
    const result = await query(
      `SELECT c.*, u.email as user_email, u.first_name, u.last_name
       FROM conversations c
       JOIN users u ON c.user_id = u.id
       WHERE c.persona_id = $1 ${isAdmin ? '' : 'AND c.user_id = $2'}
       ORDER BY c.last_message_at DESC NULLS LAST`,
      isAdmin ? [req.params.id] : [req.params.id, req.user.id]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

/**
 * POST /api/personas/:id/conversations
 * Start a new conversation with a persona
 */
router.post('/:id/conversations', validateUUIDParams('id'), async (req, res) => {
  try {
    const persona = await query(
      'SELECT * FROM personas WHERE id = $1 AND status = $2',
      [req.params.id, 'active']
    );
    
    if (!persona.rows[0]) {
      return res.status(404).json({ error: 'Persona not found or not active' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && persona.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const title = req.body.title || `Conversation with ${persona.rows[0].name}`;

    const result = await query(
      `INSERT INTO conversations (persona_id, user_id, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.user.id, title]
    );

    await audit.log({
      userId: req.user.id,
      companyId: persona.rows[0].company_id,
      action: audit.ACTIONS.CONVERSATION_START,
      entityType: 'conversation',
      entityId: result.rows[0].id,
      metadata: { personaId: req.params.id },
      req,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/personas/conversations/:conversationId
 * Get conversation with messages
 */
router.get('/conversations/:conversationId', validateUUIDParams('conversationId'), async (req, res) => {
  try {
    const conversation = await query(
      `SELECT c.*, p.name as persona_name, p.company_id
       FROM conversations c
       JOIN personas p ON c.persona_id = p.id
       WHERE c.id = $1`,
      [req.params.conversationId]
    );

    if (!conversation.rows[0]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify access (own conversation or admin)
    const isOwner = conversation.rows[0].user_id === req.user.id;
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'company_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && conversation.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const messages = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.conversationId]
    );

    res.json({
      conversation: conversation.rows[0],
      messages: messages.rows,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

/**
 * POST /api/personas/conversations/:conversationId/messages
 * Send a message in a conversation
 */
router.post(
  '/conversations/:conversationId/messages',
  validateUUIDParams('conversationId'),
  llmLimiter,
  [body('content').trim().isLength({ min: 1, max: 5000 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get conversation with persona
      const conversation = await query(
        `SELECT c.*, p.*, p.id as persona_id
         FROM conversations c
         JOIN personas p ON c.persona_id = p.id
         WHERE c.id = $1`,
        [req.params.conversationId]
      );

      if (!conversation.rows[0]) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const conv = conversation.rows[0];

      // Verify ownership
      if (conv.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { content } = req.body;

      // Save user message
      await query(
        `INSERT INTO messages (conversation_id, role, content)
         VALUES ($1, 'user', $2)`,
        [req.params.conversationId, content]
      );

      // Get conversation history
      const history = await query(
        'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [req.params.conversationId]
      );

      // Generate response
      const persona = {
        name: conv.name,
        tagline: conv.tagline,
        summary: conv.summary,
        extended_profile: conv.extended_profile,
        system_prompt: conv.system_prompt,
      };

      const response = await chatWithPersona(persona, history.rows);

      // Save assistant message
      const assistantMsg = await query(
        `INSERT INTO messages (conversation_id, role, content, tokens_used)
         VALUES ($1, 'assistant', $2, $3)
         RETURNING *`,
        [req.params.conversationId, response.content, response.tokens]
      );

      // Update conversation timestamp
      await query(
        'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
        [req.params.conversationId]
      );

      res.json({
        message: assistantMsg.rows[0],
        tokens: response.tokens,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

/**
 * PUT /api/personas/conversations/:conversationId/save
 * Save conversation for persona improvement (admin only)
 */
router.put(
  '/conversations/:conversationId/save',
  validateUUIDParams('conversationId'),
  requireAdminAccess,
  [
    body('feedbackRating').optional().isInt({ min: 1, max: 5 }),
    body('feedbackNotes').optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const conversation = await query(
        `SELECT c.*, p.company_id
         FROM conversations c
         JOIN personas p ON c.persona_id = p.id
         WHERE c.id = $1`,
        [req.params.conversationId]
      );

      if (!conversation.rows[0]) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Verify company access
      if (req.user.role !== 'super_admin' && conversation.rows[0].company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { feedbackRating, feedbackNotes } = req.body;

      await query(
        `UPDATE conversations 
         SET is_saved = true, saved_by = $1, saved_at = NOW(), 
             feedback_rating = $2, feedback_notes = $3
         WHERE id = $4`,
        [req.user.id, feedbackRating, feedbackNotes, req.params.conversationId]
      );

      await audit.log({
        userId: req.user.id,
        companyId: conversation.rows[0].company_id,
        action: audit.ACTIONS.CONVERSATION_SAVE,
        entityType: 'conversation',
        entityId: req.params.conversationId,
        req,
      });

      res.json({ message: 'Conversation saved for training' });
    } catch (error) {
      console.error('Save conversation error:', error);
      res.status(500).json({ error: 'Failed to save conversation' });
    }
  }
);

/**
 * DELETE /api/personas/conversations/:conversationId
 * Delete a conversation
 */
router.delete('/conversations/:conversationId', validateUUIDParams('conversationId'), async (req, res) => {
  try {
    const conversation = await query(
      `SELECT c.*, p.company_id
       FROM conversations c
       JOIN personas p ON c.persona_id = p.id
       WHERE c.id = $1`,
      [req.params.conversationId]
    );

    if (!conversation.rows[0]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify ownership or admin
    const isOwner = conversation.rows[0].user_id === req.user.id;
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'company_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM conversations WHERE id = $1', [req.params.conversationId]);

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
