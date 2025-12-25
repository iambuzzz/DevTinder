const express = require("express");
const auth = require("../middlewares/auth.js");
const { validateEditProfileData } = require("../utils/validate.js");
require("dotenv").config();
const User = require("../models/user.js");
const profileRouter = express.Router();
const validator = require("validator");
const bcrypt = require("bcrypt");

profileRouter.get("/profile", auth, async (req, res) => {
  const user = req.user;
  try {
    console.log("Profile accessed:", req.user.emailId);
    res.status(200).send(user);
  } catch (err) {
    console.error("Profile error:", err.message);
    res.status(500).send("Something went wrong");
  }
});

profileRouter.patch("/profile/edit", auth, async (req, res) => {
  try {
    if (!Object.keys(req.body).length) {
      return res.status(400).send("Nothing to update");
    }

    if (!validateEditProfileData(req)) {
      return res.status(400).send("Invalid edit request");
    }

    const user = req.user;

    // Object.keys(req.body).forEach((key) => {
    //   user[key] = req.body[key];
    // });
    //   await user.save();
    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    console.log("data changed successfully");
    res.send(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(400).send("Something went Wrong : " + err.message);
  }
});

profileRouter.patch("/profile/changepassword", auth, async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    // Validate body presence
    if (!password || !newPassword) {
      return res.status(400).send("password and newPassword are required");
    }
    // Only allow these 2 keys
    const allowed = ["password", "newPassword"];
    if (!Object.keys(req.body).every((key) => allowed.includes(key))) {
      return res.status(400).send("Invalid password update request");
    }

    const user = await User.findById(req.user._id);

    const isAllowed = await user.isPasswordCorrect(password);
    if (!isAllowed) {
      return res.status(401).send("Incorrect current password");
    }
    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).send("New password is too weak");
    }

    const newPass = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { password: newPass },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");
    console.log("Updated password!! \n", updatedUser);
    res.send(updatedUser);
  } catch (err) {
    console.error("Profile error:", err.message);
    res.status(500).send("Something went wrong : " + err.message);
  }
});

module.exports = profileRouter;
