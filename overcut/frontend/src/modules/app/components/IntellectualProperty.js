import React from "react";
import LegalLayout from "./LegalLayout";

const IntellectualProperty = () => {
  const isSpanish =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith("es");

  return (
    <LegalLayout
      title={isSpanish ? "Propiedad intelectual e industrial" : "Intellectual and Industrial Property"}
      updatedAt={isSpanish ? "29 de agosto de 2025" : "August 29, 2025"}
    >
      {isSpanish ? (
        /* === SOLO ESPAÑOL CUANDO navigator.language empieza por 'es' === */
        <section id="propiedad-intelectual" lang="es">
          <h2>3. PROPIEDAD INTELECTUAL E INDUSTRIAL</h2>

          <p>
            Le advertimos que OverCut es titular de todos los derechos de la propiedad intelectual e industrial de la página web, así como todos sus elementos (a título enunciativo: imágenes, sonido, audio, video, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).
          </p>

          <p>
            La página web de OverCut contiene textos que pretenden informar a sus usuarios. Cualquier error u omisión en el contenido generado no hará responsable en ningún caso OverCut.
          </p>

          <p>
            Las marcas, logotipos, emblemas, nombres comerciales y demás signos distintivos de Fórmula 1/F1, FIA, escuderías, pilotos y patrocinadores mencionados en esta web son propiedad exclusiva de sus respectivos titulares. Su uso en OverCut tiene únicamente fines informativos y descriptivos, para identificar a los sujetos y eventos comentados. Este sitio no es oficial ni está afiliado, patrocinado o respaldado por Formula 1/F1, FIA, escuderías o patrocinadores.
          </p>

          <p>
            Las imágenes y vídeos usados son propios, con licencia o proceden de fuentes que permiten su uso editorial; en caso contrario se indicará su procedencia y titularidad. No se autoriza la descarga ni reutilización de material protegido salvo lo permitido por la ley.
          </p>

          <p>
            El acceso a OverCut no implica cesión de derechos de propiedad intelectual o industrial. Si considera que algún contenido vulnera sus derechos, puede solicitar su retirada escribiendo a overcutwebf1@gmail.com{" "}con prueba de titularidad y la URL del contenido.
          </p>

          <p>
            Este sitio web no es oficial y no está asociado de ninguna manera con las empresas de Fórmula 1. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX y las marcas relacionadas son marcas comerciales de Formula One Licensing B.V.
          </p>
        </section>
      ) : (
        /* === SOLO INGLÉS CUANDO NO EMPIEZA POR 'es' === */
        <section id="intellectual-property" lang="en">
          <h2>3. INTELLECTUAL AND INDUSTRIAL PROPERTY</h2>

          <p>
            Please note that OverCut owns all intellectual and industrial property rights over this website and all of its elements (including but not limited to: images, sound, audio, video, software or texts; trademarks or logos, color schemes, structure and design, selection of materials used, and the computer programs necessary for its operation, access and use, etc.).
          </p>

          <p>
            The OverCut website contains texts intended to inform its users. Any error or omission in generated content shall not, in any case, give rise to liability for OverCut.
          </p>

          <p>
            The trademarks, logos, emblems, trade names and other distinctive signs of Formula 1/F1, the FIA, teams, drivers and sponsors mentioned on this website are the exclusive property of their respective owners. Their use on OverCut is for informational and descriptive purposes only, to identify the subjects and events discussed. This site is unofficial and is not affiliated with, sponsored or endorsed by Formula 1/F1, the FIA, any teams or sponsors.
          </p>

          <p>
            Images and videos used are our own, licensed, or come from sources that allow editorial use; otherwise their source and ownership will be indicated. Downloading or re-use of protected material is not authorized except as permitted by law.
          </p>

          <p>
            Access to OverCut does not imply any transfer of intellectual or industrial property rights. If you believe any content infringes your rights, you may request its removal by writing to overcutwebf1@gmail.com{" "}with proof of ownership and the URL of the content.
          </p>

          <p>
            This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
          </p>
        </section>
      )}
    </LegalLayout>
  );
};

export default IntellectualProperty;
