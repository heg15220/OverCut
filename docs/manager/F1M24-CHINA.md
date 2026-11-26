# F1M24-CHINA — Especificación de implementación a partir del gameplay de F1 Manager 24 en Shanghái

Fecha: 26/11/2026. Fuente: análisis multiagente de un vídeo de F1 Manager 24 (GP de China 2024, de día, McLaren con
Verstappen y Hamilton) contra una captura parcial de OverCut Manager en China 2013, con el código en el WIP `ee8ad429`.
**Continúa** a `F1M24-GAMEPLAY.md` (Baréin, de noche): lo que allí está hecho (§5 de ese documento) no se repite aquí.
Complementa a `SRS.md`, `SIM-FISICA.md` y `DESIGN.md`; no los sustituye.

**Rutas.** Igual que en F1M24-GAMEPLAY: relativas a `overcut/frontend/src/modules/overcutManager/` salvo las que empiezan
por `overcut/src/`, `overcut/frontend/scripts/` o `tools/`. Los ficheros marcados con `*` no existen todavía.

**Notación.** V = visto o medido; I = inferido. Confianza A (alta), M (media), B (baja). Tiempos de vídeo en mm:ss
(segundos absolutos entre paréntesis cuando importan). «Juego» = valor observado en F1 Manager 24, solo de referencia.
NV = valor no verificado; entra en datos con `status: "pending"`. Los identificadores `GS-nn` (motor), `VIEW-nn`
(presentación) y `AUD-Cnn` (sonido) son los del backlog de la §3; los paquetes de trabajo llevan sufijo `-C`
(`SIM-C1`, `CAM-C2`…) para no confundirlos con los de F1M24-GAMEPLAY.

---

## 1. Alcance y método

### 1.1 Vídeo analizado

- F1 Manager 24, GP de China 2024 en Shanghái, 1 h 01 min 21 s, de día y seco, **1280×720 a 30 fps** (el doble de
  resolución que el material de Baréin). Audio estéreo AAC 44,1 kHz y mezcla mono a 22 kHz.
- Contenido: clasificación Q1–Q3 (00:00–11:43), intro y preparación de carrera (11:52–13:29), parrilla y salida
  (13:29–14:08), carrera completa de 56 vueltas (14:08–58:33), repetición del ganador, vuelta de enfriamiento,
  parc fermé, podio y pantallas de resultados y clasificaciones (58:33–61:21).
- Alineación editada por el jugador (VER coche 1 con M, HAM coche 2 con S). Fin de semana sprint real jugado como normal.
- Novedades frente a Baréin: **safety car completo** con paradas masivas, doble parada bajo SC, relanzamiento con
  realización automática, volante legible (marcha, velocidad, ERS, 15 LED), selector de cámaras con índice legible por
  fotograma, final de carrera con podio y resultados.
- La simulación va a 1x el 86 % de la carrera, así que casi todos los tiempos son medibles directamente.

### 1.2 Material

Diez informes en el scratchpad de la sesión
(`C:/Users/hugoe/AppData/Local/Temp/claude/9c58f609dc3a8811/c095a266-dd47-4692-99e4-3d3d4436f1a8/scratchpad/cn/`, en
adelante `cn/`). Nada de ese material entra en el repo; puede borrarse con la limpieza del sistema.

| Informe | Qué cubre | Técnica principal |
|---|---|---|
| `quali` | Q1–Q3, reloj, garaje, evolución, preparación, parrilla y luces | Fotogramas a 30 fps, cronómetros del HUD |
| `race-a` | Carrera V1–V27: salida, DRS, batallas, parada a bordo, HUD | Hojas a 5 fps, trazas de f0, espectrogramas |
| `race-b` | Carrera V27–V56: SC, doble parada, final, podio, resultados | Detector de cortinillas, lectura de paneles cada 30 s |
| `cameras` | 262 planos de carrera con su cámara (índice del selector), zonas TV, onboards | Detector de cortes propio, correlación de fase para vibración |
| `audio` | Mezcla por vista, velocidad de simulación, motor por equipo, radio, pit lane, SC | Peine armónico con Viterbi, bandas L/R cada 50 ms |
| `dynamics` | Velocidad por curva, frenadas, seguimiento, lado a lado, SC, pit lane | Marcador del minimapa a 10 Hz (7,47 m/px), volante |
| `weather` | Widget de condiciones, previsión, temperaturas, goma, aspecto diurno, lluvia real | Lectura del widget, `look.csv`, OpenF1 9664/9668/9673 |
| `gap-sim` | Física, IA y mojado de OverCut frente a lo visto | Lectura de `engine/`, `data/balance/`, captura propia |
| `gap-view` | Cámaras, luz, lluvia y HUD de OverCut frente a lo visto | Lectura de `three/`, `components/`, captura propia |
| `gap-audio` | Sonido de OverCut frente a lo visto | `three/audio/`, `audio.json`, grabaciones WebAudio de la captura |

**Captura de OverCut.** Partida de China 2013 grabada con Playwright en `cn/ours/`. **El usuario paró la captura antes
de su informe y pidió no continuarla**, así que no hay informe `ours`; los informes de huecos usan lo que quedó:

- `telemetry.csv` (3.222 muestras a 10 Hz, cámara TV), `telemetry_speed_vs_distance.png`, `telemetry_trace_time.png`.
- Capturas por cámara y tramo: `{tv,chase,drone,heli,tcam,tcamRear,visor,nose,map}_{recta,rectaatras,T1T2,T6,T14,batalla,pitlane,ui}_n.png`,
  sus versiones mojadas `wet_*`, `start_clean_*.png`, `start_ui_*.png` y hojas de contacto `_contact_*.png`.
- Audio: `audio_{tv,chase,tcam,visor}.wav`, `wet_audio_{tv,chase}.wav`, `audio_summary.json`, espectrogramas.
- Partidas `save-china-preview.json` y `save-china-wet.json` (la mojada es sintética: el GP de 2013 fue seco).
- `_resB*.json` con fps y `_run*.log`.

Las pruebas Playwright de este documento son **pruebas de aceptación para la fase de implementación**; no se han
ejecutado y no hay que relanzar la captura para escribirlas.

### 1.3 Límites de la medida

- La velocidad en el volante no se lee a 720p salvo en la cámara de cabina con el volante recto (race-b §5).
- El minimapa aplana picos (±10 % de escala local); T9–T10 queda tapado por un desplegable en casi todas las vueltas.
- `c` (separación del peine del motor) = rpm/120 es una interpretación (B). Desfase audio/vídeo de la grabación
  ≈ +0,12–0,20 s (audio tarde), ya descontado en los tiempos de `audio`.
- El nivel absoluto de ritmo del juego va **~5 % más rápido que la realidad** (pole 1:28.374 frente a 1:33.660 real;
  vuelta rápida 1:31–1:33 frente a 1:37.810). Ningún tiempo de vuelta del juego sirve para calibrar.
- **No aparece en el vídeo**: lluvia (0,00 mm todo el rato), VSC, bandera roja, vuelta de formación, doblaje con
  bandera azul a bordo, daños visibles, humo de bloqueo. Lo que se diga sobre lluvia sale de OpenF1 (SQ de China 2024,
  sesión 9668), Pirelli y el reglamento FIA, nunca del juego.
- **En OverCut no se capturó**: SC en directo, parada completa medida, lluvia con telemetría, duelo lado a lado sostenido,
  mapa a 8x con audio.

### 1.4 Reglas de uso

Rigen las cinco reglas de F1M24-GAMEPLAY §1.4 sin cambios (solo ideas y estructura del juego; calibración con FIA, f1db,
OpenF1/FastF1 y Pirelli; RNF-07; claves por era con `pending` lo que sale de memoria; la vista solo lee del motor). Se
añaden tres:

6. **Licencias de sonido** (SRS §3.3, §7.3): ningún banco grabado con `riskRipped: true` o `license: null` suena por
   defecto ni se empaqueta en una build pública. Lo grabado nuevo es CC0/CC BY con atribución o de producción propia.
7. **Ruido con semilla en la vista**: vibración, gotas, chispas, spray y elección de cámara usan `seedOf` y el reloj de
   carrera, nunca `Math.random` ni el reloj de pared (RNF-05).
8. **Medir la validación 7.2 en cada ola** que toque el motor (`node scripts/validateSeasons.js --full`). F1M24-GAMEPLAY
   §5 bajó de 35/38 a 34/38 sin que ninguna ola lo midiera; aquí la fusión de una ola de SIM no pasa si baja de 34/38 o
   de Spearman 0,918, y la ola de SIM-C3 tiene como objetivo ≥ 35/38 y ≥ 0,92.

### 1.5 Decisiones de unificación

Los tres informes de huecos proponen a veces lo mismo con claves en sitios distintos. Se fija **una sola fuente**:

| Tema | Propuestas originales | Decisión |
|---|---|---|
| Estimación de la parada | `pitLane.estimateLoss()` nuevo (GS-15) | Ya existe `previewPit(state, carId, opts)` (`engine/sim/pitLane.js:472`, PIT-1). **No se crea otra función**: GS-15 ata `previewPit` al cronómetro (misma definición de línea a línea) y el estratega de `race.js` pasa a usarla. |
| Trazada y lateral | `trackData.positionAt(P, lat)` (GS-07), `pose.lineOffset` (VIEW-08), lateral del piano (AUD-C8) | El motor es dueño: `engine/trackData.js positionAt(P, lat)` suma trazada y lateral, y la pose publica `lineOffset` (trazada) y `lateral` (respecto al eje). `three/cameraZones.js`, `three/racingLine.js`, `Race3D.js` y `three/audio/kerbs.js` solo la leen. Cierra CAM-3. |
| Parámetros visuales del mojado | `live-view.json wet` (GS-10) y `race-weather.json display.rain` (VIEW-07) | Nuevo `data/balance/view-look.json*` con bloques `sky`, `grade`, `exposure`, `fog`, `wet`, `rain`, `fx` y esquema `engine/packs/schema/view-look.schema.json*`. `race-weather.json` se queda con lo físico (agua, spray, evacuación) y su bloque `display` (bandas del HUD). |
| Spray | Salida del motor (GS-11), partículas (GS-10/VIEW-07), siseo (AUD-C5) | El motor publica `snapshot.spray[i]` (0..1) y `snapshot.weather {waterMm:{line, off, sectors[]}, rainRate, state}`. Vista y sonido no recalculan nada. |
| Claves del duelo | `race-sim.json duel.straightPass` (GS-04) y `race-physics.json duel.alongsideMinSec` (VIEW-09) | Lo que decide el duelo va en `race-sim.json duel` (`straightPass {minAlongsideSec, completeBeforeBrakeM, confirmLengths}`, `rePass {rePassLaps, rePassPaceSec}`). Lo geométrico va en `race-physics.json lateral` (`maxRate`, `alongsideByBand`, `clearanceMetres`). |
| Seguimiento | `traffic.minFollowSec` en `race-sim.json` o `race-eras.json` | `race-sim.json traffic.minFollowSec.eras[]` (`{from, to, value, source, status}`). |
| Avance rápido | Vista al mapa (`live-view.json fastForward`, VIEW-17) y mezcla (`audio.json mixer.views.fastForward`, AUD-C1) | Dos decisiones distintas: la vista solo pasa al mapa si `live-view.json fastForward.enabled` (apagado por defecto: el 3D a ×4 es una ventaja nuestra). El sonido entra en `fastForward` **siempre** que `speed ≥ mixer.views.fastForward.minSpeed`, con o sin mapa, porque a ×8 el sintetizador recibe rpm comprimidas en el tiempo. |
| Velocidad en el audio | — | `LiveRace.js` y `SessionLive.js` pasan `speed` en `audio.frame()` (carril HUD). |
| Cortinilla | `broadcast.json replay.stingSec` (VIEW-13) y `audio.json ui.sting` (AUD-C12) | Duración en `broadcast.json replay.stingSec`; el sonido lee esa duración y solo define capas y niveles. |
| Volante | `cameras.json wheelDisplay.byEra` (VIEW-15), luces de cambio (AUD-C12) | Disposición en `cameras.json wheelDisplay.byEra`; LED desde `pose.rpm` y `shiftRpm` de `race-powertrain.json`. Imagen y sonido usan el mismo reloj de la vista. |
| Chispas por era | `view-look.json fx.eras` | `view-look.json fx.sparks.eras[]` con `pending` hasta leer el reglamento técnico (patines). |
| DRS habilitado | Banner del juego | El motor emite `control.drsEnabled {lap}` y `control.drsDisabled {reason}`; el HUD solo pinta. |
| Mensajes de mojado | — | El motor emite `control {kind: "climaticChange"|"wetTrack"|"slippery"|"lowGrip", sector?}` con umbrales de `race-sim.json raceControl.wet`. |
| Radio en sesiones | — | `engine/sessionSim` emite `radio[]` y `events[]` con la misma forma que la carrera. |

### 1.6 Lo que el juego hace mal (no copiar)

