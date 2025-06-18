import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-content">
        <div className="footer-links">
          <Link className="footer-link" to="/about_us">
            <FormattedMessage id="project.About" defaultMessage="About OverCut" />
          </Link>
          <Link className="footer-link" to="/contact">
            <FormattedMessage id="project.Contact" defaultMessage="Contact" />
          </Link>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-text">
            <FormattedMessage id="project.Footer" defaultMessage="OverCut – All rights reserved." />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
