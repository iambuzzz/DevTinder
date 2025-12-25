const express = require("express");
const authRouter = express.Router();
const { validateSignupData, validateLoginData } = require("../utils/validate");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, age, gender, mobileNo } =
      req.body;
    // Validate input (may throw)
    validateSignupData(req);
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      gender,
      mobileNo,
    });
    // 4️⃣ Save to DB
    await user.save();
    console.log("User created:", user._id);
    res.status(201).send("Signup successful");
  } catch (err) {
    console.error("Signup error:", err.message);
    // Duplicate email error
    if (err.code === 11000) {
      return res.status(409).send("Email already registered");
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
      console.log("email not found");
      return res.status(401).send("Invalid credentials");
    } else {
      const isMatch = await user.isPasswordCorrect(password);
      if (!isMatch) {
        console.log("wrong password!");
        return res.status(401).send("Invalid credentials");
      } else {
        // Create JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        console.log("Login successful");
        // Send cookie
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return res.send("Login successful");
      }
    }
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie("authToken");
  console.log("Logged out");
  return res.send("Logged out");
});

module.exports = authRouter;
