import React from "react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 py-20 px-4 md:px-10">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
          Contact Us
        </h1>
        <p className="text-slate-500 font-mono italic">
          We're here to help you
        </p>
        <div className="h-1 w-20 bg-emerald-500 mx-auto mt-6 rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Support Card */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl hover:border-emerald-500/30 transition-all">
          <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-500 font-bold mb-1">
                Email Support
              </p>
              <p className="text-xl font-mono text-slate-100">
                ambujjais1@gmail.com
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-500 font-bold mb-1">
                Phone
              </p>
              <p className="text-xl font-mono text-slate-100">+91 9793409528</p>
            </div>
          </div>
        </div>

        {/* Office/Address Card (As per Razorpay PDF) */}
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Registered Address
          </h2>
          <p className="text-slate-400 leading-relaxed">
            As per our records,<br></br> our registered communication address
            is:
          </p>
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 text-sm">
            <p className="font-bold text-white mb-1 uppercase">AMBUJ JAISWAL</p>
            <p>IIIT Kota, Ranpur, Kota, Rajasthan, India</p>
          </div>
        </div>
      </div>

      {/* Grievance Note for Razorpay */}
      <div className="max-w-5xl mx-auto mt-12 p-6 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl text-center">
        <p className="text-sm text-emerald-500">
          For any payment related grievances or support, please reach out via
          the email mentioned above. Expect a response within 24-48 business
          hours.
        </p>
      </div>
    </div>
  );
};

export default ContactUs;
