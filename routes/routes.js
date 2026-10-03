// Import required modules
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const { paginateQuery, buildSearchQuery } = require('../middleware/pagination');
const {
    validateAdminRegistration,
    validateAdminLogin,
    validateUserCreation,
    validateTourPackage,
    validateProfileUpdate
} = require('../middleware/validation');
require('dotenv').config();

const TourPackage = require('../models/tourpackage');
const User = require('../models/user');
const logger = require('../config/logger');

// Get JWT secret from environment
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h'; 
// Route to display bookings in basic elements page
router.get('/travel', authenticateToken, async (req, res) => {
    try {
        // Fetch all tour packages and populate associated user details
        const tourPackages = await TourPackage.find()
            .populate('userId', 'firstName lastName email _id') // Populate user details
            .exec();

        // Extract users from tourPackages and send to the view
        const users = tourPackages.map(package => package.userId).filter(user => user); // Extract users from the populated data

        // Render the travel page with the user data
        res.render('pages/forms/travel', { users });
    } catch (error) {
        console.error('Error fetching tour packages:', error);
        res.status(500).send('Server error');
    }
});


router.post('/add-user', validateUserCreation, async (req, res) => {
    try {
        console.log(req.body);
        const { firstName, lastName, email, password, role } = req.body; // Include role here

        // Check if password is provided
        if (!password) {
            return res.status(400).send('Password is required');
        }

        // Check if role is provided, if not, default to 'visitor'
        if (!role) {
            return res.status(400).send('Role is required');
        }

        // Create and save the new user, including the role
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            role // Include role when creating user
        });
        await newUser.save();

        // Redirect back to the travel page with flash message
        req.flash('success', 'User added successfully!');
        res.redirect('/travel');

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Server error');
    }
});
//report
router.get('/report', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, exportFormat } = req.query;
        
        // Date range filters
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get statistics
        const stats = await generateReportStats(dateFilter);

        // If export requested, generate CSV or JSON
        if (exportFormat === 'csv') {
            return exportReportAsCSV(res, stats);
        } else if (exportFormat === 'json') {
            return res.json(stats);
        }

        // Render the report page with statistics
        res.render('pages/documentation/report', { 
            stats,
            filters: { startDate, endDate }
        });
    } catch (error) {
        logger.error('Error fetching report:', error);
        req.flash('error', 'Failed to generate report');
        res.redirect('/dashboard');
    }
});

// Helper function to generate report statistics
async function generateReportStats(dateFilter = {}) {
    const Booking = require('../models/booking');
    
    // Total statistics
    const totalUsers = await User.countDocuments();
    const totalVisitors = await User.countDocuments({ role: 'visitor' });
    const totalTourCompanies = await User.countDocuments({ role: 'tour-company' });
    const totalTourPackages = await TourPackage.countDocuments();
    
    // Booking statistics from embedded bookings
    const tourPackagesWithBookings = await TourPackage.find();
    let allBookings = [];
    tourPackagesWithBookings.forEach(pkg => {
        if (pkg.bookings && pkg.bookings.length > 0) {
            allBookings.push(...pkg.bookings);
        }
    });
    
    // Add standalone bookings
    const standaloneBookings = await Booking.find();
    allBookings.push(...standaloneBookings);
    
    // Filter by date if provided
    if (dateFilter.createdAt) {
        allBookings = allBookings.filter(booking => {
            const bookingDate = booking.createdAt || booking.checkIn;
            if (dateFilter.createdAt.$gte && bookingDate < dateFilter.createdAt.$gte) return false;
            if (dateFilter.createdAt.$lte && bookingDate > dateFilter.createdAt.$lte) return false;
            return true;
        });
    }
    
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
    const completedBookings = allBookings.filter(b => b.status === 'completed').length;
    
    // Revenue statistics
    const totalRevenue = allBookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.totalCost || 0), 0);
    const pendingRevenue = allBookings
        .filter(b => b.paymentStatus === 'pending')
        .reduce((sum, b) => sum + (b.totalCost || 0), 0);
    
    // Top destinations
    const destinationStats = await TourPackage.aggregate([
        {
            $group: {
                _id: { city: '$city', country: '$country' },
                count: { $sum: 1 },
                avgPrice: { $avg: '$pricePerNight' }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
    
    // Popular tour packages (by booking count)
    const popularPackages = await TourPackage.aggregate([
        {
            $project: {
                name: 1,
                city: 1,
                country: 1,
                pricePerNight: 1,
                bookingCount: { $size: { $ifNull: ['$bookings', []] } }
            }
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 5 }
    ]);
    
    // Monthly booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyBookings = {};
    allBookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt || booking.checkIn);
        if (bookingDate >= sixMonthsAgo) {
            const monthKey = bookingDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyBookings[monthKey] = (monthlyBookings[monthKey] || 0) + 1;
        }
    });
    
    // Revenue by month
    const monthlyRevenue = {};
    allBookings
        .filter(b => b.paymentStatus === 'paid')
        .forEach(booking => {
            const bookingDate = new Date(booking.createdAt || booking.checkIn);
            if (bookingDate >= sixMonthsAgo) {
                const monthKey = bookingDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (booking.totalCost || 0);
            }
        });
    
    // Recent activity (last 10 bookings)
    const recentBookings = allBookings
        .sort((a, b) => (b.createdAt || b.checkIn) - (a.createdAt || a.checkIn))
        .slice(0, 10);
    
    return {
        overview: {
            totalUsers,
            totalVisitors,
            totalTourCompanies,
            totalTourPackages,
            totalBookings,
            confirmedBookings,
            pendingBookings,
            cancelledBookings,
            completedBookings,
            totalRevenue,
            pendingRevenue,
            averageBookingValue: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0
        },
        destinations: destinationStats,
        popularPackages,
        monthlyBookings,
        monthlyRevenue,
        recentBookings
    };
}

