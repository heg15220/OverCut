import React from "react";
import LegalLayout from "./LegalLayout";

const LegalNotice = () => {
  return (
    <LegalLayout title="Aviso legal" updatedAt="29 de agosto de 2025">
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
            <li><b>Responsable:</b> Hugo Espasandín García (en adelante, “OverCut”)</li>
            <li><b>NIF:</b> Por poner </li>
            <li><b>Domicilio:</b> Por poner </li>
            <li><b>Correo electrónico:</b> <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a></li>
            <li><b>Página web:</b> www.overcut.es</li>
          </ul>
        </details>
      </section>

      <section className="legal-section">
        <details className="legal-details">
          <summary>6. Normativa y jurisdicción</summary>
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
    </LegalLayout>
  );
};

export default LegalNotice;
