require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import configurations and utilities
const { connectToDatabase } = require('./config/database');
const logger = require('./config/logger');
const flashMessages = require('./middleware/flashMessages');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes/routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// SECURITY & RATE LIMITING
// ============================================

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to API routes
app.use('/api/', apiLimiter);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// ============================================
// VIEW ENGINE & STATIC FILES
// ============================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// BODY PARSING & COOKIE MIDDLEWARE
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// SESSION & FLASH MESSAGES
// ============================================

app.use(session({
    secret: process.env.SESSION_SECRET || 'shersher-admin-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(flash());
app.use(flashMessages);

// ============================================
// REQUEST LOGGING
// ============================================

app.use((req, res, next) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// ============================================
// ROUTES
// ============================================

// Apply login rate limiter to login routes
app.use('/login', loginLimiter);

app.use('/', routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

(async () => {
    try {
        logger.info('Starting Shersher Admin Application...');
        
        // Connect to MongoDB
        await connectToDatabase();
        logger.info('Database connection established');
        
        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
            console.log(`✓ Server is running on http://localhost:${PORT}`);
            console.log(`✓ Environment: ${NODE_ENV}`);
            console.log(`✓ Database: Connected`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);
            
            server.close(async () => {
                logger.info('HTTP server closed');
                
                try {
                    await require('mongoose').connection.close();
                    logger.info('Database connection closed');
                    process.exit(0);
                } catch (err) {
                    logger.error('Error during shutdown', err);
                    process.exit(1);
                }
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception', err);
            gracefulShutdown('uncaughtException');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection', { reason, promise });
            gracefulShutdown('unhandledRejection');
        });

    } catch (err) {
        logger.error('Failed to start application', err);
        console.error('✗ Failed to start application:', err.message);
        process.exit(1);
    }
})();

module.exports = app;