// Helper function to export report as CSV
function exportReportAsCSV(res, stats) {
    let csv = 'Shersher Admin - Analytics Report\n\n';
    
    csv += 'OVERVIEW\n';
    csv += 'Metric,Value\n';
    csv += `Total Users,${stats.overview.totalUsers}\n`;
    csv += `Total Visitors,${stats.overview.totalVisitors}\n`;
    csv += `Total Tour Companies,${stats.overview.totalTourCompanies}\n`;
    csv += `Total Tour Packages,${stats.overview.totalTourPackages}\n`;
    csv += `Total Bookings,${stats.overview.totalBookings}\n`;
    csv += `Confirmed Bookings,${stats.overview.confirmedBookings}\n`;
    csv += `Pending Bookings,${stats.overview.pendingBookings}\n`;
    csv += `Cancelled Bookings,${stats.overview.cancelledBookings}\n`;
    csv += `Completed Bookings,${stats.overview.completedBookings}\n`;
    csv += `Total Revenue,$${stats.overview.totalRevenue}\n`;
    csv += `Pending Revenue,$${stats.overview.pendingRevenue}\n`;
    csv += `Average Booking Value,$${stats.overview.averageBookingValue}\n\n`;
    
    csv += 'TOP DESTINATIONS\n';
    csv += 'City,Country,Packages,Avg Price\n';
    stats.destinations.forEach(dest => {
        csv += `${dest._id.city},${dest._id.country},${dest.count},$${dest.avgPrice.toFixed(2)}\n`;
    });
    
    csv += '\nPOPULAR PACKAGES\n';
    csv += 'Name,City,Country,Price,Bookings\n';
    stats.popularPackages.forEach(pkg => {
        csv += `${pkg.name},${pkg.city},${pkg.country},$${pkg.pricePerNight},${pkg.bookingCount}\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=shersher-report-' + Date.now() + '.csv');
    res.send(csv);
}

// API endpoint for dashboard statistics
router.get('/api/dashboard-stats', authenticateToken, async (req, res) => {
    try {
        const stats = await generateReportStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

// Route to delete a user
router.post('/delete-user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Delete the user by ID
        await User.findByIdAndDelete(userId);

        // Redirect back to the users page with flash message
        req.flash('success', 'User deleted successfully!');
        res.redirect('/users');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server error');
    }
});







// ============================================
// USER ROUTES (with pagination and search)
// ============================================

router.get('/users', authenticateToken, async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;

        // Build query
        let query = {};
        if (role) query.role = role;
        
        // Add search functionality
        if (search) {
            const searchQuery = buildSearchQuery(search, ['firstName', 'lastName', 'email']);
            query = { ...query, ...searchQuery };
        }

        // Paginate results
        const { results: users, pagination } = await paginateQuery(User, query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        });

        res.render('pages/forms/users', { 
            users, 
            pagination,
            filters: { role, search }
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        req.flash('error', 'Failed to load users');
        res.redirect('/dashboard');
    }
});


// ============================================
// BOOKING ROUTES
// ============================================

// View all bookings (with pagination and search)
router.get('/bookings', authenticateToken, async (req, res) => {
    try {
        const { status, paymentStatus, search, page = 1, limit = 15 } = req.query;
        
        // Build query
        let query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (search) {
            query.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get bookings from aggregation with pagination
        const bookingsAggregate = await TourPackage.aggregate([
            { $unwind: '$bookings' },
            { $replaceRoot: { newRoot: { $mergeObjects: ['$bookings', { tourPackageName: '$name', tourPackageId: '$_id' }] } } },
            ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    bookings: [
                        { $skip: skip },
                        { $limit: parseInt(limit) }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const bookings = bookingsAggregate[0]?.bookings || [];
        const totalItems = bookingsAggregate[0]?.totalCount[0]?.count || 0;

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        const pagination = {
            totalItems,
            totalPages,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            nextPage: parseInt(page) < totalPages ? parseInt(page) + 1 : null,
            prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
            startIndex: skip + 1,
            endIndex: Math.min(skip + parseInt(limit), totalItems)
        };

        res.render('pages/forms/bookings', { 
            bookings,
            pagination,
            filters: { status, paymentStatus, search }
        });
    } catch (error) {
        logger.error('Error fetching bookings:', error);
        req.flash('error', 'Failed to load bookings');
        res.redirect('/dashboard');
    }
});

// View single booking details
router.get('/bookings/view/:id', authenticateToken, async (req, res) => {
    try {
        const Booking = require('../models/booking');
        let booking = await Booking.findById(req.params.id)
            .populate('userId', 'firstName lastName email')
            .populate('tourPackageId', 'name city country pricePerNight')
            .exec();

        // If not found in standalone bookings, search in tour package embedded bookings
        if (!booking) {
            const tourPackages = await TourPackage.find({ 'bookings._id': req.params.id })
                .populate('userId', 'firstName lastName email')
                .exec();
            
            if (tourPackages.length > 0) {
                booking = tourPackages[0].bookings.id(req.params.id);
                booking.tourPackageName = tourPackages[0].name;
            }
        }
        
        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/bookings');
        }

        res.render('pages/forms/view-booking', { booking });
    } catch (error) {
        logger.error('Error viewing booking:', error);
        req.flash('error', 'Failed to load booking');
        res.redirect('/bookings');
    }
});

// Update booking status
router.post('/bookings/update-status/:id', authenticateToken, async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        const Booking = require('../models/booking');
        
        let booking = await Booking.findById(req.params.id);
        
        // If not found in standalone bookings, search in tour package embedded bookings
        if (!booking) {
            const tourPackages = await TourPackage.find({ 'bookings._id': req.params.id });
            
            if (tourPackages.length > 0) {
                const tourPackage = tourPackages[0];
                booking = tourPackage.bookings.id(req.params.id);
                
                if (status) booking.status = status;
                if (paymentStatus) booking.paymentStatus = paymentStatus;
                booking.updatedAt = Date.now();
                
                await tourPackage.save();
                logger.info('Booking status updated (embedded)', { bookingId: req.params.id, status, paymentStatus });
                req.flash('success', 'Booking status updated successfully!');
                return res.redirect('/bookings');
            }
        } else {
            if (status) booking.status = status;
            if (paymentStatus) booking.paymentStatus = paymentStatus;
            booking.updatedAt = Date.now();
            
            await booking.save();
            logger.info('Booking status updated', { bookingId: req.params.id, status, paymentStatus });
            req.flash('success', 'Booking status updated successfully!');
            return res.redirect('/bookings');
        }
        
        req.flash('error', 'Booking not found');
        res.redirect('/bookings');
    } catch (error) {
        logger.error('Error updating booking status:', error);
        req.flash('error', 'Failed to update booking status');
        res.redirect('/bookings');
    }
});

// Delete booking
router.post('/bookings/delete/:id', authenticateToken, async (req, res) => {
    try {
        const Booking = require('../models/booking');
        let deleted = await Booking.findByIdAndDelete(req.params.id);
        
        // If not found in standalone bookings, search in tour package embedded bookings
        if (!deleted) {
            const tourPackages = await TourPackage.find({ 'bookings._id': req.params.id });
            
            if (tourPackages.length > 0) {
                const tourPackage = tourPackages[0];
                tourPackage.bookings.id(req.params.id).remove();
                await tourPackage.save();
                
                logger.info('Booking deleted (embedded)', { bookingId: req.params.id });
                req.flash('success', 'Booking deleted successfully!');
                return res.redirect('/bookings');
            }
        } else {
            logger.info('Booking deleted', { bookingId: req.params.id });
            req.flash('success', 'Booking deleted successfully!');
            return res.redirect('/bookings');
        }
        
        req.flash('error', 'Booking not found');
        res.redirect('/bookings');
    } catch (error) {
        logger.error('Error deleting booking:', error);
        req.flash('error', 'Failed to delete booking');
        res.redirect('/bookings');
    }
});

// Export bookings to CSV
router.get('/bookings/export', authenticateToken, async (req, res) => {
    try {
        const { status, paymentStatus } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const bookings = await TourPackage.aggregate([
            { $unwind: '$bookings' },
            { $replaceRoot: { newRoot: { $mergeObjects: ['$bookings', { tourPackageName: '$name' }] } } },
            ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
            { $sort: { createdAt: -1 } }
        ]);

        // CSV header
        let csv = 'Booking ID,First Name,Last Name,Email,Tour Package,Adults,Children,Check In,Check Out,Total Cost,Status,Payment Status,Created At\n';
        
        // CSV rows
        bookings.forEach(booking => {
            csv += `${booking._id},${booking.firstName},${booking.lastName},${booking.email},${booking.tourPackageName},${booking.adultCount},${booking.childCount},${new Date(booking.checkIn).toLocaleDateString()},${new Date(booking.checkOut).toLocaleDateString()},${booking.totalCost},${booking.status || 'pending'},${booking.paymentStatus || 'pending'},${new Date(booking.createdAt).toLocaleDateString()}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=bookings-export-' + Date.now() + '.csv');
        res.send(csv);
        
        logger.info('Bookings exported', { count: bookings.length });
    } catch (error) {
        logger.error('Error exporting bookings:', error);
        req.flash('error', 'Failed to export bookings');
        res.redirect('/bookings');
    }
});

