const { body, validationResult } = require('express-validator');

/**
 * Validation middleware that checks for validation errors
 * and returns a 400 response if any exist
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        req.flash('error', errorMessages);
        return res.redirect('back');
    }
    next();
};

/**
 * Validation rules for admin registration
 */
const validateAdminRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase and one lowercase letter'),
    
    handleValidationErrors
];

/**
 * Validation rules for admin login
 */
const validateAdminLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    handleValidationErrors
];

/**
 * Validation rules for user creation
 */
const validateUserCreation = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['visitor', 'tour-company']).withMessage('Role must be either visitor or tour-company'),
    
    handleValidationErrors
];

/**
 * Validation rules for tour package creation
 */
const validateTourPackage = [
    body('name')
        .trim()
        .notEmpty().withMessage('Package name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Package name must be between 3 and 100 characters'),
    
    body('city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters'),
    
    body('country')
        .trim()
        .notEmpty().withMessage('Country is required')
        .isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters'),
    
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    
    body('type')
        .trim()
        .notEmpty().withMessage('Package type is required'),
    
    body('adultCount')
        .notEmpty().withMessage('Adult count is required')
        .isInt({ min: 1 }).withMessage('Adult count must be at least 1'),
    
    body('childCount')
        .notEmpty().withMessage('Child count is required')
        .isInt({ min: 0 }).withMessage('Child count must be 0 or greater'),
    
    body('pricePerNight')
        .notEmpty().withMessage('Price per night is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    
    body('starRating')
        .notEmpty().withMessage('Star rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Star rating must be between 1 and 5'),
    
    handleValidationErrors
];

/**
 * Validation rules for booking creation
 */
const validateBooking = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('adultCount')
        .notEmpty().withMessage('Adult count is required')
        .isInt({ min: 1 }).withMessage('Adult count must be at least 1'),
    
    body('childCount')
        .notEmpty().withMessage('Child count is required')
        .isInt({ min: 0 }).withMessage('Child count must be 0 or greater'),
    
    body('checkIn')
        .notEmpty().withMessage('Check-in date is required')
        .isISO8601().withMessage('Check-in must be a valid date')
        .custom((value, { req }) => {
            const checkIn = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (checkIn < today) {
                throw new Error('Check-in date cannot be in the past');
            }
            return true;
        }),
    
    body('checkOut')
        .notEmpty().withMessage('Check-out date is required')
        .isISO8601().withMessage('Check-out must be a valid date')
        .custom((value, { req }) => {
            const checkOut = new Date(value);
            const checkIn = new Date(req.body.checkIn);
            if (checkOut <= checkIn) {
                throw new Error('Check-out date must be after check-in date');
            }
            return true;
        }),
    
    body('totalCost')
        .notEmpty().withMessage('Total cost is required')
        .isFloat({ min: 0 }).withMessage('Total cost must be a positive number'),
    
    handleValidationErrors
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    
    handleValidationErrors
];

module.exports = {
    validateAdminRegistration,
    validateAdminLogin,
    validateUserCreation,
    validateTourPackage,
    validateBooking,
    validateProfileUpdate,
    handleValidationErrors
};
