# UI y menús: F1 Manager 24, vídeo de Bahrein (clave `ui-menus`)

Alcance: de 00:00 a 13:00 (menús de carrera profesional y pretemporada) y todas las pantallas previas y posteriores a cada sesión del vídeo (de 00:00 a 2:04:20).
Fuente: mosaicos, hojas de contactos propias cada 10 s (`work/ui-menus/s_XX.jpg`), fotogramas reescalados a 1280 px (`work/ui-menus/fr/`), ráfagas y `cuts.txt`.
El vídeo se graba a 640x360, pero el texto de los menús se lee bien reescalado. Donde no se pudo leer, se indica.

**Reglas aplicadas.** Describo cada pantalla por su función y su disposición, con palabras propias. No transcribo textos de la interfaz para reutilizarlos. Los números leídos en pantalla son "observados en el juego" y solo sirven de referencia. La calibración de OverCut sale de datos reales.

**Fuera de mi rango.** El "SUBSCRIBED" que aparece en 07:41 y en otros puntos es una capa superpuesta del youtuber y no forma parte del juego.

---

## 1. Elementos comunes de la interfaz (VISTO, confianza alta)

| Zona | Qué contiene | Comportamiento |
|---|---|---|
| Arriba a la izquierda | Botón de volver (flecha en un cuadrado), migas `// SECCIÓN / SUBSECCIÓN`, botón de ayuda `?` y un distintivo de tecla rápida | Volver sube un nivel. Las migas muestran la profundidad, por ejemplo Diseño / Suelo. |
| Arriba a la derecha | **Botón de avance principal**: una "píldora" ancha con título y un subtítulo que indica el destino | Su color indica el estado. **Turquesa**: se puede avanzar ("Continuar", "Ir a Libres 1", "Empezar clasificación"). **Granate**: hay un evento obligatorio pendiente (negociación de patrocinio, objetivos de carrera, empezar carrera). **Gris con icono de prohibido**: bloqueado, y el subtítulo explica el motivo (por ejemplo, que falta elegir un objetivo o un paquete). **Morado con importe**: confirmar un gasto. |
| Abajo a la izquierda (gestión) | Base con unos 12 iconos: inicio, bandeja de entrada (con número de no leídos), calendario, finanzas, coches, pilotos (casco), personal, ojeadores, instalaciones, equipo o junta, clasificaciones y desarrollo. Después, el engranaje de ajustes. | El icono activo se resalta en blanco. Al pasar el cursor aparece una etiqueta encima (04:56, "Instalaciones"). |
| Abajo a la derecha (gestión) | Barra de estado: temporada, "circuito en N días", fecha y saldo de caja | Se actualiza al pasar el tiempo. El saldo cambia al instante tras cada compra. |
| Abajo a la derecha (fin de semana) | Icono y texto del tiempo, agua en pista en mm y engranaje | Se ve en todas las pantallas de preparación. |
| Esquina inferior izquierda | Indicador de guardado automático (círculo que gira) | Aparece durante las cargas (02:05, 54:30). |
| Centro arriba | **Aviso breve** ("proyecto de diseño iniciado", "mejorando el centro de visitas", "mejorando la sala de juntas") | Dura unos 2 a 5 s y no bloquea nada (04:21, 07:50, 08:00). |

**Patrón de tres columnas (VISTO, alto).** Casi todas las pantallas de configuración usan el mismo esquema:
- Izquierda: lista o controles.
- Centro: panel de contexto que **cambia con el elemento sobre el que está el cursor** (qué es, qué efectos tiene, consejo).
- Derecha: resumen de impacto (rendimiento del coche con columnas "actual" y "nuevo", financiación total, progreso del piloto).

Pasar el cursor por cualquier fila basta para explicarla, sin abrir ventanas aparte.

