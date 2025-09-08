import React from "react";
import LegalLayout from "./LegalLayout";

const PrivacyPolicy = () => {
  const isSpanish =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith("es");

  return (
    <LegalLayout
      title={isSpanish ? "Política de privacidad" : "Privacy Policy"}
      updatedAt={isSpanish ? "8 de Septiembre de 2025" : "September 8, 2025"}
    >
      {isSpanish ? (
      <>
      <section>
        <p>
          Mediante la presente Política de Privacidad, el usuario queda informado de una forma clara,
          precisa y concisa. Si el usuario la acepta, nos dará su consentimiento de una forma libre,
          informada, específica e inequívoca para que OverCut trate sus datos personales, conforme al
          Reglamento UE 2016/679 relativo a la protección de las personas físicas, mediante el
          tratamiento de sus datos personales y su libre circulación (RGPD) y la Ley Orgánica 3/2018,
          del 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales
          (LOPDGDD) (legislación europea y nacional vigente sobre materia de protección de datos).
        </p>
      </section>

      <section id="basica">
        <details open className="legal-details">
          <summary>2.1 INFORMACIÓN BÁSICA SOBRE PROTECCIÓN DE DATOS</summary>
           <ul className="legal-list">
             <li><b>Responsable del tratamiento:</b> OverCut</li>
             <li><b>Finalidades del tratamiento:</b> Respuesta a consultas y dudas, prestación del servicio y posible envío de información sobre los productos y servicios.</li>
             <li><b>Legitimación:</b> Consentimiento del interesado y relación con Overcut (artículo 6.1,a del RGPD y artículo 6.1,b del RGPD).</li>
             <li><b>Destinatarios:</b> No se cederán datos a terceros. Podrán tener acceso: Fuerzas y Cuerpos de Seguridad, Encargados del Tratamiento necesarios para la prestación del servicio.</li>
             <li><b>Derechos e información adicional:</b> Se permite el ejercicio de los derechos de acceso, rectificación o supresión, entre otros. Toda la información se encuentra accesible en la información detallada de esta política de privacidad.</li>
           </ul>
           </details>
        </section>

      <section id="detallada">
          <details className="legal-details">
                <summary>2.2 INFORMACIÓN DETALLADA SOBRE PROTECCIÓN DE DATOS</summary>

              <h3>2.2.1 ¿Quién es el responsable del tratamiento?</h3>
              <p>Los datos identificativos del Responsable del Tratamiento aparecen en el apartado 1.</p>

              <h3>2.2.2 ¿Qué información recopilamos y tratamos del usuario a través de la página web?</h3>
              <p>
                Los datos que se recaban se refieren a la categoría de datos identificativos, como pueden ser: Nombre y Apellidos, Correo electrónico, así como la dirección IP desde donde accede al formulario de recogida de datos.
              </p>
              <ul>
                <li>
                  <b>• A través de nuestro email corporativo</b><br />
                  A través de nuestro correo electrónico <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a> el usuario podrá escribirnos y/o requerir la información que considere necesaria para aclarar las dudas relacionadas con nuestros servicios.
                </li>
                <li>
                  <b>• A través de los comentarios en el blog</b><br />
                  También podremos visualizar datos del usuario por comentarios que pueda escribir en los artículos de nuestro blog. Para poder realizar un comentario solicitaremos un nombre y un correo electrónico.
                </li>
                <li>
                  <b>• A través de los Mini juegos interactivos</b><br />
                  En determinados mini juegos se pueden solicitar datos de identificación (nombre o alias) y, en su caso, dirección de correo electrónico, con el fin de registrar la participación, guardar puntuaciones o mostrar resultados. Estos datos podrán utilizarse para elaborar clasificaciones internas y mostrar rankings, siempre que el usuario haya aceptado las condiciones de participación.
                </li>
                <li>
                  <b>• A través de Encuestas, quizzes y rankings</b><br />
                  En encuestas, cuestionarios o quizzes que generan rankings de usuarios, se puede recopilar información como nombre o alias, dirección de correo electrónico (si se requiere registro), respuestas aportadas y resultados obtenidos. Estos datos se emplean exclusivamente para fines estadísticos, elaboración de clasificaciones y mejora de la experiencia del usuario en el sitio.
                </li>
              </ul>
              <p>
                En el caso de que el usuario nos facilite datos de terceros, asumirá la responsabilidad de haberle informado previamente y tener su consentimiento para ello, conforme al artículo 14 del RGPD.
              </p>

              <h3>2.2.3 ¿Con qué finalidad tratamos los datos personales del usuario?</h3>
              <p>OverCut realiza un tratamiento de datos personales con las finalidades que se exponen a continuación, en función del motivo para el que hayan sido facilitados:</p>
              <ul>
                <li>• Contactar, tramitar, gestionar y dar respuesta a la petición, solicitud, incidencia o consulta del usuario (ya sea a través de correo electrónico, formulario de contacto o teléfono).</li>
                <li>• Gestionar, en su caso, el envío de información sobre novedades asociadas a OverCut por medios electrónicos y/o convencionales.</li>
              </ul>

              <h3>2.2.4 ¿Cuál es la legitimación del tratamiento de los datos del usuario?</h3>
              <ul>
                <li>• Para poder aprovechar los servicios ofertados a través de la página web, así como el registro de usuario, la legitimación es la relación contractual con Overcut y la aceptación de sus condiciones de uso, por ello, el tratamiento de datos se realiza en base al artículo 6.1,b del RGPD.</li>
                <li>• En lo que respecta al envío de información sobre productos, servicios y novedades asociadas a OverCut, la base legal para el tratamiento de los datos personales facilitados es el consentimiento que otorga el usuario de forma expresa, tal y como establece el artículo 6.1,a) del RGPD.</li>
              </ul>

              <h3>2.2.5 ¿Durante cuánto tiempo se tratarán los datos personales del usuario?</h3>
              <ul>
                <li>• Los datos de los usuarios registrados, gestión de consultas y solicitudes se conservarán durante el tiempo necesario para dar respuesta a los mismos, y en su caso, mientras el interesado no solicite la retirada de su consentimiento para enviarle información relacionada con su consulta.</li>
                <li>• Los datos para el envío de información asociada a las novedades de OverCut serán conservados mientras el usuario no revoque su consentimiento.</li>
              </ul>

              <h3>2.2.6 ¿A qué destinatarios se comunicarán los datos personales del usuario?</h3>
              <p>
                Como regla general, sus datos no serán cedidos a terceros salvo que existe una obligación legal o sea necesario para llevar a cabo la prestación del servicio. Teniendo esto en cuenta:
              </p>
              <ul>
                <li>• Únicamente en casos necesarios legalmente, los datos serán comunicados a las Fuerzas y Cuerpos de Seguridad del Estado.</li>
                <li>• También podrían ser comunicados a las Administraciones Públicas competentes en los casos previstos por la Ley.</li>
                <li>• En su caso, también serán comunicados a los Encargados del Tratamiento de OverCut para la correcta prestación del servicio.</li>
              </ul>

              <h3>2.2.7 ¿Cuáles son los derechos del usuario?</h3>
              <p>
                La normativa en materia de protección de datos permite que pueda ejercer sus derechos de acceso, rectificación, supresión y portabilidad de datos y oposición y limitación a su tratamiento, así como a no ser objeto de decisiones basadas únicamente en el tratamiento automatizado de sus datos, cuando proceda.
              </p>
              <p>Estos derechos se caracterizan por lo siguiente:</p>
              <ul>
                <li>• Su ejercicio es gratuito, salvo que se trate de solicitudes manifiestamente infundadas o excesivas (p. ej., carácter repetitivo), en cuyo caso OverCut podrá cobrar un canon proporcional a los costes administrativos soportados o negarse a actuar.</li>
                <li>• Puede ejercer los derechos directamente o por medio de su representante legal o voluntario.</li>
                <li>• Debemos responder a su solicitud en el plazo de un mes, aunque, si se tiene en cuenta la complejidad y número de solicitudes, se puede prorrogar el plazo en otros dos meses más.</li>
                <li>• Tenemos la obligación de informarle sobre los medios para ejercitar estos derechos, los cuales deben ser accesibles y sin poder denegarle el ejercicio del derecho por el solo motivo de optar por otro medio. Si la solicitud se presenta por medios electrónicos, la información se facilitará por estos medios cuando sea posible, salvo que nos solicite que sea de otro modo.</li>
                <li>• Si OverCut no da curso a la solicitud, le informará, a más tardar en un mes, de las razones de su no actuación y la posibilidad de reclamar ante una Autoridad de Control.</li>
              </ul>

          <p>
            A fin de facilitar su ejercicio, le facilitamos los enlaces al formulario de
            solicitud de cada uno de los derechos:
          </p>
          <ul>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-acceso.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio del derecho de acceso
              </a>
            </li>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-rectificacion.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio del derecho de rectificación
              </a>
            </li>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-oposicion.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio del derecho de oposición
              </a>
            </li>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-supresion.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio del derecho de supresión (derecho “al olvido”)
              </a>
            </li>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-limitacion.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio del derecho a la limitación del tratamiento
              </a>
            </li>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-portabilidad.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio del derecho a la portabilidad
              </a>
            </li>
            <li>
              <a
                href="https://www.aepd.es/documento/formulario-derecho-de-oposicion-decisiones-automatizadas.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Formulario de ejercicio a no ser objeto de decisiones individuales
                automatizadas
              </a>
            </li>
          </ul>

          <p>Para ejercer sus derechos OverCut pone a su disposición los siguientes medios:</p>
                  <ol>
                    <li>Mediante solicitud escrita y firmada dirigida a OverCut. Ref. Ejercicio de Derechos LOPD.</li>
                    <li>Enviando formulario escaneado y firmado a la dirección de correo electrónico <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a> indicando en el asunto Ejercicio de Derechos LOPD.</li>
                  </ol>

                  <p>
                    Asimismo, y especialmente si considera que no ha obtenido satisfacción plena en el ejercicio de sus derechos, le informamos que podrá presentar una reclamación ante la autoridad nacional de control dirigiéndose a estos efectos a la Agencia Española de Protección de Datos (AEPD), C/ Jorge Juan, 6 – 28001 Madrid (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
                  </p>

                  <h3>2.2.8 ¿Qué medidas de seguridad tenemos implementadas?</h3>
                  <p>En OverCut nos comprometemos a proteger su información personal.</p>
                  <p>
                    Utilizamos medidas, controles y procedimientos de carácter físico, organizativo y tecnológico, razonablemente fiables y efectivos, orientados a preservar la integridad y la seguridad de sus datos y garantizar su privacidad.
                  </p>
                  <p>
                    Además, todo el personal con acceso a los datos personales ha sido formado y tiene conocimiento de sus obligaciones con relación a los tratamientos de sus datos personales.
                  </p>
                  <p>
                    En el caso de los contratos que suscribimos con nuestros proveedores incluimos cláusulas en las que se les exige mantener el deber de secreto respecto a los datos de carácter personal a los que hayan tenido acceso en virtud del encargo realizado, así como implantar las medidas de seguridad técnicas y organizativas necesarias para garantizar la confidencialidad, integridad, disponibilidad y resiliencia permanentes de los sistemas y servicios de tratamiento de los datos personales.
                  </p>
                  <p>Todas estas medidas de seguridad son revisadas de forma periódica para garantizar su adecuación y efectividad.</p>
                  <p>
                    Sin embargo, la seguridad absoluta no se puede garantizar y no existe ningún sistema de seguridad que sea impenetrable por lo que, en el caso de cualquier información objeto de tratamiento y bajo nuestro control se viese comprometida como consecuencia de una brecha de seguridad, tomaremos las medidas adecuadas para investigar el incidente, notificarlo a la Autoridad de Control y, en su caso, a aquellos usuarios que se hubieran podido ver afectados para que tomen las medidas adecuadas.
                  </p>

                  <h3>2.2.9 Política en redes sociales</h3>
                  <p>OverCut dispone de un perfil corporativo en las redes sociales de Instagram, X y Google.</p>
                  <p>
                    Por lo tanto, OverCut es el “Responsable del tratamiento de tus datos” en virtud de la existencia de dichos perfiles en las redes sociales y ante el hecho de que el usuario nos siga y en virtud de ello también le podamos seguir.
                  </p>
                  <p>
                    Lo anterior significa que si el usuario decide unirse a nuestro perfil corporativo como un seguidor o dando un “Like” o un “Me gusta” a nuestros contenidos o perfil, acepta la presente política, donde explicamos sus derechos y cómo utilizamos sus datos.
                  </p>
                  <p>
                    En calidad de responsable del tratamiento de tus datos, garantizamos la confidencialidad en el tratamiento y el cumplimiento de los derechos del usuario, siempre bajo los efectos de la normativa vigente sobre protección de datos.
                  </p>
                  <p>
                    De otra parte, informamos que utilizaremos estas redes sociales para anunciar las noticias o información relevante relacionada con los servicios que ofrecemos, o bien sobre temas que consideremos sean de interés del usuario. Usando las funcionalidades de dichas plataformas, es posible que el usuario reciba en su muro o en su perfil noticias con este tipo de información.
                  </p>
                  <p>
                    Ahora bien, también  informamos de que no existe ningún vínculo entre OverCut y dichas plataformas o redes sociales, por lo que el usuario acepta su política de uso y condiciones una vez acceda a las mismas y/o valide sus avisos y términos y condiciones en el procedimiento de registro, no siendo responsable OverCut del uso o tratamiento de los datos del usuario que se haga fuera de la estricta relación y prestación de servicios indicados en esta política.
                  </p>
                  </details>
                </section>
      </>
      ) : (
              /* === SOLO INGLÉS === */
              <>
                <section>
                  <p>
                    Through this Privacy Policy, the user is informed in a clear,
                    precise and concise manner. If the user accepts it, they will give
                    their consent freely, in an informed, specific and unequivocal way
                    for OverCut to process their personal data, in accordance with EU
                    Regulation 2016/679 on the protection of natural persons with
                    regard to the processing of personal data and the free movement of
                    such data (GDPR) and Spanish Organic Law 3/2018, of December 5, on
                    the Protection of Personal Data and Guarantee of Digital Rights
                    (LOPDGDD).
                  </p>
                </section>

                <section id="basic">
              <details open className="legal-details">
                      <summary>2.1 BASIC INFORMATION ON DATA PROTECTION</summary>
                      <ul className="legal-list">
                        <li><b>Data Controller:</b> OverCut</li>
                        <li><b>Purpose of processing:</b> Respond to queries and questions, provide the service and possibly send information about products and services.</li>
                        <li><b>Legal basis:</b> Data subject’s consent and contractual relationship with OverCut (Article 6.1.a and Article 6.1.b GDPR).</li>
                        <li><b>Recipients:</b> No data will be transferred to third parties. Access may be granted to: Law Enforcement Authorities and Processors necessary for service provision.</li>
                        <li><b>Rights and additional information:</b> Users may exercise their rights of access, rectification or erasure, among others. All details can be found in the detailed information of this privacy policy.</li>
                      </ul>
                    </details>
              </section>

                  <section id="detailed">
                  <details className="legal-details">
                    <summary>2.2 DETAILED INFORMATION ON DATA PROTECTION</summary>

                            <h3>2.2.1 Who is the Data Controller?</h3>
                            <p>The identification details of the Data Controller are provided in section 1.</p>

                            <h3>2.2.2 What information do we collect and process through the website?</h3>
                            <p>
                              The data collected refers to identifying information such as: first and last name, email address, as well as the IP address from which the data collection form is accessed.
                            </p>

                            <ul>
                              <li>
                                <b>• Through our corporate email</b><br />
                                By emailing <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a>, the user may contact us and/or request any information deemed necessary to clarify doubts related to our services.
                              </li>
                              <li>
                                <b>• Through blog comments</b><br />
                                We may view user data contained in comments posted on our blog articles. A name and email address will be required to post a comment.
                              </li>
                              <li>
                                <b>• Through interactive Mini-games</b><br />
                                Certain mini-games may request identifying data (name or alias) and, where applicable, email address, in order to register participation, save scores or display results. These data may be used to create internal leaderboards and show rankings, provided the user has accepted the participation terms.
                              </li>
                              <li>
                                <b>• Through Surveys, quizzes and rankings</b><br />
                                In surveys, questionnaires or quizzes that generate user rankings, information such as name or alias, email address (if registration is required), responses provided and results obtained may be collected. These data are used exclusively for statistical purposes, creation of rankings and improving the user experience on the site.
                              </li>
                            </ul>

                            <p>
                              If the user provides third-party data, they assume responsibility for having previously informed them and obtained their consent, in accordance with Article 14 GDPR.
                            </p>

                            <h3>2.2.3 For what purpose do we process the user’s personal data?</h3>
                            <p>OverCut processes personal data for the following purposes, depending on the reason for which they were provided:</p>
                            <ul>
                              <li>• To contact, handle, manage and respond to the user’s request, inquiry or issue (via email, contact form or phone).</li>
                              <li>• To manage, where applicable, the sending of information about OverCut news by electronic and/or conventional means.</li>
                            </ul>

                            <h3>2.2.4 What is the legal basis for processing the user’s data?</h3>
                            <ul>
                              <li>• To use the services offered through the website, as well as user registration, the legal basis is the contractual relationship with OverCut and acceptance of its terms of use; therefore processing is carried out under Article 6.1(b) GDPR.</li>
                              <li>• Regarding the sending of information about OverCut products, services and news, the legal basis for processing the personal data provided is the explicit consent granted by the user, as set out in Article 6.1(a) GDPR.</li>
                            </ul>

                            <h3>2.2.5 How long will the user’s personal data be processed?</h3>
                            <ul>
                              <li>• Data from registered users, queries and requests will be kept for the time necessary to respond, and where applicable, as long as the data subject does not request withdrawal of consent for related communications.</li>
                              <li>• Data for sending information related to OverCut news will be retained until the user revokes consent.</li>
                            </ul>

                            <h3>2.2.6 Who will the user’s personal data be shared with?</h3>
                            <p>As a general rule, data will not be transferred to third parties unless there is a legal obligation or it is necessary to provide the service. Taking this into account:</p>
                            <ul>
                              <li>• Only where legally necessary, data may be communicated to Law Enforcement Authorities.</li>
                              <li>• Data may also be communicated to competent Public Administrations in cases provided by law.</li>
                              <li>• Where applicable, data will also be communicated to OverCut’s Processors for proper service provision.</li>
                            </ul>

                            <h3>2.2.7 What are the user’s rights?</h3>
                            <p>
                              Data protection regulations allow you to exercise your rights of access, rectification, erasure and data portability, as well as to object to and restrict processing, and not to be subject to decisions based solely on automated processing of your data, where applicable.
                            </p>
                            <p>These rights are characterized by the following:</p>
                            <ul>
                              <li>• Exercising these rights is free of charge, unless requests are manifestly unfounded or excessive (e.g., repetitive), in which case OverCut may charge a fee proportional to administrative costs or refuse to act.</li>
                              <li>• You may exercise rights directly or through a legal or voluntary representative.</li>
                              <li>• We must respond to your request within one month; considering complexity and number of requests, this period may be extended by a further two months.</li>
                              <li>• We are obliged to inform you of the means to exercise these rights, which must be accessible. If the request is submitted electronically, the information will be provided electronically where possible, unless you request otherwise.</li>
                              <li>• If OverCut does not act on the request, you will be informed within one month of the reasons and your ability to lodge a complaint with a Supervisory Authority.</li>
                            </ul>

                    <p>
                      To facilitate exercising these rights, here are the official forms from the Spanish
                      Data Protection Agency (AEPD):
                    </p>
                    <ul>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-acceso.pdf" target="_blank" rel="noopener noreferrer">Right of Access Form</a></li>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-rectificacion.pdf" target="_blank" rel="noopener noreferrer">Right of Rectification Form</a></li>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-oposicion.pdf" target="_blank" rel="noopener noreferrer">Right of Objection Form</a></li>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-supresion.pdf" target="_blank" rel="noopener noreferrer">Right of Erasure (“Right to be Forgotten”) Form</a></li>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-limitacion.pdf" target="_blank" rel="noopener noreferrer">Right to Restriction of Processing Form</a></li>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-portabilidad.pdf" target="_blank" rel="noopener noreferrer">Right to Data Portability Form</a></li>
                      <li><a href="https://www.aepd.es/documento/formulario-derecho-de-oposicion-decisiones-automatizadas.pdf" target="_blank" rel="noopener noreferrer">Right not to be Subject to Automated Decisions Form</a></li>
                    </ul>

                    <p>To exercise your rights, OverCut provides the following means:</p>
                                <ol>
                                  <li>By sending a written, signed request to OverCut. Ref: Exercise of Data Protection Rights.</li>
                                  <li>By sending a scanned, signed form to <a href="mailto:overcutwebf1@gmail.com">overcutwebf1@gmail.com</a> with the subject “Exercise of Data Protection Rights”.</li>
                                </ol>

                                <p>
                                  If you believe that you have not obtained full satisfaction in the exercise of your rights, you may file a complaint with the national supervisory authority: the Spanish Data Protection Agency (AEPD), C/ Jorge Juan, 6 – 28001 Madrid ( <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a> ).
                                </p>

                                <h3>2.2.8 What security measures have we implemented?</h3>
                                <p>At OverCut we are committed to protecting your personal information.</p>
                                <p>
                                  We use physical, organizational and technological measures, controls and procedures that are reasonably reliable and effective to preserve the integrity and security of your data and ensure your privacy.
                                </p>
                                <p>
                                  In addition, all staff with access to personal data have been trained and are aware of their obligations regarding the processing of personal data.
                                </p>
                                <p>
                                  In the contracts we sign with our suppliers, we include clauses requiring them to maintain the duty of confidentiality regarding the personal data to which they have had access by virtue of the assignment made, as well as to implement the necessary technical and organizational security measures to guarantee the confidentiality, integrity, availability and permanent resilience of the systems and services for processing personal data.
                                </p>
                                <p>All these security measures are reviewed periodically to ensure their adequacy and effectiveness.</p>
                                <p>
                                  However, absolute security cannot be guaranteed and no system is impenetrable; therefore, if any information under our control is compromised as a result of a security breach, we will take appropriate measures to investigate the incident, notify the Supervisory Authority and, where appropriate, those users who may have been affected so that they can take appropriate measures.
                                </p>

                                <h3>2.2.9 Social Media Policy</h3>
                                <p>OverCut has corporate profiles on the social networks Instagram, X and Google.</p>
                                <p>
                                  Therefore, OverCut is the “Data Controller” of your data by virtue of the existence of such profiles and the fact that the user follows us and we may follow them back.
                                </p>
                                <p>
                                  This means that if the user decides to join our corporate profile as a follower or by giving a “Like” to our content or profile, they accept this policy, where we explain their rights and how we use their data.
                                </p>
                                <p>
                                  As the data controller, we guarantee confidentiality in processing and compliance with users’ rights, always under the applicable data protection regulations.
                                </p>
                                <p>
                                  We will also use these social networks to announce news or relevant information related to the services we offer, or topics we consider to be of interest to users. Using the functionalities of these platforms, it is possible that the user will receive such news on their wall or profile.
                                </p>
                                <p>
                                  However, we also inform that there is no link between OverCut and such platforms or social networks; therefore, the user accepts their usage policy and conditions upon accessing them and/or validating their notices and terms and conditions during registration. OverCut is not responsible for the use or processing of user data outside the strict relationship and service provision indicated in this policy.
                                </p>
                               </details>
                              </section>
              </>
            )}
    </LegalLayout>
  );
};

export default PrivacyPolicy;
