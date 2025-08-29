// src/common/components/LegalLayout.jsx
import React from "react";
import "./Legal.css";

const LegalLayout = ({ title, updatedAt, children }) => {
  return (
    <article className="legal-page">
      <h1>{title}</h1>
      {updatedAt && <div className="legal-meta">Última actualización: {updatedAt}</div>}
      {children}
      <p className="legal-note">
        Si tienes dudas legales, escríbenos a <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a>.
      </p>
    </article>
  );
};

export default LegalLayout;