**Cómo se muestran los números (VISTO, alto)**
- Estrellas, de 1 a 5: valoración del equipo (01:00) y nivel de los paquetes de patrocinio (05:15).
- Barra horizontal más posición ordinal: rendimiento del coche por atributo ("3.º", "5.º"). La barra es **morada cuando el equipo es 1.º** (02:27).
- Deltas en columna aparte: turquesa si mejora, rojo si empeora, "+0" en gris si no cambia (02:57, 03:52). Las filas afectadas llevan además una franja de chevrons de fondo.
- Marcas de verificación para "recomendado" y "crucial" en el circuito siguiente (02:37).
- Puntos, de 1 a 5: modos de ritmo, combustible y ataque (12:12, 55:30).
- Anillo de color: estado de ánimo del equipo (02:10).
- Rayitas segmentadas: grado de una instalación (07:00).
- Barra de estado en %: conservación de una instalación (07:41).
- "???" o "?": satisfacción con la puesta a punto **desconocida hasta probar en pista** (11:42).
- En el gráfico de equilibrio, cada barra muestra el rango óptimo, el valor actual (marca) y el anterior (marca punteada).
- Morado en las tablas de tiempos: el mejor tiempo de la sesión.
- Filas eliminadas en clasificación: tinte rojo oscuro (42:20).

---

## 2. Inventario de pantallas

Las horas son del vídeo, en mm:ss o h:mm:ss. Los diagramas ASCII están en la sección 3.

