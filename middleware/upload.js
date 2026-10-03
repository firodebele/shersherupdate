const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Allowed file types
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,image/webp,image/gif').split(',');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images'); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        // Generate unique filename to avoid overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only ' + allowedTypes.join(', ') + ' are allowed!'), false);
    }
};

// File upload middleware
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: maxFileSize
    },
    fileFilter: fileFilter
});

module.exports = upload;