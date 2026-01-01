import React from "react";
import Logo from "../assets/logo.png";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div>
      <footer className="footer sm:footer-horizontal bg-black/40 text-base-content p-10 mt-auto">
        <aside>
          <img
            src={Logo}
            alt="Dev Tinder Logo"
            className="h-16 w-16 -ml-3 -mb-2"
          />
          <p>
            Dev Tinder Ltd.
            <br />
            Providing reliable tech since 2025
          </p>
        </aside>
        <nav>
          <h6 className="footer-title">Services</h6>
          <a className="link link-hover">Branding</a>
          <a className="link link-hover">Design</a>
          <a className="link link-hover">Marketing</a>
          <a className="link link-hover">Advertisement</a>
        </nav>
        <nav>
          <h6 className="footer-title">Company</h6>
          <a className="link link-hover">About us</a>
          <a className="link link-hover">Contact</a>
          <a className="link link-hover">Jobs</a>
        </nav>
        <nav>
          <h6 className="footer-title">Legal</h6>
          <Link to={"/terms"} className="link link-hover">
            Terms and Conditions
          </Link>
          <Link to={"/privacy-policy"} className="link link-hover">
            Privacy policy
          </Link>
          <Link to={"/contactus"} className="link link-hover">
            Contact Us
          </Link>
        </nav>
      </footer>
    </div>
  );
};

export default Footer;
