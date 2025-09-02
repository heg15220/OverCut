// src/common/components/LegalLayout.jsx
import React from "react";
import "./Legal.css";

const LegalLayout = ({ title, updatedAt, children }) => {
  const isSpanish =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith("es");

  return (
    <article className="legal-page">
      <h1>{title}</h1>
      {updatedAt && (
        <div className="legal-meta">
          {isSpanish ? "Última actualización:" : "Last updated:"} {updatedAt}
        </div>
      )}
      {children}
      <p className="legal-note">
        {isSpanish
          ? "Si tienes dudas legales, escríbenos a "
          : "If you have legal questions, write to "}
        <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a>.
      </p>
    </article>
  );
};

export default LegalLayout;
