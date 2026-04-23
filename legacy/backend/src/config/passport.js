const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const { query } = require('./database');

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query(
      `SELECT u.*, c.name as company_name, c.slug as company_slug 
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.id = $1`,
      [id]
    );
    done(null, result.rows[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Find or create user from OAuth profile
const findOrCreateOAuthUser = async (provider, profile, providerIdField) => {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error('No email provided by OAuth provider');
  }

  // Check if user exists with this OAuth ID
  let result = await query(
    `SELECT * FROM users WHERE ${providerIdField} = $1`,
    [profile.id]
  );

  if (result.rows[0]) {
    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [result.rows[0].id]
    );
    return result.rows[0];
  }

  // Check if user exists with this email
  result = await query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows[0]) {
    // Link OAuth to existing account
    await query(
      `UPDATE users SET ${providerIdField} = $1, last_login_at = NOW() WHERE id = $2`,
      [profile.id, result.rows[0].id]
    );
    return result.rows[0];
  }

  // Check if there's a pending invitation for this email
  const inviteResult = await query(
    `SELECT * FROM user_invitations 
     WHERE email = $1 AND status = 'pending' AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email]
  );

  const invitation = inviteResult.rows[0];

  // Create new user
  const insertResult = await query(
    `INSERT INTO users (email, ${providerIdField}, first_name, last_name, avatar_url, role, company_id, email_verified, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
     RETURNING *`,
    [
      email,
      profile.id,
      profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      profile.photos?.[0]?.value || null,
      invitation?.role || 'user',
      invitation?.company_id || null,
    ]
  );

  // Mark invitation as accepted if exists
  if (invitation) {
    await query(
      `UPDATE user_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [invitation.id]
    );
  }

  return insertResult.rows[0];
};

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('google', profile, 'google_id');
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth configured');
} else {
  console.log('⚠️  Google OAuth not configured (missing credentials)');
}

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL,
        scope: ['user.read'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('microsoft', profile, 'microsoft_id');
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
  console.log('✅ Microsoft OAuth configured');
} else {
  console.log('⚠️  Microsoft OAuth not configured (missing credentials)');
}

module.exports = passport;
