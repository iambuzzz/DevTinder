const express = require("express");
const auth = require("../middlewares/auth.js");
const { validateEditProfileData } = require("../utils/validate.js");
const User = require("../models/user.js");
const profileRouter = express.Router();
const validator = require("validator");
const bcrypt = require("bcrypt");
const { uploadUtils } = require("../utils/cloudinary");

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

profileRouter.patch(
  "/profile/edit",
  auth,
  (req, res, next) => {
    uploadUtils.single("image")(req, res, function (err) {
      if (err) {
        return res
          .status(400)
          .json({ message: "Image upload failed", error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (req.body.image !== undefined) {
        delete req.body.image;
      }
      if (!Object.keys(req.body).length && !req.file) {
        return res.status(400).json({
          message: "Profile Update failed",
          error: "Nothing to update",
        });
      }

      validateEditProfileData(req);

      const updateData = { ...req.body };
      if (req.file) {
        updateData.photoURL = req.file.path;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

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
  }
);

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
