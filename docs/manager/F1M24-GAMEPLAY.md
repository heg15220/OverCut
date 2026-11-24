# F1M24-GAMEPLAY — Especificación de implementación a partir del gameplay de F1 Manager 24

Fecha: 24/11/2026. Fuente: análisis multiagente de un vídeo de F1 Manager 24 (Baréin, Ferrari) contra el código de
OverCut Manager en esa fecha. Complementa a `SRS.md`, `SIM-FISICA.md` y `DESIGN.md`; no los sustituye.

**Rutas.** Salvo que se diga otra cosa, las rutas son relativas a `overcut/frontend/src/modules/overcutManager/`.
Las que empiezan por `overcut/src/`, `overcut/frontend/scripts/` o `tools/` son relativas a la raíz del repo.
Los ficheros marcados con `*` no existen todavía.

**Notación.** V = visto en pantalla; I = inferido. Confianza A (alta), M (media), B (baja). Los tiempos son de
vídeo (mm:ss o h:mm:ss; segundos absolutos entre paréntesis cuando importan). «Juego» = valor observado en F1
Manager 24, solo de referencia. NV = valor no verificado, entra en datos con `status: "pending"`.
Los identificadores en `código` (p. ej. `sc-fisico`) son los del backlog de la §3.

---

## 1. Alcance y método

### 1.1 Vídeo analizado

- «F1 Manager 24 – Ferrari is Back – Bahrain – Part 1», 2 h 04 min 32 s, sin comentarios. El fichero dice 4K/60 fps,
  pero el material de trabajo se extrajo a **640×360 y 30 fps** (fotogramas reescalados a 1280 px para leer texto).
  Audio estéreo AAC 44,1 kHz a 128 kb/s, más una mezcla mono a 22 kHz.
- Contenido: menús de carrera profesional y pretemporada (0:00–13:00), Libres 1–3 (12:58–34:20), clasificación
  Q1–Q3 (35:45–53:25), previa y parrilla (53:35–56:21) y carrera completa de 57 vueltas hasta la vuelta de
  enfriamiento (56:21–2:04:32). El vídeo termina antes de los resultados y el podio.
- El jugador cambia mucho la velocidad de simulación (1x–16x). Solo los tramos a 1x valen para medir tiempos de
  juego; en el resto se usaron los cronómetros del propio HUD.

### 1.2 Material extraído

Nueve informes en el scratchpad de la sesión (`f1m/reports/`):

| Informe | Qué cubre | Técnica principal |
|---|---|---|
| `ui-menus` | 29 pantallas (S01–S29), grafo de navegación, confirmaciones | Hojas de contactos cada 10 s, fotogramas a 1280 px |
| `practice-quali` | HUD de sesión, compresión de tiempo, salida del garaje, vueltas de Q | Fotogramas segundo a segundo, cronómetros del HUD |
| `race-1` | Carrera 53:00–90:00: salida, paradas, HUD, gestión | Recuento de fotogramas a 30 fps, trazas de f0 |
| `race-2` | Carrera 90:00–124:32: paradas, duelos, final | Hojas de contacto, cronómetros, espectrogramas |
| `cameras` | 688 planos de carrera clasificados, zonas de relevo, secuencias | Detector propio de cortes (755 cortes revisados), seguimiento del minimapa a 5 fps |
| `audio` | Motor, cambios, mezcla por vista, pit lane, salida | Tres trazadores propios (peine armónico, Viterbi, correlación log-frecuencia), estéreo L/R |
| `dynamics` | Velocidad por curva, pit lane, coches en paralelo | Marcador del minimapa a 10 Hz (41.000 muestras) proyectado sobre la línea central, 12,9 m/px |
| `gap-sim` | Huecos del motor de OverCut frente a lo visto | Lectura de `engine/`, `data/balance/`, `SIM-FISICA.md` |
| `gap-view` | Huecos de presentación (cámaras, sonido, HUD, pantallas) | Lectura de `three/`, `components/`, `audio.json` |

No se ha exportado ningún clip de audio ni de vídeo: en el material de trabajo solo hay PNG, arrays numéricos y
scripts. Nada de eso entra en el repo.

### 1.3 Límites de la medida

- **Resolución**: a 360p no se leen la velocidad del volante ni el último dígito de algunos cronómetros; la marcha
  solo se lee en la vista del piloto (HP).
- **HUD**: en carrera ocupa ~45 % del cuadro; el detector de cortes genérico (`cuts.txt`, umbral 0,30) se pierde
  muchos cortes, por eso `cameras` usó un detector propio sobre el centro sin HUD (faltan ~5 % de cortes).
- **Minimapa**: el suavizado aplana picos. Las deceleraciones salen a 1,6–2 g (reales 4–5 g) y los mínimos en curva
  dependen del método (mediana del perfil frente a mínimo por pasada). Error de escala local ±10 %.
- **Audio**: `c` (frecuencia del peine) = rpm/120 es una interpretación (B); los tonos son fiables (A), las rpm
  derivadas no tanto.
- **Noche**: toda la carrera es de noche; los cortes oscuros se escapan más.
- **No aparece en el vídeo**: safety car en pista, VSC, bandera roja, lluvia, daños visibles, accidente en directo
  (solo en repetición), vuelta de formación, resultados de carrera y podio. Todo lo que este documento diga sobre
  esos temas sale del reglamento FIA, de OpenF1/FastF1 o de f1db, nunca del juego.

### 1.4 Reglas de uso (obligatorias para todo el backlog)

1. De F1 Manager 24 solo se toman **ideas, estructura y comportamiento**. Ningún asset, modelo, textura, logotipo,
   sonido, música, texto de interfaz ni valor de ajuste del juego entra en OverCut. Las cortinillas, los sonidos de
   interfaz y la «radio» son de diseño propio (síntesis en `three/audio/`, logotipo de OverCut).
2. Los números leídos en el juego son **referencia**. La calibración sale de FIA (reglamentos deportivo y técnico
   de cada año), f1db y OpenF1/FastF1. Donde el juego se aparta de la realidad, se dice y **no se copia** (§1.6).
3. **RNF-07**: ningún valor de balance ni de presentación en el código. Todo en `data/balance/*.json` con esquema en
   `engine/packs/schema/`. Varias propuestas de este documento son, de hecho, quitar literales que ya existen.
4. **SRS §6**: cada regla o comportamiento nuevo se fecha por era (`{from, to, value}` en
   `data/seasons/curated/era-defaults.json` o en el pack). Lo que sale de memoria va `pending` hasta leer el
   reglamento del año. El juego solo modela 2022–2024; OverCut cubre 1976–2026.
5. **RNF-05 / RF-SIM-15**: la vista (realizador, repeticiones, auto-velocidad, pausa) **solo lee** del motor. Nada
   de lo que haga cambia una tirada ni el número de pasos.

### 1.5 Decisiones de unificación

Los informes `gap-sim` y `gap-view` proponen a veces lo mismo desde dos lados, con claves en ficheros distintos.
Para que los paquetes se puedan hacer en paralelo, aquí se fija **una sola fuente** para cada dato:

| Tema | Propuestas originales | Decisión |
|---|---|---|
| Semáforo de salida | `race-sim.json start` (sim) y `broadcast.json start` (vista) | El motor decide los instantes con semilla: `race-sim.json start {lightIntervalSec, holdSec}` y `era-defaults.json startProcedure`. La vista solo lee `snapshot.start` y guarda `hud.json start.hudDelaySec`. |
| Auto-velocidad y pausa | `live-view.json autoSpeed` + prioridad de evento en el motor (sim) y `hud.json autoSpeed` (vista) | **Sin cambios en el motor.** `data/balance/live-view.json*` guarda `speeds`, `defaultSpeed` por sesión, `autoSpeed`, `pauseOn` y `eventPriority` (tipo de evento → prioridad). La vista decide «coche propio» con el equipo del jugador. Se borran `SPEEDS` de `LiveRace.js:46` y `SessionLive.js:33`. |
| Escala de velocidades | `sessions.json` + `race-sim.json` | `live-view.json speeds` (una lista para todo, RF-CMD-04). |
| Buffer de repeticiones | Worker (`engine/worker/raceSession.js`) y vista (`components/replay/replayBuffer.js`) | **Vista**: `replayBuffer.js*` muestrea `liveCarAt` (22 coches × 25 s × 10 Hz). El worker solo se toca si `raceClient.js` no conserva historial suficiente. Config en `broadcast.json replay`. `buffer-repeticion` queda fundido en `replays`. |
| Cambio de marcha por fabricante | `race-powertrain.json eras[].manufacturers{}` (sim) y `audio.json shiftProfiles[].shiftRpm` (sonido) | El **motor** decide marcha y rpm (`race-powertrain.json`, sale en `pose.gear/rpm`). `audio.json shiftProfiles[]` solo guarda la **forma** del cambio (`glideMs`, `transient`), con `match` por fabricante del pack. |
| Marcha con el limitador del pit | `race-powertrain.json pitLimiter {gear}` y `audio.json pitLimiterGear` | Marcha en `race-powertrain.json pitLimiter`; `audio.json voicing.pitLimiter` solo `{flutterHz, flutterDepth}`. Se borra `pitLimiterGear` del sintetizador. |
| Temperatura de neumático en °C | `race-tyres.json windowC` (sim) y `race-physics.json tyreThermal` (vista) | `data/balance/race-tyres.json*` (SIM). La vista lee `snapshot.tyreC`; hasta que exista, el panel mantiene el medidor actual sin °C (no se inventa una conversión). |
| Hueco lateral mínimo | `race-physics.json lateral.clearanceMetres` y `minLateralGapM` (vista) | Una clave: `race-physics.json lateral.clearanceMetres`, más `eras[].carWidth/carLength`. La pasada de seguridad de `Race3D` las lee. |
| Coche de seguridad en la vista | Vista lo pone a 90 m del líder (hoy) | El motor publica `snapshot.sc`. Se borran los 90 m de `LiveRace.js:450-455` y `Race3D.js:418-430`. |
| Final de carrera en la vista | `finish-ui` (gap-view, fuera del backlog) | Se funde con `vuelta-enfriamiento` (motor) y `start-finish-scripts` (cámaras). |
| Amarilla por sector | `amarilla-sector` (motor) y `flag-header-sectors` (vista) | El motor emite `yellow {sector, marshalPost, double}`; en sesiones lo emite `sessionSim`. La vista solo pinta. |
| Probabilidad de SC por circuito | `duracion-neutralizacion` y `pre-race-briefing` | `calendar[].scRate` en el pack (generado por `generate_season_packs.py`); el motor y `CircuitCard` lo leen. |

### 1.6 Lo que el juego hace mal (no copiar)

| Juego | Real / regla | Qué hace OverCut |
|---|---|---|
| DRS activado al inicio de la V2 (race-1, 3495 s) | Desde la V3 (RF-SIM-08) | Ya lo hace bien (`race-eras.json:127`). No tocar. |
| Pit lane de 28,2–29,4 s línea a línea (race-2 §2.4) | ~24–25 s en Baréin; pérdida neta ~22–23 s | WP6 ya da 23,2/23,0 s. No tocar. |
| Estimación «total en pit» 23,736 s que no cuadra con el medido | — | `previewPit` debe dar la pérdida neta y decir qué mide. |
| Motor a 6.000–6.700 rpm en horquillas (audio §1) | Rara vez < ~9.000 rpm | Calibrar con OpenF1 `car_data` (`curvas-lentas`). |
| Libres ~3 s más lentos que los reales | FP2 2024 HAM 1:30.374 | Libres desde `qualifyingPaceOf` y plan de tandas, no del juego. |
| Mejora de pole Q1→Q3 0,36 s | 0,85 s reales (2024) | `evolucion-q` mide en f1db. |
| 75 % de probabilidad de SC en Baréin | Dato del juego | `scRate` desde OpenF1/FastF1/f1db. |
| Neumático usado a 116–126 °C en pantalla | Ventanas Pirelli por compuesto | `race-tyres.json` con fuente Pirelli; no copiar los °C. |

### 1.7 Contratos de instantánea y eventos

Para que motor, cámaras, sonido y HUD trabajen a la vez, estos campos se fijan aquí. El motor los añade a
`snapshot` (modo por pasos) y a los eventos; el modo rápido emite los eventos que tengan sentido por vuelta.
Todos opcionales para la vista: si faltan, la vista no hace nada (no inventa).

| Campo / evento | Forma | Lo produce | Lo consumen |
|---|---|---|---|
| `start` | `{phase: "formation"|"grid"|"lights"|"out", lights: 0..5, t}` | SIM-3 | AUD-3 (golpe por luz), CAM-4 (guion), HUD-4 |
| `lightsOut` (evento) | `{t}` | SIM-3 | HUD, AUD, CAM |
| `finished` (evento) | `{carId, t, pos}` | SIM-3 | CAM-4 (plano por coche), HUD-4 (cuadros, panel plegado) |
| `battle[i]` | `"RUNNING"|"FOLLOWING"|"ATTACKING"|"DEFENDING"|"TRAIN"` | SIM-4 | CAM (BATTLE_CUTS, encuadre), AUD (público), HUD |
| `duel` (evento) | `{phase: "start"|"alongside"|"resolved", carId, otherId, side, corner, result: "passed"|"defended"|"contact", attempt}` | SIM-4 | HUD (radio, banner), CAM (repetición) |
| `pass` (evento) | añade `confirmedAt` (checkpoint siguiente) | SIM-4 | HUD-3/4 (banner con retardo real, no `confirmDelaySec` fijo) |
| `yellow` (evento) | `{sector, marshalPost, double, s, until}` | SIM-4, SES-3 | HUD (cabecera), CAM (repetición) |
| `sc` | `{phase: "DEPLOYED"|"PICKUP"|"TRAIN"|"UNLAPPING"|"IN_THIS_LAP"|"RESTART", s, v, lap, lightsOn}` | SIM-5 | CAM-5, HUD-5, AUD-5 |
| `vsc` | `{deltaSec[i], ending}` | SIM-5 | HUD-5 |
| `lane[i]` | ya definido en SIM-FISICA §3.1; `PIT_EXIT` se usa de verdad | SIM-2, PIT-2 | CAM, Race3D |
| `pitPhase`, `pitStage` | ya existen (`raceClock.js:359`) | — | CAM-3 (secuencia), HUD-3 (widget) |
| `gear`, `rpm`, `throttle`, `v` | ya existen | PT-1 (marcha fija con limitador) | AUD, HUD (telemetría), CAM (volante) |
| `tyreC[i]` | `{surface, carcass}` en °C | SIM-6 | HUD-6, radio |
| `lon[i]` | `"NORMAL"|"LOCKUP"|"SPIN"` | SIM-7 | CAM (repetición), AUD (chirrido), vista (humo) |
| `damage[i]` | `{frontWing, floor, puncture, lossSecPerLap}` | SIM-7 | HUD-7, radio |
| `previewPit(state, carId, opts)` | función pura → `{lossGreen, lossSc, stopMedian, exitPos, teamMateSameLap, distanceToPitEntry}` | PIT-1 | HUD-3 (`PitDialog`) |
| Sesión: `phase[i]` | `"GARAGE"|"GARAGE_EXIT"|"OUT_LAP"|"PUSH_PREP"|"PUSH"|"IN_LAP"` + `localClock` + `boxRequest {distanceM}` | SES-1/2 | HUD (RunCard), CAM (garageExit) |
| Cámara activa | `cameraBus` (ref publicado por `Race3D`) `{id, kind, position, target}` | CAM-1 | AUD-2 (oyente de TV en la cámara real) |

---

## 2. Áreas

