import React from 'react';
import './Footer.css';

const Footer = () => {
  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const text = lang === 'es'
    ? `© ${new Date().getFullYear()} F1Hub. Un servicio de análisis de datos de OverCut.`
    : `© ${new Date().getFullYear()} F1Hub. A data analysis service by OverCut.`;

  return (
    <footer className="f1hub-footer">
      <p>{text}</p>
    </footer>
  );
};

export default Footer;