// ============================================
// END BOOKING ROUTES
// ============================================

// ============================================
// TOUR PACKAGE ROUTES
// ============================================

// View all tour packages (with pagination and search)
router.get('/tour-packages', authenticateToken, async (req, res) => {
    try {
        const { search, city, country, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

        // Build query
        let query = {};
        
        // Search by name or description
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { type: new RegExp(search, 'i') }
            ];
        }
        
        // Filter by city
        if (city) query.city = new RegExp(city, 'i');
        
        // Filter by country
        if (country) query.country = new RegExp(country, 'i');
        
        // Filter by price range
        if (minPrice || maxPrice) {
            query.pricePerNight = {};
            if (minPrice) query.pricePerNight.$gte = parseFloat(minPrice);
            if (maxPrice) query.pricePerNight.$lte = parseFloat(maxPrice);
        }

        // Paginate results
        const { results: tourPackages, pagination } = await paginateQuery(TourPackage, query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { lastUpdated: -1 },
            populate: { path: 'userId', select: 'firstName lastName email' }
        });

        res.render('pages/forms/tour-packages', { 
            tourPackages, 
            pagination,
            filters: { search, city, country, minPrice, maxPrice }
        });
    } catch (error) {
        logger.error('Error fetching tour packages:', error);
        req.flash('error', 'Failed to load tour packages');
        res.redirect('/dashboard');
    }
});