Cada área tiene: lo observado (con tiempo y confianza), lo medido, lo que hace OverCut hoy y la propuesta (con los
identificadores del backlog, que se detallan en la §3).

### 2.1 Sonido ambiente del circuito

**Observado y medido** (`audio` §3, `race-1` §4, `race-2` §2.4):

| Vista | Nivel (dBFS, canal medio) | Correlación L/R | Qué se oye | Conf. |
|---|---|---|---|---|
| Onboard (cabina, T-cam, halo) | −26 a −30 | 0,98 (casi mono) | Motor propio centrado; ruido 2–8 kHz que sube ~5 dB con la velocidad; pianos | A |
| Persecución / TV cerca | ≈ onboard | 0,9+ | Motor seguido limpio, poco Doppler (59:00–59:21) | A |
| TV de pista lejana | −41 | 0,68 | Lecho difuso de motores lejanos + zumbido estable 58/88/118/178 Hz (C) | A |
| Mapa 3D | −43 a −59 | 0,29–0,32 | Casi sin motores, solo ambiente | A |
| Pausa / menús de parada | −49,5 | 0,26 | Lecho muy bajo + clics de interfaz | A |
| Repetición | −32 | 0,97 | Como onboard, con «whoosh» en la cortinilla (59:27,5; 86:38) | A |
| Menús fuera de sesión | −43 a −45 | 0,35–0,50 | Música (no se toma) | A |
| Parrilla / previa | −32 | 0,63–0,89 | Ambiente de equipo y parrilla | A |
| Pelotón en la salida (56:32–56:40) | −15,7 RMS (máximo de la mezcla de pista) | — | Banda ancha densa, peines múltiples | A |
| Box en la parada (6355–6358 s) | −24 → −15 dB, centroide 2,2 → 2,8 kHz | — | Pistolas y ruido metálico (sin zumbidos de pistola aislables, C) | A/C |

- Diferencia onboard ↔ TV lejana: ~14 dB. **La distancia a la cámara manda en la mezcla** (A).
- Pasada cercana en TV (61:45–61:48): paneo −2,8 dB → +5 dB en ~2 s, pico −35 dBFS en el cruce; Doppler 735 → 505 Hz
  (0,687) en 0,6–0,8 s (B). Salida del pit (86:13,75): paneo de hasta +17 dB a la derecha.
- Pianos en onboard: peine de ~40 Hz (120/160/200 Hz), +12–15 dB en 40–150 Hz durante 0,5–0,8 s (77:01,5; 76:38,1;
  69:43,5).

**OverCut hoy.** Síntesis propia en `three/audio/` (sin grabaciones): lecho de público, viento
(`audio.json ambience.wind`, 250–2.200 Hz), lluvia y pistolas neumáticas; Doppler y mezcla por cámara.
`mixer.cameras.mix.map` da `focus 1` y `field 0.8`: **el mapa suena casi como la TV**. La pausa apaga motores
(`playing:false`) pero no hay mezcla propia. El oyente de TV es un poste virtual 160 m por delante
(`three/audio/mixer.js:93-101`), no la cámara que se ve. `mixer.maxVoices 6`: los otros 16 coches no suenan y nada
los representa. No hay pianos, ni radio, ni sonidos de interfaz.

**Propuesta.**
- `mix-snapshots-per-view` (P1): mezclas `map`, `paused`, `replay`, `menu` con `{focus, field, crowd, bedDb}` y
  `crossfadeMs` al cortar. El oyente de TV se coloca en la cámara real (`cameraBus` de CAM-1); el poste virtual
  queda como respaldo en 2D. Objetivo de prueba (relativo, no absoluto): onboard − TV lejana ≈ 12–15 dB; mapa ≥ 15 dB
  por debajo de TV.
- `field-bed-start` (P2): `fieldBed` en `ambience.js` (ruido filtrado + 2–3 peines desafinados) con ganancia según
  los coches cercanos sin voz propia.
- `kerbs-wind` (P2): `wind.highHz` a 8000 (dato); voz `kerb` cuando el coche enfocado pisa un piano. Las zonas
  salen de la malla: `data/circuits/<splineId>/kerbs.json*` `{kerbs:[{fromM,toM,side}]}`, generado por un script
  nuevo en `tools/assets/blender/` (SIM-FISICA §3.1 ya preveía exportar pianos). No se escribe en `trackTables.js`.
- `radio-ui-sounds` (P2): `three/audio/uiSounds.js*` sintetizado (clic 5–30 ms, whoosh 0,4–0,7 s, aviso en
  escalera, «radio» = tono de apertura/cierre + ruido en banda 300–3.000 Hz, **sin voz**). Bus propio en
  `SoundControl.js`.
- `start-lights-sound-and-timing` (P1, parte de sonido): golpe grave + tono por luz y subidas de vueltas en la
  parrilla, leyendo `snapshot.start`.

### 2.2 Salida y velocidad del pit lane

**Observado y medido.**

| Hecho | Tiempo / valor | Fuente | Conf. |
|---|---|---|---|
| Sesión: de «sacar el coche» a estar en pista | 26–30 s de juego (5 medidas: Q3 SAI 26 s, LEC 28 s; Q1 SAI 28 s, LEC 28 s; P1 ~30 s ±4) | practice-quali §4 | A |
| Desglose inferido | ~5 s garaje → calle + ~10 s calle + ~12 s carril de incorporación | practice-quali §4 | M |
| Cinemática de garaje | Solo la primera salida del fin de semana (~4 s, saltable) | practice-quali §4 | A |
| Velocidad en la calle (libres) | 83 km/h estables, límite alcanzado en ~1 s (278 m en 12 s) | dynamics §5 | A (±5 % escala) |
| Velocidad en la calle (carrera) | 80–81 km/h (203 m en 9 s; 134 m en 6 s) | dynamics §5 | A |
| Llegada al box | Decelera en los últimos ~20 m; parado 2,627 s (SAI) / 2,843 s (LEC) | race-2 §2.2–2.3 | A |
| Tiempo en pit línea a línea | 28,152 s (SAI), 29,374 s (LEC); en race-1: 28,589 / 28,245 | race-1 §6, race-2 §2.4 | A |
| Salida del pit | ~350 m antes del vértice de T1; acelera a 130–200 km/h antes de T1 | dynamics §5 | A |
| Carril de incorporación | Línea blanca y galones; plano alto (Q3 2867 s) | practice-quali §4 | A |
| Radio al soltar | «sal del box; cuidado con la línea blanca» (6358,9 s) | race-2 §2.2 | A |
| Sonido con limitador | Tono plano 197,5 / 395 / 593,5 / 1.185 Hz, igual a la ida y a la vuelta, variación < 1 % en 2 s; escalón y paneo al soltar | audio §4 | A (tono) / B (rpm ≈ 7.900) |
| Tras la parada | Neumático a 70 °C; radio de vuelta de salida | race-1 §6, race-2 §2.5 | A |
| Q3 | Empieza con todos en el garaje; salidas escalonadas por decisión del jugador | practice-quali §7 | A |
| Llamado a boxes en libres | Distancia a la línea de entrada (3,87 km) y botón de cancelar | practice-quali §3 | A |

Referencia real: 80 km/h en Baréin 2024 (FIA). Pérdida en verde ~22–23 s.

**OverCut hoy.** En carrera, pit lane físico (WP6): perfil v(s) al límite de la era y circuito
(`era-defaults.json pitLaneSpeed`), parada con `v = 0` en el box propio, pérdida a ±1 s de la real (Baréin
23,2/23,0 s). Parada por etapas con *pit crew* (WP7). Pero:
- `pitLane.js:247` solo limita velocidad desde `exitBlendS`; `EXIT_ROAD` **no mira el tráfico**: el coche se
  fusiona en la trazada aunque pase otro. No hay línea blanca de entrada ni de salida, ni su sanción.
- En sesiones el pit lane es una constante: `sessions.json:14` `laps.pitLaneSec 14` + `boxStopSec 2`
  (`session.js:274-275, 557-558`); la fase `pitlane` de la vista es una fracción de tiempo (`session.js:627`).
  No se usa `pitLane.js`, ni el garaje real, ni hay cola en el semáforo de salida.
- La cámara se queda fija a 9 m mientras `pose.garage` (`Race3D.js:446-452`); no hay cámaras de pit lane.
- El sintetizador fija 2.ª y modula el limitador con un LFO cuadrado de 14 Hz y profundidad 0,6: **rebota**.

**Propuesta.**
- `incorporacion-pit` (P1): marcas `exitLineTo` y `entryLine` en `data/splines.json` (desde
  `tools/assets/blender/extract_pitlane.py` o a mano en `assets.config.json`). Hasta `exitLineTo`, `lane = PIT_EXIT`
  con lateral fijo del lado del pit. Al acabar la línea, entra en la trazada solo si el hueco con el coche más
  cercano por detrás es ≥ `race-pit.json pitLane.mergeGapMetres`; si no, levanta y se pone detrás. Ofensa
  `pitExitLine` (y entrada tardía) en `race-eras.json penalties.offences`, años `pending`.
- `salida-boxes-sesion` (P1): fase `GARAGE_EXIT` (`sessions.json garage.exitSec`, NV) + perfil de `pitLane.js`
  (exportado por PIT-1 como `garageExitProfile`) desde el box del equipo hasta `exitLineTo`. La vuelta de entrada
  termina en el garaje. Cola en el semáforo al abrir cada segmento (`queueOffsetMetres` ya existe). Se borran
  `laps.pitLaneSec` y `boxStopSec`. Validación: garaje→línea frente a OpenF1 `pit`/`laps` de libres 2024.
- `garage-exit-presentation` (P1): RunCard con fase y distancia; `sequences.garageExit` de cámaras.
- `pit-sequence` (P1): ver §2.5.
- `pit-limiter-tone` (P1): tono plano (`flutterDepth ≈ 0`), rpm derivadas de `pitLaneSpeed` y de la marcha fija de
  `race-powertrain.json pitLimiter`. Sin tono de limitador antes de que exista límite en el pit lane (1994, NV).
- `prevision-parada` + `pit-widget-and-dialog` (P1/P2): §2.12.

### 2.3 Velocidad en pista y paso por curva

**Observado y medido** (`dynamics` §2; carrera a 1x, vueltas limpias; s = 0 unos 315 m antes del vértice de T1).
«Mín» = mediana del perfil [mínimo mediano por pasada]; el valor real del juego queda entre los dos.

| Curva | Entrada km/h | Mín km/h | Salida +150 m | Frenada antes del vértice | Conf. | Real aprox. (verificar en OpenF1) |
|---|---|---|---|---|---|---|
| T1 horquilla | 300–311 | 68 [45] | 186 | ~105 m, ~3 s | M | 66 km/h (2025, Brembo); ~80–90 según otras fuentes |
| T2–T3 | — | 147 → 210 | 230–250 | — | M | T3 ~200+ |
| T4 | 289–312 | 112 [86] | 203 | ~170–195 m | M-A | ~115–125 |
| T5 | 230 | 220–233 | — | sin frenada | M | ~230–250 |
| T6–T7 | 239 | 192 | 227 | ligera, 110 m | M | ~180–200 |
| T8 horquilla | 255–284 | 83 [57] | 178 | ~130–195 m | M | ~95–100 |
| T9–T10 | 236–247 | 75 [51] | 220 | ~130–145 m | M | ~85–100 |
| T11 | 293–297 | 142 [120] | 218 | ~150–210 m | M | ~150–160 |
| T12 rápida | 260 | 215–245 | 245–262 | levantar | M | ~250–270 |
| T13 | 265–269 | 131 [116] | 206 | ~135–240 m | M | ~125–135 |
| T14 | 296–316 | 120 [104] | 218 | ~150–205 m | M | ~105–115 |
| T15 | — | 148 → 177 | 204 | — | M | ~150 |
| Recta principal, punta | — | mediana 303–313 | — | — | M | 332 km/h (2024) |
| Recta T3→T4 / T10→T11 | — | 281–289 / 281–293 | — | — | M | ~300 / ~290–300 |

- Aceleraciones: T1 68 → 158 km/h en 100 m, 209 en 200 m, 246 en 300 m, ~285 a 500 m; T14 120 → 192 en 100 m.
- Tramo T14 → recta (700 m): 9,75 s de mediana; baja ~0,5 s del principio al final de la carrera (B; combustible y
  goma).
- Vuelta implícita del perfil: 95,4 s, coherente con la vuelta de carrera del juego (1:36–1:40; VR 1:32.417).
- Primera vuelta: vértice de T1 a ~11,5 s del apagado, mínimo 30–60 km/h por el tráfico (B).
- Patrón que **sí** sirve: tres horquillas lentas (T1, T8, T10) a 70–90 km/h; medias (T4, T11, T13, T14) a 110–145;
  tramos rápidos sin frenada (T5–T7, T12) a 190–260.

**OverCut hoy.** Traza física por era (WP2/WP3); punta de Baréin 2024 dentro de ±5 % de 332 km/h
(`speeds.test.js`); `snapshot.v` en m/s. Pero las curvas lentas van **más despacio que las reales** (Baréin mínima 49
frente a 71 km/h) y bajan una o dos marchas de más (SIM-FISICA §7), porque `race-physics.json budget` carga sobre
todo la curva lenta (1,5).

**Propuesta.** `curvas-lentas` (P2): test por curva numerada contra OpenF1 `car_data` (Baréin y Monza 2024 ya en
`engine/sim/__fixtures__/openf1-powertrain.json`; añadir Hungaroring o Mónaco 2024): mínima ±10 % y marcha en el
vértice ±1. Ajustar solo JSON: `mu.slow` por era, peso `budget.slow` (mover tiempo a curva media y frenada) y
`shift.downRpm`. Sin tocar código.

### 2.4 Motor, marchas y su sonido

**Observado y medido** (`audio` §1–2, `race-1` §4, `race-2` §8).

- Estructura: peine armónico de separación `c`; líneas fuertes 3c, 6c, 9c (y 15c). `c` = rpm/120 (B); encendido
  V6 = 6c = rpm/20. Ejemplos: recta 76:51 c = 96 Hz; vértice 76:56 c = 55,8 Hz.

| Magnitud (onboard, 9 tramos, 42.800 frames) | `c` Hz | rpm = 120·c | Conf. |
|---|---|---|---|
| Mínimo en curva lenta | 48–54 | 5.800–6.500 | B |
| Vértice T1 | 55,7 | ~6.700 | A/B |
| Mediana en carrera | 91 | ~11.000 | A/B |
| Punto de cambio, marchas altas | 98,5–99,2 | ~11.800–11.900 | A/B |
| Final de recta en 8.ª | 96–99 | ~11.500–11.900 | A/B |

- Tooltip de telemetría (4437 s): 7.ª, 269–271 km/h, ~11.000–11.100 rpm (A). 7→8 a 1:52:32 a ~280–300 km/h (A).
- **Escalera determinista**, idéntica en dos vueltas (Ferrari, 76:36–77:06):

| Cambio | `c` antes → después | Razón | Tiempo en la marcha previa |
|---|---|---|---|
| 4→5 | 93,3 → 80,0 | 0,856–0,860 | 1,97 s |
| 5→6 | 98,3–98,7 → 89,2–91,1 | 0,907–0,923 | 1,55–1,75 s |
| 6→7 | 98,7–98,9 → 88,3–88,7 | 0,893–0,898 | 1,07–1,82 s |
| 7→8 | 98,8–98,9 → 89,7 | 0,906–0,907 | 3,45–3,55 s |
| 8.ª hasta frenar | 89,7 → 96,4 asintótico | — | ~7,5 s; **sin limitador**, se aplana por arrastre |

