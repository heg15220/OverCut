import React from "react";
import LegalLayout from "./LegalLayout";

const TermsOfUse = () => {
  const isSpanish =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith("es");

  return (
    <LegalLayout
      title={isSpanish ? "Condiciones de uso" : "Terms of Use"}
      updatedAt={isSpanish ? "8 de September de 2025" : "September 8, 2025"}
    >
      {isSpanish ? (
        <>
             <nav className="legal-toc">
               <a href="#finalidad">1. Finalidad del sitio</a>
               <a href="#acceso">2. Acceso y uso correcto</a>
               <a href="#ugc">3. Contenidos generados por el usuario</a>
               <a href="#pi">4. Propiedad intelectual e industrial</a>
               <a href="#resp">5. Responsabilidades</a>
               <a href="#obl">6. Obligaciones de los usuarios</a>
               <a href="#ley">8. Ley aplicable y jurisdicción</a>
               <a href="#pi2">9. Propiedad intelectual e industrial</a>
               <a href="#act">10. Actualizaciones</a>
             </nav>
            <p>
              El presente texto establece las condiciones que regulan el acceso y uso de la página web OverCut
              (en adelante, “el Sitio”), cuyo titular es Hugo Espasandín García (en adelante, “OverCut”).
              Lea este documento con atención. Aquí encontrará las condiciones de uso de nuestro sitio web,
              los derechos y obligaciones de ambas partes, entre otras cuestiones.
              Al acceder, navegar o utilizar el Sitio, el usuario (en adelante, “el USUARIO”) acepta plenamente
              estas Condiciones de Uso. Si no está de acuerdo con ellas, deberá abstenerse de usar el Sitio.
            </p>

            <section id="finalidad">
              <details open className="legal-details">
              <summary>1. Finalidad del sitio</summary>
            <p>
              OverCut es una página de fans dedicada a la Fórmula 1 y al automovilismo, con fines informativos,
              de entretenimiento y de interacción entre aficionados, a través de contenidos editoriales, blogs,
              encuestas, mini juegos y rankings.
              El Sitio no es oficial y no está afiliado, patrocinado ni respaldado por Formula 1/F1, la FIA,
              escuderías, pilotos o patrocinadores.
            </p>
            </details>
          </section>

     <section id="acceso">
         <details className="legal-details">
            <summary>2. Acceso y uso correcto</summary>
            <ul>
              <li>El acceso al Sitio es gratuito, salvo que se indique lo contrario para determinadas funcionalidades o servicios.</li>
              <li>EL USUARIO se compromete a utilizar el Sitio, sus contenidos y servicios de conformidad con la ley, la moral, el orden público y estas Condiciones.</li>
              <li>
                Queda prohibido:
                <ul>
                  <li>Utilizar el Sitio con fines ilícitos, lesivos de derechos de terceros o que puedan perjudicar la reputación del Sitio o de terceros.</li>
                  <li>Introducir o difundir virus, malware o cualquier software dañino.</li>
                  <li>Intentar acceder a áreas restringidas, cuentas de otros USUARIOS o sistemas del Sitio sin autorización.</li>
                </ul>
              </li>
            </ul>
            </details>
          </section>

          <section id="ugc">
            <details className="legal-details">
              <summary>3. Contenidos generados por el usuario</summary>
            <ul>
              <li>El USUARIO podrá participar en comentarios, encuestas, quizzes, mini juegos o rankings, siempre respetando la temática del Sitio y las normas básicas de convivencia.</li>
              <li>El USUARIO es el único responsable del contenido que publique o envíe, garantizando que no infringe derechos de terceros (propiedad intelectual, industrial, imagen, honor, etc.).</li>
              <li>OverCut se reserva el derecho de moderar, editar o eliminar cualquier contenido que, a su juicio, incumpla estas Condiciones o resulte ofensivo, ilegal o inadecuado.</li>
              <li>Al publicar contenido, el USUARIO concede a OverCut una licencia no exclusiva, mundial y gratuita para reproducir, distribuir y mostrar dicho contenido en el contexto del Sitio y sus canales asociados.</li>
            </ul>
            </details>
          </section>

          <section id="pi">
              <details className="legal-details">
                <summary>4. Propiedad intelectual e industrial</summary>
            <ul>
              <li>
                El USUARIO reconoce y consiente expresamente que todo copyright, marca registrada y demás derechos de propiedad
                intelectual o industrial sobre los productos y servicios ofertados a través de la página web de OverCut, o sobre los
                contenidos que se aportan como parte de la página web, corresponden en todo momento a OverCut o a quienes otorgaron
                a OverCut licencia para su uso. El USUARIO no podrá hacer uso de dicho material salvo que OverCut lo autorice expresamente.
              </li>
              <li>
                Las marcas, logotipos y demás signos distintivos de Fórmula 1/F1, FIA, escuderías, pilotos y patrocinadores son propiedad
                de sus respectivos titulares y se muestran únicamente con fines informativos y descriptivos.
              </li>
              <li>
                Este sitio web no es oficial y no está asociado de ninguna manera con las empresas de Fórmula 1.
                F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX y las marcas relacionadas son marcas
                comerciales de Formula One Licensing B.V.
              </li>
              <li>El acceso al Sitio no otorga ningún derecho de uso sobre dichos contenidos o marcas.</li>
            </ul>
            </details>
          </section>

          <section id="resp">
            <details className="legal-details">
              <summary>5. Responsabilidades</summary>
            <ul>
              <li>OverCut no se responsabiliza de los daños y perjuicios derivados del mal uso que el USUARIO pueda hacer del sitio web o de sus contenidos.</li>
              <li>
                OverCut no será responsable de la interrupción o problemas en el funcionamiento de la página web o de la tienda online,
                derivados de la prestación de los servicios de acceso a Internet, virus, programas malintencionados, averías, ni de
                cualesquiera otras incidencias técnicas que no dependan directamente de OverCut.
              </li>
            </ul>
            </details>
          </section>

          <section id="obl">
            <details className="legal-details">
              <summary>6. Obligaciones de los usuarios</summary>
            <p>Al acceder a la página web de OverCut, el USUARIO se compromete a:</p>
            <ul>
              <li><strong>Uso legal y conforme a las Condiciones</strong>: Utilizar el Sitio de acuerdo con la ley, la buena fe, el orden público y estas Condiciones de Uso, evitando cualquier actuación que pueda dañar, inutilizar, sobrecargar o deteriorar el funcionamiento del mismo.</li>
              <li><strong>Respeto hacia otros usuarios y terceros</strong>: Mantener un comportamiento respetuoso en los comentarios, encuestas, mini juegos, quizzes y cualquier otra interacción, absteniéndose de publicar contenido ofensivo, difamatorio, discriminatorio, violento o ilegal.</li>
              <li><strong>Prohibición de uso indebido</strong>: No utilizar el Sitio para fines comerciales no autorizados, envío de publicidad, spam o cualquier forma de comunicación no solicitada.</li>
              <li><strong>Protección de derechos de terceros</strong>: No publicar, transmitir o compartir contenidos que infrinjan derechos de propiedad intelectual, industrial, imagen, privacidad u otros derechos de terceros, incluidos los relacionados con Fórmula 1/F1, FIA, escuderías, pilotos o patrocinadores.</li>
              <li><strong>Veracidad de la información</strong>: Aportar datos veraces, exactos y actualizados cuando se le solicite (por ejemplo, en formularios, comentarios o registros), y mantenerlos actualizados en caso de cambios.</li>
              <li><strong>Seguridad de las credenciales</strong>: Mantener en secreto sus claves de acceso y credenciales, asumiendo la responsabilidad de todas las actividades realizadas desde su cuenta.</li>
              <li><strong>Cumplimiento de normas de participación</strong>: Respetar las reglas específicas que se indiquen para encuestas, mini juegos, quizzes y rankings, evitando el uso de métodos fraudulentos para alterar resultados o clasificaciones.</li>
            </ul>
            </details>
          </section>


          <section id="ley">
            <details className="legal-details">
              <summary>7. Ley aplicable y jurisdicción</summary>
            <p>
              Para cualquier cuestión, conflicto o controversia que pueda surgir, éstas se someten expresamente a la legislación española
              y a la competencia de los Juzgados y Tribunales de Santiago de Compostela, renunciando expresamente a cualquier otra
              legislación o fuero que les sea propio, salvo que por Ley se determinen de forma imperativa otros distintos.
            </p>
            </details>
          </section>


          <section id="act">
            <details className="legal-details">
              <summary>8. Actualizaciones</summary>
            <p>
              OverCut se reserva el derecho a modificar estas Condiciones de Uso en cualquier momento. En ese caso, se pondrá en conocimiento de los usuarios.
            </p>
            <p>Versión actualizada: 8 de September de 2025.</p>
            </details>
          </section>
        </>
      ) : (
        <>
          <nav className="legal-toc">
                      <a href="#finalidad">1. Purpose of the site</a>
                      <a href="#acceso">2. Proper access and use</a>
                      <a href="#ugc">3. User-generated content</a>
                      <a href="#pi">4. Intellectual and industrial property</a>
                      <a href="#resp">5. Liability</a>
                      <a href="#obl">6. User obligations</a>
                      <a href="#resp2">7. Liability</a>
                      <a href="#ley">8. Governing law and jurisdiction</a>
                      <a href="#pi2">9. Intellectual and industrial property</a>
                      <a href="#act">10. Updates</a>
                    </nav>

            <p>
              This text sets out the conditions governing access to and use of the OverCut website (hereinafter, the “Site”),
              owned by Hugo Espasandín García (hereinafter, “OverCut”). Please read this document carefully. Here you will find
              the terms of use of our website, the rights and obligations of both parties, among other matters. By accessing,
              browsing or using the Site, the user (hereinafter, the “USER”) fully accepts these Terms of Use. If you do not
              agree with them, you must refrain from using the Site.
            </p>

          <section id="finalidad">
            <details open className="legal-details">
              <summary>1. Purpose of the site</summary>
            <p>
              OverCut is a fan site dedicated to Formula 1 and motorsport, for informational, entertainment and fan interaction
              purposes, through editorial content, blogs, surveys, mini-games and rankings. The Site is unofficial and is not
              affiliated with, sponsored or endorsed by Formula 1/F1, the FIA, teams, drivers or sponsors.
            </p>
            </details>
          </section>


          <section id="acceso">
            <details className="legal-details">
              <summary>2. Proper access and use</summary>
            <ul>
              <li>Access to the Site is free, unless otherwise indicated for certain features or services.</li>
              <li>The USER undertakes to use the Site, its contents and services in accordance with the law, morality, public order and these Terms.</li>
              <li>
                The following is prohibited:
                <ul>
                  <li>Using the Site for unlawful purposes, in ways that infringe third-party rights, or that could damage the reputation of the Site or third parties.</li>
                  <li>Introducing or spreading viruses, malware or any harmful software.</li>
                  <li>Attempting to access restricted areas, other USERS’ accounts or the Site’s systems without authorization.</li>
                </ul>
              </li>
            </ul>
            </details>
          </section>

          <section id="ugc">
            <details className="legal-details">
              <summary>3. User-generated content</summary>
            <ul>
              <li>USERS may participate in comments, surveys, quizzes, mini-games or rankings, always respecting the Site’s theme and basic rules of conduct.</li>
              <li>The USER is solely responsible for the content they publish or submit, guaranteeing that it does not infringe third-party rights (intellectual/industrial property, image, honor, etc.).</li>
              <li>OverCut reserves the right to moderate, edit or remove any content that, in its judgment, breaches these Terms or is offensive, unlawful or inappropriate.</li>
              <li>By publishing content, the USER grants OverCut a non-exclusive, worldwide, royalty-free license to reproduce, distribute and display such content in the context of the Site and its associated channels.</li>
            </ul>
            </details>
          </section>

          <section id="pi">
            <details className="legal-details">
              <summary>4. Intellectual and industrial property</summary>
            <ul>
              <li>
                The USER expressly acknowledges and agrees that all copyrights, trademarks and other intellectual or industrial property
                rights over the products and services offered through the OverCut website, or over the content provided as part of the
                website, belong at all times to OverCut or to those who granted OverCut a license for their use. The USER may not use
                such material unless expressly authorized by OverCut.
              </li>
              <li>
                Trademarks, logos and other distinctive signs of Formula 1/F1, the FIA, teams, drivers and sponsors are the property of
                their respective owners and are displayed solely for informational and descriptive purposes.
              </li>
              <li>
                This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1,
                FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One Licensing B.V.
              </li>
              <li>Access to the Site does not grant any right to use such content or marks.</li>
            </ul>
            </details>
          </section>

          <section id="resp">
            <details className="legal-details">
              <summary>5. Liability</summary>
            <ul>
              <li>OverCut is not liable for damages arising from misuse of the website or its contents by the USER.</li>
              <li>
                OverCut will not be liable for interruptions or problems in the operation of the website or the online store arising
                from Internet access services, viruses, malicious software, malfunctions, or any other technical issues not directly
                attributable to OverCut.
              </li>
            </ul>
            </details>
          </section>


          <section id="obl">
            <details className="legal-details">
              <summary>6. User obligations</summary>
            <p>By accessing the OverCut website, the USER undertakes to:</p>
            <ul>
              <li><strong>Lawful use and compliance with the Terms</strong>: Use the Site in accordance with the law, good faith, public order and these Terms of Use, avoiding any action that could damage, disable, overload or impair its operation.</li>
              <li><strong>Respect for other users and third parties</strong>: Maintain respectful behavior in comments, surveys, mini-games, quizzes and any other interaction, refraining from posting offensive, defamatory, discriminatory, violent or illegal content.</li>
              <li><strong>Prohibition of misuse</strong>: Do not use the Site for unauthorized commercial purposes, advertising, spam or any form of unsolicited communication.</li>
              <li><strong>Protection of third-party rights</strong>: Do not post, transmit or share content that infringes intellectual/industrial property, image, privacy or other rights of third parties, including those related to Formula 1/F1, the FIA, teams, drivers or sponsors.</li>
              <li><strong>Accuracy of information</strong>: Provide truthful, accurate and up-to-date data when requested (e.g., in forms, comments or registrations) and keep it up to date in case of changes.</li>
              <li><strong>Credential security</strong>: Keep access keys and credentials secret, assuming responsibility for all activities carried out from your account.</li>
              <li><strong>Compliance with participation rules</strong>: Respect the specific rules indicated for surveys, mini-games, quizzes and rankings, avoiding the use of fraudulent methods to alter results or leaderboards.</li>
            </ul>
            </details>
          </section>


          <section id="ley">
            <details className="legal-details">
              <summary>7. Governing law and jurisdiction</summary>
            <p>
              For any matter, dispute or controversy that may arise, the parties expressly submit to Spanish law and to the jurisdiction
              of the Courts and Tribunals of Santiago de Compostela, expressly waiving any other legislation or jurisdiction, unless
              mandatory law determines otherwise.
            </p>
            </details>
          </section>

          <section id="act">
            <details className="legal-details">
              <summary>8. Updates</summary>
            <p>
              OverCut reserves the right to modify these Terms of Use at any time. In such case, users will be informed.
            </p>
            <p>Last updated: September 8, 2025.</p>
            </details>
          </section>
        </>
      )}
    </LegalLayout>
  );
};

export default TermsOfUse;