// Show create tour package form
router.get('/tour-packages/create', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ role: 'tour-company' }).exec();
        res.render('pages/forms/create-tour-package', { users });
    } catch (error) {
        logger.error('Error loading create tour package form:', error);
        req.flash('error', 'Failed to load form');
        res.redirect('/tour-packages');
    }
});

// Create new tour package
router.post('/tour-packages/create', authenticateToken, upload.array('images', 10), validateTourPackage, async (req, res) => {
    try {
        const {
            userId, name, city, country, description, type,
            adultCount, childCount, pricePerNight, starRating, facilities
        } = req.body;

        // Handle image uploads
        const imageUrls = req.files ? req.files.map(file => '/images/' + file.filename) : [];

        // Parse facilities if it's a string
        const facilitiesArray = Array.isArray(facilities) ? facilities : 
                               facilities ? facilities.split(',').map(f => f.trim()) : [];

        const newTourPackage = new TourPackage({
            userId,
            name,
            city,
            country,
            description,
            type,
            adultCount,
            childCount,
            facilities: facilitiesArray,
            pricePerNight,
            starRating,
            imageUrls,
        });

        await newTourPackage.save();
        logger.info('Tour package created', { packageId: newTourPackage._id, name });
        req.flash('success', 'Tour package created successfully!');
        res.redirect('/tour-packages');
    } catch (error) {
        logger.error('Error creating tour package:', error);
        req.flash('error', 'Failed to create tour package');
        res.redirect('/tour-packages/create');
    }
});