- Por equipo (A): Ferrari ~11.850 rpm y 0,90–0,91; McLaren ~11.560 rpm y 0,866–0,876 (3→4: 0,815); Red Bull
  ~12.000 rpm y 0,863–0,876.
- Forma del cambio (A): deslizamiento de tono de **70–100 ms**. Ferrari: sin corte, «pop» +2/+3 dB 30–40 ms y
  después 1–3 dB menos. McLaren: muesca −3/−8 dB de ~40 ms.
- Levantar (A): tono −1 % cada 100 ms; banda 150–1.500 Hz −7/−9 dB en ~0,7 s.
- Reducciones (B): 4–6 golpes de gas en «^» (+6/+15 %, alguno +20 %, 80–150 ms) cada 0,25–0,5 s, más espaciados
  cerca del vértice (T1 76:53,66 / 53,95 / 54,18 / 54,51 / 55,45). Meseta de 0,3–0,5 s en el vértice (A).
- Marchas cada vez más largas (race-2): 1,0 / 1,2 / 2,2 / 3,2 s y la última ~5,4 s.
- Volante con la marcha legible solo en la vista HP (A).
- Real: límite reglamentario 15.000 rpm; en carrera 10.500–12.000; 8 marchas.

**OverCut hoy.** Tren motriz contrastado con OpenF1 (8.ª en la punta de Baréin). `race-powertrain.json:14` `shift` y
`eras[].engine.shiftRpm`: **un valor por era**, no por fabricante. En el pit lane la caja cambia con las reglas de
pista (no hay marcha fija de limitador); bajo SC no hay cambio anticipado. En sonido, `audio.json
eras[hybrid-v6-2022].engines` tiene una regla `match:{}` con `shiftRpm 12000` y `shiftCutMs 15` para todos;
`engineSynth.js shiftCutGain` es solo una muesca de ganancia y el tono salta en un fotograma (`smoothingSec 0.04`).
`nextGear` reduce con `downshiftShare 0.62` sin evento sonoro; al soltar gas solo hay crepitaciones aleatorias
(`crackleRatePerSec 9`).

**Propuesta.**
- `tren-por-pu` (P2): `race-powertrain.json eras[].manufacturers{}` como sobreescrituras `{shiftRpm, ratioScale,
  shiftCut}` medidas en OpenF1 `car_data` por piloto (2023+); `pitLimiter {gear, rpm}` por era; `shift.underSc`.
  Esquema en `engine/packs/schema/race-powertrain.schema.json`.
- `shift-shape-per-pu` (P1): `audio.json shiftProfiles[] {match: {constructorEngineId|manufacturer}, glideMs,
  transient: {kind: "pop"|"cut", db, ms}}`. `createEngineVoice` aplica `linearRampToValueAtTime` durante `glideMs`
  más la envolvente. Por era (NV): corte largo con caja en H antes de 1989, semiautomático después, *seamless* desde
  ~2008.
- `downshift-blips` (P1): `audio.json voicing.downshift {blipPct, blipMs, minSpacingSec}`; pulso de tono y ganancia
  en cada reducción (la dirección del cambio sale de `pose.gear` entre dos poses).
- Marcha en el volante: dentro de `onboard-mounts` (§2.5).

### 2.5 Cámaras onboard y de TV, y el realizador

**Observado y medido** (`cameras`).

Tipos de plano en carrera (688 planos, 4.072 s):

| Código | Tipo | n | Mediana | p25–p75 | % tiempo | Quién lo elige |
|---|---|---|---|---|---|---|
| TS | Pista baja/media con tele, panea y hace zoom | 406 | 3,3 s | 1,7–5,3 | 40 % | Realizador |
| TW | Pista alta / gran angular en curva | 75 | 2,4 s | 1,1–4,4 | 7,5 % | Realizador |
| KC | A ras de muro o piano | 2 | 1,7 s | — | <1 % | Realizador |
| HELI | Helicóptero/dron a 30–60 m, plano continuo | 8 | 26 s | 7–34 | 4,6 % | Usuario |
| CP | Onboard sobre el halo | 39 | 3,2 s* | 0,7–12 | 12 % | Usuario |
| RO | Onboard trasera sobre el airbox | 13 | 2,5 s* | 0,9–26 | 6,3 % | Usuario |
| HP | Vista del piloto | 18 | 5,5 s | 4,3–8,8 | 3,3 % | Usuario y realizador (insertos) |
| HS / SP | Lateral de cabina / pontón | 8 | 0,4 s* | — | 1 % | Usuario |
| MAP | Mapa 3D con etiquetas | 50 | 7,4 s | 4,0–11,8 | 12 % | Usuario |
| PL / GA | Pit lane / box | 18 / 6 | 5,8 / 7,3 s | — | 3,6 / 1 % | Automático en parada |
| RPL / STING | Repetición / cortinilla | 12 / 23 | 6,3 / 1,2 s | — | 2 % | Automático |

\* Mezcla dos usos: ciclar (mediana 0,4 s) y fijar (25–127 s; p. ej. 66:19 CP McLaren 126,6 s).

- **Densidad**: 21–24 planos por vuelta a 1x con realizador libre (101:56–103:34: 24 planos, 4,1 s de media) (A).
  Rachas TS/TW: mediana 15,7 s, máximo 170 s y 47 planos (114:55–117:46).
- **Relevo por posición**, no por tiempo: los inicios de plano caen en las mismas fracciones de vuelta (±0,01) en
  vueltas distintas (101:56, 118:25, 121:31). 18–22 zonas por vuelta con 1–3 cámaras alternativas (A). El plano dura
  lo que el coche tarda en cruzar la zona: corto en curvas lentas, largo en rectas. Zonas medidas en Baréin: 0,012,
  0,041, 0,095, 0,170 (frontal de frenada T1), 0,228 (T1, 60 planos), 0,282, 0,330, 0,353, 0,394, 0,512, 0,572,
  0,637 (frontal), 0,717 (frontal), 0,735–0,781, 0,840 (T11–T12, 46 planos), 0,938 (**plantilla de densidad, no
  posiciones**).
- **Óptica TS**: coche en el 15–35 % del ancho; tres variantes: frontal de recta (tele largo, 4–6 s), paso con
  barrido (gira hasta ~180° en un solo plano), seguimiento lateral (2–3 s, fondo barrido). TW altas en T1, T4, T8,
  T10, planos de 1–4 s.
- **A quién sigue** (A): siempre al **coche enfocado por el usuario** (marcador del minimapa continuo entre cortes;
  Norris en 63:44–66:17 sin salir de la TV). En peleas abre el encuadre para meter a los dos y hay ráfagas de planos
  < 1 s en la misma curva (57:56–58:20, 98:35–98:38) (M).
- **Onboards** (`cameras` §3; posiciones inferidas, M-B):

| Cámara | Posición (ejes del coche) | FOV h | Notas |
|---|---|---|---|
| CP halo | Eje central, ~1,0 m del suelo, detrás y encima del halo | ~85° ±10 | Barra del halo en el tercio inferior, horizonte al ~30 % |
| RO trasera | Encima del airbox mirando atrás, ~1,0 m | ~70° | Alerón trasero ~40–45 % del ancho |
| HP piloto | Ojos, ~0,70–0,75 m, eje central | ~100° | Vibración y cabeceo; marcha legible en el volante |
| HS lateral de cabina | Al lado del cockpit, altura del casco | ~70° | — |
| SP pontón | ~0,6 m de alto, ~0,5 m fuera del eje | ~80° | — |
| CU primer plano | Frontal al casco | tele | Solo en la repetición de meta |

- **Insertos HP** de 3–16 s, 1–2 por vuelta en rectas, en el último tercio (112:31–119:30). Que sean del realizador
  es inferencia (M).
- **Secuencia de parada** (4 veces, A): TS entrada 4–5 s → PL alto 5–6 s → GA mecánicos esperando (llegan ~2,7 s
  antes que el coche) 5–9 s → PL saliendo del box ~10,7 s → PL salida 3–7 s → TW incorporación 1–2 s. ~40 s en 5–7
  planos. Los eventos de otros coches salen como banner y **no cortan** la secuencia (race-2 §2.3).
- **Salida de garaje en sesión**: cadena de 5–6 cámaras con cortes cada 1–3 s (pit fija que gira → muro del pit →
  persecución → pórtico → alta de incorporación) y vuelta a la cámara por defecto.
- **Repeticiones** (10 medidas): cortinilla 1,2 s, contenido 9–22 s (mediana ~17 s), cortinilla 1,2 s; 1–3 ángulos.
  HUD oculto salvo etiqueta, piloto y botón de saltar. **La simulación se pausa** (el coche avanza 0,007–0,037 de
  vuelta en 14–23 s). Disparadores: adelantamiento propio (87:14 tras aviso en 87:09), bloqueo de rival (59:30),
  abandono/amarilla con plano del garaje del equipo (91:45, 104:37), parada de un rival (78:33), meta con primer plano
  (123:28).
- **Previa y salida**: SC aparcado (7,9 s), parrilla (6,3 s), piloto (6,9 s), coche (3,1 s), reloj (4,6 s), muro,
  cortinilla 1,3 s, parrilla alta 16,7 s durante el semáforo, frontal alto en la salida, 4 planos de 0,5–3,3 s en
  T1, TW alta de T2–T3 13,3 s. La primera vuelta es la de más cortes.
- **Meta**: repetición del cruce → primer plano del piloto (~7–8 s) → realización por coche que termina (1,3–2,5 s
  en `cameras`, 3–7 s en `race-2`; tomar el rango 1,3–7 s como referencia).
- **Controles**: vista (mapa / carrera / datos) separada del selector de cámara (anterior/siguiente). Orden de
  ciclado deducido CP → RO → HP/HS/SP → HELI → TV (B). Cambio de coche con la onboard activa (58:47–58:50,
  0,4–1,4 s por coche). Pausa y menú de parada congelan la imagen de fondo en gris.

**OverCut hoy.** Rig de pista ajustado a la malla GLB con línea de visión (`fitRig`), ocho modos
(`three/cameras.js:22`). Pero:
- En TV, `LiveRace.js:419-432` **cambia el coche enfocado** por `director.current.id` (atacante de una pelea o el
  líder) y lo renueva cada 7 s de reloj real; ese id llega a `Race3D`, minimapa y audio
  (`LiveRace.js:464,600,621,694`). El clic en la torre no hace nada en TV.
- Colocación por reglas fijas en código (`cameras.js:42-72`: frenada a 22 m y 5 m de alto, curvas a 38/52/68 m,
  rectas cada 260 m, grada, cable). Elige la de más prioridad (`cameras.js:232,258-261`), sin variantes.
- FOV por ancho fijo y `lookLag 14` (`cameras.js:276-281`); las peleas solo se encuadran en el mapa 2D.
- Onboards `tcam` (68°), `tcamRear` (64°), `visor` (82°), `nose` (74°) con desplazamientos en código
  (`cameras.js:160-174`); faltan HS, SP y CU; vibración con `Math.random` (`Race3D.js:476-479`, rompe la
  reproducibilidad visual); el volante no muestra la marcha.
- Una sola lista cíclica mezcla vistas y cámaras (`LiveRace.js:74`, `SessionLive.js:362`); vista por defecto TV en
  todas las sesiones (`LiveRace.js:302`, `SessionLive.js:170`).
- No hay repeticiones, ni secuencias de parada/salida/meta, ni cámaras de pit lane, ni insertos.

**Propuesta.**
- `director-follow-focus` (P1): `components/director/directorState.js*`, puro, sin React:
  `directorState(focusId, rows, events, rig, clock) → {cameraId, subjectIds[], shotKind, reason}`. El coche
  enfocado lo elige el usuario; «seguir la acción» es una opción de `data/balance/broadcast.json*`, apagada por
  defecto. Se borra el 7 del código.
- `camera-zones` (P1): `broadcast.json rigTemplate` (tipos `braking`, `corner`, `straight`, `headOn`, `passPan`,
  `lateralTrack`, `highWide`, `grandstand`, `cable` con `dist`, `height`, `width`, `priority`, `weight`) y
  `data/circuits/<splineId>/camera-zones.json*` `{zones:[{fromM,toM,cams:[...]}]}` generado desde `fitRig` y editable.
  Elección por peso con semilla y sin repetir la variante de la vuelta anterior. Test: 18–24 planos por vuelta en
  Baréin a 1x, contados con los eventos de cambio de cámara (no con vídeo).
- `tv-lens-behaviour` (P2): `framing {minShare, maxShare, critDamp}` por tipo; variantes `passPan` y
  `lateralTrack`; ancho de encuadre para dos si hay rival a menos de `battleGapSec`.
- `pit-sequence` (P1): cámaras `pitEntry`, `pitLaneHigh`, `garage`, `boxExit`, `pitExit`, `merge` sobre la trazada
  del pit de `engine/sim/pitLane.js`; `broadcast.json sequences.pitStop` y `sequences.garageExit` como listas
  `[{trigger: "pitPhase:X", cam, minSec, maxSec}]` con prioridad sobre zonas y eventos ajenos; `crewLeadSec` adelanta
  el plano de los mecánicos.
- `replays` (P1): `components/replay/replayBuffer.js*` + `ReplayOverlay.js*` (cortinilla propia, ángulos del rig
  según la posición del evento, etiqueta, piloto, saltar). `broadcast.json replay {bufferSec, stingSec, maxSec,
  triggers, pauseSim}`. Pausa del reloj de la vista como el botón de pausa.
- `onboard-mounts` (P1): `data/balance/cameras.json*` `onboard[] {id, mount{ahead,side,up,pitchDeg}, fovDeg, near,
  shake{perMs,max}, eras}` sobre `spec.head`/`spec.front` del modelo; añadir `cockpitSide` y `sidepod`; CU solo en
  repetición; vibración con ruido determinista (semilla + tiempo), no `Math.random`; marcha en el volante desde
  `pose.gear`. Por era (NV): halo desde 2018; T-cam desde los 90; antes de ~1985 solo cámaras de pista.
- `user-camera-lock` (P1): en `Broadcast.js` `PlaybackBar`, selector de **vista** (Mapa, TV, Cámara) y de
  **cámara** (lista de `cameras.json` filtrada por era) + coche anterior/siguiente por posición. En vista Cámara el
  realizador no corta. `broadcast.json cycleOrder` y `defaultView` por sesión (libres: mapa).
- `onboard-inserts` (P3): `broadcast.json inserts.onboard {perLap, minSec, maxSec, zoneKinds}`.
- `start-finish-scripts` (P2): `sequences.preRace` (saltable), `sequences.start`, `sequences.finish` con
  `finisherShots {minSec, maxSec}`; SC aparcado en la parrilla solo desde 1993.

Máquina de estados del realizador (de `cameras` §9, adaptada a OverCut):

```
TV_AUTO ── botón vista ──► MAP           TV_AUTO ── selector cámara ──► USER_CAM (sin cortes automáticos)
TV_AUTO.ZONE_SHOT(i, cam)  ── el coche enfocado sale de la zona i ──► ZONE_SHOT(i+1, cam por peso con semilla)
ZONE_SHOT ── battle[focus] ∈ {ATTACKING, DEFENDING} y rival en cuadro ──► BATTLE_CUTS (TW/TS misma curva, 0,5–1,5 s)
ZONE_SHOT ── inserts.onboard (recta) ──► ONBOARD_INSERT(HP) ──► ZONE_SHOT
cualquiera ── pitPhase del coche enfocado ──► PIT_SEQUENCE ──► TV_AUTO
cualquiera ── evento de replay.triggers ──► cola REPLAY (una a la vez; sim en pausa) ──► TV_AUTO en la zona actual
FINISHED  ── evento finished ──► plano corto del coche que cruza (finisherShots)
```