| Juego | Real / regla | Qué hace OverCut |
|---|---|---|
| DRS habilitado en la V2 y 1 vuelta tras el SC (race-a 15:46; race-b 45:10) | Tras 2 vueltas en ambos casos (RF-SIM-08) | Ya lo hace bien; GS-08 lo blinda con un test de tabla. |
| ~25 cambios de líder entre compañeros en 20 vueltas (race-a §4.2) | Pases con coste y sin ping-pong | GS-05: histéresis por pareja. |
| Ritmo ~5 % más rápido que la realidad | Pole 1:33.660 (2024) | Seguir con `refLaps` de f1db. |
| SC a 101–105 km/h fijos con la fila a 0,30 s (dynamics §7) | Vueltas de SC ≈ 140–150 % del verde; hasta 10 largos | Ya tenemos `lapFactor` 1,52 de OpenF1 y 10 largos (SIM-5). No tocar. |
| Estimación del menú 25,6 s frente a 30,9 s medidos; bajo SC 23,8 frente a 34,9 | Una definición | GS-15. |
| Choque múltiple con coches parados sin SC ni VSC (race-a 27:40) | Escalada según el incidente | `incidents.js` ya escala; GS-05 no lo debe romper. |
| +5 s a un coche ya retirado (race-b 40:52) | Pasa a sanción de parrilla | Anotar en SIM-C4 (`penalties.retiredToGrid`, `pending`). |
| Pista = aire + 13 °C fijos todo el día (weather §2.3) | El exceso baja de 13 a 9 °C por la tarde (OpenF1 9673) | GS-14. |
| El render no cambia con el estado del cielo (weather §4) | — | VIEW-06: la nubosidad cambia sombra y luz. |
| Tono del motor congelado 30 s detrás del SC (audio §4.3) | Zigzag y golpes de gas | AUD-C9. |
| Banner de adelantamiento sin pase en cuadro, retraso de la torre en puntos de cronometraje (+0,266 frente a +0,155 oficial) | — | `pass.confirmedAt` (ya existe) y retardo del banner (VIEW-09). |

---

## 2. Áreas

Cada área sigue el mismo orden: lo observado (con tiempo y confianza), lo medido, OverCut hoy (con capturas de
`cn/ours/`), la propuesta (con el id del backlog) y qué lo hace pulido.

### 2.1 Físicas y movimiento

**Observado.**
- Ningún salto de posición en 2.665 s de carrera; todos los cambios bruscos son cortes de cámara (cameras §2; A).
- Trazada real: por fuera antes de frenar, vértice en el piano interior, salida por el exterior; en el caracol T1–T2,
  vértice tardío en T2 (race-a §3; A). En tándem, desplazados ~1 ancho y ~1 largo (dynamics §4; M).
- El seguidor regula un **hueco en tiempo** de 0,1–0,5 s durante 19 vueltas: el coche de delante se ve grande en T6 y
  pequeño en la recta (dynamics §5, 15:05–30:35; A).
- Lado a lado: ~6 s en paralelo en una curva rápida con 0,3–0,5 m entre ruedas (race-a 22:42, `frames5/f_00273.jpg`;
  A secuencia, M hueco); en curvas lentas siempre en fila; en frenada ~1 m.

**Medido** (dynamics §2–3, perfil mediano a 1x; valores del juego solo como referencia):

| Curva | Juego km/h | Marcha | Real aprox. 2024 (verificar en OpenF1) |
|---|---|---|---|
| T1 entrada | 295 | 7.ª | 305–315 |
| T3 | 95 | 3.ª | 85–95 |
| T6 | 91 | 2.ª–3.ª | 70–80 |
| T8 | 186 | 5.ª–6.ª | 180–200 |
| T11 | 101 | 3.ª | 85–95 |
| Recta trasera, punta | 310 | 8.ª | 320–330 con DRS |
| T14 | 74 | 2.ª | 70–80 |
| T16 | 171 | 5.ª | 130–150 |

Frenada de T14: 326 → ~60 km/h en 2,2 s y ~103 m (V14); ~3,3 g de media con pico inicial (A/M). Carteles de
200/150/100/50 m visibles; el pelotón frena entre 150 y 100.

**OverCut hoy.**
- `telemetry.csv`: la velocidad de la vista coincide con la del motor (`liveCarAt`, `components/raceClock.js:363`), pero
  en las muestras 1337→1338 `progress` salta 0,0377 de vuelta (~205 m) en 0,16 s a 253 km/h, se congela 6 muestras y τ
  retrocede de 117,3 a 107,3 s (diagonal en `telemetry_speed_vs_distance.png`). No se distingue repetición de fallo.
- Velocidades de 2013 (`telemetry_speed_vs_distance.png`): T14 ~55 km/h (25 % lenta), T11–12 ~78, T6 ~72, T1–T2 ~83,
  punta ~315. La pérdida de la banda lenta (`race-physics.json budget.slow` 1,5) se concentra en la curva más cerrada.
- Seguimiento con `race-sim.json traffic.minGapMetres` 7,5 m fijos (`engine/sim/stepRace.js:1211-1215`): 0,09 s a
  300 km/h. `chase_batalla_*.png` muestra 0,49 s en fila, pero no hay cota en tiempo.
- Fila india por el centro de la pista en la V1 (`_contact_start.png`, `tv_batalla_1.png`) y en la recta mojada
  (`wet_tv_T14_1.png`); en `drone_T14_2.png` el vértice sí va bien. CAM-3 sigue abierto: el motor separa a lo largo del
  eje central y la vista dibuja sobre la trazada.
- Lado a lado: `lateral.clearanceMetres` 0,4 (fuente pendiente), `attackMetres` 2,6, `blockMetres` 1,8; en
  `tv_batalla_1`, `drone_batalla_*` y `chase_batalla_*` casi todo va en fila.

**Propuesta.**
- **GS-01** continuidad: `raceClock` expone `mode: live|replay|seek`; en vivo, |Δs| por fotograma ≤ `v·Δt·k + m` con
  `k`, `m` en `live-view.json continuity` (diseño: 1,2 y 2 m); teletransporte solo con `seek`.
- **GS-07 / VIEW-08** trazada única (§1.5): `trackData.positionAt`, `pose.lineOffset` en todas las fases (salida y SC
  incluidos); cámaras y pianos miden contra ella.
- **GS-03** seguimiento: distancia mínima fuera de duelo = `max(minGapMetres, v·minFollowSec)`, `minFollowSec` por era
  calibrado con el p5 de OpenF1 `intervals` en filas sin pase (2023–2025; antes NV).
- **GS-02** curvas: fixture de Shanghái 2024 (OpenF1 `car_data` de las sesiones 9664 y 9673) en
  `engine/sim/__fixtures__/openf1-powertrain.json`, escalado a 2013 con la física por era; reparto del presupuesto de la
  banda por radio con `race-physics.json budget.radiusExponent`. Para 2013 no hay telemetría pública: ±12 % y `NV`.
- **GS-06** lado a lado: `race-physics.json lateral.alongsideByBand {fast, medium, slow}` (en las lentas cede el de
  fuera en el punto de giro) y duración mínima a la par en curva rápida con Δritmo < 0,1 s/vuelta; holgura calibrada
  con OpenF1 `location` (|Δs| < 1 largo).

**Qué lo hace pulido.**
1. Continuidad absoluta: los coches nunca saltan; solo la cámara corta.
2. El hueco en tiempo hace que el de detrás «respire» solo: cerca en las curvas, lejos en las rectas.
3. Trazada visible en todas las fases, también en la salida y detrás del SC; fila india solo en las lentas.
4. Frenada con pico al principio (la onboard se hunde en los primeros 0,3–0,5 s); una deceleración constante se ve falsa.
5. Variedad entre vueltas (±10–20 km/h por pasada, deriva de stint) sin romper el determinismo.

### 2.2 IA de carrera

**Observado.**
- **Pase con DRS en la recta trasera**, fotograma a fotograma desde la onboard de VER (race-a 16:57–17:05; A): sale de
  la estela ~1 ancho en 1–1,5 s, morro con rueda a +2 s, ~2,5 s a la par con 0,5–1 ancho libre, queda delante **antes**
  de frenar en T14; la torre se reordena +0,6 s después de que el rival salga de cuadro. Mismo patrón en la recta de
  meta antes de T1 (dynamics, 1830–1845).
- Ping-pong entre compañeros (~25 cambios de líder en 20 vueltas, defecto; race-a §4.2).
- Un único contacto en 56 vueltas: **tres coches** en la frenada de T14 con ~½ ancho de holgura hasta el cartel de
  50 m (repetición, dynamics 39:53; M).
- **SC** (race-b §2; A): amarilla → SC a +1,2 s; ~14 coches paran en dos vueltas; doble parada McLaren sin cola
  (HAM ya había salido 10,5 s antes); delta de combustible de +0,5 a +3,6 kg y la IA lo lleva a ~0 en la bandera;
  ERS al 2–6 % en la última vuelta de duelo; «los doblados pueden adelantar» en la V35; verde a los 627 s de juego.
- DRS habilitado en la V2 y 1 vuelta tras el SC (defecto, §1.6).

**Medido.** Duración del pase ~3,5 s de salir de la estela a quedar delante; cambio de carril ~1 ancho en 1–1,5 s;
intervalo VER–HAM 0,0–0,5 s durante 20 vueltas; paradas 1,96 / 2,28 / 2,21 / 2,15 s (juego); pit lane línea a línea
30,9–31,1 s en verde y 34,9 s bajo SC (juego, largo frente a los ~22–24 s reales de pérdida).

**OverCut hoy.**
- `race-sim.json duel.straight`: en recta el atacante gana como mucho un 2 %; `drs.speedGain` 0,03 y `duelBonus` 0,12:
  el pase se decide en la frenada (WP4 de SIM-FISICA parcial). `pass.confirmedAt` existe (`engine/sim/duel.js:59`).
- `duel.js` tiene `pairCooldownSec`, `attemptsPerDefender`, `restLaps` y `switchback` (líneas 66–68, 201–220), pero
  SIM-8 sigue abierto: cuota de pases «invertidos» 0,127 frente a 0,198 de f1db y 150 contactos frente a 89 en 64
  carreras (F1M24-GAMEPLAY §5). Banners de adelantamiento sin pase visible (`_contact_tcam.png`).
- `engine/rules.js:246 drsOpen` con `fromLap`, `restartLaps` y `wetLimit`, sin test de tabla por era ni evento.
- Una parada no planeada sustituye a la planeada si toca en ≤ 10 vueltas (WP11); `energy.js` lleva el delta de
  combustible, pero ningún test comprueba que la IA gaste lo ahorrado ni que no haya cola con el box libre.
- `previewPit` calibrado (Baréin 23,2/23,0, Suzuka 23,3/23,5), pero nada ata la estimación del menú, la radio y el
  estratega al cronómetro.

**Propuesta.**
- **GS-04 / VIEW-09** fase `STRAIGHT_PASS` en `duel.js` dentro de las zonas DRS abiertas (`rules.drsOpen`): `pullOut`
  con `lateral.maxRate` → `alongside` ≥ `duel.straightPass.minAlongsideSec` → `ahead`; el pase se completa en la recta
  si gana `confirmLengths` antes de `completeBeforeBrakeM`; si no, tirada de frenada existente. **La tirada por vuelta
  no cambia** (equivalencia SRS §4.2): solo cambia dónde ocurre el pase. Calibración con OpenF1 `location`/`position`
  2023–2024 (dónde terminan los pases con DRS en Shanghái).
- **GS-05** histéresis `race-sim.json duel.rePass {rePassLaps, rePassPaceSec}`; vigilante de orden en modo test
  (`engine/sim/orderWatch.js*`, como `lateralWatch.js`): el orden solo cambia por duelo, boxes o incidente;
  `crowdFactor` en `incidents.js` y `race-reliability.json` (3 coches en una zona de frenada).
- **GS-08** test de tabla 2011–2025 y eventos `control.drsEnabled/drsDisabled`, con valores verificados en los
  reglamentos deportivos de 2011, 2018 y 2024.
- **GS-09** `race-energy.json tactics {fuelSpendToTarget, ersEndgame}` (el delta se gasta en las últimas N vueltas; ERS
  al máximo en las 2 últimas con duelo); en `pitLane.js`, cola solo con el box ocupado; el estratega valora parar bajo
  SC con `previewPit(..., {sc:true})` y `race-pit.json`.
- **GS-15** `previewPit` y el cronómetro usan la misma definición (línea de entrada → línea de salida); el estratega de
  `race.js`, `PitDialog.js` y la radio leen `previewPit`.

**Qué lo hace pulido.**
1. El pase se monta en tres fases legibles: rebufo de 5–7 s en que el de delante crece, cambio de carril suave en S de
   ~1–1,5 s y ≥ 1,5 s a la par; torre, banner y radio después, nunca antes.
