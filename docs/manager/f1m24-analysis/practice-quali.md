# Libres y clasificación: vista de sesión en directo y HUD (vídeo 12:00–55:00)

Clave: `practice-quali`. Fuente: vídeo de F1 Manager 24, Baréin 2024, el jugador lleva Ferrari. Resolución 640x360 a 30 fps.
Los números leídos en pantalla son **valores del juego, solo como referencia**. Nuestra calibración saldrá de datos reales (FIA, f1db, OpenF1).
Para cada observación se indica qué se VIO y qué se INFIERE, con su confianza (alta / media / baja).
La UI se describe por su función y su disposición; no se transcribe texto de interfaz para reutilizarlo.

Material de trabajo: `C:/Users/hugoe/AppData/Local/Temp/claude/f96a86a4187a3fa3/ca0f17ed-6bb4-4ef9-b0f3-3638380e9349/scratchpad/f1m/work/practice-quali/`
(fotogramas ampliados en `zf/`, tiras del HUD `*_s_*.jpg`, mosaicos `*_m*.jpg`, rejilla de velocidad de simulación `spd_grid_*.png`).

## 1. Cronología del fin de semana en el vídeo

| Vídeo (s) | mm:ss | Qué pasa | Reloj de sesión | Hora local en juego | Conf. |
|---|---|---|---|---|---|
| 720–770 | 12:00–12:50 | Preparación de P1: dos fichas de coche y submenús (compuestos, piezas, reglaje, plan de tandas, opciones de conducción) | — | — | alta |
| 772–775 | 12:52 | Opciones de sesión: gestionar o simular, con "simular hasta clasificación/carrera". Se pide confirmación al elegir gestionar | — | — | alta |
| 776–777 | | Transición de 2 s con el logo | — | — | alta |
| 778–1300 | 12:58–21:40 | **P1** gestionada | 60:00 → 0 | 14:30 | alta |
| 1300–1330 | | Resultados de P1 → objetivos de libres de P1 → preparación de P2 → opciones de sesión | — | — | alta |
| 1335–1650 | 22:15–27:30 | **P2** | 60:00 | 18:00 | alta |
| 1655–1690 | | Resultados de P2 → preparación de P3 | — | — | alta |
| 1690–2060 | 28:10–34:20 | **P3** | 60:00 | 15:30 | alta |
| 2065–2080 | | Resultados de P3 → pantalla de "confianza inicial" (LEC 70 %, SAI 68 %) | — | — | alta |
| 2080–2125 | | Cinemática previa a la clasificación (logo, rótulo del evento, garaje, vistas aéreas) con opción de saltar | — | — | alta |
| 2125–2140 | | Resumen del evento → preparación de Q1 → "gestionar esta sesión" | — | — | alta |
| 2145–2520 | 35:45–42:00 | **Q1** | 18:00 | 19:00 | alta |
| 2525–2550 | | Logo → resultados de Q1 → resumen → preparación de Q2 | — | — | alta |
| 2555–2805 | 42:35–46:45 | **Q2** | 15:00 | 19:25 | alta |
| 2810–2835 | | Resultados de Q2 → preparación de Q3 → opciones de sesión de Q3 | — | — | alta |
| 2835–3205 | 47:15–53:25 | **Q3** | 12:00 | ~19:48 | alta |
| 3210–3225 | | Resultados de Q3, luego empieza la intro de la carrera | — | — | alta |

Referencia real (Baréin 2024): FP1 a las 14:30, FP2 a las 18:00, FP3 a las 15:30, Q1 a las 19:00. Q1 dura 18 min, Q2 15 min y Q3 12 min, con 7 y 8 min de pausa entre ellas.
**El juego copia exactamente los horarios y las duraciones reales**, y el reloj local de Q2 (19:25) indica que simula la pausa entre segmentos sin enseñarla (alta).

Duración real en el vídeo frente a la sesión de juego, con la compresión del jugador:
- P1: 522 s para 3600 s, unos 6,9x de media.
- P2: 315 s, unos 11x.
- P3: 370 s, unos 10x.
- Q1: 375 s para 1080 s, unos 2,9x.
- Q2: 250 s para 900 s, unos 3,6x.
- Q3: 370 s para 720 s, unos 1,9x.

Las pantallas de opciones en boxes **pausan la sesión**, así que esos tiempos incluyen ratos en pausa.

## 2. Compresión de tiempo (velocidad de simulación)

