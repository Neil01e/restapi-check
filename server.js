// server.js
// Main server file for REST API with Express and MongoDB

// Load environment variables from .env file
require("dotenv").config();

// Import required dependencies
const express = require("express");
const mongoose = require("mongoose");

// Import the User model (using lowercase filename)
const User = require("./models/user");

// Initialize Express application
const app = express();

// Middleware to parse JSON request bodies
// This allows us to access req.body in POST and PUT requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get port from environment variables or use default 5000
const PORT = process.env.PORT || 5000;

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Connect to MongoDB database
 * Using async/await with try/catch for better error handling
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Call the connection function
connectDB();

// ==================== ROUTES ====================

/**
 * @route   GET /api/users
 * @desc    Get all users from database
 * @access  Public
 */
app.get("/api/users", async (req, res) => {
  try {
    // Fetch all users from MongoDB using Mongoose
    // .find() without parameters returns all documents
    const users = await User.find();

    // Send successful response with users data
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    // Handle any errors during the operation
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/users
 * @desc    Add a new user to the database
 * @access  Public
 */
app.post("/api/users", async (req, res) => {
  try {
    // Extract user data from request body
    const { name, email, age, role } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required fields",
      });
    }

    // Create new user document using Mongoose model
    const newUser = new User({
      name,
      email,
      age,
      role,
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Send success response with created user
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedUser,
    });
  } catch (error) {
    // Handle duplicate email error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
        error: error.message,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Edit a user by ID
 * @access  Public
 */
app.put("/api/users/:id", async (req, res) => {
  try {
    // Get user ID from URL parameters
    const { id } = req.params;

    // Get updated data from request body
    const { name, email, age, role, isActive } = req.body;

    // Check if ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by ID and update with new data
    // { new: true } returns the updated document
    // { runValidators: true } ensures validation rules are applied
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, age, role, isActive },
      { new: true, runValidators: true },
    );

    // Check if user exists
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Handle invalid ID format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Remove a user by ID
 * @access  Public
 */
app.delete("/api/users/:id", async (req, res) => {
  try {
    // Get user ID from URL parameters
    const { id } = req.params;

    // Check if ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by ID and delete
    const deletedUser = await User.findByIdAndDelete(id);

    // Check if user exists
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    // Handle invalid ID format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler for routes that don't exist
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// ==================== START SERVER ====================

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET    - http://localhost:${PORT}/api/users`);
  console.log(`   POST   - http://localhost:${PORT}/api/users`);
  console.log(`   PUT    - http://localhost:${PORT}/api/users/:id`);
  console.log(`   DELETE - http://localhost:${PORT}/api/users/:id`);
});