### 2.6 Trazada ideal

**Observado** (`dynamics` §3–4, M): los coches abren por fuera antes de frenar, cortan al vértice pisando el piano
interior y salen usando el piano exterior. En recta van por un lado (en la principal, junto al muro de boxes). La
trazada es estable y sin ruido lateral: un spline fijo con desvíos solo en batalla. El seguidor va en la estela a 2–3
largos (≈11–17 m) y, para atacar, se abre ~1 ancho de coche (~2 m) en ~1,5 s.

**OverCut hoy.** Ya resuelto en su base (SIM-FISICA §3.1, WP1 y WP9): trazada de curvatura mínima dentro de la
anchura medida (`splines.json line`, `engine/racingLineSolver.js`), la vista dibuja la trazada del motor y recorta
trazada + lateral al asfalto. Doblados que se apartan al exterior (`race-sim.json blueFlags.yieldShare`). Pérdida por
ir fuera de trazada y *marbles* (`race-physics.json lateral.marbles`).

**Propuesta.** Ningún paquete propio. Lo que falta cuelga de otros:
- Carril de estela y de ataque con velocidad lateral limitada (`no-solape`: `lateral.js`, `followGap`).
- Zonas de piano (`kerbs-wind`), que también usa la orden de evitar pianos (`tacticas`).
- Que la anchura usada para la restricción lateral sea la medida (`splines.json`), no la media anchura fija de 5,5 m
  que aún usa el anti-solape (`no-solape`).

### 2.7 Adelantamientos y defensas

**Observado y medido.**

| Hecho | Tiempo | Conf. |
|---|---|---|
| LEC → NOR en T1 con DRS y gomas nuevas: rebufo en la recta, ~3 s rueda con rueda (LEC dentro), LEC delante en la frenada, NOR se pone detrás; radio de pase y torre reordenada; banner y repetición onboard | 5220–5243 s (V26) | A |
| SAI y PER: estela a 2–3 largos, apertura de ~2 m en 1,5 s, lado a lado en T1 con ½ coche de solape y 0,3–0,7 m de hueco; el de fuera vuelve a pasar en la salida de T1–T3 | 5459–5476 s | A/M |
| NOR–LEC se pasan 4 veces en 3 vueltas | 91:17–94:34 (V31–33) | A |
| SAI recorta de 3,46 s a 0,16 s en ~7 vueltas (~0,45 s/vuelta, S frente a M) y está 3–4 vueltas a 0,2–0,6 s antes de pasar | 109:00–115:48 | A |
| LEC pasa a SAI y VER en la misma vuelta (T1 y T4); torre llega a marcar +0,000; tres en paralelo sin solape | 117:56–118:28 (V54) | A/M |
| El banner llega ~13 s después del cambio en la torre (orden a 115:49, banner a 116:01) | 6948 → 6961 s | A (retardo) / M (causa: confirmación en checkpoint) |
| Ciclo de radio del ataque: ganando al rival (con gap) → adelantamiento fallido → adelantamiento conseguido; mensajes propios de posición perdida | race-2 §4 | A |
| VER pasa a SAI aprovechando gomas frías de vuelta de salida (95 °C) | 107:10 (V44) | A |
| Compañeros: radio de «defiende la línea», orden de no pelear; luego en fila a 0,2–0,5 s | 4425–4440 s (V13) | A |
| 11 banners de pase o incidente en 34 min; rachas de cortes < 1,5 s en las peleas | race-2 §4, cameras §6 | A |
| DRS en verde en el panel dentro de rango | 118:04, 118:16 | A |

**OverCut hoy.** WP4 parcial (SIM-FISICA §7): `duel.js` con lado, cobertura, frenada tardía y `alongside`; en recta el
atacante gana como mucho un 2 % (`race-sim.json duel.straight`). Pases por carrera calibrados con f1db
(`measurePasses.js`). Faltan:
- Estado de batalla (`ERaceBattleState` de SIM-FISICA §3.5) y eventos de intento, defensa o contraataque. Eventos de
  hoy: `pass`, `swap`, `contact`, `mistake`, `lead`, `fastest`, `call`, `pit`, `sc`, `vsc`, `red`, `restart`,
  `yellow`, `investigation`, `penalty`, `flag`, `issue`, `dnf`. El pase se emite al cambiar el orden
  (`stepRace.js:1017`), no en un checkpoint.
- Al agotar el duelo, `stepRace.js:1489` coloca al atacante con `P = P_otro + minGap × 1,05`: **salto de ~8 m**
  visible a 1x.
- `SWITCHBACK`, intentos por defensor y enfriamiento por pareja (solo `cooldownSec` global), apretón y tres coches
  (`maxClaim 3` sin geometría).
- `setDefence` y `setOvertakeRisk` solo en el modo por pasos (`stepRace.js:1815,1822`).

**Propuesta.**
- `eventos-duelo` (P1): `battle[i]` en sim e instantánea; eventos `duel` y `pass.confirmedAt` (§1.7);
  `race-physics.json duel.followGap/attackGap`; radio RF-CMD-03 atada a esos eventos con umbrales en
  `race-sim.json radio`.
- `duelo-geometrico` (P2): estado `SWITCHBACK` (`duel.switchback.gapMetres`, intentos), `attempts[i][a]` con
  enfriamiento por pareja, reclamo con hasta 3 coches y **una tirada de incidente por reclamo** (interior a la
  entrada, exterior a la salida, apretón). `race-physics.json duel.switchback/squeeze/attemptsPerDefender`. Pases por
  vuelta calibrados con `equivalence.test.js` y f1db por era; pases de ida y vuelta con OpenF1 `position/intervals`.
- `tacticas` (P2): agresividad y defensa en los dos modos (§2.8).
- `event-banners` (P1): banner con el retardo real de confirmación (§2.12).

### 2.8 Batería, neumáticos, combustible y pilotaje

**Observado y medido** (`race-1` §7–8, `race-2` §3, `practice-quali` §6; valores del juego, referencia).

| LEC | V1 | V3 | V9 | V13 | V17 | V22–24 | V26 (nuevo) |
|---|---|---|---|---|---|---|---|
| Desgaste restante | 97 % | 95 % | 82 % | 74–78 % | 64 % | 50–54 % | 95 % |
| Temp. neumático | 119 °C | 121 °C | 117 °C | 118–122 °C | 118 °C | 116–125 °C | 118 °C |
| Δ combustible | +1,6 kg | +1,6 | +1,1 | +0,7–0,8 | +0,8 | +1,0 | +0,6 |
| Batería | 82 % | 46 % | 35 % | 45–49 % | 45 % | 75–87 % | 67 % |

- Desgaste: M ~2–2,3 %/vuelta; S ~3,0–3,4 %/vuelta (más al atacar con ritmo 5). Real: M dura 18–25 vueltas en Baréin.
- Temperatura: blandos nuevos 70 → 75 → 95 → 106 → 109 °C en ~100 s (106:20–108:00), radio de «temperatura óptima»
  a 107:56; en rojo por encima de ~120–122 °C; 112–126 °C en carrera; radios de sobrecalentamiento.
- Combustible: ~1,8 kg/vuelta en el plan de tandas (15 v = 27,2 kg; 18 v = 32,6 kg; vuelta lanzada de Q = 5,7 kg);
  carrera 103,9–104,4 kg para 57 vueltas; delta en kg que baja al atacar (+0,9 → +0,1), radios de *lift & coast*.
  Real: 110 kg máx.; 110/57 ≈ 1,93 kg/vuelta.
- ERS: desplegado X/4,0 MJ y recuperado Y/2,0 MJ por vuelta; 4 modos (desplegar, neutro, recargar, recuperar) y
  casilla de **ayuda de ERS en batalla**. La batería oscila 3–100 % por vuelta y baja en el ataque (25 % en el pase de
  118:04). Coincide con el reglamento (MGU-K 120 kW, 4 MJ/2 MJ).
- Ritmo: 5 niveles con efecto sobre tiempo y desgaste; combustible: 3 niveles en carrera (5 puntos en libres).
- Tácticas: agresividad al adelantar (alta/media/baja), defensa (siempre/neutra/rara vez), evitar pianos de riesgo,
  aire limpio, no pelear con el compañero; confianza del piloto con efectos +1/+2 sobre 100 y probabilidad de
  incidente.
- Libres: aclimatación, conocimiento de piezas y satisfacción con el reglaje (ventana óptima que se estrecha con el
  *feedback*, «???» hasta rodar); confianza inicial tras L3 (LEC 70 %, SAI 68 %).
- Asignación de neumáticos 2024 en seco 8 S + 3 M + 2 H (coincide con FIA); compuestos C3/C2/C1 (coinciden).

**OverCut hoy.** ERS/KERS con los límites FIA, combustible por caudal, desgaste por compuesto con *cliff*, clima
ERA5, doce atributos de piloto de f1db (todo mejor que el juego). Pero la temperatura del neumático es una variable
sin unidad 0–1 actualizada **por vuelta** (`race.js:1179-1203, 1246-1248`, deriva ×0,55) con literales en código
(0,4, 0,72, 3,2, 2,5, 2,2, SC 0,3); `aheadColdTyre` es una bandera por vuelta (< 0,38). `commandsFor`
(`rules.js:253-272`) no tiene evitar pianos ni ayuda de ERS en batalla; el aire limpio solo lo usa la IA. Panel del
piloto: neumático como `Meter` 0–100 sin °C, combustible en vueltas, batería en MJ; sin temperatura de motor, ventana
de parada, pestañas ni telemetría (`LiveRace.js:736-902`).

**Propuesta.**
- `termica-neumatico` (P2): `engine/tyres/thermal.js*` con dos nodos (superficie y carcasa) en °C por paso; calor
  por g lateral/longitudinal y modo de ritmo; enfriamiento por aire y pista; `data/balance/race-tyres.json*` con
  esquema: `blanketC` por era (2024: 70 °C según Pirelli; mantas por era NV), `windowC`, `gripCurve` por compuesto y
  proveedor. El modo rápido integra la misma ecuación por vuelta (equivalencia §4.2). Instantánea `tyreC`.
- `tacticas` (P2): `setTactics(state, carId, {avoidKerbs, cleanAir, battleAssist})` en los dos modos;
  `race-sim.json tactics` (piano: pérdida en curva y menos errores/daños de suelo; aire limpio: hueco objetivo;
  ayuda en batalla: despliegue a < 1 s dentro de `energy.js`); `commandsFor` por era (`battleAssist` solo con
  ERS/KERS).
- `driver-panel-units` (P1): pestañas en `DriverCard` (estado, tácticas, telemetría, boxes); kg de combustible,
  batería en %, tooltip con `pose.v/gear/rpm`, ventana de parada desde `strategyCall`; bloques solo en su era
  (batería desde 2009, delta de combustible solo sin repostaje). °C del neumático cuando exista `tyreC`.
- `trabajo-garaje` (P2): §2.12.

### 2.9 Detección mutua y no solapamiento

**Observado** (`dynamics` §4, `race-1` §5, `race-2` §4): nunca se ven siluetas solapadas (A). Lado a lado: 0,3–0,7 m
de hueco lateral, ½ coche de solape, ~3 s (A/M). En la frenada el de detrás se queda a ~1 coche o espera en la
trazada; la cesión es del de fuera en el vértice. Tres en paralelo en la V54 sin solape (M). Ningún contacto en todo
el tramo revisado. Inferencia: una «burbuja» por coche que nunca se atraviesa; al llegar a la distancia mínima el de
atrás va a la estela o a un carril lateral de ~1 ancho.

**OverCut hoy.** `stepRace.js:1531-1539` solo mira al coche de delante (`sim.ahead[i]`) y separa a
`carWidth = 2,0 m` de **centro a centro** (`race-sim.json:182`): con coches de 2,0 m, holgura 0 (ruedas que se
tocan). La corrección es un salto de lateral en un paso. El tercer coche no se compara con el primero. Salto de ~8 m
al cerrar el duelo (`stepRace.js:1489`). Ancho fijo para todas las eras y media anchura fija de 5,5 m. En la vista,
`Race3D.js:315-320` respeta `pose.lateral`; en la repetición rápida separa 2,3 m a quien está a menos de 9 m
(constantes en código) y no hay ninguna comprobación de solape.

**Propuesta.**
- `no-solape` (P1): `engine/sim/lateral.js*` (WP4). Vecinos a menos de `carLength` por delante y por detrás,
  ordenados por `P` (O(n) sobre el anillo). Restricción `|lat_i − lat_j| ≥ carWidth(era) + lateral.clearanceMetres`
  (0,3–0,5 m) resuelta con objetivo lateral y `nV` limitado (`lateral.maxRate/maxAccel`). Si no cabe en la anchura
  medida de `splines.json`, el de detrás levanta (velocidad del de delante), nunca salta. El pase se completa por
  velocidad (`passDefenderLoss` hasta `minGap`), sin mover `P` a mano. `race-physics.json eras[].carWidth/carLength`
  (fuente: reglamento técnico FIA por año; 2,0 m hasta 1997 y desde 2017, 1,8 m entre 1998 y 2016, NV) y
  `lateral.clearanceMetres`; `lateral` migra de `race-sim.json` a `race-physics.json` (SIM-FISICA §3.10).
  Test con 64 carreras (2024 y 1988): distancia entre cajas ≥ 0 en todo paso, holgura en paralelo ≥ 0,3 m en el
  99 % de los pasos, avance de `P` por paso ≤ `v·dt + ε`.
- `no-overlap-view` (P1): pasada de seguridad en `Race3D.step` con cajas orientadas entre vecinos (anchos de `spec`) y
  `lateral.clearanceMetres`; contador de correcciones en desarrollo (para ver bugs del motor, no taparlos); el 2,3 m y
  los 9 m pasan a datos.
- Medida real de huecos laterales: OpenF1 `location` (x, y a ~3,7 Hz) en duelos 2023–24.

### 2.10 Daños y errores

**Observado.** Errores: trompo de un rival en T14 (V1, 3490–3510 s) con amarilla de sector y repetición; bloqueos en
T11 (V2, 3565 s, cae a P18), T4 (V17, 4605 s) y T9 (GAS, V45); trompo de OCO (V41, 104:28) con humo, ida a la
escapatoria asfaltada, plano del garaje y vuelta; «el rival se ha ido largo»; chispas al tocar fondo (4011 s,
107:54). Choque múltiple en la V31 (91:37–91:43; GAS, Alpine, Sauber, BOT): amarilla «SECTOR 2», rombo en las filas,
banner con repetición y plano del garaje de Alpine, **sin SC ni VSC**; investigación de comisarios (~92:35). Fallo
mecánico (V23): el coche pierde dos posiciones en una recta, adelantado uno por cada lado. Daños: solo radio («tiene
daños») y humo en repetición; ninguna pieza suelta a la vista (A).

**OverCut hoy.** WP8 parcial: error tirado por vuelta y pagado en su curva según tipo (`race-physics.json mistake`):
trompo con `v = 0`, salida ancha al borde; `snapshot.incident`. Incidentes, salida y fiabilidad calibrados con f1db
(`engine/incidents.js`, `race-reliability.json`). `development/damage.js` pasa el daño a piezas al acabar. Faltan:
estado longitudinal `LOCKUP`, trayectoria de reincorporación, ruido por curva, **límites de pista** (ninguna
referencia en `engine/` ni en `data/`), daño por pieza en la instantánea.