- VISTO: un selector central inferior con pausa, `< Nx >`, y un botón de cámara. Los valores que aparecen son **1x, 2x, 4x, 8x y 16x**; no se vio ninguno mayor (alta). Comprobado con el reloj: a 16x avanzan 16 s de juego por segundo de vídeo (59:43 → 59:27 → 59:11), y a 8x avanzan 8 s (alta).
- Al cambiar de velocidad aparece un rótulo grande y breve en el centro ("16x", "8x", "2x"…) (alta).
- Uso que hace el jugador, según la rejilla `spd_grid_*.png`:
  - Libres: casi todo a 16x u 8x. Baja a 1x para mirar momentos concretos, como las salidas de boxes o los onboards de P3 entre 1770 y 1990.
  - Clasificación: sobre todo a 1x, con onboard durante las vueltas lanzadas. Usa 4x u 8x en las vueltas de salida y de entrada, y 16x mientras espera en el garaje (Q1 2455–2475, Q2 2715–2725, Q3 2985–2990).
- VISTO: al llegar el reloj de Q2 a 0:00 la vista pasa a la cámara del pit lane y a **1x** (2774 a 8x con 0:02, 2775 a 1x). INFERIDO: el juego vuelve solo a 1x con la bandera de cuadros (media).
- VISTO: al pulsar "sacar el coche" con la compresión alta, la sesión se pone a 1x para la cinemática del garaje (P1, 796–801) (alta).
- Implementación: la simulación necesita los niveles {1, 2, 4, 8, 16}, pausa automática en los menús de boxes y una bajada automática a 1x en los eventos clave (salida del garaje, bandera de cuadros), además de un reloj de sesión que no se mueve mientras el menú está abierto.

## 3. Disposición del HUD de la sesión en directo

| Zona | Contenido (función) | Conf. |
|---|---|---|
| Arriba a la izquierda | Torre de tiempos: sesión (P1/Q2…), reloj de cuenta atrás y modo con flechas `< >` | alta |
| Arriba a la derecha | Tres pestañas de vista (datos, carrera, análisis), un engranaje y el bloque de condiciones (ver más abajo) | alta |
| Centro | Vista 3D: mapa oscuro del circuito con etiquetas "pos. \| TLA" sobre cada coche, o cámara de TV/onboard con un minimapa en la esquina derecha | alta |
| Arriba al centro | Rótulos de dirección de carrera: inicio de sesión con condiciones normales, DRS activado, incidentes con botón de repetición | alta |
| Abajo a la izquierda y a la derecha | Una ficha por cada coche propio (izquierda coche 1, derecha coche 2) | alta |
| Abajo al centro | Pausa, velocidad de simulación, botón de cámara y cámara anterior/siguiente | alta |
| Encima de la ficha | Mensajes de radio: retrato, título y una frase del ingeniero o del piloto | alta |

**Bloque de condiciones**, arriba a la derecha:
- Hora local con segundos, icono de tiempo y temperatura del aire.
- Previsión "en N minutos" con probabilidad de lluvia.
- Pista: temperatura, estado seco con agua en mm, nivel de goma y nivel de agarre.

Valores observados, como referencia de la evolución de la pista (alta):

| Momento | Aire | Pista | Goma | Agarre |
|---|---|---|---|---|
| P1 14:30 | 20,8 °C | 32,9 °C | Muy baja | Normal |
| P1 ~15:00 | 23,5 °C | 36 °C | Muy baja | Normal |
| P2 18:24 | 22,6 °C | 27,5 °C | Normal | Alta |
| Q1 19:18 | 22,1 °C | 25,9 °C | Normal | Alta |
| Q2/Q3 19:4x | 23 °C | 29,4 °C | Alta | Alta |

### Modos de la torre de tiempos

Se cambian con las flechas `< >`. Modos vistos (alta):
- **Líder**: mejor tiempo del primero y diferencias +s.ccc.
- **Neumáticos**: icono del compuesto y % de vida restante.
- **Última vuelta**.
- **Sectores**: tres barras de color por piloto, amarillo, verde o morado.
- **Intervalo**.
- **Estado**: aparece en Q3.

Otros elementos de la torre (alta):
- Junto a cada piloto, "Vuelta de salida" o "Vuelta de entrada", y un icono de cuadros cuando ya ha terminado la sesión.
- La fila del piloto propio va resaltada en blanco.
- En las libres aparecen dentro de la torre los pilotos sin tiempo, sin número de posición.
- En la clasificación, la **zona de eliminación tiene fondo rojo**: posiciones 16–20 en Q1 y 11–15 en Q2. Un marcador rojo en el borde señala el corte.
- El reloj se vuelve **rojo** en el tramo final de Q (visto a partir de ~3:00 en Q1) y en 0:00.
- La cabecera de la torre se pone **amarilla** con bandera amarilla (P1, 54:23).

