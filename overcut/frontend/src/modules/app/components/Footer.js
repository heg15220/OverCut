import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-content">

        {/* LINKS PRINCIPALES */}
        <div className="footer-links">
          <Link className="footer-link" to="/about_us">
            <FormattedMessage id="project.About" defaultMessage="About OverCut" />
          </Link>

          {/* ENLACE ÚNICO A HUB LEGAL */}
          <Link className="footer-link" to="/legal">
            <FormattedMessage id="project.LegalPolicies" defaultMessage="Legal Policies" />
          </Link>
        </div>


        <hr className="footer-divider" />

        {/* SECCIÓN DE CONTACTO */}
        <div className="footer-contact">
          <p>
            <FormattedMessage id="project.ContactEmail" defaultMessage="Contact: " />{" "}
            <a href="mailto:overcutwebf1@gmail.com" className="footer-email">
              overcutwebf1@gmail.com
            </a>
          </p>
        </div>

        {/* ICONOS REDES SOCIALES */}
        <div className="footer-social">
          <a
            href="https://twitter.com/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href="https://www.instagram.com/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
          <a
            href="https://www.youtube.com/yourchannel"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <FaYoutube />
          </a>
        </div>

        <div className="footer-bottom">
          <p className="footer-text">
            © {new Date().getFullYear()} OverCut –{" "}
            <FormattedMessage id="project.AllRightsReserved" defaultMessage="All rights reserved." />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