2. Coste del pase: el pasado no repasa en la vuelta siguiente salvo con ventaja real.
3. Contactos raros y explicables (tres en la frenada, no dos limpios a la par).
4. Pequeñas historias de datos: el SC sube el delta de combustible y la IA llega a ~0 en la bandera; el ERS se vacía en
   la última vuelta de duelo; los doblados recuperan la vuelta y van al final del tren.
5. Una sola cifra de pérdida en boxes en todas partes (menú, radio, estratega, cronómetro).

### 2.3 Cámaras de TV y su colocación en Shanghái

**Observado** (cameras §4; A salvo indicación).
- El selector tiene **7 segmentos**: el índice de cámara se lee en cada fotograma. Anillo: TV (realizador) → HELI →
  cabina alta (CP) → trasera (RO) → hombro (HS) → lateral baja (SP) → ojos del piloto (HP). El mapa es una capa aparte
  que conserva el índice.
- **~33 zonas distintas** en Shanghái y **~27 planos por vuelta** a 1x; el relevo cae en la misma fracción de vuelta a
  ±0,003 (±16 m). El relevo lo dispara un punto fijo de la pista, no que el coche salga de cuadro.
- Mediana del plano TV 2,63 s (TS baja/media 2,85; TW alta 2,43; seguimiento lateral 2,47; frontal de recta 5,7; tele
  muy largo en T6 8,7). Con SC o en vuelta de entrada las mismas zonas duran 2–4 veces más (T14 9,8–12,4 s).
- Coche al 10–21 % del ancho con zoom continuo (54:04.9 → 54:07.3); con dos coches juntos, encuadre de los dos.
- Zonas por fracción de vuelta (resumen de cameras §4.1): recta de meta 0,035–0,080 (TW desde la torre y pórtico),
  T1 0,125 (TS exterior), T1–T2 0,147 (TS tele), T3 0,167–0,177 (TS y seguimiento lateral), T4 0,200–0,223 (a través de
  la valla, frontal bajo el puente), T5 0,248 (zoom de acercamiento), T6 0,298 (tele muy largo), T7–T10 0,367–0,510,
  T11–T13 0,528–0,628, **recta trasera 0,667–0,837 con 5 cámaras en cadena**, frenada de T14 0,857, horquilla T14
  0,867/0,893/0,910, T15 0,930, T16 y entrada al pit 0,953, inicio de la recta 0,982.
- **HELI**: plano continuo de 15–49 s, 35–50° hacia abajo, coche al 2–5 % del ancho.

**OverCut hoy.**
- `data/circuits/shanghai-1/camera-zones.json` tiene **18 zonas**, 2–3 tipos por zona y una única recta trasera
  (3.544–4.178 m) partida en dos.
- `_contact_tv_video.png`: planos `highWide` y `corner` muy abiertos, coches al 1–4 % del ancho. En
  `broadcast.json framing`, `highWide` usa minShare 0,06–0,20 y los rigs `corner` quedan a 52–68 m.
- `_contact_heli.png`: `cameras.json follow.heli` a 130 m, 70 m de desplazamiento lateral y FOV 30°: casi cenital,
  coche al ~1 %.
- Etiqueta de nombre en todos los coches a < 260 m (`Race3D.js:752-776`): tapan los coches en los generales
  (`_contact_tv_video.png`, `wet_tv_T14_1.png`), más `BOX x.xs`.

**Propuesta.**
- **VIEW-02** regenerar `shanghai-1/camera-zones.json` con `tools/assets/camera_zones.mjs` hasta ~30 zonas: T1–T3 en 5,
  cadena de 5 en la recta trasera (frontal largo y `lateralTrack`), T14 en frenada/vértice/salida, T6 con el tipo nuevo
  `longLens` en `rigTemplate` (zona de 300–500 m, FOV mínimo 3,5°); `highWide.minShare` 0,10. Posiciones calibradas con
  retransmisiones FOM de China; la densidad del juego es solo referencia.
- **VIEW-12** helicóptero por `elevationDeg` (35–50) y `shareTarget` (0,03–0,05) con altura derivada (60–100 m),
  amortiguación crítica y `lookAhead` por velocidad.
- **VIEW-11** `hud.json tags.policy` (`focus`, `focus+rival`, `all`, `none`; por defecto `focus+rival`), separación de
  solapes en 1D y ocultación con el coche < 2 % del ancho.

**Qué lo hace pulido.**
1. Cortes por posición, no por reloj: el ritmo sale de la geometría; con SC el mismo guion se alarga solo.
2. Variedad en la misma zona: 1–3 cámaras alternativas (alta y abierta, baja con tele, a través de la valla, frontal bajo
   un puente), con primeros términos desenfocados.
3. La lente siempre se mueve: zoom que agranda al coche, paneo con el fondo barrido, relevo antes de que salga de cuadro.
4. El coche ocupa el 10–35 % del ancho; los generales son la excepción, no la regla.
5. Una sola etiqueta legible en TV; las demás sobran.

### 2.4 Cámaras onboard

**Observado** (cameras §3; píxeles V, ángulos I a partir de las cotas del coche de 2024).

| Cámara | Horizonte | FOV horizontal | Rasgo |
|---|---|---|---|
| CP cabina alta | 31–35 % | 80–89° (V 50–58°) | Halo a y≈59 %, ruedas en las esquinas, volante con la marcha legible |
| RO trasera | 37 % | ~58° | Placas del alerón al 43 % del ancho |
| HS hombro | 26 % | ~80° | Casco en el cuarto derecho, volante con velocidad y marcha |
| SP lateral baja | 35 % | ~90° | Solo de paso al ciclar |
| HP ojos | ~50 % | 90–95° | Pilar del halo, volante con velocidad, marcha, 15 LED y 4 cifras de neumático |

- **CP y RO rígidas al chasis** (deriva del coche en cuadro < 0,2 px). El mundo vibra ~0,06° por encima de 3 Hz y rebota
  ~0,25° a 1–2 Hz; alabeo en curva ≤ 2° y cabeceo al frenar < 0,4°. Solo HP tiene cabeza: ~0,15° a ~3 Hz y deriva lenta
  de ~0,5° (A).
- Desenfoque de movimiento fuerte en asfalto, pianos y hierba; halo, chasis y coche de delante nítidos; guiñada de hasta
  ~45°/s en T6 y T14 (25:19; A).
- Transiciones entre onboards: corte seco de un fotograma (A). Vistazo atrás CP → RO de 1,2–1,5 s, 19 veces (A). Al
  cambiar de piloto se conserva el tipo de cámara (17 de 27 cambios de foco caen en el mismo fotograma; A).
- Volante (race-b §5; A): 284 → 296 km/h en 7.ª, cambio a 8.ª a ~298 km/h; 15 LED (5 verdes, 5 rojos, 5 azules); el
  evento de f0 cae a ≤ 0,1 s del cambio visible; razón 0,889 en 7.ª → 8.ª.

**OverCut hoy.**
- `cameras.json onboard[].fovDeg` se pasa a `PerspectiveCamera.fov`, que en three.js es **vertical**
  (`Race3D.js:703`): T-cam 68° (≈100° horizontal a 16:9), halo 85° (≈118°), visor 82°. En `_contact_tcam.png` las
  ruedas ocupan ~40 % del ancho, el horizonte cae al ~45 % y el morro tapa el centro.
- `halo` es 2018+ y no hay cabina alta antes del halo: en 2013 falta la cámara más usada del juego (48 % del tiempo).
- `shakeOffset` (`three/cameras.js:87`) solo desplaza `camera.position.y` (`Race3D.js:711`), un solo perfil para todas
  las onboards (`max 0.012`); la cámara no hereda `pose.pitch` ni `pose.roll`, que ya existen.
- Sin post-proceso: `renderer.render(scene, camera)` directo, sin `EffectComposer`.
- `cameras.json wheelDisplay` solo muestra la marcha (desde 1998, `pending`); `_contact_visor.png` sin LED ni velocidad
  legibles.
- `live-view.json views.cameras.with3D` no se filtra por era (`pending`); `Broadcast.js` usa flechas y texto; no hay
  retrovisor.

**Propuesta.**
- **VIEW-03** campo `hfovDeg` en el esquema, convertido en `onboardFor` con `vfov = 2·atan(tan(h/2)/aspect)`; valores
  iniciales desde fotogramas FOM por era (`pending` con fuente); cámara nueva `cockpitHigh` (1993–2017) con
  `aim.horizonShare` 0,33.
- **VIEW-04** la onboard pasa a ser hija del grupo del coche y hereda `pitch`/`roll` del motor;
  `cameras.json shake {hf:{deg,hz}, bob:{deg,hz}, head:{deg,hz,driftDeg}}` por cámara, con el rebote ligado a la
  rugosidad de la spline y a los pianos (`kerbs.json`); ruido con semilla.
- **VIEW-05** `three/post/*` con `RenderPass`, desenfoque por velocidad con máscara del coche propio (capa 1) y
  `OutputPass`; `view-look.json quality.motionBlur`, apagado en LOD bajo.
- **VIEW-14** anillo filtrado por era desde `cameras.json` y `cycleOrder`, con segmentos; mantener una tecla =
  `tcamRear` y soltar restaura; al cambiar de foco se conserva el tipo.
- **VIEW-15** pantalla del volante como `CanvasTexture` con velocidad, marcha y ERS o KERS según la era (nada antes de
  2009), LED desde `pose.rpm/shiftRpm`; `cameras.json wheelDisplay.byEra`.

**Qué lo hace pulido.**
1. Onboards quietas: la velocidad la venden el desenfoque del entorno y la rotación de la escena, no la vibración.
2. Un solo cuerpo vivo: solo la vista del piloto mueve la cabeza.
3. Horizonte fijo por cámara y un elemento del coche en el tercio inferior que da escala.
4. El volante es un instrumento: velocidad, marcha y LED sincronizados con el sonido.
5. El vistazo atrás es una función de juego (mantener y soltar), no un ciclo de cámaras.

### 2.5 Director (realizador, repeticiones, salida y final)

**Observado.**
- Prioridad (cameras §5; I, M-A): **bandera a cuadros > repetición de incidente o accidente (+ garaje) > bloqueo de
  cámara del usuario > secuencia de boxes > zonas de TV**. Tras cada interrupción se vuelve exactamente a la cámara del
  usuario (40:11, 59:08).
- Repetición de incidente: cortinilla ~1,8 s (1,6–2,07; n = 21) → 1 ángulo alto de 11–14 s → cortinilla → directo; con
  abandono, garaje del equipo (3 planos, ~7 s). Meta: TV 2–3 planos → repetición del cruce (3 planos) → primer plano del
  casco ~6,3 s → enfriamiento en TV. Banner «ver repetición» a +5,7 s del incidente y +10,3 s de la meta.
- Escalada del SC (race-b): amarilla (t0) → 1x en un fotograma y corte a la onboard a +0,3 s → SC a +1,2 s → radio a
  +2 s → banner a +5,7 s. Relanzamiento realizado por el juego: lateral del tren, cartel SC y panel de 200 m.
- Salida (quali §9, race-a §2.1; A): previa saltable de 5–6 tomas de 3–8 s (SC parado, parrilla, piloto, coche con
  mecánicos, muro, reloj), cortinillas de ~2 s; plano bajo lateral con el pórtico en cuadro, bajando en ease-out;
  luces a 1,000 s; apagado **1,93 s** tras la 5.ª (Baréin 1,60 s: aleatorio); el plano se mantiene ~0,9 s; corte a
  frontal bajo y **fundido del HUD de ~0,35 s a +1,0 s**; TW alta desde la torre hasta la frenada de T1 (9,4 s).
- Cuenta atrás de vueltas solo en 15, 10, 3 y última (race-b §1; A). Meta en capas: fila blanca (t), «Terminado»
  (+0,4 s), cuadros por fila, panel plegado, banner del ganador (+10 s).
- Bajada automática a 1x: al terminar la vuelta lanzada de un coche propio en Q (corte a TV +0,4 s) y con un incidente
  grave en carrera; la bajada manual a boxes fue paso a paso (race-b §3.2 corrige la inferencia de Baréin).

**OverCut hoy.**
- `broadcast.json replay.stingSec` 0,8; `live-view.json replay.autoViews ["tv"]`: en vista cámara no hay repetición
  automática, tampoco de la meta ni del choque propio. Sin `scRestart` ni encuadre de tren bajo SC.
- `_contact_start.png` y `start_clean_*.png`: salida desde un plano cenital alto, sin el pórtico en cuadro, con la
  cabecera del sitio visible y **un objeto rojo flotando en el cielo** (artefacto; quizá el SC o una malla del GLB).
  `preRace` existe en `broadcast.json`, pero sus planos `closeUp` y `gridFront` no aparecen en la captura;
  `formation: skip`.
- **HUD que tapa la escena** (`tv_ui_rectaatras.png`, 1280×720): cabecera del sitio (~110 px), stepper del GP, barra de
  reproducción (~150 px) y dos fichas de ~250 px dejan libre < 25 % del lienzo (F1M24 ~70 %).
