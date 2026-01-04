import React from "react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 py-20 px-4 md:px-10 flex flex-col items-center justify-center">
      <div className="max-w-5xl mx-auto text-center sm:mb-16 mb-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
          Contact Us
        </h1>
        <p className="text-slate-500 font-mono italic">
          We're here to help you
        </p>
        <div className="h-1 w-20 bg-emerald-500 mx-auto mt-6 rounded-full"></div>
      </div>

      <div className="max-w-5xl w-full flex flex-col gap-8">
        {/* 2. Grid Section */}
        <div className="grid md:grid-cols-2 gap-8 sm:w-full">
          {/* Support Card */}
          <div className="bg-[#1e293b] p-6 md:p-8 w-full rounded-3xl border border-slate-800 shadow-2xl hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">
                  Email Support
                </p>
                <p className="text-lg md:text-xl font-mono text-slate-100 break-all">
                  ambujjais1@gmail.com
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">
                  Phone
                </p>
                <p className="text-lg md:text-xl font-mono text-slate-100">
                  +91 9793409528
                </p>
              </div>
            </div>
          </div>

          {/* Office/Address Card */}
          <div className="bg-[#1e293b] p-6 md:p-8 w-full rounded-3xl border border-slate-800 shadow-2xl flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6">
              Registered Address
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              As per our records, our registered communication address is:
            </p>
            <div className="mt-auto pt-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 text-sm">
                <p className="font-bold text-white mb-1 uppercase tracking-tight">
                  AMBUJ JAISWAL
                </p>
                <p className="text-slate-300">
                  IIIT Kota, Ranpur, Kota, Rajasthan, India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Grievance Note Section (Ab ye cards ki width ke barabar hoga) */}
        <div className="w-full p-6 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl text-center">
          <p className="text-sm text-emerald-500 leading-relaxed">
            For any payment related grievances or support, please reach out via
            the email mentioned above. Expect a response within 24-48 business
            hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
