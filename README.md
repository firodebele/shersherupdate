# Shersher Admin Panel

A comprehensive Node.js admin dashboard for managing a tour booking system with user management, tour packages, bookings, and analytics.

## 🚀 Features

### Core Functionality
- **User Management**: Create, view, edit, and delete users (visitors and tour companies)
- **Tour Package Management**: Full CRUD operations for tour packages with image uploads
- **Booking Management**: View, filter, update, and export bookings
- **Analytics Dashboard**: Comprehensive reporting with statistics, trends, and data export
- **Admin Authentication**: Secure JWT-based authentication with bcrypt password hashing

### Security Features
- ✅ Environment variable configuration (.env)
- ✅ Secure credential management
- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ Rate limiting for login attempts and API routes
- ✅ Security headers (XSS, CSRF protection, etc.)
- ✅ File upload validation (type and size limits)
- ✅ SQL injection protection via Mongoose
- ✅ Session management with secure cookies

### User Experience
- ✅ Flash messages for user feedback
- ✅ Pagination for large datasets
- ✅ Advanced search and filtering
- ✅ Beautiful error pages
- ✅ Responsive design
- ✅ CSV/JSON data export

### Developer Features
- ✅ Structured logging with Winston
- ✅ Comprehensive error handling
- ✅ MVC architecture
- ✅ Modular middleware
- ✅ Graceful shutdown
- ✅ Development and production modes

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shersheradmin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update with your credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   
   MONGODB_URI=mongodb://your-connection-string
   
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=1h
   
   SESSION_SECRET=your-session-secret
   
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,image/webp
   ```

4. **Create required directories**
   ```bash
   mkdir -p logs public/images
   ```

5. **Start the application**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
shersheradmin/
├── config/
│   ├── database.js          # MongoDB connection configuration
│   └── logger.js            # Winston logger configuration
├── data/
│   └── database.js          # Database helper functions
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handling
│   ├── flashMessages.js     # Flash message middleware
│   ├── pagination.js        # Pagination utilities
│   ├── upload.js            # File upload configuration
│   └── validation.js        # Input validation rules
├── models/
│   ├── admin.js             # Admin user model
│   ├── booking.js           # Booking model
│   ├── tourpackage.js       # Tour package model
│   └── user.js              # User model
├── routes/
│   └── routes.js            # Application routes
├── views/
│   ├── partials/
│   │   └── flash-messages.ejs  # Flash message component
│   ├── pages/
│   │   ├── forms/           # Form views
│   │   └── documentation/   # Documentation views
│   ├── dashboard.ejs        # Dashboard view
│   ├── error.ejs            # Error page
│   ├── login.ejs            # Login page
│   ├── profile.ejs          # Profile page
│   └── register.ejs         # Registration page
├── public/
│   ├── css/                 # Stylesheets
│   ├── fonts/               # Font files
│   ├── images/              # Uploaded images
│   └── docs/                # Documentation assets
├── logs/                    # Application logs
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── app.js                   # Application entry point
└── package.json             # Dependencies and scripts
```

## 🔐 Security Improvements Made

### 1. Credential Management
- Moved all secrets to `.env` file
- Added `.env.example` for easy setup
- Updated `.gitignore` to exclude sensitive files

### 2. Authentication & Authorization
- JWT stored in HTTP-only cookies
- Password hashing with bcrypt (salt rounds: 10)
- Token expiration (default: 1 hour)
- Secure cookie configuration in production

### 3. Input Validation
- Express-validator for all forms
- Email format validation
- Password strength requirements
- File type and size validation
- XSS protection

### 4. Rate Limiting
- Login attempts: 5 per 15 minutes
- API requests: 100 per 15 minutes
- Prevents brute force attacks

### 5. Error Handling
- Global error handler
- Beautiful error pages
- Development vs production error details
- Comprehensive logging

## 🎯 API Endpoints

### Authentication
- `GET /` - Home page
- `GET /login` - Login page
- `POST /login` - Authenticate admin
- `GET /register` - Registration page
- `POST /register` - Create admin account
- `GET /logout` - Logout admin

### Dashboard
- `GET /dashboard` - Admin dashboard
- `GET /api/dashboard-stats` - Dashboard statistics (JSON)

### User Management
- `GET /users?page=1&limit=10&role=visitor&search=john` - List users with pagination
- `POST /add-user` - Create new user
- `POST /delete-user/:id` - Delete user

