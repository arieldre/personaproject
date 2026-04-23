const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Generate access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

// Generate refresh token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Generate both tokens
const generateTokens = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
});

// Verify access token middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      // Get fresh user data
      const result = await query(
        `SELECT u.*, c.name as company_name, c.slug as company_slug, c.subscription_status
         FROM users u 
         LEFT JOIN companies c ON u.company_id = c.id 
         WHERE u.id = $1 AND u.is_active = true`,
        [decoded.id]
      );

      if (!result.rows[0]) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      req.user = result.rows[0];
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Verify refresh token and issue new tokens
const refreshTokens = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Get user
      const result = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (!result.rows[0]) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const user = result.rows[0];
      const tokens = generateTokens(user);

      res.json(tokens);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Company access middleware (ensures user can only access their company's data)
const requireCompanyAccess = async (req, res, next) => {
  try {
    // Super admin can access any company
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Get company_id from route params or query
    const companyId = req.params.companyId || req.query.companyId || req.body.company_id;

    if (!companyId) {
      // If no company specified, use user's company
      if (!req.user.company_id) {
        return res.status(403).json({ error: 'No company associated with user' });
      }
      req.companyId = req.user.company_id;
      return next();
    }

    // Verify user belongs to requested company
    if (req.user.company_id !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    req.companyId = companyId;
    next();
  } catch (error) {
    console.error('Company access middleware error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Check if user is company admin or super admin
const requireAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'super_admin' && req.user.role !== 'company_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  authenticate,
  refreshTokens,
  authorize,
  requireCompanyAccess,
  requireAdminAccess,
};
