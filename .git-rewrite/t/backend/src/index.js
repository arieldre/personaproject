require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

// Import configurations
const passport = require('./config/passport');
const { pool } = require('./config/database');

// Import middleware
const {
  helmetConfig,
  sanitizeInput,
  apiLimiter,
  errorHandler,
  notFoundHandler,
  hpp,
  requestLogger,
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth.routes');
const companiesRoutes = require('./routes/companies.routes');
const usersRoutes = require('./routes/users.routes');
const questionnairesRoutes = require('./routes/questionnaires.routes');
const personasRoutes = require('./routes/personas.routes');

// Import services
const { initializeTransporter } = require('./services/email.service');
const { testConnection: testLLM } = require('./services/llm.service');

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(helmetConfig);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Parameter Pollution protection
app.use(hpp);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api/', apiLimiter);

// Passport initialization
app.use(passport.initialize());

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// =====================================================
// API ROUTES
// =====================================================

app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/questionnaires', questionnairesRoutes);
app.use('/api/personas', personasRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Persona Platform API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      companies: '/api/companies',
      users: '/api/users',
      questionnaires: '/api/questionnaires',
      personas: '/api/personas',
    },
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =====================================================
// SERVER STARTUP
// =====================================================

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');

    // Initialize email service
    initializeTransporter();

    // Test LLM connection (optional)
    if (process.env.GROQ_API_KEY) {
      const llmStatus = await testLLM();
      if (llmStatus.success) {
        console.log('✅ LLM connection established');
      } else {
        console.log('⚠️  LLM connection failed:', llmStatus.error);
      }
    } else {
      console.log('⚠️  GROQ_API_KEY not set - LLM features disabled');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Persona Platform API Server                           ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   Port: ${PORT}                                               ║
║   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