### Ficha de coche en libres

Lleva el número de posición, el nombre y la indicación de DRS (que se enciende en verde dentro de la zona).

La cabecera de objetivos de libres muestra tres iconos con % (aclimatación a la pista, conocimiento de las piezas, feedback x/5).

Hay cuatro pestañas verticales:
1. Estado.
2. Tácticas: evitar pianos de riesgo, rodar en aire limpio, no pelear con el compañero.
3. Reglaje.
4. Piloto.

Contenido de la pestaña de estado (alta):
- **Ritmo**: desgaste de los neumáticos en %, temperatura de los neumáticos en °C y modo de ritmo en 5 puntos.
- **Combustible**: delta de combustible y temperatura del motor en °C.
- **ERS**: batería en % con barra y modo.

Al pulsar "ritmo" se abre una lista de comandos de 5 niveles (de ataque a conservar), con flechas que indican el efecto sobre el tiempo por vuelta y el desgaste.

Durante una vuelta, la ficha muestra la fase arriba (vuelta de salida / vuelta lanzada / vuelta de entrada), el retrato, el segmento con el reloj, el cronómetro de vuelta con las barras de sectores y los botones de tácticas, tiempos y telemetría (alta).

### Estados y botones de la ficha cuando el coche está parado

| Estado | Botones | Visto |
|---|---|---|
| En el garaje, listo | Sacar el coche / Reconfigurar | 778 |
| Saliendo del pit lane | Solo el rótulo de estado | 796–814 |
| Vuelta de salida (Q) | "Tomar el control manual" ocupa la ficha durante unos segundos y después pasa a la vista de tiempos | 2876 |
| Llamado a boxes | Rótulo "volviendo al garaje", botón grande "cancelar llamada" y **distancia que falta hasta la línea de entrada al pit (p. ej. 3,87 km)** | 961 |
| Reconfigurando | Indicador de progreso | 1056+ |
| Feedback del piloto listo | Rótulo con icono de diálogo; "sacar el coche" queda desactivado | 1441 |
| Tras la bandera de cuadros (Q) | "Sacar el coche" desactivado y un punto rojo de aviso en reconfigurar | 2457+ |

## 4. Secuencia de salida del garaje y del pit lane

### P1, primera salida del fin de semana (alta)

| Vídeo (s) | Reloj | Hecho |
|---|---|---|
| 795–796 | ~57:05 (a 8x) | Se pulsa "sacar el coche" para Leclerc. La ficha pasa a "saliendo del pit lane" |
| 797–800 | 57:04 → 57:00 (≈1x) | **Cinemática en el garaje** (~4 s, se puede saltar): mecánicos quitan las mantas, el coche arranca y sale marcha atrás o hacia delante |
| 801 | 57:00 | Cámara fija del pit lane que gira siguiendo al coche. Radio "radio check" |
| 802.2 | | Corte a una cámara en el muro del pit, mirando calle abajo |
| 803–808 | 56:58–56:53 | Diálogo de radio en dos mensajes (ingeniero y piloto) |
| 809 | 56:52 | Pasada rápida y cercana con desenfoque de movimiento |
| 810–813 | 56:51–56:48 | Cámara alta de la salida, con el pórtico del reloj y el semáforo, y el coche alejándose |
| 813.8 | | El jugador vuelve al mapa a 8x. El estado sigue siendo "saliendo" |
| ~815 | ~56:35 | La ficha pasa a mostrar los datos del coche: ya está en pista |

**Salida → en pista ≈ 30 s de juego** (media; la resolución es de ±4 s porque iba a 8x).

### Q3 a 1x, Sainz (alta; medido segundo a segundo, `q3c_pair.jpg`)

