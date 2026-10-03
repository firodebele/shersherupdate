# 🔧 MongoDB Connection Fix

## Problem
Your IP address is not whitelisted in MongoDB Atlas. The app cannot connect to the database.

## Error Message
```
Could not connect to any servers in your MongoDB Atlas cluster. 
Your current IP address is not on your Atlas cluster's IP whitelist.
```

---

## Solution 1: Whitelist Your IP in MongoDB Atlas ✅ (Recommended)

### Steps:
1. Go to https://cloud.mongodb.com/
2. Login with your credentials
3. Select your project
4. Click **"Network Access"** from the left menu
5. Click **"Add IP Address"** button
6. Choose one option:
   - **"Add Current IP Address"** - Automatically adds your current IP
   - **"Allow Access from Anywhere"** - Enter `0.0.0.0/0` (allows all IPs)
7. Click **"Confirm"**
8. Wait 1-2 minutes for changes to propagate

### Then restart your app:
```powershell
npm run dev
```

---

## Solution 2: Install Local MongoDB (Alternative)

If you can't access MongoDB Atlas, install MongoDB locally:

### Windows:
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run on `mongodb://localhost:27017`

### Update .env file:
```env
MONGODB_URI=mongodb://localhost:27017/shersher-admin
```

### Restart your app:
```powershell
npm run dev
```

---

## Solution 3: Use MongoDB Atlas Free Tier (New Database)

Create a new free cluster:

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free
3. Create a new cluster (Free tier - M0)
4. Create a database user:
   - Username: shersher-admin
   - Password: [create a strong password]
5. **Whitelist your IP**: Click "Add My Current IP Address"
6. Get your connection string:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
7. Update your `.env` file with the new connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shersher-admin?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your credentials

---

## Quick Test

After fixing, test the connection:

```powershell
npm run dev
```

### Success looks like:
```
✓ Server is running on http://localhost:3000
✓ Environment: development
✓ Database: Connected
```

### Still failing?
Check the logs:
```powershell
type logs\error.log
```

---

## Common MongoDB Atlas Issues

### Issue: "IP not whitelisted"
**Fix**: Add your IP in Network Access (Solution 1 above)

### Issue: "Authentication failed"
**Fix**: Check username/password in MONGODB_URI

### Issue: "Network timeout"
**Fix**: 
- Check your internet connection
- Check firewall isn't blocking MongoDB (port 27017)
- Try "Allow Access from Anywhere" (0.0.0.0/0)

### Issue: "Could not connect to any servers"
**Fix**:
- Verify cluster is running (not paused)
- Check MongoDB Atlas status page
- Wait 1-2 minutes after adding IP

---

## Emergency: Start Without Database

To test the app without database (limited functionality):

Update `config/database.js` to make database optional:

```javascript
async function connectToDatabase() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected successfully to MongoDB');
  } catch (error) { 
    console.error('Warning: MongoDB not connected. Some features will not work.');
    console.error('Error:', error.message);
    // Don't throw error - allow app to start
  }
}
```

**Note**: Many features won't work without database, but you can see the UI.

---

## After Fixing

Once connected, you should be able to:

1. Register an admin account: `http://localhost:3000/register`
2. Login: `http://localhost:3000/login`
3. Access dashboard: `http://localhost:3000/dashboard`
4. Create users, tour packages, manage bookings, etc.

---

## Need Help?

If none of these solutions work:
1. Check logs in `logs/error.log`
2. Verify MongoDB Atlas credentials
3. Try pinging MongoDB servers
4. Contact MongoDB Atlas support

---

**The most common fix**: Just add your current IP in MongoDB Atlas Network Access! ✅
