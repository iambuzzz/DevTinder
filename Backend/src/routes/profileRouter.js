const express = require("express");
const auth = require("../middlewares/auth.js");
const { validateEditProfileData } = require("../utils/validate.js");
const User = require("../models/user.js");
const profileRouter = express.Router();
const validator = require("validator");
const bcrypt = require("bcrypt");

profileRouter.get("/profile", auth, async (req, res) => {
  const user = req.user;
  try {
    res
      .status(200)
      .json({ message: "Profile accessed successfully", data: user });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Profile accessed failed", error: err.message });
  }
});

profileRouter.patch("/profile/edit", auth, async (req, res) => {
  try {
    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ message: "Profile Update failed", error: "Nothing to update" });
    }

    validateEditProfileData(req);

    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Profile Update failed", error: "User not found" });
    }
    res.status(200).json({
      message: `${updatedUser.firstName} your profile was updated!`,
      data: updatedUser,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Profile Update failed", error: err.message });
  }
});

profileRouter.patch("/profile/changepassword", auth, async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    // Validate body presence
    if (!password || !newPassword) {
      throw new Error("password and newPassword are required");
    }
    // Only allow these 2 keys
    const allowed = ["password", "newPassword"];
    if (!Object.keys(req.body).every((key) => allowed.includes(key))) {
      throw new Error("Invalid password update request");
    }

    const user = await User.findById(req.user._id);

    const isAllowed = await user.isPasswordCorrect(password);
    if (!isAllowed) {
      return res.status(401).json({
        message: "Password Update failed",
        error: "Incorrect current password",
      });
    }
    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: "Password Update failed",
        error: "New password is not strong enough",
      });
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

    res.status(200).json({
      message: "Password changed successfully",
      data: updatedUser,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Password Update failed", error: err.message });
  }
});

module.exports = profileRouter;