// Show edit tour package form
router.get('/tour-packages/edit/:id', authenticateToken, async (req, res) => {
    try {
        const tourPackage = await TourPackage.findById(req.params.id).populate('userId');
        const users = await User.find({ role: 'tour-company' }).exec();
        
        if (!tourPackage) {
            req.flash('error', 'Tour package not found');
            return res.redirect('/tour-packages');
        }

        res.render('pages/forms/edit-tour-package', { tourPackage, users });
    } catch (error) {
        logger.error('Error loading edit tour package form:', error);
        req.flash('error', 'Failed to load tour package');
        res.redirect('/tour-packages');
    }
});

// Update tour package
router.post('/tour-packages/edit/:id', authenticateToken, upload.array('images', 10), validateTourPackage, async (req, res) => {
    try {
        const {
            userId, name, city, country, description, type,
            adultCount, childCount, pricePerNight, starRating, facilities
        } = req.body;

        const tourPackage = await TourPackage.findById(req.params.id);
        
        if (!tourPackage) {
            req.flash('error', 'Tour package not found');
            return res.redirect('/tour-packages');
        }

        // Update fields
        tourPackage.userId = userId;
        tourPackage.name = name;
        tourPackage.city = city;
        tourPackage.country = country;
        tourPackage.description = description;
        tourPackage.type = type;
        tourPackage.adultCount = adultCount;
        tourPackage.childCount = childCount;
        tourPackage.pricePerNight = pricePerNight;
        tourPackage.starRating = starRating;
        tourPackage.facilities = Array.isArray(facilities) ? facilities : 
                                facilities ? facilities.split(',').map(f => f.trim()) : [];
        
        // Add new images if uploaded
        if (req.files && req.files.length > 0) {
            const newImageUrls = req.files.map(file => '/images/' + file.filename);
            tourPackage.imageUrls.push(...newImageUrls);
        }

        tourPackage.lastUpdated = Date.now();
        await tourPackage.save();

        logger.info('Tour package updated', { packageId: tourPackage._id, name });
        req.flash('success', 'Tour package updated successfully!');
        res.redirect('/tour-packages');
    } catch (error) {
        logger.error('Error updating tour package:', error);
        req.flash('error', 'Failed to update tour package');
        res.redirect('/tour-packages/edit/' + req.params.id);
    }
});

// Delete tour package
router.post('/tour-packages/delete/:id', authenticateToken, async (req, res) => {
    try {
        const tourPackage = await TourPackage.findByIdAndDelete(req.params.id);
        
        if (!tourPackage) {
            req.flash('error', 'Tour package not found');
            return res.redirect('/tour-packages');
        }

        logger.info('Tour package deleted', { packageId: req.params.id, name: tourPackage.name });
        req.flash('success', 'Tour package deleted successfully!');
        res.redirect('/tour-packages');
    } catch (error) {
        logger.error('Error deleting tour package:', error);
        req.flash('error', 'Failed to delete tour package');
        res.redirect('/tour-packages');
    }
});