### Tour Packages
- `GET /tour-packages?page=1&search=beach&city=Miami` - List packages with filters
- `GET /tour-packages/create` - Create form
- `POST /tour-packages/create` - Create package
- `GET /tour-packages/edit/:id` - Edit form
- `POST /tour-packages/edit/:id` - Update package
- `GET /tour-packages/view/:id` - View package details
- `POST /tour-packages/delete/:id` - Delete package

### Bookings
- `GET /bookings?page=1&status=confirmed&search=john` - List bookings with filters
- `GET /bookings/view/:id` - View booking details
- `POST /bookings/update-status/:id` - Update booking status
- `POST /bookings/delete/:id` - Delete booking
- `GET /bookings/export?format=csv` - Export bookings

### Reports
- `GET /report?startDate=2024-01-01&endDate=2024-12-31` - View reports
- `GET /report?exportFormat=csv` - Export report as CSV
- `GET /report?exportFormat=json` - Export report as JSON

### Profile
- `GET /profile` - View admin profile
- `POST /profile` - Update admin profile

## 📊 Analytics & Reporting

The dashboard provides comprehensive analytics:

- **Overview Statistics**: Total users, bookings, revenue
- **Booking Status**: Confirmed, pending, cancelled, completed
- **Revenue Tracking**: Total and pending revenue
- **Top Destinations**: Most popular locations
- **Popular Packages**: Best-performing tour packages
- **Monthly Trends**: Booking and revenue trends (6 months)
- **Recent Activity**: Latest bookings

## 🔍 Search & Filtering

### Users
- Search by: First name, last name, email
- Filter by: Role (visitor, tour-company)
- Pagination: Customizable page size

### Tour Packages
- Search by: Name, description, type
- Filter by: City, country, price range
- Pagination: 12 items per page default

### Bookings
- Search by: First name, last name, email
- Filter by: Status, payment status
- Pagination: 15 items per page default

## 🚨 Error Handling

The application includes comprehensive error handling:

- **404 Not Found**: Custom page with navigation
- **401 Unauthorized**: Redirect to login
- **403 Forbidden**: Access denied page
- **500 Internal Server Error**: Graceful error page
- **Validation Errors**: User-friendly messages
- **JWT Errors**: Session expiration handling
- **Multer Errors**: File upload error messages

## 📝 Logging

Logs are stored in the `logs/` directory:

- `error.log` - Error level logs
- `combined.log` - All logs

Log format includes:
- Timestamp
- Log level
- Service name
- Request details (method, URL, IP)
- Error stack traces (development mode)

## 🧪 Development vs Production

### Development Mode
- Detailed error messages with stack traces
- Console logging enabled
- Source maps available
- Hot reloading with nodemon

### Production Mode
- Minimal error details
- Secure cookies (HTTPS only)
- Compression enabled
- Security headers enforced
- Rate limiting active

## 📦 Dependencies

### Core
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `ejs` - Template engine

### Security
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `express-validator` - Input validation
- `express-rate-limit` - Rate limiting
- `dotenv` - Environment variables

### Utilities
- `multer` - File uploads
- `winston` - Logging
- `connect-flash` - Flash messages
- `cookie-parser` - Cookie handling
- `express-session` - Session management

### Development
- `nodemon` - Auto-restart server

## 🔧 Scripts

```json
{
  "start": "node app.js",
  "dev": "nodemon app.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## ⚠️ Important Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default secrets** - Update JWT_SECRET and SESSION_SECRET
3. **Use HTTPS in production** - Required for secure cookies
4. **Regular updates** - Keep dependencies up to date
5. **Database security** - Use MongoDB authentication and encryption
6. **File uploads** - Validate and sanitize all uploaded files
7. **Password policy** - Enforce strong passwords (min 6 chars, uppercase, lowercase)

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong, unique secrets
3. Enable HTTPS
4. Configure MongoDB Atlas or production database
5. Set appropriate rate limits
6. Configure file upload limits

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS, Azure
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3, Cloudinary (for images)

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] HTTPS enabled
- [ ] Strong JWT secret set
- [ ] Session secret changed
- [ ] File upload directory writable
- [ ] Logs directory created
- [ ] Error monitoring enabled
- [ ] Backup strategy implemented
- [ ] Rate limits configured

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MONGODB_URI in `.env`
- Check MongoDB server is running
- Verify network connectivity
- Check firewall rules

### Authentication Issues
- Clear browser cookies
- Verify JWT_SECRET is set
- Check token expiration
- Verify password hash

### File Upload Issues
- Check `public/images` directory permissions
- Verify file size limits
- Check allowed file types
- Ensure disk space available

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for efficient tour booking management**