| # | Pantalla | Cuándo | Propósito | Controles principales | Conf. |
|---|---|---|---|---|---|
| S01 | Elegir equipo | 01:00–01:20 | Elegir escudería | Fila inferior de 10 escudos. Pestañas arriba: resumen, rendimiento, personal, info. Panel con estrellas, objetivos y presupuesto. Botón "ver vídeo del equipo". Continuar. | alta |
| S02 | Ajustes de la carrera profesional | 01:20–02:02 | Perfil y dificultad | Nombre y apellido con lápiz para editar. Selectores ‹ › para dificultad de desarrollo, de carrera y nivel de guía. Al pasar el cursor por un valor, una tarjeta explica la opción. | alta |
| S03 | Ventana de nueva partida | 02:03 | Confirmar el resumen | Resumen (equipo, guía, dificultades), aviso de que no se puede cambiar de equipo, botones Confirmar y Cancelar | alta |
| S04 | Carga | 02:05 | Carga y guardado | Logotipo girando e indicador de guardado | alta |
| S05 | Inicio | 02:10, 04:25, 06:45, 08:45, 10:05 | Panel central del juego | 6 tarjetas: equipo y objetivos (botón Junta), piloto 1 y piloto 2 (posición en el campeonato, valoración, ánimo, número de coche), centro de ánimo, clasificación (3 pestañas: equipos, pilotos, ?), próxima carrera y eventos próximos. Continuar con destino y días. | alta |
| S06 | Avance del calendario | 04:30, 10:15 | Hacer pasar los días | Franja superpuesta con 5 días y "Hoy"/"Próxima carrera". El botón principal cambia a **Parar**. Los días avanzan solos y el avance se detiene en el siguiente evento (Inicio queda atenuado detrás). | alta |
| S07 | Bandeja de entrada | 02:15, 04:35, 10:25–10:30 | Mensajes | Lista con filtro a la izquierda (remitente, asunto, antigüedad) y botón de marcar todo como leído. A la derecha, el mensaje con retrato y cargo. Algunos mensajes traen datos estructurados (resultados de pruebas, preparación de estrategia) y botones de acción. | alta |
| S08 | Coches (centro) | 02:25 | Acceso a desarrollo | Tarjetas coche 1 y coche 2, análisis del coche, desarrollo de piezas y almacén. Resumen (ingenieros libres, margen bajo el techo de gasto, capacidad de proyectos). A la derecha, rendimiento con ordinales y flechas de página ‹•• ›. | alta |
| S09 | Diseño: elegir pieza | 02:35, 03:25, 09:20 | Elegir la pieza a diseñar | Lista de 6 piezas. En el centro, ficha (tiempo y coste estimados, diseño actual, stock, si está en desarrollo). A la derecha, el rendimiento del coche. Selector "resaltar atributos para el circuito X". | alta |
| S10 | Diseño, asistente de 3 pasos | 02:40–03:15 (suelo), 03:30–04:20 (alerón trasero), 09:25–10:00 (chasis, alerón delantero) | Definir el proyecto | Indicador de pasos 1·2·3. **Paso 1**: horas de CFD y túnel de viento. **Paso 2**: perfil de enfoque y un deslizador por atributo con valores actual y nuevo. **Paso 3**: número de ingenieros, enfoque (normal, con prisa, intensivo) y resumen (fecha de fin, coste, caja y techo de gasto restantes). Botón Siguiente y después **Confirmar con importe**. | alta |
| S11 | Desarrollo de piezas (lista) | 04:21, 10:00 | Proyectos en curso | Pestañas Diseño e investigación / Fabricación. Tabla con pieza, tipo de proyecto (barra de progreso), días e ingenieros, botón cancelar (X) y huecos vacíos "sin ingenieros". Aviso de proyecto iniciado. | alta |
| S12 | Personal | 04:45 | Plantilla | Siluetas en un entorno 3D y tarjetas de departamentos | media |
| S13 | Pilotos y afiliados | 04:50–05:05 | Pilotos, ingenieros de pista y reservas | Pestañas Equipo de carrera / Afiliados. Cuadrícula 2x2 (pilotos arriba, ingenieros de pista abajo) con un indicador de afinidad entre cada pareja. Ficha a la derecha (edad, país, número, contrato, valoración, ánimo, quejas). Tarjeta de ánimo. | alta |
| S14 | Negociación de patrocinio | 05:10–06:40 | Patrocinador principal y secundarios | Tres tarjetas de paquete principal, cada una con estrellas y un icono de tipo: pago por adelantado, por compromiso o por día de carrera. Ficha del tipo y actividad preferida. Panel de financiación total (garantizada y potencial) y **dependencia del rendimiento** (indicador de aguja). Después, una cuadrícula de 9 secundarios ("hasta 5"), cada uno con actividad obligatoria y penalización. El total sube al añadir (de 48,6 M a 92,1 M observados). El botón dice **Bloqueado** hasta elegir y después Confirmar. | alta |
| S15 | Instalaciones | 06:50–08:40 | Mejorar o reformar instalaciones | Pestañas Desarrollo del coche / Personal / Operaciones. Cuadrícula de 6 instalaciones sobre una vista aérea 3D de la sede. Al hacer clic se abre un menú contextual (Mejorar / Reformar). Al pasar el cursor se ve el coste y los días. Ficha: grado, estado %, eficacia, mantenimiento mensual, efectos actuales frente a mejorados (en morado). | alta |
| S16 | Ventana de mejora de instalación | 07:40 | Confirmar el gasto | Importe grande, días, aumento del mantenimiento, caja restante, Confirmar y Cancelar | alta |
| S17 | Plan de patrocinio | 08:50–09:10 | Actividades de 6 semanas | Actividades obligatorias arriba. Cuadrícula de 12 actividades, cada una con su valor de compromiso (+N) e icono de tipo. Barra de compromiso con el objetivo (3.760 / 3.657), pago del periodo, aviso de objetivo superado y de rendimiento decreciente. Botones reiniciar y autocompletar. Confirmar abre una ventana con aviso de que no se puede cancelar. | alta |
| S18 | Objetivos de carrera | 10:35–10:45 | Apuesta por un resultado | Tarjeta del piloto y **tres niveles** (1.º, top 3, top 5) con recompensa en $ y medidor de riesgo. A la derecha, tarjeta de la ronda, rendimiento del coche en la parrilla y ánimo con sus efectos. El botón principal sigue **Bloqueado** hasta elegir un nivel. | alta |
| S19 | Entrada al fin de semana (cinemática) | 10:50–11:25 | Ambientación | Planos aéreos y de grada, rótulo de ronda, escena en el garaje y botón SALTAR abajo a la derecha. Termina con una **cortina roja** que se abre en bandas. | alta |
| S20 | Centro del fin de semana | 22:00, 27:45, 54:30 | Situación del fin de semana | Pestañas Resumen / Resultados / Informes. Tarjeta del circuito con los 3 compuestos y su número de juegos. **Cronología de 3 días** (jueves, viernes, sábado) con el tiempo previsto y botones de sesión (L1, L2 / L3, Q1–Q3 / Carrera), con la sesión actual resaltada. Ficha de la sesión (duración, temperatura, tiempo, agua). | alta |
| S21 | Preparación de sesión | 11:30, 22:20, 27:50, 35:30, 42:20, 47:10, 55:00 | Lista de comprobación de los 2 coches | Dos columnas de coche, cada una con: objetivos de práctica (aclimatación, conocimiento de piezas, satisfacción con la puesta a punto) y barra de preparación; compuestos, piezas, puesta a punto, plan de tandas y opciones del piloto. Pie con "Coche N listo". Botón de cambiar piloto (solo antes de L1, después aparece bloqueado). Ficha contextual a la derecha. Botón principal: Ir a Libres N / Empezar clasificación / Empezar carrera. | alta |
| S22 | Configuración del coche | 11:35–12:45 (y en cada sesión) | Detalle por coche | Acordeón de 5 secciones a la izquierda. **Compuestos**: rejilla de juegos (seco con 8 S, 3 M y 2 H; mixtos; lluvia), estado de cada juego (nuevo, usado, bloqueado, devuelto) y comparación montado/nuevo. **Piezas**: lista con versión y % de desgaste. **Puesta a punto**: 5 deslizadores con 5 barras de equilibrio y satisfacción. **Plan de tandas**: vueltas y kg. **Opciones de conducción**: ritmo, combustible y ERS. Ficha a la derecha. | alta |
| S23 | Opciones de sesión | 12:50, 22:10, 35:40, 47:10 | Gestionar o simular | Tarjeta grande "gestionar" y tarjeta "simular". A la derecha, "simular hasta" (clasificación / carrera); en Q1 solo queda la carrera. Pide confirmación al elegir gestionar. | alta |
| S24 | Transición con logotipo | 12:56, 21:40, 34:40, 42:30, 46:50, 55:50 | Separador entre fases | Animación de logotipo en un túnel blanco y rojo, de unos 2 a 6 s | media |
| S25 | Resultados de sesión | 21:50 (L1), 28:20 (L2), 34:30 (L3), 42:10 (Q1), 47:00 (Q2), 53:30 (Q3) | Tabla de resultados | Retrato grande del ganador con ordinal y botón "Vista de datos". Tabla con posición, piloto, equipo, mejor vuelta y neumático (o Q1/Q2/Q3), diferencia y vueltas, 10 filas por página con desplazamiento. Las filas propias se resaltan y las eliminadas llevan tinte rojo. Leyenda de penalización en parrilla. Continuar. | alta |
| S26 | Resumen de objetivos de práctica | 21:55, 28:30 | Progreso tras una sesión de libres | Dos tarjetas de piloto con aclimatación, conocimiento, puesta a punto y preparación. Ficha explicativa. Continuar. | alta |
| S27 | Vista de datos (en sesión) | 26:40–27:00 | Telemetría en tabla | Pestañas Clasificación / Historial de vueltas / Historial de neumáticos / Eventos / Informes. Tabla con líder, intervalo, última vuelta, S1–S3 (en verde los mejores personales), neumático con % y vueltas. Conmutador de vista arriba a la derecha. | alta |
| S28 | Editor de estrategia de carrera | 54:50–55:20 | Planificar paradas | Retrato del piloto. Gráfico de desgaste por vuelta (área por compuesto, ventanas de parada en turquesa, previsión del tiempo por vuelta arriba). Línea con iconos de compuesto. **Lista de estrategias** (ninguna, A, B, C, D, con editar, borrar y añadir). A la derecha, tiempo estimado con su diferencia, ventana de parada y solape con el compañero, y la regla de neumáticos obligatorios con marcas. | alta |
| S29 | Preparación de carrera | 55:00–55:40 | Comprobación final | Igual que S21, con miniatura de la estrategia. Las piezas aparecen **bloqueadas por parque cerrado** (candado), el combustible en vueltas y kg, y la posición de salida en el pie. Botón granate para empezar la carrera. | alta |