- La torre no tiene modo sectores; no hay minimapa en 3D, cuenta atrás ni panel de boxes por fases. La carrera empieza
  a ×4 en TV (`live-view.json defaultSpeed.race 4`); el rótulo ×1 ya existe.

**Propuesta.**
- **VIEW-13** `stingSec` 1,6–1,8 (diseño propio con logotipo de OverCut); `broadcast.json directorPriorities`
  (`finish`, `ownIncident`, `userLock`, `pitSeq`, `zones`) con `override` y `restore`; `sequences.scRestart` y
  `framing.train` cuando `sc.phase = TRAIN`.
- **VIEW-10** planos `startLightsLow` (pórtico en cuadro hasta apagado + `holdShotSec`) y `startHigh` hasta T1 en
  `scriptRig`; fundido del HUD por `hud.json start {hudDelaySec, fadeSec}`; arreglar la malla flotante con un test de
  mallas visibles sin padre.
- **VIEW-01** modo directo a pantalla completa que oculta cabecera y stepper; `hud.json layout` con alto máximo por
  bloque en %; fichas plegables a una línea; barra de reproducción de una fila.
- **VIEW-16** `hud.json lapCountdown [15,10,3,"last"]`, modo `sectors` en `components/tower.js`, minimapa SVG con zonas
  DRS solo en 2011+, panel de boxes por `pit.phase` (`components/pitTimer.js`), textos por react-intl.
- **VIEW-17** `live-view.json fastForward {mapAtSpeed: 8, enabled: false}` con restauración de la cámara previa.

**Qué lo hace pulido.**
1. Jerarquía clara de interrupciones y regreso exacto al estado del usuario.
2. Cortinilla constante de ~1,8 s como frontera de contexto; dentro del directo, cortes secos.
3. Repetición = hecho + reacción humana; el banner llega tarde a propósito para que el directo se vea antes.
4. Ritual de salida con tempo fijo y una sola incertidumbre (la espera del apagado); el HUD nunca está con las luces.
5. El HUD cambia de forma con la fase (fichas grandes en el garaje, línea plegada en onboard) y deja ver el 3D.
6. Cuenta atrás escasa (15, 10, 3, última): poca frecuencia, mucho peso.

### 2.6 Sonido del motor

**Observado** (audio §4; A salvo indicación).
- Punto de cambio y razón fijos **por coche** y repetidos en Baréin: McLaren `c` 95,3–96,5 Hz con razón 0,87; Ferrari
  98,5–98,8 y 0,89–0,93; Mercedes 98,2–100,8 y 0,85–0,90.
- Orden 9c dominante en los tres; el segundo cambia por coche (6c McLaren, 4c Ferrari, 2c Mercedes) (B). Sin silbido de
  turbo ni MGU-K separables.
- Forma del cambio McLaren: muesca −2,5 dB ~50 ms, deslizamiento 60–80 ms, rebote +1,5 dB ~60 ms. Reducciones con cuatro
  golpes de gas de +2,5–6,8 % que se acortan hacia el vértice (0,46 / 0,26 / 0,18 s) (B). En 7.ª con LED azules 1,5 s
  sin cambiar: no hay rebote de limitador.
- Mesetas de rpm en curvas de velocidad constante (T8, T13) y solo levantar el pie en T7 (race-a §3; A).
- Limitador del pit: peine de 58,2 Hz, **idéntico a la ida y a la vuelta** (+0,4 %), ralentí −6 dB al pararse, dos
  ráfagas de pistola separadas 1,1 s, suelta del limitador en la línea de salida (audio §4.4).
- Bajo SC el tono se queda congelado ~30 s (±0,1 %) (defecto, audio §4.3).
- Tras la meta, f0 fijo a ~145 Hz y −30 dB ~6 s con la radio por encima.

**Medido en OverCut** (`audio_summary.json`): razón de cambio mediana 0,891 (V8 2013), 43 cambios en 60 s de TV,
`c` mediana 113 Hz, igual para todos los coches; tcam −33,4 dBFS, chase −34,6 dBFS (unos 12 dB por debajo del juego en
relación con su propia escala de sonoridad).

**OverCut hoy.**
- `voicing.byCylinders` (4/6/8/10/12) sin filas por fabricante; `shiftProfiles.seamless` hace −7 dB y 35 ms sin rebote.
- `audio.frame()` no recibe la velocidad (`components/LiveRace.js:704-722`, `components/SessionLive.js:382`): a ×16 las
  marchas cambian 16 veces más rápido (`gearHoldSec` es tiempo de carrera en `engineSynth.js heldGear`).
- `race-powertrain.json shift.underSc` `pending` de 1993 a 2021; el motor no tiene zigzag ni variación de gas bajo SC.
- `data/manager-sounds.json` trae bancos de mods de GTA y de F1 2020 (Codemasters) con `license: null` y
  `riskRipped: true`, con `samples.enabledByDefault` y `mixer.defaults.recorded` a `true`.

**Propuesta.**
- **AUD-C1** `speed` en el frame; `audio.json mixer.views.fastForward {minSpeed, attackMs, holdMs, releaseMs}` (NV,
  p. ej. 4 / 50 / 300 / 800) y `snapshots.fastForward`: por encima del umbral las voces se sustituyen por un `fieldBed`
  L/R decorrelado sin seguimiento de rpm; el bus `ui` no se toca; fundidos asimétricos en `mixer.js blendMix`.
- **AUD-C6** `voicing.byManufacturer[] {from, to, match, overtoneTrim, halfOrderTrim}` sobre el perfil de cilindros,
  de diseño propio o medido en grabaciones CC0/CC BY; motor del pack (f1db `engines`); sin turbo ni MGU-H antes de 2014
  salvo 1977–1988.
- **AUD-C9** `race-sim.json safetyCar.weave {amplitudeM, periodSec}` y variación de gas medidos con OpenF1 `car_data`
  bajo SC (sesiones 9480 y 9655) para 2022–2025, NV antes.
- **AUD-C10** sintetizado por defecto (`recorded: false`) y exclusión de bancos `riskRipped` con `PUBLIC_BUILD=1`.
- **AUD-C12** `transient.rebound {db, ms}` en `seamless` (NV) y LED del volante desde `pose.rpm` con el mismo reloj.

**Qué lo hace pulido.**
1. Determinismo por coche: cada coche cambia en el mismo punto y con la misma razón en todas las vueltas.
2. Microtransitorios en el cambio y golpes de gas en las reducciones; sin ellos suena a salto de muestra.
3. Reglas físicas audibles: mesetas en curvas constantes, última marcha casi plana por la resistencia.
4. Un limitador de tono exactamente constante que se corta en el fotograma de la línea de salida.
5. Nunca un estado largo congelado: siempre varía algo (gas, marcha, posición).

### 2.7 Sonido ambiente del circuito y mezcla

**Observado** (audio §2–3, §6–8; A).
- Mezcla por vista: a bordo −21 dBFS; TV 8 dB por debajo (Baréin de noche 14 dB) con lecho continuo ancho (corr L/R
  0,71, pendiente ≈ −6 dB/oct); mapa 8x −39 dBFS con lecho totalmente difuso (coherencia < 0,3); menús −43 dBFS con
  música. Las cuatro onboards suenan igual (±0,3 dB).
- **A partir de 4x la vista pasa al mapa** en el mismo fotograma; el motor cae −18…−20 dB en 30–60 ms; al volver,
  0,3 s planos y rampa de 0,6–0,9 s. Radio, avisos y clics no cambian. 2x conserva la cámara.
- Corte de cámara a bordo → TV: −25 dB en 60–100 ms y **~0,2 s casi en silencio** antes del plano nuevo.
- Radio: whoosh 0,4 s → motivo de 4 notas 0,4 s → hueco 0,6 s → estática de 2–8 kHz 0,3–0,9 s → voz de 100 Hz a 6 kHz
  (no banda telefónica, corrige Baréin); todo el paquete **±5–7 dB hacia el lado del panel del piloto**; nivel igual en
  cualquier vista y velocidad; un mensaje cada 20–40 s, también en clasificación.
- Pianos: dos ráfagas de 0,12 s con peine de 108–118 Hz a velocidad alta. Doppler en pasadas de TV (razón ~0,71–0,78);
  paneo −6…−8 dB a un lado y vuelta en 1–2 s.
- Pausa al abrir un menú en carrera: golpe grave de 0,25 s y lecho de −45 dBFS. Luces de salida: golpe grave + tono por
  luz cada 1,00 s; el apagado no suena; subida de vueltas desde la luz 3.

**Medido en OverCut** (`audio_summary.json`, `gap-audio` §1):

| Magnitud | F1M24 | OverCut | Lectura |
|---|---|---|---|
| A bordo − TV | 8 dB | 14,8 dB (TV −48,3 dBFS) | TV demasiado lejana o vacía |
| TV por debajo de −60 dBFS | ~0 % | 3,4 % (p10 −52,5) | Huecos sin lecho |
| Corr L/R de la TV | 0,71 | 0,88 | Lecho y público casi mono |
| Corr L/R a bordo | 0,98 | 1,00 | Bien |

**OverCut hoy.**
- Oyente de TV 160 m por delante (`mixer.cameras.mix.tv.ahead`); público = paso banda mono de 900 Hz
  (`three/audio/ambience.js:163`).
- `views.crossfadeMs 250` simétrico entre cámaras (`index.js:295`): suena a fundido encadenado.
- `uiSounds.js:60-73`: tono de 1.320 Hz, estática en `band {300,3000}` (`itutBand`) y tono de cierre, centrado.
  `SessionLive` pasa `events: []` y ningún `radio`: las sesiones no tienen radio ni avisos.
- `ambience.pit.stages ["wheels"]`: traqueteo modulado a 22 Hz toda la etapa (`index.js:413`), aunque `pitStop.js` ya
  tiene etapas.
- `kerb.stripeM 1,4` (`stripeStatus: pending`, ~40 Hz a 200 km/h), `maxHz 90`; `onKerb` exige `pose.lateral` a < 1,5 m
  del borde y, con CAM-3, el coche enfocado casi nunca pisa el piano.
- El impacto y el chirrido salen del registro de incidentes y suenan en contactos falsos de SIM-8.
- `paused`/`menu` llevan el motor a −60 dB sin cue; sin bus de música; el whoosh solo suena con la repetición.

**Propuesta.**
- **AUD-C2** `mixer.views.cut {outMs, gapMs, inMs, gapDb}` (NV, p. ej. 70/150/300/−24) en los buses de motor y
  ambiente, también al cambiar de coche en la misma cámara.
- **AUD-C3** `ui.radio.sequence` con fases `whoosh/motif/gap/static/tail` y motivo propio (no el del juego); banda ancha
  propia (p. ej. 150–5.500 Hz); `pan {byPanelSide, db: 6}` con `StereoPannerNode` por `carId`; radio y eventos en
  sesiones desde `engine/sessionSim`.
- **AUD-C4** `mixer.loudness {onboardTargetDbfs: -20, tolerance: 3}` con makeup antes del limitador;
  `ambience.trackBed` estéreo decorrelado siempre presente en TV, heli y chase (`cameras.mix.*.bed`); público L/R
  decorrelado.
- **AUD-C7** `ambience.pit.events {gunOff, gunOn, jackDown, release}` como one-shots sobre las etapas de `pitStop.js`,
  `idleDb` en la parada y corte del limitador en el evento `pitExitLine` de `pitLane.js`; tiempos de `race-pit.json`.
- **AUD-C8** paso de resaltes medido en la malla (`tools/assets/blender/extract_kerbs.py` → `kerbs.json stripeM` con
  `status: measured`), lateral de la trazada (§1.5), `maxHz` 160.
- **AUD-C11** impacto solo con `contact {confirmed: true}` de `incidents.js` y solape lateral < `clearanceMetres`.
- **AUD-C12** `ui.pause` sintetizado, bus `music` solo en menús (generativa propia, volumen en `SoundControl`),
  `ui.sting` en tres capas con la duración de `broadcast.json replay.stingSec`.

**Qué lo hace pulido.**
1. Jerarquía fija de buses: radio y avisos por encima de todo y ajenos a la cámara y a la velocidad.
2. Silencio rápido, presencia lenta (< 60 ms para quitar, 0,6–1 s para devolver); huecos de ~0,2 s en los cortes.
3. Espacialización con significado: radio al lado de su piloto, motor a bordo mono, TV ancha, avance rápido difuso.
4. Avisos por capas con tiempos fijos y siempre el mismo motivo propio: el oído aprende «llega un mensaje».
5. Lecho de pista continuo: la TV nunca está en silencio entre pasadas.

### 2.8 Luz de día

**Observado** (weather §4, cameras §3; `look.csv`, n = 736).
- Negros levantados (p2 0,07–0,11), luminancia media 0,46–0,52, saturación media 0,18–0,20 (podio 0,32), cielo blanco
  azulado lechoso (RGB ≈ 0,66/0,69/0,68) quemado a propósito (6–12 % del cuadro > 0,97). Perspectiva aérea fuerte
  (calima real de Shanghái).
