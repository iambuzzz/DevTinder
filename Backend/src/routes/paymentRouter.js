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

paymentRouter.post("/payment/webhookk", async (req, res) => {
  // SABSE PEHLE 200 STATUS BHEJO (Razorpay loop rokne ke liye)
  // Razorpay ko response milte hi wo retry band kar dega
  res.status(200).send("OK");

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body), // Zaroori: req.body ko stringify karke pass karo
      req.headers["x-razorpay-signature"],
      webhookSecret
    );

    if (!isWebhookValid) return; // Silent exit, 200 pehle hi ja chuka hai

    const { event, payload } = req.body;
    const paymentData = payload.payment.entity;

    if (event === "payment.captured") {
      const payment = await Payment.findOne({ orderId: paymentData.order_id });
      if (payment) {
        payment.status = "captured";
        payment.paymentId = paymentData.id;
        await payment.save();

        await User.findByIdAndUpdate(payment.userId, { isPremium: true });
      }
    }
  } catch (error) {
    console.error("Webhook Background Error:", error.message);
  }
});

const crypto = require("crypto");

paymentRouter.post("/payment/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    // HMAC generate karke verify karo
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // User ko Premium karo
      await User.findByIdAndUpdate(req.user._id, { isPremium: true });

      // Payment record update karo
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          status: "captured",
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        }
      );

      return res.json({ success: true, message: "Payment verified" });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "Signature mismatch" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = paymentRouter;
