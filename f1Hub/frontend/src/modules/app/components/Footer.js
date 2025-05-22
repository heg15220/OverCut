import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="f1hub-footer">
      <p>© {new Date().getFullYear()} F1Hub. Un servicio de análisis de datos de OverCut.</p>
    </footer>
  );
};

export default Footer;