**Propuesta.**
- `errores-visibles` (P2): `lon[i]` con `LOCKUP`/`SPIN` en la instantánea; `mistake.recovery.path` (sale y vuelve
  por la escapatoria); ofensa `trackLimits` por era (`pending`) con avisos, sanción en carrera y borrado de tiempo en
  clasificación; probabilidad por agresividad, piano y neumático. Tasa con OpenF1 `race_control` (TRACK LIMITS,
  2023+).
- `danos-visibles` (P3): `snapshot.damage {frontWing, floor, puncture}` con s/vuelta; radio con sugerencia de cambiar
  el alerón (etapa `wing` de `pitStop.js`); restos como objeto con riesgo de pinchazo para quien pasa.
- `amarilla-sector` (P2): `yellow {sector, marshalPost, double}`; doble amarilla para coche parado en pista; en
  sesión, vuelta abortada o borrada según la era (`yellowLapDeleted`, `pending`); duración desde la limpieza.
  Fuente: FIA Sporting Regulations e ISC Apéndice H.
- Repeticiones de error y plano del garaje: `replays` (§2.5).

### 2.11 Safety car y VSC, con sus velocidades

**Observado.** **No aparecen en el vídeo** (barrido de la cabecera a 1–2 Hz y de mosaicos en toda la carrera). Solo:
SC aparcado tras la parrilla (55:54, 7,9 s de plano); informe previo con pérdida en pit lane **22 s en verde y 16 s con
SC** y **75 % de probabilidad de SC** (10:30); estructura del juego por fases (SIM-FISICA §1, n.º 18): esperando en
boxes, recoger al líder, agrupar, dejar pasar a los doblados, listo para terminar, entra. El choque múltiple de la V31
no provocó SC. Ninguna medida de velocidad, delta, agrupamiento, sonido ni cámara bajo SC/VSC sale de este vídeo.

**OverCut hoy.**
- SC: `stepRace.js:802-806` limita a cada coche a `1/(baseLap × 1,42)` y el que está a más de 25 m recupera a 1,6×
  (`race-sim.json:158-164`). No hay coche de seguridad en pista, ni fases, ni reanudación con el líder marcando el
  ritmo, ni prohibición de adelantar hasta la línea. Duración sorteada en vueltas: `scLaps [3,5]`
  (`race-eras.json:141`, `race.js:1806`). El factor es el mismo en todas las eras y circuitos.
- VSC: `stepRace.js:804` `rate = min(rate, 1/(baseLap × 1,36))` uniforme; sin delta por minisector, sin aviso de fin,
  vuelta a verde por vueltas enteras (`vscLaps [1,3]`).
- Reglas por era: `era-defaults.json` solo `safetyCar` (desde 1993) y `vsc` (desde 2015).
- Vista: SC dibujado 90 m delante del líder (`LiveRace.js:450-455`, `Race3D.js:418-430`), barra de luces sin
  parpadeo (`Race3D.js:48`), sin voz, sin banner de «entra esta vuelta», sin delta de VSC.

**Velocidades: de dónde salen.** No se fija ninguna cifra en este documento. Se miden:

| Magnitud | Fuente | Cómo |
|---|---|---|
| Ritmo bajo SC por circuito y era (`safetyCar.lapFactor` del modo rápido, ritmo del coche de seguridad en el modo por pasos) | OpenF1 `laps` + `race_control` (2023+); FastF1 `track_status` (2018+; códigos 4 = SC, 6 = VSC, 7 = VSC terminando, verificar) | Mediana del tiempo de vuelta del líder en vueltas completas bajo SC / su vuelta en verde, por circuito |
| Ritmo bajo VSC (`vsc.deltaFactor`) | Igual, vueltas bajo VSC | El delta por minisector es el tiempo de la traza × factor; el piloto va hasta `vsc.marginSec` por encima según su precisión (RF-STF-02) |
| Fin de VSC (`vsc.endingWarnSec`) | FIA Sporting Regulations (VSC, 2015+); OpenF1 `race_control` («VSC ENDING») | Entre el aviso y el verde (rango 10–15 s, NV) |
| Separación máxima del tren | FIA Sporting Regulations (artículo del SC de cada año) | 10 largos de coche (regla vigente; verificar años) |
| Pérdida en boxes bajo SC | **Derivada**, no configurada | Tiempo de pit lane − tiempo de recorrer el mismo tramo a ritmo SC; `previewPit` devuelve `lossGreen` y `lossSc` |
| Coche de seguridad por era | Fuentes publicadas (NV) | `safetyCar.cars[] {from, to, powerKw, topKmh, source}` (Porsche 911 1993–95, Mercedes desde 1996, Aston Martin desde 2021, NV) |
| Probabilidad y duración | OpenF1/FastF1 (2018+); antes, f1db si lo trae o fuentes publicadas (NV) | `calendar[].scRate`; duración por limpieza del incidente |

**Propuesta.**
- `sc-fisico` (P1, XL): `engine/sim/safetyCar.js*` con un coche más en el anillo (`sim.sc`) que sale por el pit lane
  (`pitLane.js`), con su traza física de coche de calle de la era. Fases `DEPLOYED`, `PICKUP`, `TRAIN`, `UNLAPPING`,
  `IN_THIS_LAP`, `RESTART`. Tren a ≤ 10 largos con `traffic.minGapMetres` (usa `lateral.js`). En `RESTART` el líder
  marca el ritmo desde la línea de SC 1 y nadie adelanta hasta la línea de control. `race-sim.json safetyCar.phases`
  y `safetyCar.cars[]` con esquema `engine/packs/schema/race-sim.schema.json*`. Modo rápido con `lapFactor` calibrado
  por circuito y era. Instantánea `sc` (§1.7). La equivalencia §4.2 sigue excluyendo vueltas de SC. Tests: nadie
  adelanta bajo SC salvo los doblados autorizados; tren agrupado (≤ 10 largos) antes de `IN_THIS_LAP`; misma semilla,
  mismo resultado.
- `vsc-delta` (P1): delta por minisector, aviso de fin y verde en cualquier punto; duración en segundos; instantánea
  `vsc`.
- `reglas-sc-era` (P2): claves cerradas `pending` hasta leer cada reglamento: `scUnlapping`, `scPitClosed` (2007–08,
  verificar), `scRestartLine` (`control`/`sc1`), `scOvertakeBeforeLine`, `vscEndingWarn`; `rulesFor` las expone,
  `safetyCar.js` las aplica; `rules.test.js` recorre las 38 temporadas (criterio 7.2).
- `duracion-neutralizacion` (P2): incidente `{s, onTrack, severity}`; `race-sim.json cleanup {base, perSeverity,
  offTrackFactor}`; coche parado en pista → SC, en escapatoria → VSC o amarilla; SC termina cuando acaba la limpieza
  y el tren está agrupado; `calendar[].scRate`.
- `sc-pose-from-sim` (P1): la vista dibuja `snapshot.sc` (posición, velocidad, luces con parpadeo de frecuencia en
  `broadcast.json`), `sequences.scDeploy` (plano del SC saliendo de boxes), banner «SC entra esta vuelta», delta de VSC
  en la tarjeta (`hud.json sc`).
- `sc-vsc-sound` (P2): el sintetizador ya baja solo con `pose.rpm/gear` (PT-1 `shift.underSc`); voz del SC por era
  (`audio.json safetyCar {formula}`) y aviso de interfaz con «radio» al desplegar y retirar.
- Coherencia: SC desde 1993, VSC desde 2015 (SRS §6.2).

### 2.12 Interfaces y botones

#### 2.12.1 HUD de sesión y de carrera (V-A salvo indicación)

| Zona | Juego (función) | OverCut hoy | Backlog |
|---|---|---|---|
| Arriba izquierda: torre | 20 filas; cabecera de vuelta/estado; modos con flechas: intervalo, líder, neumático (compuesto + %), última vuelta, sectores (barras amarillo/verde/morado), paradas, estado (Q3). Etiquetas: vuelta de salida/entrada, en boxes, +1 vuelta, rombo de incidente, morado de VR, cuadros al terminar. Fila propia resaltada. Q: zona de eliminación en rojo (16–20 en Q1, 11–15 en Q2) con marcador; reloj rojo desde ~3:00 y en 0:00 | `TOWER_MODES = ["interval","gap","tyres"]` (`LiveRace.js:104`); `Broadcast.js:52-131` sin sectores, última vuelta, paradas, rombo ni cuadros; neumático sin % | `tower-modes` |
| Cabecera con bandera | Amarilla con «sector N», alterna bandera/sector/vuelta; 2–19 s; también en libres (P1 54:23) | Franja por curva (`LiveRace.js:580-581`); torre sin color; sesiones solo verde y cuadros (`SessionLive.js:372`) | `flag-header-sectors` |
| Arriba centro: banners | Pase, bloqueo, trompo, choque, investigación, VR (morado, nombre y tiempo), DRS activado, 15/10/3 vueltas, última vuelta, meta; con «ver repetición»; 3–5 s; subrayado animado | Solo «Se apagan los semáforos» (`LiveRace.js:635`), cuadros (636-641) y chip de pelea (643-648) | `event-banners` |
| Arriba derecha: condiciones | Hora local con segundos, aire, previsión en N min con % de lluvia, pista °C, agua en mm, goma (muy baja → alta) y agarre (normal → alto) | Hora fija 15:00 (`LiveRace.js:512`), aire = `trackTemp*0.62+4` (`:591`), goma = `displayLap/(laps*0.55)` (`:514`), mm = `wetness*3` (`Broadcast.js:160`), umbrales en código (`:128-129`) | `status-strip-data` |
| Derecha: minimapa | Puntos con posición; coches propios con círculo | Existe | — |
| Abajo izq./der.: panel por coche | 4 pestañas (estado, tácticas, telemetría, boxes); desgaste %, temp. °C con tendencia (rojo > ~120 °C), Δ combustible kg, temp. motor 104–113 °C, batería % con modo, puntos de ritmo y mezcla; DRS verde en rango; ventana de parada (ÓPTIMA → ABIERTA); fases de vuelta en sesión; plegado al terminar | `LiveRace.js:736-902`: Meter 0–100, vueltas de combustible, MJ; sin pestañas, motor, ventana ni telemetría | `driver-panel-units`, `vuelta-enfriamiento` |
| Encima del panel: radio | Retrato, título, frase; cada 5–20 s; muchas piden una acción | Solo texto en `Feed` (`Broadcast.js:209`) | `radio-ui-sounds`, `eventos-duelo` |
| Abajo centro | Pausa, `< Nx >` (1/2/4/8/16), rótulo grande al cambiar, cámara anterior/siguiente | Carrera `[1,2,4,8,16]` empieza a 4x/8x (`LiveRace.js:46,300`); sesiones `[1,4,10,30,60]` a 30x/10x (`SessionLive.js:33,169`); lista única vista+cámara | `speeds-unify`, `auto-velocidad`, `auto-speed-drop`, `user-camera-lock` |
| Ventanas de mando | Ritmo 5 niveles con gráfico de vida; combustible 3 niveles; ERS 4 modos + ayuda en batalla; tácticas; tooltip de telemetría (~1,2 s) | Órdenes parciales; sin tácticas completas | `tacticas`, `driver-panel-units` |
| Diálogo de parada | Pausa la sesión (0,35 s de juego en 6 s de vídeo); juegos de neumáticos con %, montado frente a planificado (vida, Δ por vuelta), regla de 2 compuestos con contador, piezas, penalizaciones, tiempo estimado y total, gráfico de estrategia, ventana, posición estimada (+N), selector de vuelta, avisos de conflicto de estrategia y de doble parada; distancia en km a la entrada | Botones de compuesto en la tarjeta (`LiveRace.js:845-860`), sin pausa ni previsión | `pit-widget-and-dialog`, `prevision-parada` |
| Widget de parada | Tiempo en pit (desde la línea) → tiempo parado en rojo → saliendo → total congelado en la línea de salida; posición bajando en directo | `BOX x.xs` sobre el coche (`Race3D.js:518-519`) | `pit-widget-and-dialog` |
| Auto-velocidad | Baja sola a 1x (8x → 2x → 1x) al entrar el coche propio, con los cuadros de Q, al sacar el coche; menús de boxes y repeticiones pausan | Solo manual (`LiveRace.js:300,704`; `SessionLive.js:169`) | `auto-velocidad`, `auto-speed-drop` |
| Final | «N vueltas para el final» a 15/10/3 (~1 vuelta, rojo), «Última vuelta», «Terminado»; cuadros por fila | Contador (`LiveRace.js:655-657`), banner de cuadros, `lv-card__status` | `vuelta-enfriamiento` |

**Propuesta (HUD).**
- `tower-modes` (P1): modos `lastLap`, `sectors`, `stops`, `tyres%`; flags `incident`, `finished`, `outLap`,
  `inLap`; `data/balance/hud.json* tower.modes` con orden por era; sectores desde `circuit.sectors`.
- `flag-header-sectors` (P1): `TimingTower` recibe `flag` y tiñe la cabecera con token y **texto** (nunca solo
  color, DESIGN §6.5); `sessionSim` emite `yellow`.
- `event-banners` (P1): `EventBanner` en `Broadcast.js` con cola de uno en uno; `hud.json banners {kinds,
  durationSec}` y `lapsToGoCallouts [15,10,3,1]`; el instante sale de `pass.confirmedAt` cuando exista; botón de
  repetición si el buffer cubre el evento; DRS en la V3 (2011–2025) y aerodinámica activa en 2026.
- `auto-velocidad` + `auto-speed-drop` + `speeds-unify` (P1): `live-view.json* {speeds, defaultSpeed por sesión,
  autoSpeed, pauseOn: ["pitDialog","setupDialog","replay"], eventPriority, restoreAfter}`; hook
  `components/useAutoSpeed.js*` compartido; rótulo central al cambiar; las sesiones pasan a 1–16 + saltar al
  siguiente evento (RF-CMD-04).
- `driver-panel-units` (P1), `pit-widget-and-dialog` (P1): `components/PitDialog.js*` (un `Sheet`, `pauseOnOpen`) con
  `previewPit`; `PitTimer` que lee `pitPhase/pitStage`.
- `status-strip-data` (P2): hora local del pack; aire de `engine/weather` (calibrado con OpenF1 `weather`); goma de
  `sessions.json evolution`; `race-weather.json display {mmPerWetness, rubberBands, gripBands}`.

#### 2.12.2 Pantallas del fin de semana y de gestión (`ui-menus`)

- **Bucle fijo** (A): centro del fin de semana (cronología de 3 días con botones de sesión, ficha de la sesión) →
  preparación con dos columnas de coche («coche N listo») → opciones de sesión (gestionar / simular / simular hasta Q
  o carrera; confirmación al gestionar) → transición con logotipo (~2–6,5 s, saltable) → sesión → transición →
  resultados (→ resumen de objetivos en libres) → centro.
- **Resultados** (A): retrato del ganador, tabla de 10 filas por página (libres: mejor vuelta y neumático; Q:
  Q1/Q2/Q3 con eliminados en rojo oscuro), mejor tiempo en morado, filas propias resaltadas.
- **Informe previo** (10:30): longitud, vueltas, récord, probabilidad de SC, pérdida en pit en verde y con SC, plan.
- **Patrones generales** útiles como idea: botón de avance único con estados (puede avanzar / evento obligatorio /
  bloqueado con motivo / confirmar gasto), avance de días que se para solo en el siguiente evento, tres columnas
  (controles / ayuda según el cursor / impacto actual frente a nuevo con deltas), asistente de pasos con el coste en
  el botón final, información oculta hasta probar («?» en la satisfacción del reglaje), parque cerrado con candado,
  lista de estrategias A–D con gráfico de desgaste por vuelta. Estos patrones de gestión no tienen paquete aquí:
  quedan como referencia para DESIGN.md.
