const express = require('express');
const { body, validationResult } = require('express-validator');
const slugify = require('slugify');
const { query, transaction } = require('../config/database');
const { authenticate, authorize, requireCompanyAccess, requireAdminAccess } = require('../middleware/auth');
const { validateUUIDParams } = require('../middleware/security');
const audit = require('../services/audit.service');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/companies
 * List all companies (super admin only)
 */
router.get('/', authorize('super_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE name ILIKE $${paramIndex++} OR slug ILIKE $${paramIndex++}`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += whereClause ? ` AND subscription_status = $${paramIndex++}` : `WHERE subscription_status = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM companies ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count,
              (SELECT COUNT(*) FROM personas WHERE company_id = c.id) as persona_count
       FROM companies c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    res.json({
      companies: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    });
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'Failed to list companies' });
  }
});

/**
 * POST /api/companies
 * Create a new company (super admin only)
 */
router.post(
  '/',
  authorize('super_admin'),
  [
    body('name').trim().isLength({ min: 2, max: 255 }),
    body('industry').optional().trim().isLength({ max: 100 }),
    body('companySize').optional().isIn(['small', 'medium', 'large', 'enterprise']),
    body('licenseCount').optional().isInt({ min: 1, max: 10000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, industry, companySize, licenseCount = 5 } = req.body;

      // Generate unique slug
      let slug = slugify(name, { lower: true, strict: true });
      const existingSlug = await query('SELECT id FROM companies WHERE slug = $1', [slug]);
      if (existingSlug.rows[0]) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const result = await query(
        `INSERT INTO companies (name, slug, industry, company_size, license_count, subscription_status, created_by)
         VALUES ($1, $2, $3, $4, $5, 'active', $6)
         RETURNING *`,
        [name, slug, industry, companySize, licenseCount, req.user.id]
      );

      const company = result.rows[0];

      await audit.log({
        userId: req.user.id,
        companyId: company.id,
        action: audit.ACTIONS.COMPANY_CREATE,
        entityType: 'company',
        entityId: company.id,
        newValues: company,
        req,
      });

      res.status(201).json(company);
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  }
);

/**
 * GET /api/companies/:id
 * Get company details
 */
router.get('/:id', validateUUIDParams('id'), requireCompanyAccess, async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin' ? req.params.id : req.user.company_id;

    const result = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count,
              (SELECT COUNT(*) FROM personas WHERE company_id = c.id AND status = 'active') as persona_count,
              (SELECT COUNT(*) FROM questionnaires WHERE company_id = c.id) as questionnaire_count
       FROM companies c
       WHERE c.id = $1`,
      [companyId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

/**
 * PUT /api/companies/:id
 * Update company details
 */
router.put(
  '/:id',
  validateUUIDParams('id'),
  requireAdminAccess,
  [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('industry').optional().trim().isLength({ max: 100 }),
    body('companySize').optional().isIn(['small', 'medium', 'large', 'enterprise']),
    body('settings').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const companyId = req.user.role === 'super_admin' ? req.params.id : req.user.company_id;
      
      // Get current values
      const current = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
      if (!current.rows[0]) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const { name, industry, companySize, settings } = req.body;
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (industry !== undefined) {
        updates.push(`industry = $${paramIndex++}`);
        values.push(industry);
      }
      if (companySize) {
        updates.push(`company_size = $${paramIndex++}`);
        values.push(companySize);
      }
      if (settings) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(settings));
      }

      if (updates.length === 0) {
        return res.json(current.rows[0]);
      }

      values.push(companyId);
      const result = await query(
        `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      await audit.log({
        userId: req.user.id,
        companyId,
        action: audit.ACTIONS.COMPANY_UPDATE,
        entityType: 'company',
        entityId: companyId,
        oldValues: current.rows[0],
        newValues: result.rows[0],
        req,
      });

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  }
);

/**
 * PUT /api/companies/:id/licenses
 * Update company license count (super admin only)
 */
router.put(
  '/:id/licenses',
  validateUUIDParams('id'),
  authorize('super_admin'),
  [
    body('licenseCount').isInt({ min: 1, max: 10000 }),
    body('subscriptionStatus').optional().isIn(['active', 'inactive', 'suspended', 'trial']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { licenseCount, subscriptionStatus } = req.body;
      const companyId = req.params.id;

      // Check current usage
      const current = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
      if (!current.rows[0]) {
        return res.status(404).json({ error: 'Company not found' });
      }

      if (licenseCount < current.rows[0].licenses_used) {
        return res.status(400).json({
          error: `Cannot reduce licenses below current usage (${current.rows[0].licenses_used})`,
        });
      }

      const updates = ['license_count = $1'];
      const values = [licenseCount];

      if (subscriptionStatus) {
        updates.push('subscription_status = $2');
        values.push(subscriptionStatus);
      }

      values.push(companyId);
      const result = await query(
        `UPDATE companies SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );

      await audit.log({
        userId: req.user.id,
        companyId,
        action: audit.ACTIONS.LICENSE_UPDATE,
        entityType: 'company',
        entityId: companyId,
        oldValues: { licenseCount: current.rows[0].license_count },
        newValues: { licenseCount },
        req,
      });

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update licenses error:', error);
      res.status(500).json({ error: 'Failed to update licenses' });
    }
  }
);

/**
 * GET /api/companies/:id/users
 * List company users
 */
router.get('/:id/users', validateUUIDParams('id'), requireAdminAccess, async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin' ? req.params.id : req.user.company_id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM users WHERE company_id = $1',
      [companyId]
    );

    const result = await query(
      `SELECT id, email, first_name, last_name, avatar_url, role, is_active, 
              email_verified, last_login_at, created_at
       FROM users
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List company users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /api/companies/:id/stats
 * Get company statistics
 */
router.get('/:id/stats', validateUUIDParams('id'), requireCompanyAccess, async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin' ? req.params.id : req.user.company_id;

    const stats = await query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE company_id = $1) as total_users,
        (SELECT COUNT(*) FROM users WHERE company_id = $1 AND is_active = true) as active_users,
        (SELECT COUNT(*) FROM personas WHERE company_id = $1 AND status = 'active') as active_personas,
        (SELECT COUNT(*) FROM questionnaires WHERE company_id = $1) as total_questionnaires,
        (SELECT COUNT(*) FROM questionnaires WHERE company_id = $1 AND status = 'active') as active_questionnaires,
        (SELECT COUNT(*) FROM conversations c JOIN personas p ON c.persona_id = p.id WHERE p.company_id = $1) as total_conversations,
        (SELECT COUNT(*) FROM conversations c JOIN personas p ON c.persona_id = p.id WHERE p.company_id = $1 AND c.created_at > NOW() - INTERVAL '7 days') as conversations_this_week`,
      [companyId]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * DELETE /api/companies/:id
 * Delete company (super admin only)
 */
router.delete('/:id', validateUUIDParams('id'), authorize('super_admin'), async (req, res) => {
  try {
    const companyId = req.params.id;

    // Get company info before deletion
    const company = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!company.rows[0]) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Delete company (cascades to users, questionnaires, personas, etc.)
    await query('DELETE FROM companies WHERE id = $1', [companyId]);

    await audit.log({
      userId: req.user.id,
      companyId,
      action: audit.ACTIONS.COMPANY_DELETE,
      entityType: 'company',
      entityId: companyId,
      oldValues: company.rows[0],
      req,
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

module.exports = router;
