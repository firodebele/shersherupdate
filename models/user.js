const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['visitor', 'tour-company'], // Only these two roles are allowed
    default: 'visitor' // Default role is 'visitor'
  }
  
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;
