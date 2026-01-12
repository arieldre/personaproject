const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { generateTokens, authenticate, refreshTokens } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const audit = require('../services/audit.service');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 }),
  body('inviteToken').optional().isString(),
];

/**
 * POST /api/auth/register
 * Register a new user (requires invite token for company users)
 */
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, inviteToken } = req.body;

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let companyId = null;
    let role = 'user';
    let invitation = null;

    // Check for invitation
    if (inviteToken) {
      const inviteResult = await query(
        `SELECT * FROM user_invitations 
         WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
        [inviteToken]
      );
      
      if (!inviteResult.rows[0]) {
        return res.status(400).json({ error: 'Invalid or expired invitation' });
      }

      invitation = inviteResult.rows[0];
      
      // Verify email matches invitation
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: 'Email does not match invitation' });
      }

      companyId = invitation.company_id;
      role = invitation.role;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, company_id`,
      [email, passwordHash, firstName, lastName, role, companyId, !!inviteToken]
    );

    const user = result.rows[0];

    // Update invitation status
    if (invitation) {
      await query(
        `UPDATE user_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
        [invitation.id]
      );
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Audit log
    await audit.log({
      userId: user.id,
      companyId: user.company_id,
      action: audit.ACTIONS.USER_REGISTER,
      entityType: 'user',
      entityId: user.id,
      req,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await query(
      `SELECT u.*, c.name as company_name, c.slug as company_slug
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Debug logging for password comparison
    console.log('Login attempt:', { email, password });
    console.log('Stored hash:', user.password_hash);
    try {
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log('bcrypt.compare result:', isValid);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err) {
      console.error('bcrypt.compare error:', err);
      return res.status(500).json({ error: 'Password comparison failed', details: err.message });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Generate tokens
    const tokens = generateTokens(user);

    // Audit log
    await audit.log({
      userId: user.id,
      companyId: user.company_id,
      action: audit.ACTIONS.USER_LOGIN,
      entityType: 'user',
      entityId: user.id,
      req,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        companyId: user.company_id,
        companyName: user.company_name,
        companySlug: user.company_slug,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', refreshTokens);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role, 
              u.company_id, u.email_verified, u.created_at,
              c.name as company_name, c.slug as company_slug, c.subscription_status,
              c.license_count, c.licenses_used
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      company: user.company_id ? {
        id: user.company_id,
        name: user.company_name,
        slug: user.company_slug,
        subscriptionStatus: user.subscription_status,
        licenseCount: user.license_count,
        licensesUsed: user.licenses_used,
      } : null,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client should delete tokens)
 */
router.post('/logout', authenticate, async (req, res) => {
  await audit.log({
    userId: req.user.id,
    companyId: req.user.company_id,
    action: audit.ACTIONS.USER_LOGOUT,
    entityType: 'user',
    entityId: req.user.id,
    req,
  });

  res.json({ message: 'Logged out successfully' });
});

/**
 * Google OAuth routes
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const tokens = generateTokens(req.user);
      
      await audit.log({
        userId: req.user.id,
        companyId: req.user.company_id,
        action: audit.ACTIONS.USER_LOGIN,
        metadata: { provider: 'google' },
        req,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      );
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

/**
 * Microsoft OAuth routes
 */
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const tokens = generateTokens(req.user);
      
      await audit.log({
        userId: req.user.id,
        companyId: req.user.company_id,
        action: audit.ACTIONS.USER_LOGIN,
        metadata: { provider: 'microsoft' },
        req,
      });

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      );
    } catch (error) {
      console.error('Microsoft callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

/**
 * GET /api/auth/invite/:token
 * Validate invitation token
 */
router.get('/invite/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, c.name as company_name, u.email as inviter_email, u.first_name as inviter_name
       FROM user_invitations i
       JOIN companies c ON i.company_id = c.id
       JOIN users u ON i.invited_by = u.id
       WHERE i.token = $1`,
      [req.params.token]
    );

    const invitation = result.rows[0];

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already used', status: invitation.status });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    res.json({
      email: invitation.email,
      role: invitation.role,
      companyName: invitation.company_name,
      inviterName: invitation.inviter_name,
      expiresAt: invitation.expires_at,
    });
  } catch (error) {
    console.error('Invite validation error:', error);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

module.exports = router;