| Vídeo (s) | Reloj Q3 | Hecho |
|---|---|---|
| 2853 | 11:41 | Se pulsa sacar el coche. **Sin cinemática en el garaje** |
| 2854 | 11:40 | La ficha pasa a "saliendo del pit lane". La cámara por defecto del pit lane está fija |
| ~2858 | 11:36 | El coche pasa por delante de la cámara del pit lane |
| 2861 | 11:33 | Corte a una cámara cercana en el muro del pit lane, con el coche pasando |
| 2862 | 11:32 | Cámara trasera o de persecución por el pit lane |
| 2863 | 11:31 | Plano largo del pit lane hacia la salida |
| 2864–2866 | 11:30–11:28 | Cámara en el pórtico de la salida (semáforo y línea) |
| 2867–2868 | 11:27–11:26 | Cámara alta en la **incorporación**, con la línea de salida, galones blancos y el carril que se une a pista |
| 2869 | 11:25 | Vuelta automática a la cámara por defecto del pit (ahora vacía) |
| 2872 | 11:20 | El jugador pone 2x y después 4x |
| 2875→2876 | 11:16 → 11:12 | El estado pasa de "saliendo" a **vuelta de salida** |

- Sainz: salida → en pista **≈ 26 s** (11:40 → ~11:14). Leclerc, en el mismo Q3: 11:02 → ~10:34, **≈ 28 s**.
- Q1: Sainz 13:11 → ~12:43 (**≈ 28 s**) y Leclerc ~12:57 → ~12:29 (**≈ 28 s**).
- **Patrón: el estado "saliendo del pit lane" dura 26–30 s de juego** (alta). INFERIDO: incluye la salida del garaje, el tramo a velocidad limitada y el carril de incorporación hasta el final de la línea de salida, unos 5 + 10 + 12 s (media).
- Referencia real: Baréin tiene límite de 80 km/h en el pit lane, y la salida se incorpora por el carril interior pasada la curva 1. Para nuestro modelo: estado de salida = tiempo garaje→calle + longitud del pit lane desde el box / 80 km/h + tiempo del carril de incorporación.
- Velocidad en el pit lane: **no se puede leer** en el vídeo (no hay velocímetro en el HUD fuera de la telemetría). El paso por la cámara por defecto hasta la incorporación es de ≈ 10 s de juego.
- Audio de la salida (baja): en 2853–2862 y 801–811 el tono dominante es estable, de ~170–230 Hz, con rms entre −21 y −25 dBFS. Es coherente con un limitador de régimen fijo. El nivel cae unos 20 dB cuando la cámara se aleja (2865+). No se oyen cambios de marcha en ese tramo.

### Cámaras durante la salida (resumen)

Hay una cadena fija de unas 5–6 cámaras con cortes secos cada 1–3 s:

| Orden | Cámara |
|---|---|
| 1 | Garaje, solo en la primera salida |
| 2 | Cámara fija del pit lane que gira siguiendo al coche |
| 3 | Muro del pit en primer plano |
| 4 | Persecución |
| 5 | Pórtico de salida |
| 6 | Cámara alta de la incorporación |

Después vuelve a la cámara por defecto. Al iniciar cualquier sesión, la cámara por defecto es la del pit lane delante de los garajes (alta).

## 5. Vueltas de salida, lanzada y de entrada (Q1, `q1lap_s_*.jpg`)

| Fase | Sainz | Leclerc | Notas |
|---|---|---|---|
| Sale del garaje | 13:11 | ~12:57 | Ambos esperaron ~5 min en el garaje con la pista libre |
| Fin de "saliendo" (vuelta de salida) | ~12:43 | ~12:29 | El cronómetro de la ficha **marca 0:00.000 durante toda la vuelta de salida** |
| La ficha pasa a vuelta lanzada | ~11:15 | ~11:10 | Aparece unos 10 s antes de cruzar la línea (preparación de la vuelta), con el cronómetro todavía a cero, y llega un mensaje de radio de inicio de vuelta lanzada |
| Empieza el cronómetro | ~11:03 | ~10:51 | Cuenta en tiempo real a 1x |
| Fin de la vuelta | ~9:33 → **1:30.168** | ~9:21 → **1:29.932** | Llega una ventana emergente de vuelta completa con el tiempo y una frase de radio ("P5", "buena vuelta") |
| Vuelta de entrada | 9:33 → ~7:45 | 9:21 → ~7:30 | El **cronómetro sí corre en la vuelta de entrada** (1:30.45 a las 8:03 en Sainz). Hasta el garaje ≈ 1:50 |

- Duración de la vuelta de salida (fin de "saliendo" → inicio del cronómetro): **≈ 100 s** en los dos coches (alta).
- Total desde "sacar el coche" hasta el inicio de la vuelta lanzada: **≈ 2:08**, y hasta volver al garaje unos 5:25 de reloj (alta).
- Referencia real: una vuelta de salida en clasificación real en Baréin dura ~1:45–2:00. El juego la hace algo más rápida.
- Plan de tandas en Q: "1 vuelta lanzada = 5,7 kg" (salida + lanzada + entrada ≈ 3 × 1,8 + margen) (alta).
- Las vueltas de Q3 cuentan 5 (dos tandas: salida, lanzada, entrada, salida, lanzada); las de Q1 cuentan 3 para quien hizo una sola tanda (alta).

