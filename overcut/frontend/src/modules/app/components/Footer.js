import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { useConsent } from "../../../cookies/ConsentContext"; // ajusta la ruta si tu estructura difiere
import "./Footer.css";

const Footer = () => {
  const { openConfig } = useConsent();

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

          {/* REABRIR CONFIGURACIÓN DE COOKIES */}
          <button
            type="button"
            className="footer-link footer-link--button"
            onClick={openConfig}
          >
            <FormattedMessage id="cookies.reopen" defaultMessage="Configuración de cookies" />
          </button>
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
            href="https://x.com/OvercutPlatform?t=jceCVUgFPkqio-Bry8SZIg&s=09"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href="https://www.instagram.com/overcutplatform?igsh=eTVhZWk0YjNmeXBv"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
          <a
            href="https://www.youtube.com/@OvercutMediaPlatform"
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
