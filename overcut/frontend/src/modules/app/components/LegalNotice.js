import React from "react";
import LegalLayout from "./LegalLayout";

const LegalNotice = () => {
  const isSpanish =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith("es");

  return (
    <LegalLayout
      title={isSpanish ? "Aviso legal" : "Legal Notice"}
      updatedAt={isSpanish ? "29 de agosto de 2025" : "August 29, 2025"}
    >
      {isSpanish ? (
        <>
          <nav className="legal-toc">
            <a href="#identificacion">1. Aviso legal</a>
          </nav>

          <section id="identificacion" className="legal-section">
            <details open className="legal-details">
              <summary>1. Aviso legal</summary>
              <p>
                En cumplimiento con el artículo 10.1 de la Ley 34/2002, de 11 de julio, de Servicios de la
                Sociedad de la Información y Comercio Electrónico (LSSI) se indican los datos identificativos
                del titular:
              </p>
              <ul>
                <li><b>Responsable:</b> Hugo E.G. (en adelante, “OverCut”)</li>
                <li><b>Correo electrónico:</b> <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a></li>
                <li><b>Identificación de la web:</b> www.overcutf1.com</li>
                <li><b>Apartado de correos:</b> 636</li>
                <li><b>Código Postal:</b> 15704</li>
              </ul>
            </details>
          </section>

          <section className="legal-section">
            <details className="legal-details">
              <summary>Normativa y jurisdicción</summary>
              <p>
                Nuestros textos legales se rigen por la ley española. Estos textos permanecerán accesibles
                para los usuarios en todo momento desde nuestra página web.
              </p>
              <p>
                Si las partes no acordasen someterse a mediación o arbitraje previamente, en el presente aviso
                legal se establece el acuerdo de someterse a los Juzgados y Tribunales de Santiago de Compostela
                renunciando expresamente a cualquier otra jurisdicción.
              </p>
            </details>
          </section>
        </>
      ) : (
        <>
          <nav className="legal-toc">
            <a href="#identification">1. Legal Notice</a>
          </nav>

          <section id="identification" className="legal-section">
            <details open className="legal-details">
              <summary>1. Legal Notice</summary>
              <p>
                In compliance with Article 10.1 of Spanish Law 34/2002, of July 11, on Information Society
                Services and Electronic Commerce (LSSI), the identifying details of the owner are provided:
              </p>
              <ul>
                <li><b>Controller:</b> Hugo E.G. (hereinafter, “OverCut”)</li>
                <li><b>Email:</b> <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a></li>
                <li><b>Website identification:</b> www.overcutf1.com</li>
                <li><b>P.O. Box:</b> 636</li>
                <li><b>Postal Code:</b> 15704</li>
              </ul>
            </details>
          </section>

          <section className="legal-section">
            <details className="legal-details">
              <summary>Applicable law and jurisdiction</summary>
              <p>
                Our legal texts are governed by Spanish law. These texts will remain accessible to users
                at all times through our website.
              </p>
              <p>
                If the parties do not agree to submit to mediation or arbitration beforehand, this legal
                notice establishes that disputes will be submitted to the Courts and Tribunals of Santiago
                de Compostela, expressly waiving any other jurisdiction.
              </p>
            </details>
          </section>
        </>
      )}
    </LegalLayout>
  );
};

export default LegalNotice;