- Autoexposición en un corte a contraluz (56:57–57:03, 10 fps): recorte de 0,1 % a 40,9 %, luminancia 0,42 → 0,72 →
  0,61 (+0,3 s) → 0,57 (+1,8 s); adaptación rápida τ ≈ 0,2–0,3 s con cola lenta ~1,5 s y nunca completa (A).
- Sombras blandas con cielo cubierto y duras y alargadas a contraluz al final (16:28–16:34 de juego); sombras de las
  cubiertas de grada dan saltos de 30–50 niveles en 0,3 s con bloom; el color del halo cambia con el ángulo del sol.
- **El render no cambia con el estado del cielo** (sol frente a nublado: L 0,489/0,480/0,473; M): fallo del juego.
- Sol real en Shanghái el 21/04 (NOAA, 31,34 N 121,22 E): 43° a las 15:00 y 23° a las 16:35.
- Chispas del suelo de día al frenar al final de las rectas y en baches, destellos de 1–3 fotogramas; nunca humo de
  bloqueo (race-a 14:31, dynamics 39:51).

**OverCut hoy.**
- Fondo de color plano `#8fb6dc`, `THREE.Fog` lineal, sol fijo en `focus + (60,120,40)` (`Race3D.js:158-168, 734`):
  misma dirección para cualquier circuito, hora y cámara.
- `applyWeather` binario seco/mojado (`trackScene.js:450`); ACES con exposición fija 1,05 (`three/studio.js`); sin lift
  de negros, sin autoexposición, sin bloom; cielo sin nubes (`_contact_tv_video.png`).
- Sin chispas ni humo.

**Propuesta.**
- **VIEW-06** `three/sky.js*` con `Sky` de three/examples y posición solar NOAA desde `lat/lon` del pack y la hora de la
  sesión; nubosidad del motor (7 estados, RF-SIM-11) → dureza y opacidad de sombra = 1 − nubes y más luz hemisférica;
  `FogExp2` por humedad (OpenF1 `humidity`); grading (lift, saturación) y exposición adaptativa asimétrica en
  `view-look.json`; cada corte empieza con la exposición del plano anterior. Es una mejora sobre el juego, no una copia.
- **VIEW-18** `three/fx/sparks.js*` por frenada fuerte o bache, solo en eras con patines de titanio (2015+, por
  verificar con el reglamento técnico; **nunca en 2013**), y humo con el evento `lockup`; `view-look.json fx.sparks.eras`.

**Qué lo hace pulido.**
1. Negros levantados, neblina y saturación ~0,8×: los coches y la cartelería destacan sobre un mundo gris.
2. Sol de verdad, que baja por la tarde y entra de cara al final; contraluz quemado con velo y bloom.
3. Autoexposición asimétrica que se nota en los cortes.
4. Las nubes se ven en el render con la misma rampa que mueve las cifras del widget.
5. Detalles de un fotograma (chispas) coherentes con la era.

### 2.9 Lluvia

**Observado.** No llovió en el vídeo (0,00 mm, 5 % de probabilidad en tramos nublados). Referencia real (weather §5):
- **SQ de China 2024** (OpenF1 9668): lluvia desde las 15:52; a las 16:01 «WET TRACK», «CHANGE IN CLIMATIC CONDITIONS»,
  «TRACK SURFACE SLIPPERY» en los sectores 5/6/17/19 y «LOW GRIP CONDITIONS»; «DRS DISABLED» a las 16:09; SQ3 con
  intermedios; pista 28,9 → 22,2 °C y humedad 32 → 64 %.
- **Clasificación de China 2014**: «muy mojada, visibilidad mínima por el spray» (Pirelli).
- **GP de China 2009**: salida detrás del SC con extremos (memoria, M; verificar en f1db).
- Reglas FIA (Reglamento Deportivo 2024, arts. 49 y 51, M): salida detrás del SC con neumáticos de lluvia obligatorios
  hasta que entra el SC (desde 2023 el director puede autorizar intermedios); quien entra a boxes sale del pit lane;
  desde 2017, salida parada tras el SC cuando la pista está para correr.

**OverCut hoy.**
- El motor calcula agua en mm por sector, en la trazada y fuera de ella (`engine/weather/index.js:131-136`), con secado
  calibrado con OpenF1 y bloques `spray` y `offLine` en `race-weather.json` (NV). `spray {windowSec 1,5, lossSec 0,6,
  incident 1}` entra en el tiempo de vuelta y el riesgo, pero no en la instantánea, la radio ni la orden de aire limpio.
- La vista es binaria: `Race3D.js:574-579 setWet(bool)` y `rain.visible`; 2.600 rayas `LineSegments` sembradas con
  `Math.random` y caída fija de 28 m/s (`Race3D.js:170-178, 737-748`); `setWet` cambia todo el asfalto de golpe
  (`trackScene.js:482`). En `wet_chase_T14_1.png`, `wet_tv_recta_1.png` y `wet_tv_T14_1.png`: gotas, pero asfalto seco,
  sin reflejos, sin trazada seca, sin spray y con los coches en el centro de la pista.
- `race.js:735-766` solo elige el compuesto de salida (`tyreForWetness`); no hay salida tras el SC ni secuencia de
  mensajes de mojado.
- Sonido (`_wet_audio_tv`): `rainOf(wetness)` alimenta un `highpass` de 4.500 Hz con gain 0,32 igual en todas las
  cámaras (`ambience.js:52,172,321`); centroide de 9,5 kHz y banda de 10–20 kHz a −6 dB (seco −24): la lluvia tapa los
  motores.

**Propuesta.**
- **GS-10 / VIEW-07** (vista): la instantánea lleva `weather.waterMm`, `rainRate` y `spray[i]` (§1.5); `trackScene.js`
  con asfalto de `wetness` continuo (rugosidad y oscurecimiento por mm) y máscara de trazada que seca antes la línea;
  `three/rain/*` con spray instanciado (velocidad × agua, estela de 50–150 m, límite por LOD), gotas en la lente solo en
  onboards, niebla por tasa de lluvia y charcos en zonas bajas de la spline; parámetros en `view-look.json wet/rain`;
  semillas con `seedOf`. Guardabarros anti-spray: solo prueba FIA 2023–24, nunca en carrera.
- **GS-11** (motor): `lossSec` calibrado con OpenF1 2023–2025 en mojado (ritmo a < 1,5 s frente a > 3 s del de delante
  con el mismo compuesto) y pasado a `status: "M"`; la orden de aire limpio gana peso con el spray; radio por umbral
  (`race-sim.json radio`).
- **GS-12** (reglas): `era-defaults.json wetStart {behindSc, standingAfter, wetTyresMandatory, intersAllowed}` por años
  con fuente FIA (`pending` hasta leer el PDF); fase `START_BEHIND_SC` en `safetyCar.js` reutilizando `PICKUP/TRAIN`;
  `race-sim.json raceControl.wet` con umbrales de agua por mensaje; DRS cerrado con WET TRACK.
- **AUD-C5** `ambience.rain` separado en `drops` (intensidad del estado del clima, rosa 1–8 kHz con gránulos con semilla;
  a bordo con paso bajo sobre el halo) y `spray` (mm × velocidad, en la voz de cada coche con panner y Doppler, sigue
  mientras la pista se seca); cuotas por cámara `cameras.mix.*.rain`; siseo por compuesto.

**Qué lo hace pulido.**
1. Capas que se activan con el mismo dato del motor: primero se oscurece fuera de la trazada, al final la línea; la
   trazada seca es una franja más clara de ~2 m que se ensancha con las vueltas.
2. Spray que tapa al de detrás y se ve, se oye y cuesta tiempo con la misma cifra.
3. La cadena de Dirección de Carrera como guion: cambio de condiciones → pista mojada (~9 min tras la primera gota en
   la SQ de 2024) → resbaladiza por sector → DRS desactivado → salida tras el SC si toca.
4. Los motores siguen por encima de la lluvia en la mezcla.

### 2.10 Condiciones intermedias (cruce de neumáticos, secado, goma y temperatura)

**Observado** (weather §1–3; A salvo indicación).
- Widget con hora, aire (rojo entre 25,2 y 29,2 °C), previsión «N min» con % de lluvia, pista (rojo entre 39 y 44 °C),
  agua en mm con dos decimales también en seco, goma en **5 bandas** (Muy baja → Muy alta; rojo con rombo las bajas,
  verde las altas) y agarre en 3 bandas en seco, un nivel por delante de la goma.
- Previsión como cola de tramos de 4,0 min de juego en carrera (24 tramos en el editor); coincidió 21 de 21.
- Aire en rampa hacia el equilibrio del tramo siguiente, empezando 45–60 s antes (τ ≈ 1,2–1,5 min).
- Goma: Muy baja V1 → Baja V4 → Normal V12 → Alta V22 → Muy alta V27; **reiniciada el domingo** tras una Q que acabó en
  Alta. En Q, las nubes enfrían la pista ~0,5 °C/min y el sol la recalienta (+3 °C en 5 min) (quali §6).
- Pista = aire + 13,1 ± 0,3 °C en carrera (defecto). Real (OpenF1 9673): aire 18,0–19,1 °C, pista 32,2 → 27,1 °C,
  exceso 13,1 → 9,0 °C.
- Cruce real (Pirelli): intermedios al 110–112 % del seco; intermedios con pista para slicks cuestan 5–6 s/vuelta. SQ
  2024: inter/seco = 1,234 (1,26 frente a la pole del sábado). Evacuación a 300 km/h por neumático: 2014 inter 25 L/s y
  lluvia 65; generación actual 35–40 y 85. Enfriamiento con lluvia: −6,7 °C en 33 min; pista − aire hacia ~5 °C.

**OverCut hoy.**
- `race-weather.json grip.evacuationLitresPerSec {inter 25, wet 65}` para todos los años; `INTER_CAPACITY_MM` fijo
  (`engine/weather/index.js:39-42`); cruces 1,11/1,27 medidos con OpenF1 (encajan con Pirelli).
- `race-weather.json display.rubberBands` con 4 bandas; `rubber` NV; temperatura de pista desde ERA5 sin altura del sol;
  `temperature.trackOverAirDry 11,2` medio y `trackOverAirRain 4,9` (coherente con la SQ de 2024).

**Propuesta.**
- **GS-13** evacuación por era `[{from, to, inter, wet, source, status}]` (2011–2016 25/65, 2017+ 37/85, antes NV) y
  capacidad del intermedio calculada por año; fixture OpenF1 9668.
- **GS-14** banda `veryHigh`; exceso pista − aire = f(altura del sol NOAA, nubosidad) con τ de 1,2–1,5 min; goma heredada
  dentro del mismo día y reiniciada entre días (`sessions.json evolution`), sin llegar a cero (las carreras de soporte la
  reponen).

**Qué lo hace pulido.**
1. Las cifras se mueven en rampas que anticipan el cambio de icono; nunca saltos de más de 0,5 °C por lectura.
2. La pista baja por la tarde y con nubes, y sube con sol: la pista parece viva aunque no llueva.
3. Bandas con color y texto (RNF-09), cinco niveles de goma, agua siempre en mm.
4. La precisión de la previsión viene del centro meteorológico, nunca de un ruido que cambie al refrescar.

### 2.11 Candidatos de clasificación fuera del backlog

El informe `quali` aporta reglas que no entraron en el backlog priorizado por falta de captura propia de sesiones. Se
dejan anotadas para un plan posterior (carril SES/HUD): tiempo de configurar en el garaje = **máximo** de las tareas,
no la suma (`sessions.json garage.combine: "max"`); bajada a 1x al terminar la lanzada de un coche propio con corte de
cámara a ese coche; gráfica de planificación del segmento (agarre, tráfico previsto, tandas, cursor de hora, margen
sobre el corte); cinemática de garaje solo en la primera salida de la Q; reloj rojo por debajo de 3:00; plan de tandas
agotado con «sacar el coche» desactivado; tiempo de «saliendo» según la longitud del pit lane (20–26 s en Shanghái
frente a 26–30 en Baréin, juego).

---

## 3. Backlog priorizado y paquetes de trabajo

Prioridad: P1 = se ve o se oye en todas las carreras en vivo; P2 = frecuente o realismo importante; P3 = pulido.
Esfuerzo S/M/L como en F1M24-GAMEPLAY.

### 3.1 Backlog

