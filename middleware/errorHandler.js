const logger = require('../config/logger');

/**
 * 404 Not Found Handler
 * Catches all requests that don't match any routes
 */
function notFoundHandler(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
}

/**
 * Global Error Handler
 * Handles all errors thrown in the application
 */
function errorHandler(err, req, res, next) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Log the error
    logger.error('Error occurred', {
        statusCode,
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.admin ? req.admin.id : 'unauthenticated'
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).render('error', {
            statusCode: 400,
            message: 'Validation Error',
            details: err.message,
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).render('error', {
            statusCode: 400,
            message: 'Invalid ID format',
            details: 'The requested resource ID is not valid',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).render('error', {
            statusCode: 401,
            message: 'Invalid token',
            details: 'Authentication token is invalid',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }

    if (err.name === 'TokenExpiredError') {
        req.flash('error', 'Your session has expired. Please login again.');
        return res.redirect('/login');
    }

    if (err.code === 11000) {
        // Duplicate key error
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).render('error', {
            statusCode: 409,
            message: 'Duplicate Entry',
            details: `A record with this ${field} already exists`,
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }

    // Handle Multer errors (file upload)
    if (err.name === 'MulterError') {
        let multerMessage = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            multerMessage = 'File is too large';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            multerMessage = 'Too many files';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            multerMessage = 'Unexpected file field';
        }
        
        req.flash('error', multerMessage);
        return res.redirect('back');
    }

    // Default error response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        // API request - return JSON
        return res.status(statusCode).json({
            success: false,
            statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                details: err 
            })
        });
    }

    // Web request - render error page
    res.status(statusCode).render('error', {
        statusCode,
        message,
        details: message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
}

/**
 * Async Route Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Development Error Handler (more verbose)
 */
function developmentErrorHandler(err, req, res, next) {
    console.error('Error Stack:', err.stack);
    res.status(err.status || 500);
    res.render('error', {
        statusCode: err.status || 500,
        message: err.message,
        details: err.message,
        error: err,
        stack: err.stack
    });
}

/**
 * Production Error Handler (less verbose, no stack traces)
 */
function productionErrorHandler(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        statusCode: err.status || 500,
        message: err.message || 'Something went wrong',
        details: err.status === 500 ? 'Internal Server Error' : err.message,
        error: {},
        stack: null
    });
}

module.exports = {
    notFoundHandler,
    errorHandler,
    asyncHandler,
    developmentErrorHandler,
    productionErrorHandler
};
