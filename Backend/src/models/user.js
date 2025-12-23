//what fields a user can have - user schema
const mongoose = require("mongoose");
//defining schema for user collection
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
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
    },

    age: {
      type: Number,
      min: 18,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    mobileNo: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
//created model for User collection -> this User collection will be stored in mongodb as "users" (plural+lowercase)
// it is basically a class of User and we will be creating multiple instances of this User class
//and these instances will be the documents inside our users collection.
const User = mongoose.model("User", userSchema);
// arguments -> name of model or class with which we will refer it and schema of the collection.
module.exports = User;