**No aparece en el vídeo.** No hay resultados de carrera, podio ni clasificación posterior a la carrera. La "Parte 1" termina a las 2:04:20, con la carrera aún en marcha (repetición de un adelantamiento hacia el 2:03:40).

---

## 3. Diagramas ASCII (disposición)

```
S05 INICIO                                        S10 DISEÑO (3 pasos)
+------------------------------------------+      +-------------------------------------------+
| // INICIO ?            [CONTINUAR>> dest]|      | <- // DISEÑO / PIEZA ?  [estado][fecha][$]|
| +--------+ +----+ +----+ +--------------+|      | +-----------+ +-----------+ +------------+|
| |EQUIPO  | |PIL1| |PIL2| | ANILLO ÁNIMO ||      | |1·2·3 paso | |AYUDA DEL  | |RENDIMIENTO ||
| |objetiv.| |pos | |pos | | peor / prob. ||      | |deslizad.  | |ELEMENTO   | |actual|nuevo||
| |[Junta] | |val | |val | | [centro]     ||      | |por atribut| |CON CURSOR | |deltas +/-  ||
| +--------+ +----+ +----+ +--------------+|      | |circuito   | |efecto num.| |✓recom ✓cruc||
| +--------+ +--------------+ +-----------+|      | +-----------+ +-----------+ +------------+|
| |CLASIF. | | PRÓXIMA      | | EVENTOS   ||      |                      [SIGUIENTE>> / CONF $]|
| |pestañas| | CARRERA      | | hoy/N días||      +-------------------------------------------+
| +--------+ +--------------+ +-----------+|
| [base de 12 iconos][⚙]   [año|circ N d|fecha|$]|
+------------------------------------------+

S14 PATROCINIO                                    S21 PREPARACIÓN DE SESIÓN
+------------------------------------------+      +-------------------------------------------+
| <- ?                    [BLOQUEADO/CONF] |      | <- // L1 PREPARACIÓN ? [IR A L1 >>]       |
| TÍTULO + subtítulo        [‹ • • ›]      |      | +-----------+ +-----------+ +-----------+ |
| [01★][02★]  [FICHA TIPO]  +------------+ |      | |COCHE1 [⇄] | |COCHE2 [⇄] | |FICHA DE   | |
| [03★]       [actividad]   |TOTAL $     | |      | |objetivos % | |objetivos %| |CONTEXTO   | |
| +--------------+          |garantizado | |      | |prep [====] | |prep [====]| |(cursor)   | |
| |SECUNDARIOS   |          |potencial   | |      | |Compuestos  | |...        | +-----------+ |
| | 1 2 3        |          +------------+ |      | |Piezas  ✓   | |           |               |
| | 4 5 6 (≤5)   |          |Depend. rend| |      | |Puesta Untd | |           |               |
| | 7 8 9        |          +------------+ |      | |Plan 15v kg | |           |               |
| +--------------+                         |      | |[✓COCHE LISTO]|[✓COCHE LISTO]|            |
+------------------------------------------+      | [tiempo | agua mm | ⚙]                     |
                                                  +-------------------------------------------+
S22 PUESTA A PUNTO (acordeón)                     S28 EDITOR DE ESTRATEGIA
+------------------------------------------+      +-------------------------------------------+
| <- // L1 / COCHE1 ?                      |      | <- // CARRERA / ESTRATEGIA ?              |
| >Compuestos      +---------------------+ |      | +-------------------------------+ +------+|
| >Piezas          | EQUILIBRIO           | |      | |RETR| tiempo por vuelta ☀☁   | |COCHE ||
| vPuesta a punto  | sobrevir.  [==|==]?? | |      | |    | área desgaste+ventanas  | |t est.||
|  ala del. ──o──  | frenada    [==|==]?? | |      | |    | S---M---S---| 57       | |ventan||
|  ala tras.──o──  | curva      [==|==]?? | |      | +----+--------------------------+ +------+|
|  antivuelco─o──  | tracción   [==|==]?? | |      | (o)Ninguna ───────────────── |REGLA  ||
|  caída    ──o──  | recta      [==|==]?? | |      | ( )A ✎ 🗑  S──S──M          |NEUM.  ||
|  convergencia─o─ | satisf.>>>>> ?       | |      | ( )B ✎ 🗑  M──S──S          |✓ ✓    ||
|  [revertir]      +---------------------+ |      | ( )D ✎ 🗑  ...  [+]          +------+|
| >Plan de tandas  | AYUDA DEL DESLIZADOR | |      +-------------------------------------------+
| >Opciones        +---------------------+ |
+------------------------------------------+

S25 RESULTADOS                                     S23 OPCIONES DE SESIÓN
+------------------------------------------+      +-------------------------------------------+
| LOGO                    [CONTINUAR >>]   |      | <-        OPCIONES / NOMBRE SESIÓN        |
| +--------+ +---------------------------+ |      |  +----------------+   SIMULAR HASTA:      |
| |RETRATO | |GP AÑO  / SESIÓN    ⚠ pen. | |      |  |   GESTIONAR    |   o-[Q clasificación] |
| |ganador | |# piloto equipo mejor gap v| |      |  +----------------+   o-[R carrera]       |
| | 1.º    | |1 ...  (morado = mejor)    | |      |  [   SIMULAR      ]                       |
| +--------+ |... 10 filas, eliminados en| |      |  texto de ayuda                           |
| [Vista de  |    rojo                   | |      +-------------------------------------------+
|  datos]    +---------------------------+ |
+------------------------------------------+
```