- **OverCut hoy**: `Weekend.js:75-174` cambia de fase al instante; cada fase lleva sus botones de directo o
  simulación (`Weekend.js:478-492`); sin transición ni «simular hasta»; resultados de libres y Q repartidos por fase;
  `CircuitCard` sin probabilidad de SC ni pérdida en boxes (`Weekend.js:389`); el *feedback* del reglaje está en
  `SetupBench` pero no hay resumen de sesión.
- **Propuesta**: `session-options-transition` (P2: `components/SessionGate.js*`, `components/Transition.js*` con el
  logotipo de OverCut, `hud.json transitionSec`, respeta `prefers-reduced-motion`; subestados `gate`, `live`,
  `results` en `weekend.stage`), `session-results-unified` (P2: `components/SessionResults.js*` sobre `DataTable`),
  `practice-goals-summary` (P3), `pre-race-briefing` (P3).

#### 2.12.3 Sesiones: reloj, tráfico y garaje (`practice-quali`)

- Horas y duraciones reales 2024: L1 14:30, L2 18:00, L3 15:30, Q 19:00; 60/60/60 min y Q1 18, Q2 15, Q3 12 min con
  7–8 min de pausa simulada sin enseñarla (reloj local de Q2 a 19:25) (A). Pista 32,9 °C en L1 → 25,9 °C en Q1.
- Máquina de estados por coche (A): GARAJE → (cinemática solo la primera vez) → SALIENDO (26–30 s) → VUELTA DE
  SALIDA (~100 s, cronómetro a 0) → PREPARACIÓN (~10 s antes de la línea, radio) → LANZADA → VUELTA DE ENTRADA
  (cronómetro en marcha, ~110 s hasta el garaje) → GARAJE. Sacar el coche → inicio de lanzada ≈ 2:08.
- Final de Q (A): reloj a 0:00 en rojo, la sesión sigue mientras haya coches en vuelta lanzada; torre que se reordena
  en directo; los coches propios ya no pueden salir.
- Menú de boxes en sesión (A): pausa la sesión; cada cambio cuesta tiempo (reglaje 4:24, plan de tandas 14–15 s,
  neumáticos y piezas), suma visible antes de confirmar.
- **OverCut hoy**: `session.js` decide cada vuelta al empezarla; sin tráfico, rebufo, vueltas estropeadas ni amarillas
  que anulen; `sessions.json durations` sin hora de inicio ni pausa; `evolution {perFieldLap −0,0028, max −0,8,
  carry 0,6}` sin fuente; `garage.turnaroundSec 40` para cualquier cambio. Bien: con el reloj a cero cuentan las
  vueltas ya empezadas.
- **Propuesta**: `reloj-sesion`, `evolucion-q`, `trabajo-garaje`, `salida-boxes-sesion`, `trafico-sesion` (§3).

### 2.13 Salida y final de la carrera

**Observado y medido** (`race-1` §2, `audio` §5, `cameras` §7, `race-2` §6).

| Evento | t (s) | Δ | Conf. |
|---|---|---|---|
| Luces 1–2 ya encendidas al entrar el plano | 3385,47 | — | A |
| Luz 4 | 3386,80 | +1,0 s | A |
| Luz 5 | 3387,77 | +0,97 s | A |
| Apagado | 3389,37 | **1,60 s** tras la 5.ª | A |
| Motores lanzados | ~3389,8–3390,6 | +0,4 s | A |
| HUD completo | ~3390,3 | +0,9 s | A |
| Vértice de T1 | ~3401 | ~11,5 s del apagado | B |

- Sonido por luz: golpe grave 30–120 Hz (~−24 dB sobre fondo de −50) + tono de ~523 Hz (1.045, 1.570), ~0,2 s tras
  el cambio visual; el apagado no suena. Subidas de vueltas sueltas con las luces encendidas (3383,5–3386,6 s).
- No se ve vuelta de formación (se salta o está editada, M). SC aparcado tras la parrilla.
- Real (FIA): 1 luz por segundo y apagado tras una espera variable (el rango 0,2–3 s que citan los informes es NV).
- Final: bandera a cuadros por fila; avisos de vueltas; radio de ganador; panel del que termina plegado; realizador
  por coche; repetición de la victoria con primer plano.

**OverCut hoy.** `stepRace.js:343` apaga las luces en el instante 0; la reacción y la arrancada sí están
(`incidents.js:212`). Sin vuelta de formación, fase de luces, espera con semilla ni procedimiento por era. En la vista:
`INTRO_SECONDS = 4.6` (`LiveRace.js:52`), una luz cada 0,8 s y apagado fijo (`LiveRace.js:490`), sin sonido de
luces. Final: evento `flag` (`race.js:2289`), sin vuelta de enfriamiento ni `finished` por coche.

**Propuesta.**
- `salida-carrera` (P1): fase `PRE_START` con eventos `formation → grid → light{n} → lightsOut` en el flujo `control`
  con semilla; `race-sim.json start {lightIntervalSec, holdSec}` (FIA); `era-defaults.json startProcedure` (antes de
  los 90 NV: ¿rojo → verde?). Vuelta de formación opcional (1x o saltable) a `formation.lapFactor`, que calienta
  neumáticos (con `thermal.js` cuando exista), `formation.abortChance` y `pitStart` (NV). Instantánea `start`.
- `start-lights-sound-and-timing` (P1): la vista pasa a leer `snapshot.start`; `hud.json start.hudDelaySec`;
  `audio.json ambience.startLights {thumpHz, toneHz, gain}` y `gridRevs`.
- `start-finish-scripts` (P2) y `vuelta-enfriamiento` (P3): evento `finished`, vuelta a `race-sim.json
  cooldown.lapFactor` sin duelos y con el pit cerrado, `live-view.json lapsToGo`, panel plegado y cuadros.

---

## 3. Backlog priorizado y paquetes de trabajo

### 3.1 Backlog

P1 = se ve u oye en cada sesión en directo; P2 = profundidad; P3 = pulido. Esfuerzo S/M/L/XL. «WP» = paquete de la
§3.3. Ficheros en escritura (los que solo se leen no se listan).

| id | P | Esf. | Requisitos SRS | Ficheros (escritura) | Fuente de calibración | WP |
|---|---|---|---|---|---|---|
| sc-fisico | P1 | XL | RF-SIM-10, RF-SIM-01, RF-SIM-15, RF-3D-04, RNF-07, RNF-05 | engine/sim/safetyCar.js*, engine/sim/stepRace.js, engine/race.js, data/balance/race-sim.json, engine/packs/schema/race-sim.schema.json* | FIA Sporting Regs (SC por año); OpenF1 race_control + laps (2023+); FastF1 track_status (2018+) | SIM-5 |
| vsc-delta | P1 | M | RF-SIM-10, RF-SIM-15, RNF-07 | engine/sim/stepRace.js, engine/sim/safetyCar.js*, data/balance/race-sim.json, data/seasons/curated/era-defaults.json | FIA (VSC 2015+); OpenF1 race_control («VSC ENDING») y laps | SIM-5 |
| no-solape | P1 | M | RF-SIM-07, RF-SIM-01, RF-3D-03, RNF-05, RNF-07 | engine/sim/lateral.js*, engine/sim/stepRace.js, engine/sim/duel.js, data/balance/race-physics.json, data/balance/race-sim.json, engine/sim/stepRace.test.js | FIA Technical Regs (ancho por año); OpenF1 location | SIM-2 |
| incorporacion-pit | P1 | M | RF-SIM-12, RF-SIM-10, RF-3D-04, RNF-07 | engine/sim/pitLane.js, data/balance/race-pit.json, data/balance/race-pit.schema.json, data/splines.json, tools/assets/blender/extract_pitlane.py, data/balance/race-eras.json (traspaso) | FIA Sporting Regs (líneas del pit); geometría de la malla | PIT-2 |
| salida-boxes-sesion | P1 | M | RF-WKD-02, RF-SIM-12, RF-3D-04, RNF-07 | engine/sessionSim/session.js, data/balance/sessions.json, engine/sessionSim/session.test.js (+ engine/sim/pitLane.js en PIT-1) | era-defaults.json pitLaneSpeed (FIA); OpenF1 laps/pit de libres | PIT-1, SES-2 |
| salida-carrera | P1 | M | RF-SIM-10, RF-SIM-15, RF-3D-04, RNF-05, RNF-07 | engine/sim/stepRace.js, engine/race.js, data/balance/race-sim.json, data/seasons/curated/era-defaults.json, engine/sim/stepRace.test.js | FIA Sporting Regs (procedimiento de salida); OpenF1 race_control | SIM-3 |
| eventos-duelo | P1 | M | RF-SIM-07, RF-CMD-03, RF-3D-04, RNF-07 | engine/sim/duel.js, engine/sim/stepRace.js, engine/race.js, data/balance/race-sim.json, data/balance/race-physics.json | Comportamiento; pases por carrera contra f1db (measurePasses.js) | SIM-4 |
| auto-velocidad | P1 | S | RF-CMD-04, RF-3D-04, RNF-05, RNF-07 | components/LiveRace.js, components/SessionLive.js, data/balance/live-view.json*, engine/packs/schema/live-view.schema.json* (sin cambios en el motor, §1.5) | Comportamiento | HUD-1 |
| director-follow-focus | P1 | M | RF-3D-04, RNF-07, RNF-09 | components/director/directorState.js*, data/balance/broadcast.json*, engine/packs/schema/broadcast.schema.json* (+ LiveRace.js en HUD-2) | Comportamiento | CAM-1, HUD-2 |
| camera-zones | P1 | L | RF-3D-03, RF-3D-04, RNF-02, RNF-05, RNF-07 | three/cameras.js, three/cameras.test.js, data/balance/broadcast.json, data/circuits/<splineId>/camera-zones.json* | Densidad de la referencia; posiciones desde la malla GLB | CAM-2 |
| pit-sequence | P1 | M | RF-3D-04, RF-SIM-12, RF-WKD-02, RNF-07 | three/cameras.js, three/Race3D.js, components/director/directorState.js, data/balance/broadcast.json | Geometría del pit (pitLane.js) | CAM-3 |
| replays | P1 | L | RF-3D-04, RF-SIM-15, RNF-05, RNF-07 | components/replay/replayBuffer.js*, components/replay/ReplayOverlay.js*, three/Race3D.js, data/balance/broadcast.json (+ LiveRace.js en HUD-4) | Comportamiento | CAM-3, HUD-4 |
| onboard-mounts | P1 | M | RF-3D-04, RF-3D-05, RNF-07 | three/cameras.js, three/Race3D.js, three/carModel.js, data/balance/cameras.json*, engine/packs/schema/cameras.schema.json* | FOV de partida; fechas de halo y T-cam en FIA | CAM-1 |
| user-camera-lock | P1 | S | RF-3D-04, RNF-09, RNF-07 | components/Broadcast.js, components/LiveRace.js, components/SessionLive.js (+ broadcast.json cycleOrder/defaultView en CAM-1) | Comportamiento | HUD-1 |
| shift-shape-per-pu | P1 | M | RF-3D-04, RF-SIM-02, RNF-07 | three/audio/engineSynth.js, three/audio/audio.test.js, data/balance/audio.json, engine/packs/schema/audio.schema.json | OpenF1 car_data (rpm, n_gear) por equipo 2023+; eras anteriores NV | AUD-1 |
| downshift-blips | P1 | S | RF-3D-04, RNF-07 | three/audio/engineSynth.js, data/balance/audio.json | Puntos de reducción de OpenF1 car_data | AUD-1 |
| pit-limiter-tone | P1 | S | RF-3D-04, RF-SIM-12, RNF-07 | three/audio/engineSynth.js, data/balance/audio.json | FIA pitLaneSpeed por año (Baréin 2024: 80 km/h) | AUD-1 |
| mix-snapshots-per-view | P1 | M | RF-3D-04, RNF-02, RNF-07, RNF-09 | three/audio/mixer.js, three/audio/index.js, data/balance/audio.json (+ cameraBus en Race3D.js, CAM-1) | Comportamiento (niveles relativos) | AUD-2 |
| start-lights-sound-and-timing | P1 | S | RF-SIM-10, RF-SIM-15, RNF-05, RNF-07 | three/audio/ambience.js, three/audio/index.js, data/balance/audio.json (+ LiveRace.js/hud.json en HUD-4) | FIA procedimiento de salida por año | AUD-3, HUD-4 |
| tower-modes | P1 | M | RF-WKD-07, RF-3D-04, RNF-07, RNF-09 | components/Broadcast.js, components/LiveRace.js, components/SessionLive.js, data/balance/hud.json* | Comportamiento | HUD-2 |
| flag-header-sectors | P1 | S | RF-SIM-10, RF-WKD-02, RNF-09 | components/Broadcast.js, components/LiveRace.js, components/SessionLive.js (+ session.js en SES-3) | Comportamiento | HUD-2, SES-3 |
| event-banners | P1 | M | RF-SIM-08, RF-SIM-10, RF-CMD-03, RF-3D-04, RNF-07, RNF-08 | components/Broadcast.js, components/LiveRace.js, data/balance/hud.json | FIA (activación del DRS) | HUD-3 |
| auto-speed-drop | P1 | S | RF-CMD-04, RNF-07 | components/LiveRace.js, components/SessionLive.js, components/useAutoSpeed.js*, data/balance/live-view.json* | Comportamiento | HUD-1 |
| speeds-unify | P1 | S | RF-CMD-04, RNF-07 | components/LiveRace.js, components/SessionLive.js, data/balance/live-view.json* | Comportamiento | HUD-1 |
| driver-panel-units | P1 | M | RF-CMD-01, RF-SIM-03, RF-SIM-04, RF-SIM-05, RF-SIM-13, RNF-07 | components/LiveRace.js, components/Broadcast.js | Pirelli (ventanas), OpenF1 car_data; no copiar °C del juego | HUD-3, HUD-6 |
| pit-widget-and-dialog | P1 | M | RF-CMD-02, RF-SIM-12, RF-SIM-13, RNF-07 | components/PitDialog.js*, components/LiveRace.js, components/Broadcast.js | Pérdida calibrada con OpenF1 pit / f1db | HUD-3 |
| sc-pose-from-sim | P1 | M | RF-SIM-10, RF-3D-04, RNF-07 | engine/sim/stepRace.js (SIM-5), components/raceClock.js, components/LiveRace.js, data/balance/hud.json (HUD-5), three/Race3D.js, data/balance/broadcast.json (CAM-5) | FIA (delta VSC), OpenF1 race_control y laps | SIM-5, HUD-5, CAM-5 |
| no-overlap-view | P1 | S | RF-SIM-07, RF-3D-04, RNF-07 | three/Race3D.js | Anchos por era FIA (lee race-physics.json) | CAM-3 |
| garage-exit-presentation | P1 | S | RF-WKD-02, RF-SIM-12, RF-3D-04, RNF-07 | engine/sessionSim/session.js (SES-2), components/SessionLive.js (HUD-2), three/Race3D.js (CAM-3) | FIA pitLaneSpeed; OpenF1 location/pit | SES-2, HUD-2, CAM-3 |
| duelo-geometrico | P2 | L | RF-SIM-07, RF-STF-02, RNF-07 | engine/sim/duel.js, engine/sim/lateral.js, data/balance/race-physics.json | f1db (cambios netos por era); OpenF1 position/intervals | SIM-8 |
| curvas-lentas | P2 | M | RF-SIM-01, RF-SIM-02, RNF-07 | data/balance/race-physics.json (traspaso), data/balance/race-powertrain.json, engine/sim/speeds.test.js, engine/sim/__fixtures__/openf1-powertrain.json, overcut/src/main/resources/scripts/powertrain_from_openf1.py | OpenF1 car_data (speed, n_gear, rpm, brake) | PT-2, PT-3 |
| termica-neumatico | P2 | L | RF-SIM-03, RF-SIM-07, RNF-07 | engine/tyres/thermal.js*, engine/race.js, engine/sim/stepRace.js, data/balance/race-tyres.json*, engine/packs/schema/race-tyres.schema.json* | Pirelli (mantas por temporada); FIA; constantes térmicas NV | SIM-6 |
| reglas-sc-era | P2 | M | RF-SIM-10, RNF-07 | data/seasons/curated/era-defaults.json, engine/rules.js, engine/sim/safetyCar.js*, overcut/src/main/resources/scripts/generate_season_packs.py, engine/rules.test.js | FIA Sporting Regs de cada año | SIM-5 |
| duracion-neutralizacion | P2 | M | RF-SIM-10, RF-SIM-09, RNF-07 | engine/race.js, engine/incidents.js, data/balance/race-sim.json, generate_season_packs.py | OpenF1 race_control (2023+), FastF1 track_status (2018+); antes NV | SIM-5 |
| trafico-sesion | P2 | L | RF-WKD-02, RF-SIM-01, RF-SIM-06, RNF-07 | engine/sessionSim/stepSession.js*, engine/sessionSim/session.js, data/balance/sessions.json (SES-8); engine/sim/stepRace.js (SIM-8) | Comportamiento; q1/q2/q3 de f1db | SIM-8, SES-8 |
| reloj-sesion | P2 | M | RF-WKD-01, RF-SIM-11, RNF-07 | engine/sessionSim/session.js, engine/sessionSim/formats.js, data/balance/sessions.json, generate_season_packs.py, engine/weather/index.js | f1db (horas de sesión), horario FIA, ERA5 | SES-1 |
| evolucion-q | P2 | S | RF-WKD-02, RF-SIM-11, RNF-07 | data/balance/sessions.json, overcut/frontend/scripts/measureEvolution.js*, engine/sessionSim/session.test.js | f1db qualifying q1/q2/q3 (2006+) | SES-1 |
| trabajo-garaje | P2 | S | RF-WKD-03, RF-STF-07, RNF-07 | data/balance/sessions.json, engine/sessionSim/session.js, engine/setup.js | Comportamiento (NV) | SES-1 |
| tacticas | P2 | M | RF-CMD-01, RF-SIM-05, RF-SIM-09, RNF-07 | engine/race.js, engine/sim/stepRace.js, engine/energy.js, engine/rules.js, data/balance/race-sim.json | Comportamiento; límites de energía FIA ya implementados | SIM-7, HUD-7 |
| rnf07-race | P2 | S | RNF-07, RF-SIM-03, RF-SIM-07, RF-SIM-09 | engine/race.js, engine/sim/stepRace.js, data/balance/race-eras.json, data/balance/race-sim.json, race-sim.schema.json* | Refactor puro (golden `quickRace.golden.json` sin cambios) | SIM-1 |
| tren-por-pu | P2 | M | RF-SIM-01, RF-DEV-05, RF-3D-04, RNF-07 | data/balance/race-powertrain.json, engine/packs/schema/race-powertrain.schema.json, engine/sim/powertrain.js, powertrain_from_openf1.py | OpenF1 car_data por piloto | PT-1 |
| amarilla-sector | P2 | S | RF-SIM-10, RF-WKD-02, RNF-07 | engine/sim/stepRace.js, engine/race.js, data/balance/race-sim.json, data/seasons/curated/era-defaults.json (SIM-4); engine/sessionSim/session.js (SES-4) | FIA Sporting Regs e ISC App. H | SIM-4, SES-4 |
| errores-visibles | P2 | M | RF-SIM-09, RF-SIM-10, RNF-07 | engine/sim/stepRace.js, engine/race.js, data/balance/race-physics.json, data/balance/race-eras.json, data/seasons/curated/era-defaults.json | OpenF1 race_control (TRACK LIMITS 2023+); FIA | SIM-7 |
| buffer-repeticion | P2 | M | RF-3D-04, RF-SIM-15, RNF-05, RNF-07 | Fundido en `replays`; engine/worker/raceClient.js solo si no conserva historial | Comportamiento | CAM-3 |
| prevision-parada | P2 | S | RF-CMD-02, RF-SIM-12, RF-SIM-13 | engine/sim/pitLane.js, engine/sim/pitStop.js, engine/sim/pitLane.test.js (sin race.js) | Pérdidas ya calibradas (FastF1/f1db) | PIT-1 |
| tv-lens-behaviour | P2 | M | RF-3D-04, RNF-07 | three/cameras.js, data/balance/broadcast.json | Comportamiento | CAM-2 |
| start-finish-scripts | P2 | M | RF-3D-04, RF-SIM-10, RNF-07 | components/director/directorState.js, three/cameras.js, data/balance/broadcast.json (+ LiveRace.js en HUD-4) | Comportamiento | CAM-4, HUD-4 |
| field-bed-start | P2 | S | RF-3D-04, RNF-02, RNF-07 | three/audio/ambience.js, three/audio/index.js, data/balance/audio.json | Comportamiento | AUD-2 |
| kerbs-wind | P2 | S | RF-3D-03, RF-3D-04, RNF-07 | three/audio/ambience.js, data/balance/audio.json, data/circuits/<splineId>/kerbs.json*, tools/assets/blender/extract_kerbs.py* | Geometría de la malla o la trazada | AUD-2 |
| radio-ui-sounds | P2 | M | RF-CMD-03, RNF-07, RNF-08 | three/audio/uiSounds.js*, three/audio/SoundControl.js, three/audio/mixer.js, data/balance/audio.json | Diseño propio | AUD-4 |
| sc-vsc-sound | P2 | S | RF-SIM-10, RNF-07 | three/audio/index.js, three/audio/engineSynth.js, data/balance/audio.json | FIA (SC 1993+, VSC 2015+); OpenF1 | AUD-5 |
| status-strip-data | P2 | S | RF-SIM-11, RF-WKD-03, RNF-07 | components/LiveRace.js, components/Broadcast.js, data/balance/race-weather.json (bloque display) | f1db y FIA (horarios), OpenF1 weather | HUD-4 |
| session-options-transition | P2 | M | RF-WKD-01, RF-WKD-02, RF-WKD-07, RNF-07 | components/Weekend.js, components/SessionGate.js*, components/Transition.js*, engine/career.js | Comportamiento | WKD-1 |
| session-results-unified | P2 | M | RF-WKD-07, RNF-09 | components/SessionResults.js*, components/Weekend.js | Comportamiento | WKD-1 |
| danos-visibles | P3 | S | RF-DEV-08, RF-SIM-09, RF-CMD-03 | engine/sim/stepRace.js, engine/incidents.js, engine/race.js, data/balance/race-reliability.json | f1db (abandonos por daños) | SIM-7 |
| vuelta-enfriamiento | P3 | S | RF-WKD-07, RF-3D-04, RNF-07 | engine/sim/stepRace.js, data/balance/race-sim.json (SIM-3); data/balance/live-view.json, LiveRace.js, Broadcast.js (HUD-4) | Comportamiento | SIM-3, HUD-4 |
| onboard-inserts | P3 | S | RF-3D-04, RNF-07 | components/director/directorState.js, data/balance/broadcast.json | Comportamiento | CAM-4 |
| practice-goals-summary | P3 | S | RF-WKD-03, RF-WKD-07 | components/SessionResults.js | Comportamiento | WKD-2 |
| pre-race-briefing | P3 | S | RF-INB-01, RF-SIM-10, RF-SIM-12 | components/CircuitCard.js, engine/packs/packWorld.js | f1db y OpenF1 race_control (SC por circuito), OpenF1 pit | WKD-6 |