## 6. Libres: objetivos, reglaje, feedback y confianza

### Pantalla de preparación de la sesión (P1/P2/P3)

Dos fichas, una por coche (alta). Cada una lleva:
- Los objetivos de libres: aclimatación a la pista %, conocimiento de las piezas %, satisfacción con el reglaje %.
- Una barra de "preparación del piloto" %.
- Filas de compuestos (% de juegos, letra del compuesto), piezas, reglaje (sin probar o %), plan de tandas (N vueltas y kg) y opciones del piloto.
- Un botón de "coche listo" por coche y un botón principal arriba a la derecha para ir a la sesión.

El panel lateral explica el elemento seleccionado. Antes de P1 se puede **cambiar a un piloto afiliado**, que solo puede correr P1 y transmite su progreso.

**Reglaje** (alta): cinco deslizadores (ala delantera 5,5°, ala trasera 11–12,5°, reparto de antirrollo 7:3 o 5:5, caída −3,00°, convergencia negativa 0,20°).
- Panel de satisfacción con cinco ejes (sobreviraje, estabilidad en frenada, paso por curva, tracción, rectas). Cada eje tiene una barra con la **ventana óptima en verde turquesa**, una marca de "actual", otra de "anterior" y otra de "mejor", y una nota (?/Bien/Muy bien/Óptimo).
- La ventana se estrecha a medida que llega feedback del piloto: al principio hay "???" y en la sesión ya aparecen notas.
- Cada deslizador explica hacia qué ejes empuja el reglaje.

**Plan de tandas** (alta): número de vueltas (15 o 18) y combustible = vueltas × 1,8 kg + ~0,2 kg (27,2 kg / 32,6 kg).
Referencia real: ~1,6–1,9 kg/vuelta en Baréin (110 kg / 57 vueltas ≈ 1,93).

**Opciones de conducción** (alta): ritmo en 5 puntos, consumo de combustible en 5 puntos y estrategia de ERS (neutral: máxima energía almacenada y usada de 2 MJ por vuelta).
Referencia real: el reglamento limita la MGU-K a 2 MJ de recuperación por vuelta y la batería a 4 MJ de diferencia de carga.

### Opciones en boxes durante la sesión (alta)

- Se abren cuando el coche entra al garaje y la sesión queda **pausada**; arriba se ve "sesión en pausa" con el reloj congelado.
- Cada cambio tiene su coste en tiempo: reglaje 4:24, plan de tandas 14–15 s, más neumáticos y piezas.
- La suma aparece como "tiempo de configuración" junto al tiempo que le queda a la sesión, y se acepta con un botón de confirmar. Tras confirmar, la ficha muestra que se está reconfigurando.

### Feedback y confianza

- VISTO: a lo largo de las tandas llegan mensajes de satisfacción con el reglaje ("muy buena", "me siento a gusto"), y la ficha avisa de que el piloto está recogiendo feedback de reglaje, con un mini gráfico (alta).
- Feedback del piloto: contador x/5 (en P2: 4/5).
- La aclimatación crece de forma continua mientras el coche rueda sin parar (el texto lo dice). Después de P1: LEC 17 % y SAI 15 % de aclimatación; 16 % de conocimiento de piezas; preparación 8 % y 7 % (alta). Tras P3, la **confianza inicial** queda en LEC 70 % y SAI 68 % (alta).
- En la preparación de Q aparece la confianza del piloto (Alta / Media) con sus efectos: precisión, frenada, paso por curva, adelantamiento y defensa, cada uno entre +1 y +2 sobre 100, más una probabilidad de incidente (Baja). La ficha también muestra la mejor vuelta de libres y la posición de corte (15.ª) (alta).
- Implementación: tres medidores de progreso que suman una preparación (la aclimatación es "una cuarta parte del máximo"), una ventana óptima de reglaje que se estrecha con el feedback, y una confianza del piloto con efectos pequeños sobre sus atributos.

### Incidentes en libres (alta)

- Rótulo de dirección de carrera "ALBON se sale en la curva 7" con botón de repetición (P1, ~830).
- Bandera amarilla en la cabecera de la torre (P1, 54:23).
- Mensajes de radio de contexto: neumáticos fríos, menos ritmo, "cuida los neumáticos".