---

## 4. Grafo de navegación

```
[Cinemática inicial 0:00-0:52] -> S01 Elegir equipo -> S02 Ajustes -> (Continuar) -> S03 Ventana -> Confirmar -> S04 Carga
 -> S05 INICIO  <====================================================================================+
      |  base de iconos (directo, sin ventanas): S07 Bandeja | S08 Coches | S12 Personal | S13 Pilotos | |
      |                     S15 Instalaciones | (calendario, finanzas, ojeadores... no se abren)       |
      |  S08 -> S11 Desarrollo -> S09 Elegir pieza -> S10 paso1 -> paso2 -> paso3 -> Confirmar$ -> S11  |
      |  S15 -> menú contextual (Mejorar/Reformar) -> S16 Ventana -> Confirmar -> aviso                 |
      +-- [CONTINUAR] -> S06 Avance de días --(se para en un evento)--> botón principal en GRANATE ----+
               evento "Negociación de patrocinio" -> S14 (Bloqueado hasta elegir) -> Confirmar -> S05
               evento "Plan de patrocinio" -> S17 -> Confirmar -> ventana -> S05
               evento "Fin de semana" -> S07 (mensaje de preparación) -> S18 Objetivos (Bloqueado) -> elegir
 -> S19 Cinemática (SALTAR) -> cortina roja -> S21 Prep L1 <-> S22 Coche1/Coche2 (volver)
 -> [Ir a L1] -> S23 Opciones (Gestionar | Simular | Simular hasta Q / Carrera) -> ventana "gestionar" -> S24 logo -> SESIÓN EN DIRECTO
 SESIÓN termina -> S24 logo -> S25 Resultados -> (S26 Objetivos de práctica) -> S04 carga -> S20 Centro del fin de semana
 -> S21 Prep sesión siguiente -> S23 -> S24 -> SESIÓN ... (L1 -> L2 -> L3 -> Q1 -> Q2 -> Q3)
 Q3 -> S25 -> S19b Cinemática previa a la carrera -> S24 -> S20 (Carrera) -> S28 Editor de estrategia <-> S29 Prep carrera
 -> [Empezar carrera] -> S24 -> parrilla / salida (56:00) -> CARRERA
```

