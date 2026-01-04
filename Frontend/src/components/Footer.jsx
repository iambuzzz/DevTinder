import React from "react";
import Logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-black/40 text-base-content p-10 mt-auto border-t border-white/10">
      {/* Main Container: 
          - Mobile (default): flex-col + items-center + text-center 
          - Desktop (md): flex-row + justify-around + text-left
      */}
      <div className="flex flex-col md:flex-row justify-around items-start gap-10 text-left">
        <aside className="flex flex-col items-start">
          <img src={Logo} alt="Dev Tinder Logo" className="h-16 w-16 -ml-3" />
          <p className="mt-2">
            Dev Tinder Ltd.
            <br />
            Providing reliable tech since 2025
          </p>
        </aside>

        <nav className="flex flex-col gap-2">
          <h6 className="footer-title opacity-60 font-bold uppercase text-xs mb-2">
            Services
          </h6>
          <a className="link link-hover">Branding</a>
          <a className="link link-hover">Design</a>
          <a className="link link-hover">Marketing</a>
          <a className="link link-hover">Advertisement</a>
        </nav>

        <nav className="flex flex-col gap-2">
          <h6 className="footer-title opacity-60 font-bold uppercase text-xs mb-2">
            Company
          </h6>
          <a className="link link-hover">About us</a>
          <Link to={"/contactus"} className="link link-hover">
            Contact Us
          </Link>
          <a className="link link-hover">Jobs</a>
        </nav>

        <nav className="flex flex-col gap-2">
          <h6 className="footer-title opacity-60 font-bold uppercase text-xs mb-2">
            Legal
          </h6>
          <Link to={"/terms"} className="link link-hover">
            Terms and Conditions
          </Link>
          <Link to={"/privacy-policy"} className="link link-hover">
            Privacy policy
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
