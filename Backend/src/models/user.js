const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 100,
    },

    age: {
      type: Number,
      min: 16,
      max: 150,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    mobileNo: {
      type: String,
    },

    skillsOrInterests: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 15;
        },
        message: "You can add a maximum of 15 skills/interests.",
      },
    },

    photoURL: {
      type: String,
      default:
        "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg",
      validate: {
        validator: function (v) {
          return validator.isURL(v);
        },
        message: "Invalid Photo URL",
      },
    },
    about: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;

// ----------------------------------------------------------------------------------

//created model for User collection -> this User collection will be stored in mongodb as "users" (plural+lowercase)
// it is basically a class of User and we will be creating multiple instances of this User class
//and these instances will be the documents inside our users collection.
// arguments -> name of model or class with which we will refer it and schema of the collection.
