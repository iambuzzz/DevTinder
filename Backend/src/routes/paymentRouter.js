const express = require("express");
const auth = require("../middlewares/auth");
const paymentRouter = express.Router();
const instance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
paymentRouter.post("/payment/create", auth, async (req, res) => {
  try {
    const user = req.user;
    var options = {
      amount: 500 * 100, // Amount is in currency subunits.
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      notes: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
    const order = await instance.orders.create(options);

    const payment = new Payment({
      userId: user._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
      status: order.status,
    });
    const savedPayment = await payment.save();
    res.status(200).json({
      success: true,
      order: order,
      paymentRecord: savedPayment,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({
      success: false,
      msg: "Could not create order",
      error: error.message,
    });
  }
});

paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      req.headers["x-razorpay-signature"],
      webhookSecret
    );
    if (!isWebhookValid) {
      return res.status(400).json({
        success: false,
        msg: "Invalid webhook signature",
      });
    }

    const paymentData = req.body.payload.payment.entity;
    const payment = await Payment.findOne({ orderId: paymentData.order_id });
    payment.status = paymentData.status;
    payment.paymentId = paymentData.id;
    payment.signature = req.headers["x-razorpay-signature"];
    const updatedPayment = await payment.save();

    const user = await User.findById(payment.userId);
    // Update user premium status on successful payment
    if (paymentData.status === "captured") {
      user.isPremium = true;
      await user.save();
    }

    if (req.body.event === "payment.failed") {
      return res.status(200).json({
        success: true,
        msg: "Payment failed recorded",
        data: updatedPayment,
      });
    }

    res.status(200).json({
      success: true,
      msg: "Payment verified successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({
      success: false,
      msg: "Payment verification failed",
      error: error.message,
    });
  }
});

module.exports = paymentRouter;
