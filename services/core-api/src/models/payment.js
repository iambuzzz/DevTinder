const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Aapke User model ka reference
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true, // Razorpay order_id (e.g., order_RyXd5xL9Ymqu8s)
    },
    paymentId: {
      type: String, // Success ke baad milega (razorpay_payment_id)
      default: null,
    },
    signature: {
      type: String, // Verification ke liye zaroori hai
      default: null,
    },
    amount: {
      type: Number,
      required: true, // Paise mein store hoga (e.g., 50000)
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "succeeded", "failed", "pending"],
      default: "created",
    },
    receipt: {
      type: String,
    },
    notes: {
      firstName: String,
      lastName: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
