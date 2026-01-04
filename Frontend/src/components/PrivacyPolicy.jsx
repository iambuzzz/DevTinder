import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 py-20 px-4 md:px-10">
      {/* Premium Header */}
      <div className="max-w-5xl mx-auto text-center sm:mb-16 mb-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
          Privacy Policy
        </h1>
        <p className="text-slate-500 font-mono">
          Last updated on March 19th, 2024
        </p>
        <div className="h-1 w-20 bg-primary mx-auto mt-6 rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto grid gap-8">
        {/* 1. Introduction Card */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 hover:border-primary/30 transition-all shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3 text-sm">
              01
            </span>
            Introduction
          </h2>
          <p className="leading-relaxed">
            This Privacy Policy applies to your use of the website and services
            provided by <strong>AMBUJ JAISWAL</strong>. It governs the
            collection and use of Personal Information to ensure a safe
            experience on our platform. By visiting this Website, you agree to
            the collection and processing of your data as set out herein.
          </p>
        </div>

        {/* 2. Data Collection Card */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3 text-sm">
              02
            </span>
            Information We Collect
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="text-primary mr-2">▹</span>
              <span>
                <strong>Personal Details:</strong> Name, phone number, and email
                address.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">▹</span>

              <span>
                <strong>Sensitive Data:</strong> Financial information such as
                bank account or card details saved in your account.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">▹</span>

              <span>
                <strong>Activity Logs:</strong> Browser type, IP address,
                location, and timestamp information.
              </span>
            </li>
          </ul>
        </div>

        {/* 3. Purpose of Use Card */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3 text-sm">
              03
            </span>
            How We Use Your Information
          </h2>

          <p className="mb-4 italic text-slate-400">
            We use commercially reasonable efforts to limit collection to what
            is necessary.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm font-semibold text-primary mb-1">
                Service & Safety
              </p>

              <p className="text-xs text-slate-400">
                To troubleshoot problems, detect fraud, and enforce terms.
              </p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm font-semibold text-primary mb-1">
                Communication
              </p>

              <p className="text-xs text-slate-400">
                To send transaction alerts, news, and newsletters via email/SMS.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Security & Rights */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3 text-sm">
              04
            </span>
            Security & Your Rights
          </h2>
          <p className="mb-4">
            We implement industry-standard security practices to protect your
            information. You have the right to modify your preferences or
            request the erasure of your data from our servers.
          </p>
          <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-xl">
            <p className="text-amber-500 text-sm italic">
              "While we try our best to provide security better than industry
              standards, absolute security over the internet cannot be
              warranted."
            </p>
          </div>
        </div>

        {/* 5. Grievance Redressal (Crucial for Razorpay) */}
        <div className="bg-gradient-to-br from-[#1e293b] to-primary/10 p-8 rounded-3xl border border-primary/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3 text-sm">
              04
            </span>
            Grievance Redressal
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-400 uppercase tracking-widest mb-1">
                DPO Officer
              </p>
              <p className="text-xl font-bold text-white">
                Mr. SHASHANK KARINCHETI
              </p>

              <p className="mt-2 text-slate-400">
                Razorpay Software Private Limited
              </p>
              <p>
                No. 22, 1st Floor, SJR Cyber, Laskar - Hosur Road, Adugodi,
                Bangalore - 560030
              </p>
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <p className="flex justify-between border-b border-slate-700 pb-1">
                <span>Email:</span>

                <span className="text-primary font-mono">dpo@razorpay.com</span>
              </p>
              <p className="flex justify-between border-b border-slate-700 pb-1">
                <span>Phone:</span>

                <span className="text-slate-300">080-46669555</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acceptance Footer */}
      <div className="max-w-5xl mx-auto mt-12 text-center text-slate-500 text-xs">
        <p>
          This document was accepted by <strong>{"AMBUJ JAISWAL"}</strong> on{" "}
          {"2026-01-01"}.
        </p>
        <p className="mt-2">
          Governed by the laws of India. Jurisdiction: Bengaluru.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