Secuencia medida, de Q1 a Q2 (cortes según `cuts.txt`):
1. 42:00: tabla de resultados de Q1, con desplazamiento a las filas 11–20 en 42:20.
2. 42:22–42:26: preparación de Q2.
3. 42:30: logotipo.
4. 42:40: pit lane en directo.

Elegir "gestionar" en Q1 hace saltar una ventana de confirmación entre 35:42.5 y 35:43.2 (corte en 2143.2 s). El logotipo llega en 35:44 y la sesión empieza hacia 35:49.7. El paso dura unos 6,5 s (confianza media).

---

## 5. Flujos de confirmación (VISTO)

| Flujo | Hora | Pasos | Qué protege |
|---|---|---|---|
| Nueva partida | 02:03 | Resumen, advertencia de irreversibilidad, Confirmar / Cancelar | Equipo y dificultad |
| Proyecto de diseño | 03:15, 04:20 | Asistente de 3 pasos. El último botón es morado y muestra el coste (cambia de 1 M$ a 3 M$ al pasar el enfoque de "normal" a "intensivo"). Sin ventana adicional. | Gasto (caja y techo de gasto) |
| Mejora de instalación | 07:40 | Menú contextual, ventana (coste, días, mantenimiento, caja restante), Confirmar | Gasto grande |
| Patrocinio | 05:10–06:40 | El botón principal pasa de "Bloqueado" a "Confirmar" en cuanto la selección es válida | Elección obligatoria |
| Plan de patrocinio | 09:10 | Ventana con objetivo y pago, más advertencia de que no se puede cancelar | Compromiso de 6 semanas |
| Objetivo de carrera | 10:35 | Bloqueado hasta elegir un nivel | Elección obligatoria |
| Gestionar sesión | 35:42 | Ventana breve de sí o no | Entrar en directo |
| Preparación | toda | "Coche N listo" en cada columna. El botón principal no exige que la puesta a punto se haya probado. | Ninguna (solo informativo) |