## 7. Clasificación: eliminatorias y cortes

- Antes de cada Q hay pantalla de preparación (sin el submenú de reglaje; las piezas en **parque cerrado** se avisan con un candado). Las opciones de sesión (gestionar/simular) se vieron en Q1 y Q3 (alta).
- Q3 empieza **con todos en el garaje**. Las salidas se escalonan a decisión del jugador (alta).
- Final de Q1/Q2 (alta):
  - El reloj se queda en 0:00 en rojo y la sesión sigue mientras haya coches en vuelta lanzada.
  - La radio avisa de que se espera a que los demás terminen.
  - Las posiciones se reordenan en directo: Sargeant pasa de 15.º a 16.º en ~2510 y cae a la zona roja.
  - El icono de cuadros marca a quien ya terminó y los coches propios ya no pueden salir.
- Hay un logo de transición antes de la tabla de resultados (Q1/Q2/Q3 por columnas, y vueltas).
- Resultados observados (referencia):

| | Q1 | Q2 | Q3 |
|---|---|---|---|
| VER (pole) | 1:29.822 | 1:29.751 | 1:29.463 |
| LEC | 1:29.932 | 1:29.997 | 1:29.857 |
| SAI | 1:30.168 | 1:30.088 | 1:30.154 |
| Corte | ~1:31.8 (16.º SAR 1:31.847) | 1:31.119 (11.º RIC) | — |

Real 2024: VER 1:30.031 / 1:29.374 / 1:29.179; LEC Q3 1:29.407; SAI Q3 1:29.507.
La mejora del juego de Q1 a Q3 en el poleman es de 0,36 s, frente a 0,85 s en la realidad (subestima la evolución). Los tiempos absolutos están a ~0,3 s.

- Libres (referencia): mejor tiempo de P1 1:33.504 (HAD), P2 ~1:32.8 y P3 1:33.470 (PER). Ferrari, entre 1:34.4 y 1:35.8.
Real: FP2 HAM 1:30.374 y FP3 SAI 1:30.755. **El juego corre las libres ~3 s más lento** (inferido: más combustible o ritmo de tanda larga; media).

## 8. Cámaras durante la sesión (resumen)

- Por defecto: el mapa 3D a vista de pájaro con etiquetas de coche ("pos. | TLA"). La cámara gira o se desplaza levemente (alta).
- Cámara de TV de seguimiento (planos laterales y altos de pista), onboard en el halo / T-cam, onboard a la altura del morro y cámara trasera de alerón. Se cambian con el botón de cámara y con anterior/siguiente; el jugador eligió onboard de VER en Q1 y de LEC/SAI en Q2/Q3 (alta).
- La cámara de TV corta cada pocos segundos para seguir al coche elegido (Q3 3160–3195: tres planos de TV en ~15 s) (media). La lista de cortes `cuts.txt` muestra grupos de cortes cada 1–3 s en las salidas de boxes y en las transiciones de menú.

## 9. Ideas para implementar en OverCut (sin assets, solo estructura)

1. Máquina de estados por coche: GARAJE → (CINEMÁTICA_GARAJE solo en la primera salida) → SALIENDO_PIT (26–30 s) → VUELTA_SALIDA (~100 s, cronómetro parado) → PREPARACIÓN_LANZADA (~10 s antes de la línea) → LANZADA (cronómetro) → VUELTA_ENTRADA (cronómetro en marcha, ~110 s hasta el garaje) → GARAJE.
2. En libres, llamada a boxes con distancia a la línea de entrada y opción de cancelar. El menú de boxes pausa la sesión y cada cambio cuesta tiempo de sesión.
3. Reloj de sesión con duraciones reales (60/18/15/12 min), hora local del evento y pausa entre segmentos de Q que no se muestra.
4. Velocidades 1/2/4/8/16x, con vuelta automática a 1x en eventos.
5. Torre con modos que se van cambiando (líder, intervalo, última vuelta, sectores, neumáticos, estado), zona de corte en rojo, reloj rojo al final y cuadros al terminar.
6. Bloque de condiciones con evolución de la pista (goma de muy baja a alta y agarre de normal a alto en el fin de semana, temperatura de pista según la hora). La calibración saldrá de OpenF1 (meteorología) y no de los valores del juego.
7. Progreso de preparación (aclimatación, piezas, reglaje) → confianza del piloto con pequeños modificadores.
