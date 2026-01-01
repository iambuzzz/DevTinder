import React from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Redux se user check karne ke liye
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
const PremiumPage = () => {
  const [showToast, setShowToast] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user); // Aapka user state
  const isPremium = user?.isPremium;

  const handlePayment = async () => {
    try {
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
              BASE_URL + "payment/verify",
              response,
              { withCredentials: true }
            );
            if (verifyRes.data.success) {
              // Direct reload karo ek success flag ke saath
              window.location.href = "/premium?paymentsuccess=true";
            }
          } catch (err) {
            console.error("Verification failed", err);
          }
        },
        prefill: { name: user.firstName + " " + user.lastName },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initiation failed", error);
    }
  };
  useEffect(() => {
    // Agar URL mein ?paymentsuccess=true hai
    if (searchParams.get("paymentsuccess") === "true") {
      setShowToast(true);

      // 5 second baad toast hatao aur URL clean kar do
      const timer = setTimeout(() => {
        setShowToast(false);
        setSearchParams({}); // URL se query hata dega (?paymentsuccess=true gayab)
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-y-auto overflow-x-hidden flex items-center justify-center py-20 px-6">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-md w-full my-auto"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Top Badge for Premium Users */}
          {isPremium && (
            <div className="absolute top-0 right-1 bg-indigo-500 text-white text-[10px] font-bold px-4 py-1 rounded-bl-2xl uppercase tracking-widest shadow-lg">
              Active
            </div>
          )}

          <motion.div
            animate={
              isPremium
                ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }
                : { rotateY: [0, 10, 0], y: [0, -10, 0] }
            }
            transition={{ repeat: Infinity, duration: 4 }}
            className={`w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)] ${
              isPremium
                ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-indigo-600"
                : "bg-gradient-to-tr from-indigo-500 to-purple-500"
            }`}
          >
            {isPremium ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="white"
                className="w-12 h-12"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            ) : (
              <span className="text-4xl text-white font-bold italic">DT</span>
            )}
          </motion.div>

          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            {isPremium ? "Member " : "DevTinder "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {isPremium ? "Gold" : "Gold"}
            </span>
          </h1>

          <p className="text-slate-400 mb-8 text-lg leading-relaxed">
            {isPremium
              ? `Welcome back, ${user?.firstName}! Your premium features are active.`
              : "Unleash the full potential of developer networking."}
          </p>

          <div className="space-y-4 mb-10 text-left">
            {[
              "Unlimited Swipe",
              "See who likes you",
              "Direct Message",
              "Priority Support",
            ].map((feature, i) => (
              <div key={i} className="flex items-center text-slate-300">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3 text-indigo-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm md:text-base">{feature}</span>
              </div>
            ))}
          </div>

          {isPremium ? (
            <button
              onClick={() => navigate("/")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:bg-slate-700 transition-all shadow-xl"
            >
              Back to Home
            </button>
          ) : (
            <button
              onClick={handlePayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(99,102,241,0.3)]"
            >
              Upgrade Now - ₹500
            </button>
          )}

          <p className="mt-6 text-[10px] md:text-xs text-slate-500 leading-relaxed italic">
            {isPremium
              ? "Thank you for supporting DevTinder!"
              : "Secure payment via Razorpay. By upgrading, you agree to our Privacy Policy."}
          </p>
        </div>
      </motion.div>
      {showToast && (
        <div className="toast toast-top toast-center z-[100]">
          <div className="alert border border-indigo-500 bg-slate-900 shadow-2xl rounded-2xl p-4 min-w-[350px]">
            <div className="flex items-center gap-4">
              {/* Animated Crown Icon */}
              <div className="bg-indigo-600 p-2 rounded-xl animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"
                  />
                </svg>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-white font-bold text-lg">
                  Mubarak ho! 🎉
                </span>
                <span className="text-indigo-300 text-sm">
                  Aap DevTinder{" "}
                  <span className="font-extrabold text-white">Gold</span> member
                  ban gaye hain.
                </span>
              </div>
            </div>

            {/* Progress bar animation (optional) */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-[progress_4s_linear]"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumPage;
