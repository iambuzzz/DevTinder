import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 py-20 px-4 md:px-10">
      <div className="max-w-5xl mx-auto text-center sm:mb-16 mb-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary mb-4">
          Terms & Conditions
        </h1>
        <p className="text-slate-500 font-mono">
          Effective Date: January 1st, 2026
        </p>
        <div className="h-1 w-20 bg-secondary mx-auto mt-6 rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto grid gap-8">
        {/* Usage of Website */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing DevTinder, you agree to be bound by these Terms of Use
            and our Privacy Policy. If you do not agree with any of these terms,
            you are prohibited from using or accessing this site.
          </p>
        </div>

        {/* Intellectual Property */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            2. Intellectual Property
          </h2>
          <p>
            The content, logos, and service marks displayed on this Website are
            the exclusive property of <strong>AMBUJ JAISWAL</strong>. You may
            not use, copy, or display our intellectual property without express
            written permission.
          </p>
        </div>

        {/* Payments & Refunds - Sabse Important for Razorpay */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-primary/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 text-primary">
            3. Payments & Donations
          </h2>
          <ul className="space-y-4">
            <li>
              <strong className="text-slate-100">Transaction Security:</strong>{" "}
              All payments are processed through Razorpay's secure checkout. We
              do not store your full card details.
            </li>
            <li>
              <strong className="text-slate-100 font-bold text-red-400 uppercase tracking-tighter">
                Refund Policy:
              </strong>{" "}
              Payments made to support development are voluntary and{" "}
              <strong>Non-Refundable</strong>. Once a transaction is successful,
              no refund requests will be entertained.
            </li>
          </ul>
        </div>

        {/* Governing Law */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            4. Governing Law
          </h2>
          <p>
            These terms are governed by the laws of India. Any legal actions or
            proceedings shall be brought exclusively in the competent courts of{" "}
            <strong>Bengaluru, India</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
