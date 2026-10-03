# 🚀 Quick Start Guide - Shersher Admin

## Prerequisites ✅
- ✅ Node.js v20.19.5 (Installed)
- ✅ .env file configured
- ⏳ Dependencies need to be installed

## Step-by-Step Instructions

### 1️⃣ Install Dependencies

Open your terminal in the project folder and run:

```powershell
npm install
```

This will install all required packages:
- express, mongoose, ejs
- bcryptjs, jsonwebtoken
- express-validator, express-rate-limit
- winston, multer, connect-flash
- And more...

**Expected output:** A progress bar showing package installation.

---

### 2️⃣ Start the Server

After installation, start the development server:

```powershell
npm run dev
```

**For production mode:**
```powershell
npm start
```

---

### 3️⃣ Expected Startup Messages

You should see:
```
✓ Server is running on http://localhost:3000
✓ Environment: development
✓ Database: Connected
```

---

### 4️⃣ Open the Application

Open your browser and go to:

```
http://localhost:3000
```

You should see the home page!

---

## 📝 First Time Setup

### Create Your First Admin Account

1. Go to: `http://localhost:3000/register`
2. Fill in the registration form:
   - **Name**: Your name
   - **Email**: Your email
   - **Password**: At least 6 characters with 1 uppercase and 1 lowercase letter
3. Click "Register"
4. You'll be redirected to the dashboard

---

## 🔍 Available Pages

Once logged in, you can access:

- **Dashboard**: `http://localhost:3000/dashboard`
- **Users**: `http://localhost:3000/users`
- **Tour Packages**: `http://localhost:3000/tour-packages`
- **Bookings**: `http://localhost:3000/bookings`
- **Reports**: `http://localhost:3000/report`
- **Profile**: `http://localhost:3000/profile`

---

## 🐛 Troubleshooting

### Issue: "npm install" fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

---

### Issue: "Cannot find module 'dotenv'"

**Solution:**
```powershell
# Install dotenv specifically
npm install dotenv

# Then install all dependencies
npm install
```

---

### Issue: "Database connection failed"

**Solution:**
- Check your `.env` file has the correct `MONGODB_URI`
- Verify MongoDB is accessible
- Check your internet connection (if using MongoDB Atlas)

---

### Issue: "Port 3000 is already in use"

**Solution:**
```powershell
# Change port in .env file
PORT=3001
```

Or stop the process using port 3000:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

## 🎯 Manual Installation (If npm install doesn't work)

If you're having issues with `npm install`, install packages one by one:

```powershell
npm install express
npm install mongoose
npm install ejs
npm install bcryptjs
npm install jsonwebtoken
npm install cookie-parser
npm install express-session
npm install connect-flash
npm install dotenv
npm install express-validator
npm install express-rate-limit
npm install winston
npm install multer
npm install nodemon --save-dev
```

---

## 📱 Testing the Application

### Test Login
1. Go to `http://localhost:3000/login`
2. Enter your registered credentials
3. Click "Login"
4. You should be redirected to the dashboard

### Test Creating a User
1. Go to `http://localhost:3000/users`
2. Click "Add User"
3. Fill in the form
4. Click "Submit"
5. User should be added successfully

### Test Creating a Tour Package
1. Go to `http://localhost:3000/tour-packages`
2. Click "Create New Package"
3. Fill in all required fields
4. Upload images (optional)
5. Click "Submit"
6. Package should be created

---

## 🔄 Stopping the Server

To stop the server:
- Press `Ctrl + C` in the terminal
- Or close the terminal window

The server will gracefully shut down and close database connections.

---

## 🎨 Development vs Production

### Development Mode (npm run dev)
- Auto-restart on file changes with nodemon
- Detailed error messages
- Console logging enabled
- Source maps available

### Production Mode (npm start)
- No auto-restart
- Minimal error details (secure)
- Optimized for performance
- HTTPS recommended

---

## 📞 Need Help?

If you encounter issues:

1. Check the logs in `logs/` directory
   - `logs/error.log` - Error logs
   - `logs/combined.log` - All logs

2. Check console output for error messages

3. Verify all environment variables in `.env`

4. Make sure MongoDB is running and accessible

---

## ✅ Quick Checklist

Before starting:
- [ ] Node.js installed (v14+)
- [ ] `.env` file exists and configured
- [ ] MongoDB connection string is correct
- [ ] All dependencies installed (`npm install`)
- [ ] Port 3000 is available

To start:
- [ ] Run `npm run dev`
- [ ] Check for startup messages
- [ ] Open `http://localhost:3000`
- [ ] Register/login to test

---

## 🎉 You're Ready!

Your Shersher Admin application is now ready to run. Follow the steps above and you'll be up and running in minutes!

**Happy coding! 🚀**
