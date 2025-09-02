import React from "react";
import LegalLayout from "./LegalLayout";

const CookiesPolicy = () => {
  const isSpanish =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith("es");

  return (
    <LegalLayout
      title={isSpanish ? "Política de cookies" : "Cookies Policy"}
      updatedAt={isSpanish ? "29 de agosto de 2025" : "August 29, 2025"}
    >
      {isSpanish ? (
        /* === SOLO ESPAÑOL CUANDO navigator.language empieza por 'es' === */
        <section id="cookies-policy" lang="es">
          <h2>4. POLÍTICA DE COOKIES</h2>

          <h3>4.1  Información básica sobre las cookies</h3>

          <h4>◦ Lo que el usuario debe saber sobre las Cookies</h4>
          <p>
            Las cookies (galletas) son pequeños archivos que guardan información en los dispositivos de los Usuarios que usan nuestra Web.
          </p>
          <p>
            Las cookies se asocian con el navegador de un ordenador o dispositivo determinado. Gracias a ellas, resulta posible que OverCut reconozca los navegadores de los Usuarios; también sirven para determinar las preferencias del usuario de navegación y, a partir de ello, evaluar las preferencias del usuario pudiendo usarlas como indicadores, todo ello para mejorar nuestra oferta de servicios.
          </p>

          <h4>◦ La aceptación de las cookies en OverCut:</h4>
          <p>
            La Ley 34/2002, de 11 de julio, de Sociedad de la Información y Comercio Electrónico (en adelante, LSSI) en relación con las cookies exige que nuestros Usuarios sean informados con carácter previo a la experiencia de navegación en la plataforma sobre el uso, tipo y finalidad de las cookies. Esa es la razón por la que hemos implementado un aviso informativo que se despliega una vez que el usuario accede a nuestra Web, informando de manera previa, y dando la opción de que el usuario escoja las cookies que desea permitir y las acepte expresamente, cumpliendo así con los criterios establecidos por el Comité Europeo de Protección de Datos y la Guía sobre el uso de las Cookies de la AEPD.
          </p>

          <h3>4.2  Información detallada sobre las cookies</h3>

          <p>
            • Cookies técnicas o funcionales: son aquellas que permiten al usuario la navegación a través de una página web,  plataforma o aplicación y la utilización de las diferentes opciones o servicios que en ella existan,  incluyendo aquellas que el editor utiliza para permitir la gestión y operativa de la página web y habilitar  sus funciones y servicios, como, por ejemplo, controlar el tráfico y la comunicación de datos, identificar la  sesión, acceder a partes de acceso restringido, recordar los elementos que integran un pedido, realizar el proceso de compra de  un  pedido,  gestionar el pago, controlar el fraude vinculado a la seguridad del   servicio,  realizar  la  solicitud de inscripción o participación en un evento,  contar visitas a efectos de la  facturación de licencias del software con el que funciona el servicio (sitio web, plataforma o aplicación), utilizar elementos de seguridad durante la navegación, almacenar contenidos para la difusión de vídeos o sonido, habilita contenidos dinámicos (por ejemplo, animación de carga de un texto o imagen) o compartir contenidos a través de redes sociales.
          </p>
          <p>
            También pertenecen a esta categoría, por su naturaleza técnica, aquellas cookies que permiten la gestión, de la forma más eficaz posible, de los espacios publicitarios que, como un elemento más de diseño o “maquetación” del servicio ofrecido al usuario, el editor haya incluido en una página web, aplicación o plataforma en base a criterios como el contenido editado, sin que se recopile información de los usuarios con fines distintos, como puede ser personalizar ese contenido publicitario u otros contenidos.
          </p>
          <p>
            *Las cookies técnicas estarán exceptuadas del cumplimiento de las obligaciones establecidas en el artículo 22.2 de la LSSI cuando permitan prestar el servicio solicitado por el usuario, como ocurre en el caso de las cookies enumeradas en los párrafos anteriores. Sin embargo, si estas cookies se utilizan también para finalidades no exentas (por ejemplo, para fines publicitarios comportamentales), quedarán sujetas a dichas obligaciones.
          </p>

          <p>
            • Cookies de preferencias o personalización: son aquellas que permiten recordar la información para que el usuario acceda al servicio con determinadas características que pueden diferenciar su experiencia de la de otros usuarios, como, por ejemplo, el idioma, el número de resultados a mostrar cuando el usuario realiza una búsqueda, el aspecto o contenido del servicio en función del tipo de navegador a través del cual el usuario accede al servicio o de la región desde la que accede al servicio, etc.
          </p>
          <p>
            *Si es el propio usuario quien elige esas características (por ejemplo, si selecciona el idioma de un sitio web clicando en el icono de la bandera del país correspondiente), las cookies estarán exceptuadas de las obligaciones del artículo 22.2 de la LSSI por considerarse un servicio expresamente solicitado por el usuario, y ello siempre y cuando las cookies obedezcan exclusivamente a la finalidad seleccionada.
          </p>

          <p>
            • Cookies de análisis o medición: son aquellas que permiten al responsable de las mismas el seguimiento y análisis del comportamiento de los usuarios de los sitios web a los que están vinculadas, incluida la cuantificación de los impactos de los anuncios. La información recogida mediante este tipo de cookies se utiliza en la medición de la actividad de los sitios web, aplicación o plataforma, con el fin de introducir mejoras en función del análisis de los datos de uso que hacen los usuarios del servicio.
          </p>
          <p>
            *Este tipo de cookies, a pesar de que no estén exentas del deber de obtener un consentimiento informado para su uso, el GT29 manifestó que es poco probable que representen un riesgo para la privacidad de los usuarios siempre que se trata de primera parte, que traten datos agregados con una finalidad estrictamente estadística, que se facilite la información sobre sus usos y se incluya la posibilidad de que los usuarios manifiesten su negativa sobre su utilización.
          </p>

          <p>
            • Cookie de publicidad comportamental: son aquellas que almacenan información del comportamiento de los usuarios obtenida a través de la observación continuada de sus hábitos de navegación, lo que permite desarrollar un perfil específico para mostrar publicidad de función del mismo.
          </p>

          <h4>◦ Las cookies que utilizamos en OverCut</h4>
          <p>
            En la tabla que aparece a continuación se incluyen los detalles, finalidad, el tipo y las clases de cookies que hemos implementado en nuestra plataforma. Para su comprensión, detallamos a continuación los tipos de cookies que pueden ser utilizadas si el usuario nos da su consentimiento:
          </p>
          <div className="cookie-table-wrapper">
            <table className="cookie-table" aria-label="Listado de cookies">
              <caption>Listado de cookies y otros almacenamientos utilizados en OVERCUT</caption>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Proveedor / Dominio</th>
                  <th>Finalidad</th>
                  <th>Categoría</th>
                  <th>Duración</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="Nombre"><code>oc_consent</code></td>
                  <td data-label="Proveedor / Dominio">OVERCUT (dominio del sitio)</td>
                  <td data-label="Finalidad">
                    Guardar preferencias de consentimiento (formato compacto p. ej. <code>P1|A0|ADS1</code>)
                  </td>
                  <td data-label="Categoría"><span className="badge badge--tech">Técnica</span></td>
                  <td data-label="Duración">12 meses</td>
                  <td data-label="Tipo"><span className="badge badge--own">Cookie propia</span></td>
                </tr>

                <tr>
                  <td data-label="Nombre"><code>oc_cid</code></td>
                  <td data-label="Proveedor / Dominio">OVERCUT (dominio del sitio)</td>
                  <td data-label="Finalidad">
                    Identificador anónimo para asociar el consentimiento antes/después del inicio de sesión
                  </td>
                  <td data-label="Categoría"><span className="badge badge--tech">Técnica</span></td>
                  <td data-label="Duración">12 meses</td>
                  <td data-label="Tipo"><span className="badge badge--own">Cookie propia</span></td>
                </tr>

                <tr>
                  <td data-label="Nombre"><code>serviceToken</code></td>
                  <td data-label="Proveedor / Dominio">OVERCUT</td>
                  <td data-label="Finalidad">Mantener la sesión de usuario (token JWT)</td>
                  <td data-label="Categoría"><span className="badge badge--tech">Técnica</span></td>
                  <td data-label="Duración">Hasta cerrar sesión / limpiar almacenamiento</td>
                  <td data-label="Tipo"><span className="badge badge--storage">Almacenamiento local</span></td>
                </tr>

                <tr>
                  <td data-label="Nombre"><code>_ga, _ga_*</code></td>
                  <td data-label="Proveedor / Dominio">Google (si activa “Analítica”)</td>
                  <td data-label="Finalidad">Medición de uso del sitio (Google Analytics)</td>
                  <td data-label="Categoría"><span className="badge badge--analytics">Analítica</span></td>
                  <td data-label="Duración">Hasta 2 años</td>
                  <td data-label="Tipo"><span className="badge badge--third">Cookie de terceros</span></td>
                </tr>

                <tr>
                  <td data-label="Nombre"><code>_gid</code></td>
                  <td data-label="Proveedor / Dominio">Google (si activa “Analítica”)</td>
                  <td data-label="Finalidad">Distinción de usuarios (Google Analytics)</td>
                  <td data-label="Categoría"><span className="badge badge--analytics">Analítica</span></td>
                  <td data-label="Duración">24 horas</td>
                  <td data-label="Tipo"><span className="badge badge--third">Cookie de terceros</span></td>
                </tr>

                <tr>
                  <td data-label="Nombre"><code>_gcl_au</code></td>
                  <td data-label="Proveedor / Dominio">Google (si activa “Publicidad”)</td>
                  <td data-label="Finalidad">Medición/Atribución de anuncios</td>
                  <td data-label="Categoría"><span className="badge badge--ads">Publicidad</span></td>
                  <td data-label="Duración">3 meses</td>
                  <td data-label="Tipo"><span className="badge badge--third">Cookie de terceros</span></td>
                </tr>
              </tbody>
            </table>

            <p className="cookie-table__note">
              Nota: La presencia y duración de determinadas cookies de terceros puede variar según la configuración y los
              servicios activos. Puede gestionar sus preferencias en “Configuración de cookies”.
            </p>
          </div>

          <p style={{marginTop: '1rem'}}>
            <i>Notas:</i> (i) Los identificadores concretos y duraciones de cookies de terceros pueden variar por
            proveedor y configuración; (ii) al retirar su consentimiento, desactivamos la carga de nuevas cookies
            no necesarias y dejamos de usar las ya almacenadas; algunas cookies de terceros pueden requerir que Ud.
            las elimine desde su navegador o mediante los mecanismos del propio tercero.
          </p>

          {/* La tabla de cookies del texto original se define con los encabezados anteriores y sin filas específicas. */}

          <h3 id="desinstalar">4.3  ¿Cómo desinstalar las cookies?</h3>
          <p>
            Si un usuario desea desinstalar las cookies utilizadas en www.overcutf1.com de su navegador, a continuación, le dejamos las instrucciones para distintos navegadores:
          </p>
          <ul>
            <li>
              • Para más información sobre Internet Explorer pulse{" "}
              <a
                href="https://support.microsoft.com/es-es/windows/administrar-cookies-en-microsoft-edge-ver-permitir-bloquear-eliminar-y-usar-168dab11-0753-043d-7c16-ede5947fc64d#ie=%22ie-10%22"
                target="_blank"
                rel="noopener noreferrer"
              >
                aquí
              </a>.
            </li>
            <li>
              • Para más información sobre Microsoft Edge pulse{" "}
              <a
                href="https://support.microsoft.com/es-es/microsoft-edge/microsoft-edge-datos-de-exploraci%C3%B3n-y-privacidad-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
                target="_blank"
                rel="noopener noreferrer"
              >
                aquí
              </a>.
            </li>
            <li>
              • Para más información sobre Firefox pulse{" "}
              <a
                href="https://support.mozilla.org/es/kb/Borrar%20cookies"
                target="_blank"
                rel="noopener noreferrer"
              >
                aquí
              </a>.
            </li>
            <li>
              • Para más información sobre Chrome pulse{" "}
              <a
                href="https://support.google.com/chrome/answer/95647?hl=%22es%22"
                target="_blank"
                rel="noopener noreferrer"
              >
                aquí
              </a>.
            </li>
            <li>
              • Para más información sobre Safari pulse{" "}
              <a
                href="https://www.apple.com/legal/privacy/es/cookies/"
                target="_blank"
                rel="noopener noreferrer"
              >
                aquí
              </a>.
            </li>
          </ul>
        </section>
      ) : (
        /* === SOLO INGLÉS CUANDO NO EMPIEZA POR 'es' === */
        <section id="cookies-policy-en" lang="en">
          <h2>4. COOKIES POLICY</h2>

          <h3>4.1  Basic information about cookies</h3>

          <h4>◦ What users should know about cookies</h4>
          <p>
            Cookies are small files that store information on the devices of Users who browse our website.
          </p>
          <p>
            Cookies are associated with the browser of a given computer or device. They allow OverCut to recognize Users’ browsers; they are also used to determine browsing preferences and, from that, assess user preferences that may be used as indicators, all in order to improve our service offering.
          </p>

          <h4>◦ Acceptance of cookies on OverCut:</h4>
          <p>
            Spanish Law 34/2002, of July 11, on Information Society Services and Electronic Commerce (LSSI) requires that our Users be informed prior to browsing about the use, type and purpose of cookies. This is why we have implemented an informational notice that is displayed when the user accesses our website, providing prior information and giving the user the option to choose which cookies to allow and to expressly accept them, thus complying with the criteria set by the European Data Protection Board and the Spanish DPA’s Cookies Guidance.
          </p>

          <h3>4.2  Detailed information about cookies</h3>

          <p>
            • Technical or functional cookies: these enable the user to navigate a website, platform or application and to use the different options or services available there, including those used by the publisher to manage and operate the website and enable its functions and services, such as controlling traffic and data communication, identifying the session, accessing restricted areas, remembering the items in an order, carrying out the purchase process of an order, managing payment, controlling fraud linked to the security of the service, submitting a request to register for or participate in an event, counting visits for the purpose of software license billing for the service (website, platform or app), using security elements during browsing, storing content to play videos or sound, enabling dynamic content (e.g., loading animations for text or images), or sharing content via social networks.
          </p>
          <p>
            Also included in this category, due to their technical nature, are cookies that allow the most effective management of advertising spaces which, as another design or “layout” element of the service offered to the user, the publisher has included on a website, application or platform based on criteria such as edited content, without collecting user information for different purposes such as personalizing that advertising or other content.
          </p>
          <p>
            *Technical cookies are exempt from the obligations set out in Article 22.2 of the LSSI when they enable the provision of a service expressly requested by the user, as is the case with the cookies listed in the previous paragraphs. However, if these cookies are also used for non-exempt purposes (for example, behavioral advertising), they will be subject to those obligations.
          </p>

          <p>
            • Preference or personalization cookies: these store information so that the user can access the service with certain features that may differentiate their experience from other users, such as language, the number of results to show when the user performs a search, or the appearance or content of the service based on the type of browser through which the user accesses the service or the region from which they access the service, etc.
          </p>
          <p>
            *If the user chooses those features (for example, by selecting the website language by clicking the corresponding flag icon), such cookies are exempt from the obligations of Article 22.2 of the LSSI because they are considered a service expressly requested by the user, provided that the cookies are used exclusively for the selected purpose.
          </p>

          <p>
            • Analytics or measurement cookies: these allow their controller to monitor and analyze the behavior of users of the websites to which they are linked, including quantifying the impact of ads. The information collected through this type of cookie is used to measure the activity of websites, applications or platforms, in order to introduce improvements based on the analysis of usage data made by users of the service.
          </p>
          <p>
            *Although these cookies are not exempt from the need to obtain informed consent for their use, the former Article 29 Working Party indicated that they are unlikely to pose a risk to users’ privacy provided they are first-party, process aggregated data strictly for statistical purposes, information is provided about their uses, and users are given the option to object to their use.
          </p>

          <p>
            • Behavioral advertising cookies: these store information on users’ behavior obtained through the continuous observation of their browsing habits, which allows a specific profile to be developed to display advertising based on it.
          </p>

          <h4>◦ Cookies we use on OverCut</h4>
          <p>
            The table below includes details, purposes, type and classes of cookies we have implemented on our platform. For clarity, we describe the types of cookies that may be used if the user gives consent:
          </p>

          <div className="cookie-table-wrapper">
            <table className="cookie-table" aria-label="List of cookies">
              <caption>List of cookies and other storage used on OVERCUT</caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Provider / Domain</th>
                  <th>Purpose</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="Name"><code>oc_consent</code></td>
                  <td data-label="Provider / Domain">OVERCUT (site domain)</td>
                  <td data-label="Purpose">
                    Store consent preferences (compact format e.g. <code>P1|A0|ADS1</code>)
                  </td>
                  <td data-label="Category"><span className="badge badge--tech">Technical</span></td>
                  <td data-label="Duration">12 months</td>
                  <td data-label="Type"><span className="badge badge--own">First-party cookie</span></td>
                </tr>

                <tr>
                  <td data-label="Name"><code>oc_cid</code></td>
                  <td data-label="Provider / Domain">OVERCUT (site domain)</td>
                  <td data-label="Purpose">
                    Anonymous identifier to associate consent before/after login
                  </td>
                  <td data-label="Category"><span className="badge badge--tech">Technical</span></td>
                  <td data-label="Duration">12 months</td>
                  <td data-label="Type"><span className="badge badge--own">First-party cookie</span></td>
                </tr>

                <tr>
                  <td data-label="Name"><code>serviceToken</code></td>
                  <td data-label="Provider / Domain">OVERCUT</td>
                  <td data-label="Purpose">Maintain user session (JWT token)</td>
                  <td data-label="Category"><span className="badge badge--tech">Technical</span></td>
                  <td data-label="Duration">Until logout / storage cleared</td>
                  <td data-label="Type"><span className="badge badge--storage">Local storage</span></td>
                </tr>

                <tr>
                  <td data-label="Name"><code>_ga, _ga_*</code></td>
                  <td data-label="Provider / Domain">Google (if “Analytics” enabled)</td>
                  <td data-label="Purpose">Site usage measurement (Google Analytics)</td>
                  <td data-label="Category"><span className="badge badge--analytics">Analytics</span></td>
                  <td data-label="Duration">Up to 2 years</td>
                  <td data-label="Type"><span className="badge badge--third">Third-party cookie</span></td>
                </tr>

                <tr>
                  <td data-label="Name"><code>_gid</code></td>
                  <td data-label="Provider / Domain">Google (if “Analytics” enabled)</td>
                  <td data-label="Purpose">User distinction (Google Analytics)</td>
                  <td data-label="Category"><span className="badge badge--analytics">Analytics</span></td>
                  <td data-label="Duration">24 hours</td>
                  <td data-label="Type"><span className="badge badge--third">Third-party cookie</span></td>
                </tr>

                <tr>
                  <td data-label="Name"><code>_gcl_au</code></td>
                  <td data-label="Provider / Domain">Google (if “Advertising” enabled)</td>
                  <td data-label="Purpose">Ads measurement/attribution</td>
                  <td data-label="Category"><span className="badge badge--ads">Advertising</span></td>
                  <td data-label="Duration">3 months</td>
                  <td data-label="Type"><span className="badge badge--third">Third-party cookie</span></td>
                </tr>
              </tbody>
            </table>

            <p className="cookie-table__note">
              Note: The presence and duration of certain third-party cookies may vary depending on configuration and active services. You can manage your preferences in “Cookie settings”.
            </p>
          </div>

          <p style={{marginTop: '1rem'}}>
            <i>Notes:</i> (i) Specific identifiers and durations for third-party cookies may vary by provider and configuration; (ii) when you withdraw consent, we stop loading new non-essential cookies and stop using those already stored; some third-party cookies may require you to delete them from your browser or through the third party’s own mechanisms.
          </p>

          {/* The original cookie table is defined by the headers above without specific rows beyond those included. */}

          <h3 id="uninstall">4.3  How to uninstall cookies?</h3>
          <p>
            If a user wishes to uninstall the cookies used on www.overcutf1.com from their browser, below are instructions for different browsers:
          </p>
          <ul>
            <li>
              • For more information about Internet Explorer click{" "}
              <a
                href="https://support.microsoft.com/es-es/windows/administrar-cookies-en-microsoft-edge-ver-permitir-bloquear-eliminar-y-usar-168dab11-0753-043d-7c16-ede5947fc64d#ie=%22ie-10%22"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>.
            </li>
            <li>
              • For more information about Microsoft Edge click{" "}
              <a
                href="https://support.microsoft.com/es-es/microsoft-edge/microsoft-edge-datos-de-exploraci%C3%B3n-y-privacidad-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>.
            </li>
            <li>
              • For more information about Firefox click{" "}
              <a
                href="https://support.mozilla.org/es/kb/Borrar%20cookies"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>.
            </li>
            <li>
              • For more information about Chrome click{" "}
              <a
                href="https://support.google.com/chrome/answer/95647?hl=%22es%22"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>.
            </li>
            <li>
              • For more information about Safari click{" "}
              <a
                href="https://www.apple.com/legal/privacy/es/cookies/"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>.
            </li>
          </ul>
        </section>
      )}
    </LegalLayout>
  );
};

export default CookiesPolicy;