### 3.2 Propiedad de ficheros (carriles)

Ocho carriles. Cada fichero tiene **un solo carril con permiso de escritura** en todo el plan, salvo los traspasos
marcados. Los demás carriles solo lo leen y se apoyan en los contratos de la §1.7.

| Carril | Escribe |
|---|---|
| **SIM** motor de carrera | engine/sim/stepRace.js, engine/race.js, engine/sim/duel.js, engine/sim/lateral.js*, engine/sim/safetyCar.js*, engine/tyres/thermal.js*, engine/incidents.js, engine/rules.js, engine/energy.js, data/balance/race-sim.json, race-eras.json, race-physics.json, race-tyres.json*, race-reliability.json, data/seasons/curated/era-defaults.json, esquemas race-sim*/race-tyres*/race-physics, engine/sim/stepRace.test.js, engine/rules.test.js, overcut/src/main/resources/scripts/generate_season_packs.py (salvo ola 1) |
| **PIT** pit lane | engine/sim/pitLane.js, engine/sim/pitStop.js, engine/sim/pitLane.test.js, data/balance/race-pit.json (+ esquema), data/splines.json, tools/assets/blender/extract_pitlane.py |
| **SES** sesiones | engine/sessionSim/*, data/balance/sessions.json, engine/setup.js, engine/weather/index.js (solo la consulta por hora), overcut/frontend/scripts/measureEvolution.js* |
| **PT** tren motriz | engine/sim/powertrain.js, data/balance/race-powertrain.json (+ esquema), engine/sim/speeds.test.js, engine/sim/__fixtures__/openf1-powertrain.json, overcut/src/main/resources/scripts/powertrain_from_openf1.py |
| **AUD** sonido | three/audio/*, data/balance/audio.json, engine/packs/schema/audio.schema.json, data/circuits/<splineId>/kerbs.json*, tools/assets/blender/extract_kerbs.py* |
| **CAM** cámaras y realizador | three/cameras.js, three/cameras.test.js, three/Race3D.js, three/carModel.js, components/director/*, components/replay/*, data/balance/broadcast.json*, cameras.json*, data/circuits/<splineId>/camera-zones.json*, sus esquemas, engine/worker/* (si hiciera falta) |
| **HUD** HUD y reproducción | components/LiveRace.js, components/SessionLive.js, components/Broadcast.js, components/raceClock.js, components/PitDialog.js*, components/useAutoSpeed.js*, data/balance/hud.json*, data/balance/live-view.json*, sus esquemas, bloque `display` de data/balance/race-weather.json |
| **WKD** pantallas del fin de semana | components/Weekend.js, components/SessionGate.js*, components/Transition.js*, components/SessionResults.js*, components/CircuitCard.js, engine/career.js, engine/packs/packWorld.js |

Traspasos puntuales: SES escribe `generate_season_packs.py` en la ola 1; PIT escribe `race-eras.json` en la ola 2;
PT escribe `race-physics.json` en la ola 3. En la ola 8, SES-8 escribe `engine/sessionSim/stepSession.js` y SIM-8
solo exporta `advance` en modo sesión desde `stepRace.js`. En las olas de traspaso el carril dueño no toca ese
fichero.

Integración: CAM entrega módulos puros (`directorState.js`, `replayBuffer.js`, `ReplayOverlay.js`) y el `cameraBus`
de `Race3D`; HUD los engancha en `LiveRace.js` en la ola siguiente. HUD-1 crea `hud.json` y `live-view.json` y CAM-1
crea `broadcast.json` y `cameras.json` **con el esquema completo** (también las claves que consumirán otros carriles
o paquetes posteriores, con valores `pending` donde haga falta); así WKD y AUD solo leen.

Dentro del carril SIM, los módulos nuevos (`lateral.js`, `safetyCar.js`, `thermal.js`) se pueden escribir y probar
aislados antes de su ola; lo que se serializa es el enganche en `stepRace.js` y `race.js`.

### 3.3 Olas y paquetes

En cada ola, los paquetes de carriles distintos no comparten ningún fichero en escritura y se pueden hacer en
paralelo. Entre olas hay que fusionar y pasar los tests (equivalencia SRS §4.2 sin tocar tolerancias; golden del modo
rápido donde aplique). Cada commit cita sus requisitos (CLAUDE.md).

| Ola | SIM | PIT | SES | PT | AUD | CAM | HUD | WKD |
|---|---|---|---|---|---|---|---|---|
| 1 | SIM-1 | PIT-1 | SES-1 | PT-1 | AUD-1 | CAM-1 | HUD-1 | WKD-1 |
| 2 | SIM-2 | PIT-2 | SES-2 | PT-2 | AUD-2 | CAM-2 | HUD-2 | WKD-2 |
| 3 | SIM-3 | — | SES-3 | PT-3 | AUD-3 | CAM-3 | HUD-3 | — |
| 4 | SIM-4 | — | SES-4 | — | AUD-4 | CAM-4 | HUD-4 | — |
| 5 | SIM-5 | — | — | — | AUD-5 | CAM-5 | HUD-5 | — |
| 6 | SIM-6 | — | — | — | — | — | HUD-6 | WKD-6 |
| 7 | SIM-7 | — | — | — | — | — | HUD-7 | — |
| 8 | SIM-8 | — | SES-8 | — | — | — | — | — |

El camino crítico es el carril SIM (8 olas, SIM-5 es XL). Si hace falta acortar, SIM-6 (térmica) puede adelantarse a
la ola 3 o 4 desarrollando `thermal.js` aislado y dejando su enganche para una ola en que SIM no toque `race.js`.

#### Ola 1

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-1** Deuda RNF-07 | rnf07-race | engine/race.js, engine/sim/stepRace.js, data/balance/race-eras.json, data/balance/race-sim.json, engine/packs/schema/race-sim.schema.json* | Literales de `passChanceOf`, térmica, `startTerm`, `rollMistake`, SC ×0,62, `crew` 1,4/100 leídos de JSON con esquema | Golden `quickRace.golden.json` idéntico byte a byte; equivalencia §4.2 |
| **PIT-1** Previsión y perfil de garaje | prevision-parada, parte de salida-boxes-sesion | engine/sim/pitLane.js, engine/sim/pitStop.js, engine/sim/pitLane.test.js | `previewPit()` pura (§1.7) con `lossGreen`/`lossSc`; `garageExitProfile(circuit, era, box)` | Sin tiradas (RNG intacto); Baréin 2024 pérdida ±1 s de f1db |
| **SES-1** Reloj, evolución, garaje | reloj-sesion, evolucion-q, trabajo-garaje | engine/sessionSim/session.js, formats.js, session.test.js, data/balance/sessions.json, engine/setup.js, engine/weather/index.js, measureEvolution.js*, generate_season_packs.py (traspaso) | `calendar[].sessions[] {kind, startLocal}`, `durations.knockout[].breakMinutes`, `localClock`, `evolution.byEra[]`, `garage.work{}` | Mejora Q1→Q3 ±0,15 s de f1db por era; reloj local de Q2 incluye la pausa |
| **PT-1** Cambio por fabricante | tren-por-pu | engine/sim/powertrain.js, race-powertrain.json (+ esquema), powertrain_from_openf1.py, powertrain.test.js | `manufacturers{}`, `pitLimiter {gear, rpm}`, `shift.underSc`; `pose.gear` fija en el pit | rpm de cambio por equipo ±3 % frente a OpenF1 car_data 2024 |
| **AUD-1** Forma del cambio | shift-shape-per-pu, downshift-blips, pit-limiter-tone | three/audio/engineSynth.js, audio.test.js, data/balance/audio.json, audio.schema.json | `shiftProfiles[]`, `voicing.downshift`, `voicing.pitLimiter`; se borra `pitLimiterGear` | Rampa de frecuencia de `glideMs`; limitador sin modulación audible (profundidad ≈ 0) |
| **CAM-1** Realizador puro y onboards | director-follow-focus (módulo), onboard-mounts | components/director/directorState.js*, three/cameras.js, three/Race3D.js, three/carModel.js, data/balance/broadcast.json*, cameras.json* (+ esquemas) | `directorState()`; montajes por era; vibración determinista; marcha en el volante; `cameraBus` | Test puro de `directorState`: con `focusId` fijo nunca devuelve otro sujeto en TV salvo `followAction` |
| **HUD-1** Reproducción | speeds-unify, auto-velocidad, auto-speed-drop, user-camera-lock | components/LiveRace.js, SessionLive.js, Broadcast.js, useAutoSpeed.js*, data/balance/live-view.json*, hud.json* (+ esquemas) | Escala 1–16 en todo; auto-velocidad y pausa en diálogos; vista y cámara separadas; coche anterior/siguiente | RNF-05: misma semilla con y sin auto-velocidad → mismo resultado |
| **WKD-1** Puerta y resultados | session-options-transition, session-results-unified | components/Weekend.js, SessionGate.js*, Transition.js*, SessionResults.js*, engine/career.js | Bucle gate → live → results; transición saltable; resultados por tipo | `prefers-reduced-motion` sin animación |

#### Ola 2

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-2** Holgura lateral | no-solape | engine/sim/lateral.js*, stepRace.js, duel.js, race-physics.json (+ esquema), race-sim.json, stepRace.test.js | Vecinos, restricción con holgura, sin saltos de `P`, ancho por era, `lane` respetado (incluido `PIT_EXIT`) | 64 carreras: cajas ≥ 0, holgura ≥ 0,3 m en el 99 %, `ΔP ≤ v·dt + ε` |
| **PIT-2** Líneas blancas | incorporacion-pit | pitLane.js, race-pit.json (+ esquema), data/splines.json, extract_pitlane.py, race-eras.json (traspaso), pitLane.test.js | `exitLineTo`, `entryLine`, `mergeGapMetres`, ofensa `pitExitLine` (`pending`) | Ningún coche que sale invade la trazada antes de `exitLineTo`; cede si el hueco es menor |
| **SES-2** Garaje físico | salida-boxes-sesion, garage-exit-presentation (motor) | session.js, sessions.json, session.test.js | Fases `GARAGE_EXIT…IN_LAP`, cola en el semáforo, `boxRequest.distanceM`; se borran `pitLaneSec`/`boxStopSec` | Garaje → pista en Baréin 2024 dentro del rango medido en OpenF1 (no del juego) |
| **PT-2** Banco de curvas | curvas-lentas (tests) | speeds.test.js, __fixtures__/openf1-powertrain.json, powertrain_from_openf1.py | Fixture de un circuito lento (Hungaroring o Mónaco 2024); test por curva numerada | El test falla hoy en las curvas lentas (documentado) |
| **AUD-2** Mezcla por vista | mix-snapshots-per-view, field-bed-start, kerbs-wind | three/audio/mixer.js, index.js, ambience.js, audio.json, kerbs.json*, extract_kerbs.py* | Mezclas map/paused/replay/menu; oyente en `cameraBus`; lecho del pelotón; pianos; viento hasta 8 kHz | Relaciones de nivel entre vistas (§2.1) en un test de mezcla offline |
| **CAM-2** Zonas de cámara | camera-zones, tv-lens-behaviour | three/cameras.js, cameras.test.js, broadcast.json, camera-zones.json* (+ script generador) | `rigTemplate`, zonas por circuito, elección por peso con semilla, `framing`, `passPan`, `lateralTrack` | 18–24 planos por vuelta en Baréin a 1x |
| **HUD-2** Torre y realizador | tower-modes, flag-header-sectors (vista), director-follow-focus (enganche), garage-exit-presentation (RunCard) | LiveRace.js, Broadcast.js, SessionLive.js, hud.json | Modos y flags de torre; cabecera con texto; el clic en la torre cambia el sujeto de la TV | La amarilla nunca se indica solo con color (RNF-09) |
| **WKD-2** Resumen de libres | practice-goals-summary | SessionResults.js | Panel con deltas de confianza y reglaje | — |

#### Ola 3

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-3** Salida y final | salida-carrera, vuelta-enfriamiento (motor) | stepRace.js, race.js, race-sim.json, era-defaults.json, stepRace.test.js | `PRE_START`, luces con semilla, `startProcedure` por era, vuelta de formación opcional, `finished`, vuelta de enfriamiento | Intervalo de luces y espera reproducibles por semilla; ninguna regla fuera de su era |
| **PT-3** Curvas lentas | curvas-lentas (ajuste) | race-physics.json (traspaso), race-powertrain.json | `mu.slow`, `budget.slow`, `shift.downRpm` por era | Mínima por curva ±10 % y marcha ±1; punta ±5 % sin romper |
| **SES-3** Amarilla en sesión | flag-header-sectors (sesión) | session.js | `sessionSim` emite `yellow` con sector desde `circuit.sectors` | — |
| **AUD-3** Luces de salida | start-lights-sound-and-timing (sonido) | ambience.js, index.js, audio.json | Golpe y tono por luz y subidas de vueltas leyendo `snapshot.start` | Ningún sonido de luces si falta `snapshot.start` |
| **CAM-3** Boxes, repeticiones y anti-solape de vista | pit-sequence, replays (módulos), buffer-repeticion, no-overlap-view, garage-exit-presentation (cámaras) | cameras.js, Race3D.js, directorState.js, broadcast.json, replay/*, (engine/worker/raceClient.js si hace falta) | Cámaras de pit, `sequences.pitStop/garageExit`, buffer de 25 s, overlay, pasada de seguridad con contador | La repetición no cambia el resultado (RNF-05); contador de correcciones = 0 en las 64 carreras de SIM-2 |
| **HUD-3** Banners, panel y parada | event-banners, driver-panel-units, pit-widget-and-dialog | LiveRace.js, Broadcast.js, PitDialog.js*, hud.json | `EventBanner` con cola; pestañas y unidades; `PitDialog` con pausa y `previewPit`; `PitTimer` | La sesión no avanza con el diálogo abierto |

#### Ola 4

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-4** Batalla y amarilla | eventos-duelo, amarilla-sector (motor) | duel.js, stepRace.js, race.js, race-sim.json, race-physics.json, era-defaults.json | `battle[i]`, eventos `duel`, `pass.confirmedAt`, `yellow{sector,…}`, `yellowLapDeleted` (`pending`), radio por umbrales | Pases por carrera sin cambio frente a f1db; equivalencia §4.2 |
| **SES-4** Vuelta anulada | amarilla-sector (sesión) | session.js | Vuelta abortada o borrada según la era | — |
| **AUD-4** Radio e interfaz | radio-ui-sounds | three/audio/uiSounds.js*, SoundControl.js, mixer.js, audio.json | Clic, whoosh, aviso, «radio» sin voz; bus propio | Silenciable por separado |
| **CAM-4** Guiones y insertos | start-finish-scripts, onboard-inserts | directorState.js, cameras.js, broadcast.json | `sequences.preRace/start/finish`, `finisherShots`, insertos HP | Guiones deterministas por semilla |
| **HUD-4** Enganches y final | replays (enganche), start-finish-scripts (enganche), start-lights (vista), vuelta-enfriamiento (vista), status-strip-data | LiveRace.js, Broadcast.js, hud.json, live-view.json, race-weather.json (`display`) | Botón de repetición en banners; luces desde `snapshot.start`; cuadros por fila y panel plegado; condiciones desde datos | Se borran `INTRO_SECONDS`, `intro/0.8`, `15*3600`, `*0.62+4`, `*0.55`, `*3` |

#### Ola 5

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-5** Neutralizaciones | sc-fisico, vsc-delta, reglas-sc-era, duracion-neutralizacion, sc-pose-from-sim (motor) | safetyCar.js*, stepRace.js, race.js, incidents.js, race-sim.json (+ esquema), era-defaults.json, rules.js, rules.test.js, generate_season_packs.py | Coche de seguridad con fases, VSC por delta, claves por era, limpieza por incidente, `scRate`, `snapshot.sc/vsc` | Sin adelantamientos bajo SC salvo doblados autorizados; tren ≤ 10 largos; 38 temporadas sin reglas fuera de era; determinismo |
| **AUD-5** Sonido de SC | sc-vsc-sound | three/audio/index.js, engineSynth.js, audio.json | Voz del SC por era; aviso al desplegar y retirar | Sin voz de SC antes de 1993 |
| **CAM-5** SC en 3D | sc-pose-from-sim (3D) | Race3D.js, broadcast.json, directorState.js | Dibuja `snapshot.sc`; luces con parpadeo; `sequences.scDeploy` | Se borran los 90 m de `Race3D.js` |
| **HUD-5** SC en HUD | sc-pose-from-sim (HUD) | raceClock.js, LiveRace.js, hud.json | Banner «SC entra esta vuelta», delta de VSC en la tarjeta, SC en el mapa 2D | Se borran los 90 m de `LiveRace.js` |

#### Olas 6–8

| WP | Backlog | Escribe | Entrega | Prueba |
|---|---|---|---|---|
| **SIM-6** Térmica | termica-neumatico | engine/tyres/thermal.js*, race.js, stepRace.js, race-tyres.json* (+ esquema) | Dos nodos en °C, mantas por era, `tyreC`, misma ecuación en el modo rápido | Equivalencia §4.2; calentamiento tras parada coherente con OpenF1 (tiempos de vuelta de salida) |
| **HUD-6** °C en el panel | driver-panel-units (°C) | LiveRace.js, Broadcast.js | Temperatura con tendencia y aviso desde `race-tyres.json windowC` | — |
| **WKD-6** Informe previo | pre-race-briefing | CircuitCard.js, packWorld.js | Pérdida en boxes (verde y SC) y `scRate` del pack regenerado en SIM-5 | — |
| **SIM-7** Tácticas, errores, daños | tacticas, errores-visibles, danos-visibles | race.js, stepRace.js, energy.js, rules.js, incidents.js, race-physics.json, race-eras.json, era-defaults.json, race-reliability.json, race-sim.json | `setTactics`, `lon[i]`, recuperación, `trackLimits` (`pending`), `damage`, restos | Errores por carrera ±25 % del modo rápido; límites de pista solo en su era |
| **HUD-7** Tácticas y daño | tacticas (UI), danos-visibles (UI) | LiveRace.js, Broadcast.js | Pestaña de tácticas con las órdenes de su era; daño en la tarjeta | — |
| **SIM-8** Duelo geométrico | duelo-geometrico, trafico-sesion (export) | duel.js, lateral.js, race-physics.json, stepRace.js | `SWITCHBACK`, intentos por pareja, reclamo a 3 con tirada de incidente; `advance` en modo `session` | Pases por vuelta con `equivalence.test.js` y f1db |
| **SES-8** Tráfico en sesión | trafico-sesion | engine/sessionSim/stepSession.js*, session.js, sessions.json | Sesiones sobre el motor por pasos (sin duelos), rebufo, estorbos (`impeding`, `pending`), `ai.spacingSec` | Tiempos de Q contra f1db q1/q2/q3 |

---

## 4. Enmiendas propuestas al SRS (no aplicadas)

Se proponen para que el SRS no contradiga ni se quede corto frente a lo de arriba. Ninguna se ha escrito en `SRS.md`.

1. **RF-3D-04** (hoy: «cámaras TV, persecución, onboard y helicóptero; mapa 2D»). Añadir: «El realizador de TV sigue
   al coche que elige el usuario, corta por zonas de pista, encuadra las peleas y tiene secuencias de parada, salida de
   garaje, previa, salida y meta; repeticiones de eventos con la simulación en pausa; onboards por era (halo desde
   2018)». Hoy el SRS no menciona realizador ni repeticiones, y el código hace lo contrario de lo visto (cambia el
   sujeto cada 7 s).
2. **RF-CMD-04** (×1–×16 y saltar al siguiente evento). Las sesiones usan hoy ×1/×4/×10/×30/×60
   (`SessionLive.js:33`), lo que **contradice** el SRS. Propuesta: mantener el SRS y cambiar el código
   (`speeds-unify`), y añadir «con bajada automática a ×1 configurable en los eventos del coche propio y pausa al abrir
   los diálogos de parada y reglaje». Si se decide conservar ×30/×60 en libres, escribirlo aquí como excepción.
3. **RF-SIM-10**. Añadir: «SC como coche en pista con fases (salida del pit, recogida del líder, agrupamiento,
   doblados, entra esta vuelta, reanudación con el líder marcando el ritmo y sin adelantar hasta la línea); VSC por
   delta de minisector con aviso de fin y vuelta a verde en cualquier punto; duración según el incidente; amarilla por
   sector de comisarios y doble amarilla; procedimiento de salida por era (luces con espera aleatoria por semilla,
   vuelta de formación opcional); límites de pista según la era».
4. **RF-SIM-07**. Añadir: «Los coches se detectan mutuamente y nunca se solapan: holgura lateral mínima por dato, ancho
   del coche por era, sin saltos de posición; estado de batalla por coche y eventos de intento, defensa y
   contraataque; pase confirmado en el siguiente punto de cronometraje».
5. **RF-SIM-12**. Además de la enmienda 3 de SIM-FISICA, añadir: «líneas blancas de entrada y salida, incorporación que
   cede ante el tráfico de pista y sanción por cruzarlas según la era; el mismo pit lane se usa en libres y
   clasificación».
6. **RF-SIM-03**. Precisar «temperatura en °C con al menos superficie y carcasa, mantas según la era y proveedor, y
   penalización de la vuelta de salida por neumático frío».
7. **RF-WKD-01 / RF-WKD-02**. Añadir a RF-WKD-01 «hora local de inicio de cada sesión y pausas entre segmentos desde el
   pack»; a RF-WKD-02 «simular esta sesión o simular hasta la siguiente sesión obligatoria; en directo, libres y
   clasificación sobre el motor por pasos (tráfico, rebufo, amarillas)».
8. **RF-WKD-03**. Añadir «cada cambio en boxes cuesta tiempo de sesión según el trabajo y el *pit crew*; el reloj de la
   sesión no avanza con el menú abierto».
9. **RF-WKD-07**. Añadir «un componente de resultados común a libres, clasificación, sprint y carrera».
10. **RF-CMD-03**. Añadir «la radio se acompaña de un aviso sonoro de diseño propio (sin voz grabada) y se dispara con
    los eventos de batalla, parada y neumáticos».
11. **RNF-05**. Precisar: «la vista (realizador, repeticiones, auto-velocidad, pausas) solo lee del motor; un test
    compara la salida con y sin esas funciones».
12. **Tabla §6.2**. Nuevas claves cerradas en el pack, todas `pending` hasta leer el reglamento de cada año:
    `startProcedure`, `carWidth`/`carLength`, `scUnlapping`, `scPitClosed`, `scRestartLine`, `scOvertakeBeforeLine`,
    `vscEndingWarn`, `trackLimits`, `yellowLapDeleted`, `pitExitLine`, `impeding`; además, para la presentación, caja
    (H, semiautomática, *seamless*) y coche de seguridad por era.
13. **§6.3 pack**. Añadir `calendar[].sessions[] {kind, startLocal}` y `calendar[].scRate`.
14. **§1.4 / §2.5 (método)**. Dejar escrito que de los vídeos de gameplay solo se toman ideas y estructura; sus cifras
    son referencia; cuando el juego contradice la realidad (DRS en la V2, pit lane de 28 s, 6.000 rpm en horquillas,
    evolución de pista) manda la fuente real. No contradice el SRS actual, pero hoy solo lo dice SIM-FISICA §1.

RF-SIM-08 **no** se enmienda: el SRS ya pide el DRS desactivado en las dos primeras vueltas; el juego es el que se
equivoca.