// View single tour package details
router.get('/tour-packages/view/:id', authenticateToken, async (req, res) => {
    try {
        const tourPackage = await TourPackage.findById(req.params.id)
            .populate('userId', 'firstName lastName email')
            .populate('bookings.userId', 'firstName lastName email')
            .exec();
        
        if (!tourPackage) {
            req.flash('error', 'Tour package not found');
            return res.redirect('/tour-packages');
        }

        res.render('pages/forms/view-tour-package', { tourPackage });
    } catch (error) {
        logger.error('Error viewing tour package:', error);
        req.flash('error', 'Failed to load tour package');
        res.redirect('/tour-packages');
    }
});

// ============================================
// END TOUR PACKAGE ROUTES
// ============================================

router.get('/basic-elements', authenticateToken, async (req, res) => {
    try {
        // Fetch all tour packages and populate associated user details
        const tourPackages = await TourPackage.find()
            .populate('userId', 'firstName lastName email _id') // Populate user details
            .exec();

        // Render the basic elements page with tour package data
        res.render('pages/forms/basic_elements', { tourPackages });
    } catch (error) {
        console.error('Error fetching tour packages:', error);
        res.status(500).send('Server error');
    }
});

router.get('/users', (req, res) => {
    res.render('pages/forms/users');
});

router.get('/travel', (req, res) => {
    res.render('pages/forms/travel');
});

// Display login form
router.get('/', (req, res) => {
    res.render('home'); // Assuming login.ejs is in your views folder
});

// Display registration form
router.get('/register', (req, res) => {
    res.render('register'); // Assuming register.ejs is in your views folder
});

// Handle registration
router.post('/register', validateAdminRegistration, async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.render('register', { errorMessage: 'Email already exists' });
        }

        // Validate password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.render('register', { errorMessage: 'Password must be at least 6 characters long and contain at least one uppercase and one lowercase letter' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const newAdmin = new Admin({ name, email, password: hashedPassword });
        await newAdmin.save();
        console.log('Admin registered successfully');

        // Redirect to login
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error registering admin:', error);
        res.render('register', { errorMessage: 'Server error' });
    }
});

// Display login form
router.get('/login', (req, res) => {
    res.render('login'); // Assuming login.ejs is in your views folder
});

// Handle login
router.post('/login', validateAdminLogin, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if admin exists
        const admin = await Admin.findOne({ email });
        console.log('Admin found:', admin); 

        if (!admin) {
            return res.render('login', { errorMessage: 'Admin not found' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.render('login', { errorMessage: 'Invalid password' });
        }

        // Issue JWT
        const payload = { admin: { id: admin.id } };
        jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn }, (err, token) => {
            if (err) {
                console.error('JWT signing error:', err);
                return res.render('login', { errorMessage: 'Server error' });
            }
            res.cookie('token', token, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000 // 1 hour
            });
            req.flash('success', 'Login successful!');
            res.redirect('/dashboard');
        });
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.render('login', { errorMessage: 'Server error' });
    }
});

// Display dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).send('Admin not found');
        }
        res.render('dashboard', { admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).send('Server error');
    }
});

// Display profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).send('Admin not found');
        }
        res.render('profile', { admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).send('Server error');
    }
});

// Handle profile updates
router.post('/profile', authenticateToken, upload.single('picture'), validateProfileUpdate, async (req, res) => {
    try {
        const { name, bio } = req.body;
        const picture = req.file ? '/images/' + req.file.filename : null;

        const updatedFields = { name, bio };
        if (picture) updatedFields.picture = picture;

        const admin = await Admin.findByIdAndUpdate(req.admin.id, updatedFields, { new: true });
        if (!admin) {
            return res.status(404).send('Admin not found');
        }

        res.render('profile', { admin, successMessage: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).send('Server error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully!');
    res.redirect('/login');
});

module.exports = router;