---

## 6. Datos observados en el juego (solo como referencia), comparados con la realidad

| Dato | Juego (hora) | Real o regla |
|---|---|---|
| Longitud del circuito y número de vueltas | 5,412 km y 57 vueltas, 308,484 km (10:30) | Bahrein: 5,412 km y 57 vueltas (oficial 308,238 km) |
| Récord de vuelta | 1:31.447 (10:30) | De la Rosa 2005, 1:31.447, coincide |
| Pérdida en el pit lane | 22 s normal, 16 s con coche de seguridad (10:30) | Bahrein, unos 22–23 s de verde. Bajo SC se pierde menos, coherente. |
| Probabilidad de coche de seguridad | 75 % (10:30) | Dato propio del juego. Calibrar con f1db. |
| Consumo estimado | unos 1,8 kg/vuelta. Tanda de 15 vueltas = 27,2 kg, 16 = 29,0, 18 = 32,6 (12:02) | Límite de la FIA: 110 kg por carrera. 110/57 ≈ 1,93 kg/vuelta. |
| Combustible de carrera | 57 vueltas = 103,9 / 104,4 kg (55:30) | Máximo de 110 kg; los equipos suelen cargar algo menos |
| Asignación de neumáticos | En seco 8 S + 3 M + 2 H = 13 juegos; 5 de mixtos y 2 de lluvia (28:00, zoom) | Reglamento de la FIA de 2024: 13 juegos de seco (8/3/2). Revisar en el reglamento el número de mixtos y de lluvia. |
| Compuestos | C3 (S), C2 (M), C1 (H) (54:30) | Bahrein 2024: C1, C2 y C3, coincide |
| Umbrales de agua | Seco 0–1 mm, mixtos 1–4 mm, lluvia 4+ mm (28:00) | Diseño del juego |
| Pole | 1:29.463 (53:30) | Verstappen 2024: 1:29.179 |
| Tiempo estimado de carrera | 1:28:00 (55:00) | Ganador en 2024: 1:31:44.742 |
| Día de la carrera | Sábado en la cronología (54:30) | 2024: sábado 2 de marzo, coincide |

---

## 7. Ideas para OverCut (deducidas, no copiadas)

1. **Un solo botón de avance con estados** (puede avanzar, evento obligatorio, bloqueado por motivo, confirmar gasto) y con subtítulo de destino. Hace de guía para todo el bucle de gestión.
2. **Avance del tiempo que se para solo** en el siguiente evento obligatorio, con un botón para pararlo a mano.
3. **Patrón de tres columnas** en las pantallas de decisión: controles, ayuda contextual según el cursor e impacto con columnas actual y nuevo y deltas de color.
4. **Asistente de pasos numerados** para proyectos caros, con el coste a la vista en el botón final. Sin ventana extra para gastos medianos; ventana solo para los grandes o irreversibles.
5. **Bucle del fin de semana**, siempre igual: centro del fin de semana, preparación con 2 columnas de coche, opciones (gestionar o simular), transición, sesión, resultados y vuelta al centro.
6. **Información oculta hasta probar**: la satisfacción con la puesta a punto aparece como "?" hasta rodar. Le da sentido a los libres.
7. **Parque cerrado** visible como candado en la preparación de carrera.
8. Usar las fichas de estrategia (lista A–D más gráfico de desgaste por vuelta) como plantilla funcional, con estilo y textos propios.
