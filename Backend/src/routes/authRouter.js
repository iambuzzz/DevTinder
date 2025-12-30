const express = require("express");
const authRouter = express.Router();
const { validateSignupData, validateLoginData } = require("../utils/validate");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();

authRouter.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      mobileNo,
      // skillsOrInterests,
      // photoURL,
    } = req.body;

    validateSignupData(req);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      gender,
      mobileNo: "",
      // skillsOrInterests,
      // photoURL,
    });

    const savedUser = await user.save();

    //generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Send cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    delete user.password;

    res.status(201).json({ message: "Signup successful", data: user });
  } catch (err) {
    // Duplicate email error
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Signup failed",
        error: "Email already registered",
      });
    }
    // Other validation / server errors
    res.status(400).json({
      message: "Signup failed",
      error: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const { emailId, password } = req.body;
  try {
    validateLoginData(req);
    const user = await User.findOne({ emailId });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Login failed", error: "Invalid credentials" });
    } else {
      const isMatch = await user.isPasswordCorrect(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Login failed", error: "Invalid credentials" });
      } else {
        // Create JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        // Send cookie
        res.cookie("authToken", token, {
          httpOnly: true,

          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const { password, ...updatedUser } = user.toObject();

        return res.status(200).json({
          message: "Login successful",
          data: updatedUser,
        });
      }
    }
  } catch (err) {
    res.status(400).json({ message: "Login failed", error: err.message });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("authToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

module.exports = authRouter;
