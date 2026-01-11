const express = require('express');
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const { query } = require('../config/database');
const { authenticate, authorize, requireCompanyAccess, requireAdminAccess } = require('../middleware/auth');
const { validateUUIDParams } = require('../middleware/security');
const { sendInvitationEmail } = require('../services/email.service');
const audit = require('../services/audit.service');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/users
 * List users (admin sees their company, super admin sees all)
 */
router.get('/', requireAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, companyId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // Super admin can filter by company, others see only their company
    if (req.user.role === 'super_admin') {
      if (companyId) {
        whereClause = `WHERE u.company_id = $${paramIndex++}`;
        params.push(companyId);
      }
    } else {
      whereClause = `WHERE u.company_id = $${paramIndex++}`;
      params.push(req.user.company_id);
    }

    if (search) {
      const searchCondition = `(u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      whereClause += whereClause ? ` AND ${searchCondition}` : `WHERE ${searchCondition}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role, 
              u.is_active, u.email_verified, u.last_login_at, u.created_at,
              c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * POST /api/users/invite
 * Invite a user to the company
 */
router.post(
  '/invite',
  requireAdminAccess,
  [
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'company_admin']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, role = 'user' } = req.body;
      const companyId = req.user.company_id;

      // Super admin can't invite without a company
      if (req.user.role === 'super_admin' && !req.body.companyId) {
        return res.status(400).json({ error: 'Company ID required for super admin invites' });
      }

      const targetCompanyId = req.user.role === 'super_admin' ? req.body.companyId : companyId;

      // Check if user already exists in this company
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND company_id = $2',
        [email, targetCompanyId]
      );
      if (existingUser.rows[0]) {
        return res.status(409).json({ error: 'User already exists in this company' });
      }

      // Check license availability
      const company = await query(
        'SELECT * FROM companies WHERE id = $1',
        [targetCompanyId]
      );
      if (!company.rows[0]) {
        return res.status(404).json({ error: 'Company not found' });
      }
      if (company.rows[0].licenses_used >= company.rows[0].license_count) {
        return res.status(400).json({ error: 'No licenses available' });
      }

      // Check for existing pending invitation
      const existingInvite = await query(
        `SELECT id FROM user_invitations 
         WHERE email = $1 AND company_id = $2 AND status = 'pending' AND expires_at > NOW()`,
        [email, targetCompanyId]
      );
      if (existingInvite.rows[0]) {
        return res.status(409).json({ error: 'Invitation already sent to this email' });
      }

      // Create invitation
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const result = await query(
        `INSERT INTO user_invitations (email, company_id, invited_by, role, token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [email, targetCompanyId, req.user.id, role, token, expiresAt]
      );

      // Send invitation email
      const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;
      await sendInvitationEmail({
        to: email,
        inviterName: `${req.user.first_name} ${req.user.last_name}`,
        companyName: company.rows[0].name,
        inviteLink,
        role,
      });

      await audit.log({
        userId: req.user.id,
        companyId: targetCompanyId,
        action: audit.ACTIONS.USER_INVITE,
        entityType: 'invitation',
        entityId: result.rows[0].id,
        newValues: { email, role },
        req,
      });

      res.status(201).json({
        message: 'Invitation sent successfully',
        invitation: {
          id: result.rows[0].id,
          email,
          role,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  }
);

/**
 * GET /api/users/invitations
 * List pending invitations for company
 */
router.get('/invitations', requireAdminAccess, async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin' ? req.query.companyId : req.user.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const result = await query(
      `SELECT i.*, u.email as inviter_email, u.first_name as inviter_name
       FROM user_invitations i
       JOIN users u ON i.invited_by = u.id
       WHERE i.company_id = $1
       ORDER BY i.created_at DESC`,
      [companyId]
    );

    res.json({ invitations: result.rows });
  } catch (error) {
    console.error('List invitations error:', error);
    res.status(500).json({ error: 'Failed to list invitations' });
  }
});

/**
 * DELETE /api/users/invitations/:id
 * Revoke an invitation
 */
router.delete('/invitations/:id', validateUUIDParams('id'), requireAdminAccess, async (req, res) => {
  try {
    const invitation = await query(
      'SELECT * FROM user_invitations WHERE id = $1',
      [req.params.id]
    );

    if (!invitation.rows[0]) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Verify company access
    if (req.user.role !== 'super_admin' && invitation.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query(
      `UPDATE user_invitations SET status = 'revoked' WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: 'Invitation revoked' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    res.status(500).json({ error: 'Failed to revoke invitation' });
  }
});

/**
 * GET /api/users/:id
 * Get user details
 */
router.get('/:id', validateUUIDParams('id'), async (req, res) => {
  try {
    // Users can get their own info, admins can get company users
    const isOwnProfile = req.params.id === req.user.id;
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'company_admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role,
              u.is_active, u.email_verified, u.last_login_at, u.created_at,
              c.id as company_id, c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Company admins can only see users in their company
    if (req.user.role === 'company_admin' && result.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put(
  '/:id',
  validateUUIDParams('id'),
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
    body('avatarUrl').optional().isURL(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isOwnProfile = req.params.id === req.user.id;
      const isAdmin = req.user.role === 'super_admin' || req.user.role === 'company_admin';

      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { firstName, lastName, avatarUrl } = req.body;
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (firstName) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
      }
      if (lastName) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
      }
      if (avatarUrl !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(avatarUrl);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(req.params.id);
      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, email, first_name, last_name, avatar_url, role`,
        values
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

/**
 * PUT /api/users/:id/status
 * Activate/deactivate user (admin only)
 */
router.put(
  '/:id/status',
  validateUUIDParams('id'),
  requireAdminAccess,
  [body('isActive').isBoolean()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { isActive } = req.body;
      const userId = req.params.id;

      // Get user
      const user = await query('SELECT * FROM users WHERE id = $1', [userId]);
      if (!user.rows[0]) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Company admins can only manage their company's users
      if (req.user.role === 'company_admin' && user.rows[0].company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Can't deactivate yourself
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own status' });
      }

      // Can't deactivate super admin
      if (user.rows[0].role === 'super_admin') {
        return res.status(400).json({ error: 'Cannot deactivate super admin' });
      }

      await query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);

      await audit.log({
        userId: req.user.id,
        companyId: user.rows[0].company_id,
        action: audit.ACTIONS.USER_UPDATE,
        entityType: 'user',
        entityId: userId,
        oldValues: { isActive: user.rows[0].is_active },
        newValues: { isActive },
        req,
      });

      res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }
);

/**
 * PUT /api/users/:id/role
 * Change user role (admin only)
 */
router.put(
  '/:id/role',
  validateUUIDParams('id'),
  requireAdminAccess,
  [body('role').isIn(['user', 'company_admin'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { role } = req.body;
      const userId = req.params.id;

      // Get user
      const user = await query('SELECT * FROM users WHERE id = $1', [userId]);
      if (!user.rows[0]) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Company admins can only manage their company's users
      if (req.user.role === 'company_admin' && user.rows[0].company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Can't change super admin role
      if (user.rows[0].role === 'super_admin') {
        return res.status(400).json({ error: 'Cannot change super admin role' });
      }

      await query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

      await audit.log({
        userId: req.user.id,
        companyId: user.rows[0].company_id,
        action: audit.ACTIONS.USER_UPDATE,
        entityType: 'user',
        entityId: userId,
        oldValues: { role: user.rows[0].role },
        newValues: { role },
        req,
      });

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

module.exports = router;
