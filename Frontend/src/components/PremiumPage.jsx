import React from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
const PremiumPage = () => {
  const handlePayment = async () => {
    const { data } = await axios.post(
      BASE_URL + "payment/create",
      {},
      { withCredentials: true }
    );
    const { order } = data;

    const options = {
      key: data.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "DevTinder Premium",
      description: "Unlock unlimited matches",
      order_id: order.id,
      handler: async (response) => {
        try {
          const verifyRes = await axios.post(
            BASE_URL + "payment/verify", // Naya verify route call karo
            response,
            { withCredentials: true }
          );
          if (verifyRes.data.success) {
            alert("Mubarak ho! Aap Premium member hain.");
            window.location.href = "/";
          }
        } catch (err) {
          console.error("Verification failed", err);
        }
      },
      prefill: { name: order.notes.firstName + " " + order.notes.lastName },
      theme: { color: "#6366f1" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    // FIX 1: overflow-y-auto enables scrolling, overflow-x-hidden prevents side-scroll
    <div className="min-h-screen bg-[#020617] relative overflow-y-auto overflow-x-hidden flex items-center justify-center py-20 px-6">
      {/* FIX 2: Glows should be absolute but NOT wrap the content */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full"></div>
      </div>

      {/* FIX 3: Removed relative wrapper that was breaking scroll */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-md w-full my-auto" // Added z-10 and my-auto
      >
        {/* Glassmorphism Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center">
          <motion.div
            animate={{ rotateY: [0, 10, 0], y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)]"
          >
            <span className="text-4xl text-white font-bold italic">DT</span>
          </motion.div>

          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight leading-tight">
            DevTinder{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Gold
            </span>
          </h1>
          <p className="text-slate-400 mb-8 text-lg leading-relaxed">
            Unleash the full potential of developer networking.
          </p>

          <div className="space-y-4 mb-10 text-left">
            {[
              "Unlimited Swipe",
              "See who likes you",
              "Direct Message",
              "Priority Support",
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center text-slate-300"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-sm md:text-base">{feature}</span>
              </motion.div>
            ))}
          </div>

          <button
            onClick={handlePayment}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(99,102,241,0.3)]"
          >
            Upgrade Now - ₹500
          </button>

          <p className="mt-6 text-[10px] md:text-xs text-slate-500 leading-relaxed italic">
            Secure payment via Razorpay. By upgrading, you agree to our{" "}
            <a
              href="/privacy-policy"
              className="underline hover:text-indigo-400"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumPage;