| Id | P | E | Requisitos | Ficheros principales | Fuente de calibración | Prueba de aceptación |
|---|---|---|---|---|---|---|
| GS-01 Continuidad | P1 | S | RF-SIM-01, RF-3D-03, RNF-02, RNF-05 | components/raceClock.js, raceClock.test.js, data/balance/live-view.json | Captura propia (`telemetry.csv`) | 45 min a 60 Hz en `live`: |Δs| ≤ v·Δt·1,2 + 2 m y τ monótono; Playwright 5 min de TV y persecución con 0 violaciones fuera de `seek` |
| GS-02 Curvas | P2 | M | RF-SIM-01, RF-SIM-02, RNF-07 | engine/sim/physics.js, race-physics.json, speeds.test.js, __fixtures__/openf1-powertrain.json | OpenF1 car_data 9664/9673; refLaps de f1db | Mínima por curva ±10 % de OpenF1, marcha ±1, T14 ≥ 65 km/h, pole ±1,5 % |
| GS-03 Seguimiento | P1 | S | RF-SIM-06, RF-SIM-01, SRS 4.2, RNF-07 | engine/sim/stepRace.js, race-sim.json | OpenF1 intervals 2023–2025 | 20 semillas: p5 del hueco con v > 250 km/h ≥ `minFollowSec`; pases ±10 % frente al modo rápido |
| GS-04 Pase con DRS | P1 | M | RF-SIM-07, RF-SIM-08, SRS 4.2, RNF-07 | engine/sim/duel.js, lateral.js, race-sim.json, duelGeometry.test.js | OpenF1 location/position 2023–2024 | ≥ 50 % de pases con DRS antes del cartel de 100 m de T14; ≥ 80 % con ≥ 1,5 s a la par; carril en 0,8–1,8 s; pases ±10 % |
| GS-05 Histéresis y contactos | P1 | L | RF-SIM-07, RF-SIM-09, RF-SIM-15, criterio 7.2 | duel.js, stepRace.js, incidents.js, race-sim.json, race-reliability.json | f1db, OpenF1 position | 32 semillas: 0 cambios sin causa; ≤ 3 cambios por pareja en 10 vueltas (p95); toques ±25 % de f1db; 7.2 ≥ 35/38 y Spearman ≥ 0,92 |
| GS-06 Lado a lado | P2 | M | RF-SIM-07, RF-3D-03, RNF-07 | lateral.js, race-physics.json, lateral.test.js | OpenF1 location 2023–2024 | A la par en curva rápida sigue a la par con ≥ 0,3 m; en lenta sale en fila; Playwright ≥ 1 secuencia a la par de ≥ 2 s en 10 min |
| GS-07 Trazada única | P1 | M | RF-3D-03, RF-3D-04, criterio 7.2 | engine/trackData.js, three/cameraZones.js, three/racingLine.js | splines.json y solver propio | Lateral medio en el vértice sin duelo a ≤ 1,5 m del solver; Playwright coche dentro de la caja en ≥ 98 % de fotogramas en 2 vueltas |
| GS-08 DRS por tabla | P2 | S | RF-SIM-08, RF-SIM-10, SRS §6 | engine/rules.js, rules.test.js, era-defaults.json | Reglamento deportivo FIA 2011, 2018, 2024 | 2011–2025 falso en V1–2 y verdadero en V3 con < 1 s; falso 2 vueltas tras SC; falso con agua, en 2008 y en 2026 |
| GS-09 Estrategia SC, combustible, ERS | P2 | M | RF-SIM-13, RF-SIM-04, RF-SIM-05, RF-SIM-12 | engine/race.js, energy.js, pitLane.js, race-energy.json, race-pit.json | f1db pit_stops; FIA; OpenF1 stints | 32 semillas con SC forzado: ≥ 60 % de coches con ventana a ≤ 15 vueltas paran; |Δcomb| ≤ 0,5 kg en la bandera; cola 0 con el compañero fuera |
| GS-10 Mojado en la vista | P1 | L | RF-SIM-11, RF-3D-04, RNF-02, RNF-09 | three/Race3D.js, trackScene.js, three/rain/*, view-look.json* | Salida del motor (agua por sector) | Unit de correspondencia; Playwright con `save-china-wet.json`: contraste ≥ 8 % trazada/fuera con Δh ≥ 0,2 mm, ≥ 3 % de píxeles de spray a < 1 s con h ≥ 0,5 mm, ≥ 50 fps |
| GS-11 Spray del motor | P2 | M | RF-SIM-11, RF-SIM-06, RF-CMD-01, RF-CMD-03, RNF-05 | engine/weather/index.js, stepRace.js, race-weather.json | OpenF1 laps/intervals mojados 2023–2025 | Pérdida ±30 % de lo medido y 0 en seco; `snapshot.spray` determinista |
| GS-12 Salida en mojado y DC | P2 | L | RF-SIM-10, RF-SIM-08, SRS §6.2, criterio 7.2 | engine/sim/safetyCar.js, race.js, era-defaults.json, race-sim.json | Reglamento deportivo FIA por año; OpenF1 race_control 9668 | Con h ≥ capacidad del intermedio: SC en la V1, todos con lluvia, salida parada en ≥ 2017; mensajes en orden; DRS cerrado con WET TRACK; ninguna regla fuera de era |
| GS-13 Evacuación por era | P2 | S | RF-SIM-03, RF-SIM-11, RNF-07, SRS §6 | engine/weather/index.js, race-weather.json, weather.test.js | Pirelli; OpenF1 9668 | Inter/seco 1,23–1,27; cruce 1,10–1,12; −6–7 °C en 30 min; capacidad 2024 > 2014 |
| GS-14 Goma y temperatura | P3 | M | RF-SIM-11, RF-WKD-03, RNF-07 | engine/weather/index.js, race-weather.json, sessions.json | OpenF1 weather 9664/9673; ERA5 | Pista ±2 °C de OpenF1 y exceso que baja ≥ 2 °C en la carrera |
| GS-15 Estimación = cronómetro | P2 | S | RF-SIM-12, RF-CMD-02, RF-SIM-13 | engine/sim/pitLane.js, pitLane.test.js | f1db pit_stops, OpenF1 pit | |previewPit − medido| ≤ 0,5 s en verde y ≤ 1,5 s bajo SC en 8 circuitos |
| VIEW-01 HUD por zonas | P1 | M | RF-3D-04, RNF-09, RNF-07, RF-WKD-07 | components/LiveRace.js, Broadcast.js, hud.json, hud.schema.json | Diseño propio | `elementsFromPoint` en rejilla 32×18: libre ≥ 65 % plegado y ≥ 50 % con una ficha, a 1280×720 y 1920×1080 |
| VIEW-02 Zonas de Shanghái | P1 | M | RF-3D-04, RNF-07, RNF-05 | shanghai-1/camera-zones.json, tools/assets/camera_zones.mjs, broadcast.json, three/cameras.js | Retransmisiones FOM de China | 22–32 cortes por vuelta y mediana 2–4 s; Playwright caja del coche ≥ 10 % del ancho (mediana) |
| VIEW-03 FOV onboard | P1 | S | RF-3D-04, RF-3D-05, RNF-07, SRS §6 | cameras.json, cameras.schema.json, three/cameras.js, Race3D.js | Fotogramas FOM por era | Horizonte 0,30–0,40 y ruedas ≤ 30 % en T-cam; mismo vfov a 16:9 y 21:9 con el mismo hfov; Playwright horizonte ±5 % |
| VIEW-04 Vibración y pose | P2 | M | RF-3D-04, RNF-05, RNF-07 | three/cameras.js, Race3D.js, cameras.json | Vídeo onboard FOM | CP 0,03–0,08° rms > 3 Hz; HP con pico en 2,5–3,5 Hz; determinista |
| VIEW-05 Desenfoque | P2 | M | RF-3D-04, RNF-02, RNF-07 | three/post/*, Race3D.js, view-look.json* | Diseño propio | Laplaciano lateral −30 % y centro < 10 %; ≥ 50 fps a 1080p |
| VIEW-06 Luz de día | P1 | L | RF-3D-04, RF-SIM-11, RNF-07, RNF-02 | three/sky.js*, Race3D.js, trackScene.js, studio.js, view-look.json* | NOAA, ERA5/OpenF1, fotogramas FOM | Sol ±2° del NOAA; nublado frente a soleado con desviación de luminancia ≥ 15 % y p2 0,05–0,12 |
| VIEW-07 Lluvia visible | P2 | L | RF-SIM-11, RF-3D-04, RNF-05, RNF-07, SRS §6 | three/rain/*, Race3D.js, trackScene.js, view-look.json* | OpenF1 9668, Pirelli, vídeo FOM | Spray 0 con 0 mm y monótono; contraste a 200 m −25 %; especular +10 % |
| VIEW-08 Trazada en la vista | P1 | M | RF-3D-03, RF-SIM-01, criterio 7.2 | three/racingLine.js, cameraZones.js, lateral.js, Race3D.js | OpenF1 location; spline | 50 m antes de T14 ≥ 3 m hacia fuera; vértice ≤ 1,5 m del piano; Playwright dispersión lateral del top 10 > 1 ancho |
| VIEW-09 Pase legible | P1 | L | RF-SIM-07, RF-SIM-15, RNF-05, RNF-07 | duel.js, lateral.js, duelGeometry.test.js, Race3D.js | OpenF1 position/intervals/location | 32 semillas: 0 pases invertidos tras `confirmedAt`; a la par ≥ 1,5 s; ≤ 1 repase en 2 vueltas; banner con el atacante delante en pose |
| VIEW-10 Salida | P1 | M | RF-3D-04, RF-WKD-02, RNF-05, RNF-07, SRS §6 | broadcast.json, three/cameras.js, director/raceScripts.js, hud.json, trackScene.js | Procedimiento de salida FIA | ≥ 4 de 5 luces en el lienzo; HUD con opacidad < 0,1 hasta +0,9 s; sin malla flotante |
| VIEW-11 Etiquetas | P1 | S | RF-3D-04, RNF-09, RNF-07 | Race3D.js, hud.json | Diseño propio | IoU = 0 entre etiquetas y ≤ 2 visibles en `focus+rival` |
| VIEW-12 Helicóptero | P2 | S | RF-3D-04, RNF-07 | cameras.json, three/cameras.js, cameras.test.js | Planos reales de helicóptero | A 300 km/h, elevación 35–50° y caja 2–5 % durante 20 s sin cortes |
| VIEW-13 Cortinillas y prioridades | P2 | M | RF-3D-04, RF-SIM-10, RNF-07 | broadcast.json, live-view.json, director/directorState.js, replay/ReplayOverlay.js | Diseño propio | Override y restore en `directorState.test`; Playwright cortinilla 1,5–2,1 s |
| VIEW-14 Selector y retrovisor | P2 | S | RF-3D-04, RF-CMD-04, SRS §6 | components/Broadcast.js, playback.js, live-view.json | Diseño propio | Halo ausente en 2013; ciclo cerrado; retrovisor vuelve en ≤ 1 fotograma |
| VIEW-15 Volante | P2 | M | RF-3D-04, RF-SIM-05, SRS §6, RNF-07 | cameras.json, three/carBody.js, Race3D.js | OpenF1 car_data (rpm, marcha) | LED completos con `shiftRpm`, ≤ 60 % a 0,85·`shiftRpm`; ≤ 100 ms frente al cambio |
| VIEW-16 HUD de carrera | P2 | M | RF-WKD-07, RF-SIM-08, RNF-08, RNF-09 | hud.json, LiveRace.js, components/tower.js, pitTimer.js | Pack (zonas DRS), pitLane.js | Cuenta atrás en N-15, N-10, N-3 y N; sin DRS en 2010; minimapa ≤ 6 % del lienzo |
| VIEW-17 Avance rápido | P3 | S | RF-CMD-04, RNF-07 | live-view.json, playback.js, useAutoSpeed.js | Diseño propio | Con la opción y ×8, mapa; al volver a ×1, cámara previa |
| VIEW-18 Chispas por era | P3 | S | RF-3D-04, SRS §6, RNF-07 | three/fx/sparks.js*, Race3D.js, view-look.json* | Reglamento técnico FIA (patines) | `sparksEnabled(2013) = false`, `(2016) = true` |
| AUD-C1 Avance rápido | P1 | M | RF-3D-04, RF-CMD-04, RNF-07, RNF-02, RF-WKD-02 | three/audio/index.js, mixer.js, levels.js, LiveRace.js, SessionLive.js, audio.json | Diseño propio (NV) | `resolveView({speed:8})='fastForward'`; a bordo − fastForward ≥ 15 dB; −18 dB en ≤ 60 ms y ≥ 600 ms al salir; Playwright 10 s a 8x con coherencia < 0,35 y radio ±1 dB |
| AUD-C2 Corte de cámara | P1 | S | RF-3D-04, RNF-07 | mixer.js, index.js, audio.json | Diseño propio (NV) | `cutEnvelope` con mínimo ≤ gapDb; Playwright tcam→tv con RMS mínimo ≥ 18 dB bajo los 500 ms previos |
| AUD-C3 Radio | P1 | M | RF-CMD-03, RNF-07, RNF-08, RF-WKD-02 | uiSounds.js, uiSounds.test.js, SessionLive.js, audio.json | Diseño propio (NV) | pan ≥ +0,5 coche 2 y ≤ −0,5 coche 1; secuencia ±5 ms; banda ≥ 4 kHz; Playwright R−L ≥ 4 dB y 1x/8x ≤ 1 dB |
| AUD-C4 Sonoridad y lecho | P1 | M | RF-3D-04, RNF-07, RNF-09 | ambience.js, mixer.js, levels.js, audio.json | Diseño propio (NV) | a bordo − TV 8–12 dB; Playwright 60 s: a bordo −23…−17 dBFS, TV < 0,5 % bajo −60 dBFS, corr ≤ 0,8 |
| AUD-C5 Lluvia | P2 | M | RF-SIM-11, RF-3D-04, RNF-07, RNF-05 | ambience.js, index.js, audio.json | Fixture OpenF1 9668; espectro propio o CC0 | Motor 150–1.500 Hz ≥ 6 dB sobre la lluvia; sin lluvia y 1 mm: drops 0, spray > 0; Playwright centroide TV ≤ 5 kHz |
| AUD-C6 Timbre por fabricante | P2 | M | RF-3D-04, RNF-07, SRS §6.2 | engineSynth.js, audio.json | Pack (f1db engines), diseño propio o CC0/CC BY | 2013: Renault/Ferrari/Mercedes ≥ 3 dB en algún orden 1–12; sin turbo en 2013; turbo en 1986 |
| AUD-C7 Pit lane | P2 | S | RF-SIM-12, RF-3D-04, RNF-07 | ambience.js, index.js, pitStop.js, pitLane.js, audio.json | race-pit.json; FIA pitLaneSpeed | Dos golpes por rueda ±10 ms; limitador ida/vuelta ≤ 0,5 %; suelta en `pitExitLine` ±1 fotograma |
| AUD-C8 Pianos | P2 | M | RF-3D-03, RF-3D-04, RNF-07 | kerbs.js, ambience.js, extract_kerbs.py, shanghai-1/kerbs.json | Malla GLB | `kerbRumble(250,true).hz` = v/`stripeM`; Playwright ≥ 4 activaciones por vuelta |
| AUD-C9 SC sin bucle | P2 | S | RF-SIM-10, RF-3D-04, RNF-07 | stepRace.js, race-sim.json, race-powertrain.json, audio.test.js | OpenF1 car_data bajo SC | 30 s detrás del SC: desviación de f0 ≥ 2 % y ≥ 1 cambio o golpe de gas |
| AUD-C10 Licencias | P2 | S | SRS §3.3, §7.3, RF-3D-04 | engineSamples.js, manager-sounds.json, audio.json | Manifiesto de sonidos | Con `PUBLIC_BUILD=1`, `bankFor()` null para `riskRipped`; `defaults.recorded === false` |
| AUD-C11 Impactos | P3 | S | RF-SIM-07, RF-SIM-09, RF-3D-04 | three/audio/index.js, incidents.js | Eventos del motor | Pase sin solape sin impacto; contacto confirmado con impacto |
| AUD-C12 Pulido | P3 | M | RF-3D-04, RNF-07, RNF-08 | uiSounds.js, mixer.js, SoundControl.js, audio.json | Diseño propio (NV) | Shots de la pausa; music = 0 en directo; Playwright cambio del volante y del audio ≤ 0,1 s |

### 3.2 Carriles (propiedad de ficheros)

Mismos carriles que F1M24-GAMEPLAY §3.2, más **WX** (clima) y **LOOK** (luz, lluvia y efectos). Cada fichero tiene un
solo carril con permiso de escritura en cada ola; los traspasos se indican en la ola.

| Carril | Escribe |
|---|---|
| **SIM** | engine/trackData.js, engine/sim/stepRace.js, duel.js, lateral.js, safetyCar.js, lateralWatch.js, orderWatch.js*, engine/race.js, engine/rules.js, engine/incidents.js, engine/energy.js, data/balance/race-sim.json, race-physics.json, race-reliability.json, race-energy.json, data/seasons/curated/era-defaults.json, sus esquemas, stepRace.test.js, lateral.test.js, duelGeometry.test.js, safetyCar.test.js, rules.test.js |
| **PIT** | engine/sim/pitLane.js, pitStop.js, pitLane.test.js, pitStop.test.js, data/balance/race-pit.json (+ esquema) |
| **PT** | engine/sim/physics.js, powertrain.js, speeds.test.js, physics.test.js, __fixtures__/openf1-powertrain.json, data/balance/race-powertrain.json, overcut/src/main/resources/scripts/powertrain_from_openf1.py |
| **WX** | engine/weather/index.js, weather.test.js, engine/weather/__fixtures__/*, data/balance/race-weather.json (+ esquema) |
| **SES** | engine/sessionSim/*, data/balance/sessions.json (+ esquema) |
| **AUD** | three/audio/*, data/balance/audio.json, audio.schema.json, data/manager-sounds.json, data/circuits/shanghai-1/kerbs.json, tools/assets/blender/extract_kerbs.py |
| **CAM** | three/cameras.js, cameras.test.js, three/Race3D.js, three/cameraZones.js, three/racingLine.js, three/carBody.js, components/director/*, components/replay/*, data/balance/broadcast.json, cameras.json, data/circuits/shanghai-1/camera-zones.json, sus esquemas, tools/assets/camera_zones.mjs |
| **HUD** | components/LiveRace.js, SessionLive.js, Broadcast.js, raceClock.js, raceClock.test.js, playback.js, useAutoSpeed.js, PitDialog.js, tower.js, pitTimer.js, hudConditions.js, data/balance/hud.json, live-view.json, sus esquemas |
| **LOOK** | three/sky.js*, three/post/*, three/rain/*, three/fx/*, three/trackScene.js, three/studio.js, data/balance/view-look.json*, engine/packs/schema/view-look.schema.json* |

**Puntos de contención.** `Race3D.js` es de CAM salvo en las olas 3 y 4, en que pasa a LOOK para enganchar luz, post,
lluvia y chispas (CAM trabaja esas olas en `components/director/*` y `carBody.js`). `race-physics.json` pasa a PT en la
ola 1 (GS-02) y vuelve a SIM en la ola 2. `sessions.json` pasa a WX en la ola 3 (GS-14). `race-sim.json` lo escribe un
solo paquete de SIM por ola. Como en el plan anterior, los módulos nuevos (`orderWatch.js`, `sky.js`, `post/*`, `rain/*`,
`fx/*`) se escriben y prueban aislados antes de su enganche.

**Contratos que fija la ola 1** (para que las olas siguientes no esperen): HUD-C1 crea las claves nuevas de `hud.json` y
`live-view.json` **con el esquema completo** (`layout`, `tags.policy`, `start.fadeSec`, `lapCountdown`, `continuity`,
`fastForward`, `views.cameras` por era); CAM-C1 hace lo mismo con `cameras.json` (`hfovDeg`, `cockpitHigh`, `shake`,
`wheelDisplay.byEra`) y `broadcast.json` (`directorPriorities`, `sequences.scRestart`, `framing.train`,
`startLightsLow`); LOOK-C1 con `view-look.json` (todos los bloques); SIM-C1 publica en la instantánea `lineOffset`,
`weather {waterMm, rainRate, state}` y `spray[i]`, y declara los eventos `control.*` (§1.5) aunque algunos se emitan
más tarde. Lo que aún no tenga valor va `pending`.

### 3.3 Olas y paquetes

Entre olas: fusionar, pasar la suite del Manager, la equivalencia SRS §4.2 sin tocar tolerancias, el golden del modo
rápido donde aplique y, si la ola tocó el motor, la validación 7.2 (§1.4 regla 8). Cada commit cita sus requisitos.

| Ola | SIM | PIT | PT | WX | SES | AUD | CAM | HUD | LOOK |
|---|---|---|---|---|---|---|---|---|---|
| 1 | SIM-C0, SIM-C1 | PIT-C1 | PT-C1 | WX-C1 | SES-C1 | AUD-C-1 | CAM-C1 | HUD-C1 | LOOK-C1 |
| 2 | SIM-C2, SIM-C5 | PIT-C2 | — | WX-C2 | — | AUD-C-2 | CAM-C2 | HUD-C2 | LOOK-C2 |
| 3 | SIM-C3 | — | — | WX-C3 | — | AUD-C-3 | CAM-C3 | — | LOOK-C3 |
| 4 | SIM-C4 | — | — | — | — | AUD-C-4 | — | — | LOOK-C4 |
| 5 | — | — | — | — | — | — | CAM-C4 | HUD-C3 | — |

Camino crítico: SIM (cuatro olas, SIM-C2 y SIM-C3 son L). LOOK-C3/C4 dependen de que CAM-C2 haya cerrado la trazada en la
vista (ola 2). CAM-C4 va en la ola 5 porque `Race3D.js` está en manos de LOOK en las olas 3 y 4.

#### Ola 1

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-C0** DRS por tabla | GS-08 | engine/rules.js, engine/rules.test.js, data/seasons/curated/era-defaults.json | Test de tabla por era; eventos `control.drsEnabled/drsDisabled` declarados en `rules.js`; claves verificadas en FIA 2011/2018/2024 (las no leídas, `pending`) | Aceptación de GS-08 |
| **SIM-C1** Trazada única y seguimiento | GS-07 (motor), VIEW-08 (motor), GS-03, contratos §1.5 | engine/trackData.js, engine/sim/lateral.js, engine/sim/stepRace.js, engine/sim/lateral.test.js, engine/sim/stepRace.test.js, data/balance/race-sim.json, engine/packs/schema/race-sim.schema.json | `positionAt(P, lat)`; `pose.lineOffset` en todas las fases; holgura medida sobre la trazada; `traffic.minFollowSec.eras[]`; `snapshot.weather` y `snapshot.spray` desde `engine/weather` (solo lectura) | Aceptación de GS-03; contador de correcciones de la pasada de seguridad de la vista = 0 en las 64 carreras de SIM-2 (cierra CAM-3); equivalencia §4.2 |
| **PIT-C1** Estimación = cronómetro | GS-15 | engine/sim/pitLane.js, engine/sim/pitLane.test.js | `previewPit` y el cronómetro con la misma definición de líneas; documentado qué mide cada campo | Aceptación de GS-15 |
| **PT-C1** Curvas de Shanghái | GS-02 | engine/sim/physics.js, data/balance/race-physics.json (traspaso), race-physics.schema.json, engine/sim/speeds.test.js, __fixtures__/openf1-powertrain.json, powertrain_from_openf1.py | Fixture de China 2024, `budget.radiusExponent`, test por curva 2024 y 2013 (NV ±12 %) | Aceptación de GS-02; punta ±5 % sin romper |
| **WX-C1** Evacuación por era | GS-13 | engine/weather/index.js, engine/weather/weather.test.js, engine/weather/__fixtures__/openf1-9668.json*, data/balance/race-weather.json, race-weather.schema.json | Lista por era con fuente; capacidad del intermedio por año | Aceptación de GS-13 |
| **SES-C1** Radio en sesiones | AUD-C3 (parte motor) | engine/sessionSim/session.js, engine/sessionSim/session.test.js | `radio[]` y `events[]` (vuelta lanzada terminada, salida del garaje, bandera) con la forma de carrera | Mismos eventos con la misma semilla (RNF-05) |
| **AUD-C-1** Licencias, avance rápido y cortes | AUD-C10, AUD-C1 (sonido), AUD-C2 | three/audio/mixer.js, index.js, engineSamples.js, audio.test.js, data/balance/audio.json, audio.schema.json, data/manager-sounds.json | `recorded: false` por defecto y exclusión en build pública; vista `fastForward` por velocidad con fundidos asimétricos; `views.cut` | Unit de AUD-C10, AUD-C1 y AUD-C2 (las Playwright, tras HUD-C1) |
| **CAM-C1** Encuadre TV y FOV | VIEW-02, VIEW-12, VIEW-03 | three/cameras.js, three/cameras.test.js, three/Race3D.js, data/balance/cameras.json, cameras.schema.json, broadcast.json, broadcast.schema.json, data/circuits/shanghai-1/camera-zones.json, camera-zones.schema.json, tools/assets/camera_zones.mjs | ~30 zonas en Shanghái, `longLens`, `highWide.minShare`; helicóptero por elevación; `hfovDeg` y `cockpitHigh`; esquemas completos (§3.2) | Aceptación de VIEW-02, VIEW-12, VIEW-03 |
| **HUD-C1** Continuidad y HUD por zonas | GS-01, VIEW-01, AUD-C1 (`speed` en el frame) | components/raceClock.js, raceClock.test.js, LiveRace.js, SessionLive.js, Broadcast.js, data/balance/hud.json, hud.schema.json, live-view.json, live-view.schema.json | `mode live|replay|seek` y límite de continuidad; modo directo a pantalla completa; layout por zonas; fichas plegables; `speed` al audio; esquemas completos (§3.2) | Aceptación de GS-01 y VIEW-01 |
| **LOOK-C1** Cielo, sol y grading aislados | VIEW-06 (módulos), VIEW-05 (módulos) | three/sky.js*, three/sky.test.js*, three/post/*, three/studio.js, data/balance/view-look.json*, engine/packs/schema/view-look.schema.json* | `sunDirection(lat, lon, fecha, hora)` NOAA; sombra por nubosidad; grading y exposición asimétrica; pase de desenfoque con máscara; todo sin enganchar | Sol ±2° del NOAA; sombra monótona con la nubosidad; pase determinista |

#### Ola 2

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-C2** Duelo legible | GS-04, VIEW-09 (motor), GS-06 | engine/sim/duel.js, lateral.js, stepRace.js, duelGeometry.test.js, lateral.test.js, data/balance/race-sim.json, race-sim.schema.json, race-physics.json, race-physics.schema.json | `STRAIGHT_PASS` con `pullOut/alongside/ahead`; `duel.straightPass`; `confirmedAt` con `confirmLengths`; `lateral.alongsideByBand` | Aceptación de GS-04, GS-06 y la parte unitaria de VIEW-09; equivalencia §4.2; 7.2 ≥ 34/38 |
| **SIM-C5** Estrategia bajo SC y final | GS-09 (motor) | engine/race.js, engine/energy.js, data/balance/race-energy.json, race-energy.schema.json, engine/sim/energyFuel.test.js | `tactics.fuelSpendToTarget`, `ersEndgame`; el estratega usa `previewPit(..., {sc})` | Aceptación de GS-09 salvo la cola; golden del modo rápido regenerado y justificado |
| **PIT-C2** Cola y etapas | GS-09 (cola), prerrequisito de AUD-C7 | engine/sim/pitLane.js, pitStop.js, pitLane.test.js, pitStop.test.js, data/balance/race-pit.json (+ esquema) | Cola solo con el box ocupado; pérdida bajo SC; `pitStage {name, t}` en la pose y evento `pitExitLine` | Cola 0 con el compañero fuera; etapas deterministas |
| **WX-C2** Spray calibrado | GS-11 (calibración) | engine/weather/index.js, weather.test.js, __fixtures__/openf1-wet-*.json*, data/balance/race-weather.json, race-weather.schema.json | `spray.lossSec` medido (`status: "M"`); función pura `sprayAt` usada por SIM-C1 | Aceptación de GS-11 salvo radio y aire limpio |
| **AUD-C-2** Radio, sonoridad y lecho | AUD-C3 (sonido), AUD-C4 | three/audio/uiSounds.js, uiSounds.test.js, ambience.js, mixer.js, levels.js, data/balance/audio.json, audio.schema.json | Secuencia de radio propia, paneo por panel, banda ancha; `loudness`, `trackBed`, público decorrelado | Aceptación de AUD-C3 y AUD-C4; Playwright de AUD-C1 y AUD-C2 |
| **CAM-C2** Vibración y trazada en la vista | VIEW-04, VIEW-08 (vista), GS-07 (vista) | three/cameras.js, cameras.test.js, three/Race3D.js, three/cameraZones.js, three/racingLine.js, data/balance/cameras.json, cameras.schema.json | Onboard hija del coche con `pitch/roll`; `shake` por cámara con semilla; cajas de cámara y `fitRig` sobre `trackData.positionAt` | Aceptación de VIEW-04, VIEW-08 y GS-07 |
| **HUD-C2** Torre, selector, boxes y sesiones | VIEW-16, VIEW-14, VIEW-17, GS-15 (menú), AUD-C3 (enganche en sesión) | components/LiveRace.js, Broadcast.js, SessionLive.js, playback.js, useAutoSpeed.js, PitDialog.js, tower.js, pitTimer.js, data/balance/hud.json, live-view.json | Cuenta atrás, modo sectores, minimapa con DRS por era, panel de boxes por fase; anillo de cámaras por era, retrovisor, foco que conserva el tipo; `fastForward` opcional; `PitDialog` con `previewPit`; radio y eventos de sesión al audio | Aceptación de VIEW-16, VIEW-14 y VIEW-17 |
| **LOOK-C2** Asfalto mojado y lluvia aislados | GS-10 (módulos), VIEW-07 (módulos) | three/trackScene.js, three/rain/*, three/rain/rain.test.js*, data/balance/view-look.json | `wetness` continuo y máscara de trazada en el material; spray instanciado, gotas de lente, niebla por lluvia, charcos; todo con `seedOf` | Unit de GS-10 y VIEW-07 (spray 0 con 0 mm, monótono, mismas partículas con la misma semilla) |

#### Ola 3

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-C3** Histéresis y contactos (cierra SIM-8) | GS-05, AUD-C11 (motor), VIEW-09 (histéresis) | engine/sim/duel.js, stepRace.js, orderWatch.js*, stepRace.test.js, engine/incidents.js, data/balance/race-sim.json, race-sim.schema.json, race-reliability.json, race-reliability.schema.json | `duel.rePass`; vigilante de orden; `crowdFactor`; `contact {confirmed}` | Aceptación de GS-05 y VIEW-09; **7.2 ≥ 35/38 y Spearman ≥ 0,92** |
| **WX-C3** Goma y temperatura | GS-14 | engine/weather/index.js, weather.test.js, __fixtures__/openf1-9664-9673.json*, data/balance/race-weather.json, race-weather.schema.json, data/balance/sessions.json (traspaso) | `veryHigh`; exceso solar NOAA con nubosidad; goma por día | Aceptación de GS-14 |
| **AUD-C-3** Pit lane, pianos y lluvia | AUD-C7, AUD-C8, AUD-C5 | three/audio/ambience.js, index.js, kerbs.js, audio.test.js, data/balance/audio.json, audio.schema.json, data/circuits/shanghai-1/kerbs.json, tools/assets/blender/extract_kerbs.py | Pistolas por etapa, ralentí, suelta en `pitExitLine`; paso de resaltes medido y lateral de la trazada; `drops` y `spray` | Aceptación de AUD-C7, AUD-C8 y AUD-C5 |
| **CAM-C3** Realizador: prioridades, cortinillas y salida | VIEW-13, VIEW-10 (guion) | components/director/directorState.js, directorState.test.js, raceScripts.js, components/replay/ReplayOverlay.js, data/balance/broadcast.json, broadcast.schema.json | `directorPriorities` con override/restore; `stingSec`; `scRestart`, `framing.train`; guion `startLightsLow → startHigh` | Aceptación de VIEW-13; guion de salida determinista por semilla |
| **LOOK-C3** Enganche de luz y efectos | VIEW-06, VIEW-05, VIEW-18, VIEW-10 (malla flotante) | three/Race3D.js (traspaso), three/trackScene.js, three/studio.js, three/fx/sparks.js*, three/fx/sparks.test.js*, data/balance/view-look.json | Cielo, sol, sombra, niebla, grading y exposición en directo; post con desenfoque por calidad; chispas por era; test de mallas visibles sin padre y arreglo del objeto rojo | Aceptación de VIEW-06, VIEW-05 y VIEW-18; ≥ 50 fps a 1080p con 22 coches (RNF-02) |

#### Ola 4

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-C4** Mojado, SC y radio | GS-12, AUD-C9, GS-11 (radio y aire limpio) | engine/sim/safetyCar.js, safetyCar.test.js, engine/race.js, engine/sim/stepRace.js, engine/rules.js, rules.test.js, data/seasons/curated/era-defaults.json, data/balance/race-sim.json, race-sim.schema.json | `wetStart` por años (`pending` hasta leer la FIA); `START_BEHIND_SC`; `raceControl.wet` y eventos `control.*`; DRS cerrado con WET TRACK; `safetyCar.weave`; aire limpio con spray; radio por umbral; sanción de un retirado a parrilla (`pending`) | Aceptación de GS-12 y AUD-C9; 38 temporadas sin reglas fuera de era; 7.2 sin bajar |
| **AUD-C-4** Timbre y pulido | AUD-C6, AUD-C12 | three/audio/engineSynth.js, uiSounds.js, mixer.js, SoundControl.js, audio.test.js, data/balance/audio.json, audio.schema.json | `voicing.byManufacturer`; `transient.rebound`; `ui.pause`, bus `music`, `ui.sting` | Aceptación de AUD-C6 y AUD-C12 |
| **LOOK-C4** Enganche del mojado | GS-10, VIEW-07 | three/Race3D.js (traspaso), three/trackScene.js, three/rain/*, data/balance/view-look.json | `setWet(bool)` sustituido por la instantánea de agua; spray por coche; gotas en onboards; niebla; se borran las rayas con `Math.random` | Playwright de GS-10 y VIEW-07 con `save-china-wet.json`; ≥ 50 fps |

#### Ola 5

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **CAM-C4** Etiquetas, volante y plano de luces | VIEW-11, VIEW-15, VIEW-10 (plano en 3D) | three/Race3D.js, three/carBody.js, three/cameras.js, cameras.test.js, data/balance/cameras.json | `tags.policy` con repulsión 1D; pantalla del volante por era con LED; `startLightsLow` con el pórtico en cuadro | Aceptación de VIEW-11 y VIEW-15; ≥ 4 de 5 luces en el lienzo |
| **HUD-C3** Salida y Dirección de Carrera en mojado | VIEW-10 (HUD), GS-12 (HUD) | components/LiveRace.js, Broadcast.js, hudConditions.js, data/balance/hud.json | Fundido del HUD desde `snapshot.start`; banners y cabecera con `control.*` (mojado, DRS); textos por react-intl | HUD con opacidad < 0,1 hasta +0,9 s; mensajes en el orden del motor |

---

## 4. Enmiendas propuestas al SRS (no aplicadas)

Se proponen para que el SRS no contradiga ni se quede corto frente a lo anterior. Ninguna se ha escrito en `SRS.md`.
Se suman a las de F1M24-GAMEPLAY §4, que siguen sin aplicar.

1. **RF-SIM-06** (aire sucio y rebufo por distancia). Añadir: «El coche que sigue a otro fuera de un duelo mantiene un
   hueco mínimo en tiempo por era, calibrado con OpenF1 `intervals`; la distancia en metros sale del hueco y la
   velocidad».
2. **RF-SIM-07** (adelantamiento como duelo en curva). Ampliar a «duelo en curva **o en recta con DRS**: con DRS el
   pase puede completarse antes de la frenada, con fases visibles de salida de la estela, a la par y delante; tras un
   pase hay histéresis por pareja». Hoy el texto solo contempla la curva.
3. **RF-SIM-10 y tabla 6.2.** Añadir el procedimiento de salida en mojado por años: salida detrás del SC con neumáticos
   de lluvia obligatorios (y la excepción de intermedios desde 2023), salida desde el pit lane para quien entra, y
   salida parada tras el SC desde 2017; más la secuencia de mensajes de Dirección de Carrera en mojado. Todo `pending`
   hasta leer el reglamento deportivo de cada año. También: sanción de tiempo a un coche retirado convertida en sanción
   de parrilla según la era.
4. **RF-SIM-11** (clima dinámico). Añadir: «La temperatura de pista sigue al aire más un exceso que depende de la altura
   real del sol y de la nubosidad; la goma tiene cinco niveles, se hereda dentro del día y se reinicia (sin llegar a
   cero) entre días; el spray reduce la visibilidad y el ritmo del que sigue, calibrado con OpenF1».
5. **RF-SIM-03 / §6.2** (neumáticos). Añadir la capacidad de evacuación de intermedios y lluvia por era (Pirelli:
   2011–2016 25/65 L/s, desde 2017 35–40/85 L/s) como parámetro del pack.
6. **RF-SIM-12 y RF-CMD-02.** Añadir: «La estimación de la pérdida en boxes que ven el jugador y el estratega usa la
   misma definición y el mismo modelo que el cronómetro del pit lane (línea de entrada a línea de salida)».
7. **RF-CMD-03** (radio). Añadir: «Radio también en libres y clasificación; cada mensaje suena en el lado del panel de
   su piloto; su nivel no depende de la cámara ni de la velocidad de simulación».
8. **RF-CMD-04** (velocidades). Añadir: «Por encima de un umbral de velocidad el sonido pasa a un lecho difuso sin
   seguimiento de motor, y vuelve con una rampa; el paso automático al mapa es opcional».
9. **RF-3D-04** (cámaras). Añadir: «Los FOV de las onboards se definen en horizontal y por era (cabina alta antes del
   halo); las onboards de chasis son rígidas y solo la vista del piloto tiene movimiento de cabeza; la luz sale de la
   posición real del sol a la hora de la sesión y de la nubosidad; la lluvia se ve graduada por el agua en pista
   (trazada seca, spray, gotas en la lente)».
10. **RNF-02** (rendimiento 3D). Precisar que los 50 fps a 1080p se miden con el post-proceso del nivel medio activo, y
    que el desenfoque y el spray se apagan en LOD bajo o móvil.
11. **SRS §3.3 y §7.3** (licencias). Extender el indicador `riskRipped` y la exclusión automática en build pública a los
    **bancos de sonido** (hoy el SRS solo lo dice de circuitos y coches), y añadir el riesgo de bancos sacados de mods y
    juegos de terceros.
12. **Criterio 7.2.** Añadir dos criterios medibles: «En vivo, ningún coche avanza entre dos fotogramas más de lo que
    permite su velocidad salvo en un salto explícito de repetición» y «la holgura lateral entre coches se mide sobre la
    trazada, no sobre el eje central» (cierra la ambigüedad que dejó abierto CAM-3).
