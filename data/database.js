const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin'); // Adjust the path as needed
require('dotenv').config();

// MongoDB connection URI from environment variable
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB using Mongoose
async function connectToDatabase() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected successfully to MongoDB');
  } catch (error) { 
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
}

async function addAdmin(name, email, password, picture, bio) {
  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a new admin document
    const newAdmin = new Admin({
      name: name,
      email: email,
      password: hashedPassword,
      picture: picture,
      bio: bio
    });

    // Save the new admin document to the database
    await newAdmin.save();
    console.log('Admin saved successfully');
    return newAdmin;
  } catch (err) {
    console.error('Error saving admin:', err);
    throw err; // Propagate the error
  }
}

module.exports = { connectToDatabase, addAdmin };