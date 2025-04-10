const mongoose = require("mongoose");
const { generateApiKey, generateAuthToken } = require("../utils/jwt&key");
const User = require("../models/user_model");

// User Signup Controller
exports.SignUp = async (req, res) => {
  try {
    const { name, email, pass } = req.body;

    if (!name || !email || !pass) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "An account with this email already exists.",
      });
    }

    const newUser = await User.create({
      name,
      email,
      password: pass,
      api_key: generateApiKey(), // Optional, depending on your model
    });

    const token = generateAuthToken(newUser._id);

    res.status(201).json({
      status: "success",
      message: "User created successfully.",
      token,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

// User Login Controller
exports.login = async (req, res) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({
        status: "fail",
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: "fail", message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(pass);
    if (!isMatch) {
      return res.status(401).json({ status: "fail", message: "Invalid email or password." });
    }

    const token = generateAuthToken(user._id);

    res.status(200).json({
      status: "success",
      message: "Login successful.",
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

// Dashboard Controller
exports.dashboard = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      status: "success",
      data: {
        api_key: user.api_key,
        total_api_calls: user.apiUsageCount,
        total_remaining: user.totalRemaining,
        last_request_at: user.lastRequestAt,
        history: user.lastRequests,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dashboard data.",
    });
  }
};
