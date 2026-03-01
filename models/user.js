// models/user.js
// This file defines the User schema and model for MongoDB

const mongoose = require("mongoose");

/**
 * User Schema - defines the structure of user documents in MongoDB
 * Each field has validation rules to ensure data integrity
 */
const userSchema = new mongoose.Schema(
  {
    // Name field - required string with trimming
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // Email field - required, unique, with email format validation
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    // Age field - optional number with minimum value
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [150, "Age cannot exceed 150"],
    },

    // Role field - with default value
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    // Active status - boolean with default value
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  },
);

// Create and export the User model
// The model will create a 'users' collection in MongoDB (automatically pluralized)
const User = mongoose.model("User", userSchema);

module.exports = User;
