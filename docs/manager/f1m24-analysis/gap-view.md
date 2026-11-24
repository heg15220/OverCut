# gap-view: presentación de F1 Manager 24 frente a OverCut Manager

Ámbito: realización de TV y tipos de cámara, geometría de los onboards, sonido del motor y de los cambios, ambiente y mezcla, sonido del pit lane y del SC, HUD en directo (torre, paneles de piloto, botones, reproducción) y pantallas previas y posteriores a cada sesión.

Fuentes: los siete informes de analistas (`ui-menus`, `practice-quali`, `race-1`, `race-2`, `cameras`, `audio`, `dynamics`), leídos enteros, y el código actual:

- `frontend/src/modules/overcutManager/three/cameras.js` y `three/Race3D.js`
- `three/audio/{index,engineSynth,mixer,ambience}.js` y `data/balance/audio.json`
- `components/{LiveRace,SessionLive,Broadcast,Weekend}.js`
- `docs/manager/{SRS,DESIGN}.md`

No se ha editado el repositorio.

Reglas que se aplican a todas las propuestas:

- **RNF-07**: ningún valor de balance ni de presentación va en el código. Todo vive en `data/balance/*.json` con su esquema en `engine/packs/schema/`.
- **SRS §6**: coherencia histórica por era.
- De F1 Manager 24 solo se toman ideas y estructura. Nada de assets, textos, logotipos ni sonidos; las cortinillas y los sonidos de interfaz son de diseño propio.
- Las cifras del juego se usan solo como referencia. Los valores reales se calibran con FIA, f1db y OpenF1.

Prioridades:

- **P1**: el usuario lo ve o lo oye en cada sesión en directo.
- **P2**: profundidad.
- **P3**: pulido.

---

## 0. Resumen

OverCut ya tiene una base sólida:

- **Cámaras**: un rig de cámaras de pista ajustado a la malla GLB con línea de visión (`fitRig`) y ocho modos de cámara (`cameras.js:22`).
- **Motor**: un sintetizador de motor por era y fórmula f1db con Doppler y mezcla por cámara (`audio.json`).
- **Ambiente**: un lecho de público, viento y lluvia, y pistolas neumáticas.
- **HUD**: una torre con tres modos, una franja de estado de bandera y meteo, y una barra de reproducción ×1–×16.

Las diferencias grandes frente a la referencia son siete:

1. **El realizador.** El nuestro no sigue al coche que el usuario enfoca: en modo TV elige él una pelea o al líder cada 7 s de reloj real (`LiveRace.js:419-432`). Tampoco tiene secuencias (boxes, salida, meta, parrilla), repeticiones ni insertos de onboard.
2. **El sonido de los cambios.** El cambio es un salto de 15 ms, igual para todos los fabricantes. No hay deslizamiento de tono, «pop», golpes de gas al reducir ni perfil por unidad de potencia. El limitador de boxes «rebota» a 14 Hz cuando debería ser un tono plano.
3. **La mezcla por vista.** El mapa suena casi como la TV, la pausa no apaga los motores y el oyente de TV es un poste virtual, no la cámara real del rig.
4. **Eventos sonoros que faltan.** No suenan las luces de salida, los pianos, la radio filtrada, la interfaz ni el ruido del pelotón en la salida.
5. **El HUD.** La torre solo tiene intervalo, líder y neumáticos, sin sectores, última vuelta ni paradas, y su cabecera no se tiñe de amarillo por sector. No hay banners de evento con repetición. El panel del piloto muestra el combustible en vueltas y no en kg, la temperatura de neumáticos sin °C y no tiene widget de tiempos de parada. La velocidad no baja sola a ×1 en los eventos.
6. **La salida y el SC.**
   - Las luces se encienden cada 0,8 s y se apagan a un tiempo fijo, ambos escritos en el código (`LiveRace.js:52,490`).
   - El coche de seguridad lo pinta la vista 90 m por delante del líder (`LiveRace.js:450-455`, `Race3D.js:418-430`), no la simulación.
   - El VSC no tiene delta ni sonido propio.
7. **El flujo del fin de semana.** No hay transiciones entre fases ni ventana de opciones de sesión (gestionar o simular), y la pantalla de resultados de las sesiones no es única.

Abajo van 28 puntos, cada uno con lo que se observó, lo que tenemos hoy, la propuesta y los requisitos que toca.

---

## 1. Cámaras y realización

### 1.1 `director-follow-focus` (P1, M)

- **Observado** (`cameras`, §6): la cámara TV sigue siempre al coche que el usuario enfoca. El marcador del minimapa es continuo entre cortes, y el usuario cambió a Norris sin salir de la TV.
- **Hoy**:
  - En modo `tv`, `LiveRace.js:419-432` sustituye el coche enfocado por `director.current.id` (el atacante de una pelea o el líder) y lo renueva cada 7 s de reloj real (`until: realNow + 7`).
  - `Race3D`, el minimapa y el audio reciben ese id (`LiveRace.js:464,600,621,694`).
  - El clic en la torre cambia `focusId`, pero en TV no tiene efecto.
- **Propuesta**:
  - Separar el **coche enfocado** (lo decide el usuario) del **tipo de vista** (TV automática, cámara fija del usuario o mapa).
  - En `components/director/` (un módulo nuevo y puro, sin React) crear `directorState(focusId, rows, events, rig, clock)`, que devuelva `{ cameraId, subjectIds[], shotKind, reason }`.
  - El modo «el realizador elige la pelea» pasa a ser una opción («seguir la acción») dentro de `broadcast.json`, apagada por defecto.
  - El 7 s actual se borra del código.
- **Requisitos**: RF-3D-04, RNF-07, RNF-09.

### 1.2 `camera-zones` (P1, L)

- **Observado** (`cameras`, §5): los relevos se dan en posiciones fijas de pista que se repiten cada vuelta (±0,01). Hay entre 18 y 22 zonas, cada una con 1 a 3 cámaras alternativas, y de 21 a 24 planos por vuelta. Mediana TS 3,3 s, TW 2,4 s y frontales de recta de 4 a 6 s.
- **Hoy**:
  - `cameras.js:42-72` coloca las cámaras por reglas fijas: en cada zona de frenada (22 m, 5 m de alto), en cada curva (38/52/68 m), en rectas cada 260 m, más una grada y un cable.
  - Elige la cámara de más prioridad que cubre el tramo (`cameras.js:232,258-261`) y no alterna variantes.
  - Todas las distancias y alturas están escritas en el código.
- **Propuesta**:
  - Nuevo `data/balance/broadcast.json` con un bloque `rigTemplate`: tipos de cámara (`braking`, `corner`, `straight`, `headOn`, `passPan`, `lateralTrack`, `highWide`, `grandstand`, `cable`), cada uno con su distancia, altura, ancho de encuadre (`width`), prioridad y peso.
  - Fichero opcional por circuito, `data/circuits/<splineId>/camera-zones.json`, con el esquema `{ zones: [{ fromM, toM, cams: [{ type, at, side, dist, height, weight }] }] }`, generado por un script desde la malla (`fitRig`) y corregible a mano.
  - En cada zona el realizador elige la cámara por peso con semilla y evita repetir la variante de la vuelta anterior.
  - Mantener el test de densidad: entre 18 y 24 planos por vuelta en Bahrein a ×1, medidos desde el motor y no por vídeo.
- **Requisitos**: RF-3D-03, RF-3D-04, RNF-02, RNF-05, RNF-07.

### 1.3 `tv-lens-behaviour` (P2, M)

- **Observado** (`cameras`, §4): la TS panea y hace zoom manteniendo el coche en el 15–35 % del ancho. El paso con barrido gira hasta 180° en un solo plano, y el seguimiento lateral sobre carril dura de 2 a 3 s. En las peleas se abre el encuadre para meter a los dos coches.
- **Hoy**: `cameras.js:276-281` usa un FOV calculado por el ancho fijo de la cámara, `look` con `lookLag 14` y nada más. Las peleas se resuelven en `LiveRace.js:428-430` poniendo el objetivo en el punto medio, solo en el mapa 2D.
- **Propuesta**:
  - En `cameras.js`, añadir `framing: { minShare, maxShare, critDamp }` por tipo de cámara (datos en `broadcast.json`).
  - Variante `passPan`, que permite girar el yaw a través del coche.
  - Variante `lateralTrack`: una cámara que se desliza en paralelo a la pista durante N metros.
  - Encuadre de pelea: si hay un rival a menos de `battleGapSec` (dato), el `width` crece hasta abarcar a los dos.
- **Requisitos**: RF-3D-04, RNF-07.

### 1.4 `pit-sequence` (P1, M)

- **Observado** (`cameras` §7, `race-2` §2.2, `practice-quali` §4):
  - **Parada del coche enfocado**: TS de entrada (4–5 s), PL alto sobre el carril (5–6 s), GA con mecánicos esperando unos 2,7 s antes de que llegue el coche (5–9 s), PL saliendo del box (~10,7 s), PL de la salida del pit lane (3–7 s), TW de la incorporación (1–2 s). Unos 40 s en total.
  - **Salida desde el garaje en una sesión**: cinemática solo la primera vez, luego una cadena de 5 o 6 cámaras con cortes cada 1–3 s hasta la cámara de la incorporación.
  - Los eventos de otros coches salen como banner y no cortan la secuencia.
- **Hoy**:
  - `Race3D.js:446-452` fija un único plano a 9 m del coche cuando `pose.garage`.
  - En boxes solo aparecen figuras del equipo (`buildCrew`, `Race3D.js:63-78,400-411`).
  - No hay cámaras de pit lane en el rig ni una secuencia ligada a `pitPhase` (que el reloj ya expone: `raceClock.js:359`).
- **Propuesta**:
  - Añadir al rig cámaras `pitEntry`, `pitLaneHigh`, `garage`, `boxExit`, `pitExit` y `merge`, situadas con la trazada del pit lane que ya calcula `engine/sim/pitLane.js`.
  - En `broadcast.json`, un bloque `sequences.pitStop` y otro `sequences.garageExit`, cada uno una lista `[{ trigger: "pitPhase:ENTRY_ROAD", cam, minSec, maxSec }]`.
  - La secuencia tiene prioridad sobre las cámaras de zona y sobre los eventos de la IA.
  - El plano de los mecánicos se adelanta `crewLeadSec` (dato) a la llegada del coche, cosa que se puede hacer porque el reloj conoce el futuro inmediato.
- **Requisitos**: RF-3D-04, RF-SIM-12, RF-WKD-02, RNF-07.

### 1.5 `replays` (P1, L)

- **Observado** (`cameras` §6, `race-1`, `race-2`):
  - Hay un banner arriba con la opción de ver la repetición.
  - La repetición dura de 9 a 22 s, con una cortinilla de 1,2 s al entrar y otra al salir, y de 1 a 3 ángulos.
  - El HUD se oculta: solo quedan la etiqueta, el piloto y un botón para saltar.
  - La simulación se pausa durante la repetición.
  - Disparadores: adelantamiento propio, bloqueo o trompo de un rival, abandono o amarilla (con plano del garaje), parada de un rival y meta (con primer plano del piloto).
- **Hoy**: no hay repeticiones; `replay` no aparece en `components/` ni en `three/`.
- **Propuesta**:
  - `components/replay/replayBuffer.js`: un buffer circular de poses de los 22 coches durante `bufferSec` (unos 25 s, dato), muestreado del `liveCarAt` ya existente. El coste es pequeño: 22 coches × 25 s × 10 Hz.
  - `components/replay/ReplayOverlay.js`: la cortinilla (diseño propio con el logo de OverCut), los ángulos elegidos del rig por la posición del evento, la etiqueta, el piloto y el botón de saltar.
  - En `broadcast.json`: `replay { bufferSec, stingSec, maxSec, triggers: { pass, mistake, dnf, pitOther, finish }, pauseSim: true }`.
  - Mientras dura, el reloj de LiveRace se pausa igual que con el botón de pausa. La determinación del resultado no cambia (RNF-05), porque las repeticiones solo leen datos.
- **Requisitos**: RF-3D-04, RF-SIM-15, RNF-05, RNF-07.

### 1.6 `onboard-mounts` (P1, M)

- **Observado** (`cameras` §3): seis onboards.
  - CP sobre el halo: ~1,0 m de alto y ~85° de FOV.
  - RO trasera sobre el airbox: ~70°.
  - HP, ojos del piloto: ~0,72 m, ~100°, con vibración y la marcha legible en el volante.
  - HS lateral de cabina: ~70°.
  - SP en el pontón: 0,6 m de alto y 0,5 m fuera del eje, ~80°.
  - CU, primer plano de la visera, solo en la repetición de meta.
- **Hoy**:
  - `cameras.js:160-174` define `tcam` (FOV 68), `tcamRear` (64), `visor` (82) y `nose` (74) con desplazamientos escritos en el código.
  - No hay HS, SP ni CU.
  - La vibración usa `Math.random()` con una amplitud escrita en el código (`Race3D.js:476-479`).
  - El volante no muestra la marcha.
- **Propuesta**:
  - Nuevo `data/balance/cameras.json` con `onboard[]: { id, mount: { ahead, side, up, pitchDeg }, fovDeg, near, shake: { perMs, max }, eras: [from, to] }`.
  - Coherencia por era: no hay halo antes de 2018 (la HP cambia de encuadre); la T-cam es de los años 90 en adelante; antes de unos 1985 solo hay cámaras de pista (por verificar con fuentes).
  - Las medidas se leen de `carModel.js`/`assetCar.js` (`spec.head`, `spec.front`) multiplicadas por el montaje.
  - Añadir `cockpitSide` (HS) y `sidepod` (SP). La CU solo en repetición.
  - Una pegatina de marcha en el volante (textura dinámica) que lea `pose.gear` del tren motriz (`engine/sim/powertrain.js`).
- **Requisitos**: RF-3D-04, RF-3D-05, SRS §6.2, RNF-07.

### 1.7 `user-camera-lock` (P1, S)

- **Observado** (`cameras` §8): el usuario cicla cámaras en ráfagas (mediana 0,4 s) y puede fijar una onboard entre 25 y 127 s; mientras está fija, el realizador no corta. Hay botones de cámara anterior y siguiente, y el cambio de coche se hace con la onboard activa. La vista (mapa, carrera, datos) es un estado aparte de la cámara.
- **Hoy**:
  - `PlaybackBar` cicla una sola lista que mezcla vistas y cámaras (`LiveRace.js:74`: `tv…tcamRear, map`).
  - No hay botones de coche anterior o siguiente, solo el clic en la torre o en el 3D.
  - El orden es fijo en el código.
- **Propuesta**:
  - En `Broadcast.js`, separar en `PlaybackBar` un selector de **vista** (Mapa, TV, Cámara) y un selector de **cámara** (lista sacada de `cameras.json` por era).
  - Añadir los botones «coche anterior» y «coche siguiente» por posición.
  - En vista Cámara, el realizador no corta.
  - En `broadcast.json`: `cycleOrder` y `defaultView` por sesión (en libres, el mapa por defecto).
- **Requisitos**: RF-3D-04, RNF-09, RNF-07.

### 1.8 `onboard-inserts` (P3, S)

- **Observado**: en el último tercio de carrera aparecen insertos de vista del piloto de 3 a 16 s, una o dos veces por vuelta, en rectas (inferido como del realizador).
- **Hoy**: no hay insertos.
- **Propuesta**: en `broadcast.json`, `inserts.onboard { perLap, minSec, maxSec, zoneKinds: ["straight"] }`, elegido con semilla dentro de `director/`.
- **Requisitos**: RF-3D-04, RNF-07.

### 1.9 `start-finish-scripts` (P2, M)

- **Observado** (`cameras` §7, `race-1` §2, `race-2` §6):
  - **Antes de la salida**: unos 25 s de planos de parrilla (SC aparcado, piloto, coche, muro), cortinilla, plano alto de la parrilla durante el semáforo, frontal en la salida y planos de 0,5 a 3,5 s en T1.
  - **En la meta**: repetición del cruce, primer plano del piloto, y después el realizador salta a cada coche que cruza la línea (1,3–2,5 s).
  - El panel del piloto que ha terminado se pliega.
- **Hoy**: la salida es un semáforo superpuesto (2D) o las luces del modelo de pista (3D), más el banner «Se apagan los semáforos» durante 3 s (`LiveRace.js:628-635`). En la meta, un banner (`LiveRace.js:636-641`) y nada más.
- **Propuesta**:
  - En `broadcast.json`: `sequences.preRace` (lista de planos con `subject: grid|safetyCarParked|driver|pitWall`, que se puede saltar), `sequences.start` (plano alto de parrilla y frontal) y `sequences.finish` (repetición del ganador y `finisherShots { minSec, maxSec }`).
  - Los planos usan las cámaras `grandstand` y `pitWall` del rig.
  - Coherencia: el SC aparcado en la parrilla solo desde 1993.
- **Requisitos**: RF-3D-04, RF-SIM-10, SRS §6.2, RNF-07.

---

## 2. Sonido

### 2.1 `shift-shape-per-pu` (P1, M)

- **Observado** (`audio` §2, `race-1`, `race-2`):
  - Al subir de marcha, el tono baja con un deslizamiento de 70 a 100 ms, no con un salto seco.
  - Ferrari: sin corte, con un «pop» de +2 a +3 dB durante 30–40 ms. McLaren: una muesca de −3 a −8 dB de unos 40 ms.
  - Punto de cambio y caída por fabricante: Ferrari unas 11.850 rpm y 0,90–0,91 en marchas altas; McLaren unas 11.560 rpm y 0,87; Red Bull unas 12.000 rpm y 0,87.
  - Escalera determinista, idéntica en dos vueltas.
- **Hoy**:
  - `audio.json` → `eras[hybrid-v6-2022].engines` tiene una sola regla `match: {}` con `shiftRpm 12000` para todos.
  - `shiftCutMs: 15` en esa era.
  - `engineSynth.js` → `shiftCutGain` solo hace una muesca de ganancia.
  - El tono salta en el mismo fotograma (`set` con `smoothingSec 0.04`).
- **Propuesta**:
  - En `audio.json`, añadir `shiftProfiles[]: { match: { constructorEngineId | manufacturer }, shiftRpm, glideMs, transient: { kind: "pop"|"cut", db, ms } }`, con `match` contra el motor de f1db del pack (`teams[].engines[].id`).
  - En `createEngineVoice`, aplicar `linearRampToValueAtTime` sobre la frecuencia durante `glideMs`, más la envolvente del transitorio.
  - **Datos**: punto de cambio y relaciones reales de OpenF1 `car_data` (rpm y `n_gear`) por equipo y temporada desde 2023. Para eras anteriores, valores marcados NV.
  - Coherencia: H-pattern manual (corte largo) antes de 1989, semiautomático después, *seamless shift* desde unos 2008 (por verificar).
- **Requisitos**: RF-3D-04, RF-SIM-02, SRS §6.2, RNF-07.

### 2.2 `downshift-blips` (P1, S)

- **Observado** (`audio` §2.2): al levantar el pie el tono cae ~1 % cada 100 ms y el nivel baja 7–9 dB. En la frenada hay de 4 a 6 golpes de gas en forma de «^» (+6 a +15 %, 80–150 ms, cada 0,25–0,5 s) y una meseta de 0,3–0,5 s en el vértice.
- **Hoy**: `nextGear` reduce de marcha por `downshiftShare 0.62` sin ningún evento sonoro. La carga sale de la aceleración (`loadFromAccel`) y el *overrun* da crepitaciones aleatorias, no golpes de gas.
- **Propuesta**: en `audio.json` → `voicing.downshift { blipPct, blipMs, minSpacingSec }`. En `driveStep`, que `shifted` lleve su dirección; `voice.update` aplica un pulso de tono y de ganancia en cada reducción.
- **Requisitos**: RF-3D-04, RNF-07.

### 2.3 `pit-limiter-tone` (P1, S)

- **Observado** (`audio` §4, `race-2`, `practice-quali`): en el pit lane el tono es estable (197,5 Hz en 3c; variación <1 % en 2 s), idéntico a la entrada y a la salida y sin sierra. En la salida, escalón de tono y paneo fuerte.
- **Hoy**: `engineSynth.js` (`driveStep`, rama de `pitPhase` LIMITER/ENTRY_ROAD/EXIT_ROAD) fija la 2.ª marcha (`pitLimiterGear: 2`) y activa el `limiterLfo` cuadrado a 14 Hz con profundidad 0,6, es decir, un rebote audible.
- **Propuesta**:
  - En `audio.json` → `voicing.pitLimiter { gear, flutterHz, flutterDepth }`, con `flutterDepth` por defecto casi 0 y separado del limitador de régimen.
  - Las rpm del limitador salen de `pitLaneSpeed` (de `era-defaults.json` y del pack; 80 km/h en Bahrein en 2024) y de la marcha.
  - Coherencia: sin límite de velocidad en el pit lane antes de 1994 (por verificar con el reglamento); antes de esa fecha no hay tono de limitador.
- **Requisitos**: RF-3D-04, RF-SIM-12, SRS §6.2, RNF-07.

### 2.4 `mix-snapshots-per-view` (P1, M)

- **Observado** (`audio` §3, `race-1`):
  - Onboard de −26 a −30 dBFS, casi mono (correlación 0,98).
  - TV de pista a −41, ancha (0,68), con Doppler y paneo.
  - Mapa de −43 a −59 dBFS, prácticamente sin motores.
  - Pausa y menús de parada a −49,5: el motor desaparece.
  - Repetición a −32, mezcla de onboard, con un *whoosh* en la cortinilla.
  - Diferencia entre onboard y TV lejana: unos 14 dB.
- **Hoy**:
  - En `audio.json` → `mixer.cameras.mix.map`, el coche enfocado tiene `focus 1` y el resto `field 0.8`: el mapa suena casi como la TV.
  - En pausa, `playing:false` silencia los motores (`index.js`), pero no hay un *snapshot* propio con un lecho bajo.
  - El oyente de TV es un poste virtual 160 m por delante (`mixer.js:93-101`), no la cámara que realmente está en pantalla en `cameras.js`.
  - No existe la vista de repetición.
- **Propuesta**:
  - `mixer.cameras.mix` pasa a tener `map`, `paused`, `replay` y `menu`, con `focus`, `field`, `crowd` y `bedDb`.
  - Los cambios de mezcla al cortar de cámara se hacen con un fundido de `crossfadeMs`.
  - El oyente de TV pasa a ser la posición real del rig: `Race3D` publica la cámara activa en un `ref` que lee el audio, y el poste virtual queda solo como respaldo en 2D.
  - Paneo en estéreo según la posición en pantalla (ya hay `PannerNode`): basta con colocar al oyente en la cámara real.
- **Requisitos**: RF-3D-04, RNF-02, RNF-07, RNF-09.

### 2.5 `start-lights-sound-and-timing` (P1, S)

- **Observado** (`race-1` §2, `audio` §5): las luces se encienden a intervalos de 1,0 s y cada una suena con un golpe grave y un tono. Las luces se apagan 1,6 s después de la quinta, sin sonido propio. Los motores lanzados se oyen unos 0,4 s más tarde y el HUD aparece a +0,9 s. Con las luces encendidas se oyen subidas de vueltas en la parrilla.
- **Hoy**:
  - `LiveRace.js:52`: `INTRO_SECONDS = 4.6`.
  - `LiveRace.js:490`: una luz cada 0,8 s (`intro/0.8`).
  - El apagado llega a un tiempo fijo: no hay espera aleatoria.
  - No hay sonido de luces ni subidas de vueltas en parrilla; solo `swell.start` del público (`index.js:193`).
  - Todo escrito en el código.
- **Propuesta**:
  - En `broadcast.json`: `start { lightIntervalSec: 1.0, holdMinSec, holdMaxSec, hudDelaySec }`, con la espera tirada con la semilla de la carrera (RF-SIM-15).
  - En `audio.json`: `ambience.startLights { thumpHz, toneHz, gain }` y `gridRevs { rpmShare, jitter }`.
  - Coherencia por era (a verificar):
    - Antes de 1996: luz roja y después verde. Desde 1996: cinco rojas que se apagan.
    - Salida lanzada tras SC: sin luces.
- **Requisitos**: RF-SIM-10, RF-SIM-15, SRS §6.2, RNF-05, RNF-07.

### 2.6 `field-bed-start` (P2, S)

- **Observado**: en la salida, el pelotón produce una banda ancha densa con muchos peines, el nivel más alto de la mezcla de pista (−15,7 dB de mediana).
- **Hoy**: `mixer.maxVoices: 6`. Los 16 coches restantes no se oyen, y no hay un lecho que los represente.
- **Propuesta**: en `ambience.js`, un `fieldBed` de ruido filtrado más 2 o 3 peines desafinados, con ganancia proporcional al número de coches a menos de `nearbyMetres` del oyente que no tienen voz propia. Datos en `audio.json` → `ambience.fieldBed`. El coste es mínimo (RNF-02).
- **Requisitos**: RF-3D-04, RNF-02, RNF-07.

### 2.7 `kerbs-wind` (P2, S)

- **Observado** (`audio` §3 y la sección de ambiente): en onboard, los pianos suenan con un peine de unos 40 Hz y +12–15 dB en 40–150 Hz durante 0,5–0,8 s. El viento o la rodadura entre 2 y 8 kHz sube unos 5 dB con la velocidad.
- **Hoy**: el viento ya existe (`ambience.wind`, de 250 a 2.200 Hz, y `windOf`). No hay sonido de pianos: el reloj no informa de cuándo un coche pisa un piano.
- **Propuesta**:
  - Pasar el viento a `highHz` 8000 (dato).
  - En `ambience.js`, una voz `kerb` que se dispara cuando el coche enfocado pisa un tramo marcado como piano. Las zonas de piano se guardan en `trackTables.js`/`racingLineSolver` como `kerbs: [{ fromM, toM, side }]` por circuito, o se derivan de la malla GLB.
  - Datos en `audio.json` → `ambience.kerb`.
- **Requisitos**: RF-3D-03, RF-3D-04, RNF-07.

### 2.8 `radio-ui-sounds` (P2, M)

- **Observado** (`audio` §6, §4):
  - Radio del equipo filtrada en banda telefónica (300–3.000 Hz), ligada a avisos como la entrada en boxes.
  - Clics de interfaz de 5 a 30 ms, *whoosh* de 0,4 a 0,7 s al cambiar de panel y arpegio de aviso.
- **Hoy**: el `Feed` muestra la radio como texto (`Broadcast.js:209`). No hay sonido de radio ni de interfaz.
- **Propuesta**:
  - Nuevo `three/audio/uiSounds.js`, sintetizado y sin muestras: clic, *whoosh* y aviso.
  - La «radio» se representa con un tono corto de apertura y cierre más ruido filtrado por el mismo bus, sin voz grabada; texto en ES/EN (RNF-08).
  - Datos en `audio.json` → `ui { click, whoosh, alert, radio { bandHz: [300, 3000] } }`.
  - Un control propio en `SoundControl.js` para el bus de interfaz.
- **Requisitos**: RF-CMD-03, RNF-07, RNF-08.

### 2.9 `sc-vsc-sound` (P2, S)

- **Observado**: no se vio SC ni VSC en ningún tramo del vídeo; el analista de audio sugiere rpm más bajas, marchas largas y sin frenadas fuertes.
- **Hoy**:
  - No hay tratamiento sonoro específico.
  - El coche de seguridad no tiene voz.
  - Con VSC el `driveStep` sigue al ritmo que le llegue de la simulación.
- **Propuesta**:
  - Con `pose.rpm` y `pose.gear` del tren motriz bajo SC o VSC (la velocidad la da `stepRace.js:803`, `balance.safetyCar`), el sintetizador ya bajaría solo.
  - Añadir una voz para el SC (V8 o V6 de calle, sacado de `audio.json` → `safetyCar { formula, by era }`).
  - Un aviso de interfaz con radio cuando se despliega o se retira.
  - Coherencia: SC desde 1993 y VSC desde 2015 (SRS §6.2).
- **Requisitos**: RF-SIM-10, SRS §6.2, RNF-07.

---

## 3. HUD en directo

### 3.1 `tower-modes` (P1, M)

- **Observado** (`practice-quali` §3, `race-1` §7, `race-2` §9):
  - Modos de la torre: intervalo, líder, neumáticos (compuesto y %), última vuelta, sectores (barras de color), paradas (número de paradas por coche) y estado.
  - Etiquetas por fila: vuelta de salida o de entrada, en boxes, +1 vuelta, rombo de incidente, morado de vuelta rápida y bandera a cuadros al terminar.
- **Hoy**:
  - `LiveRace.js:104`: `TOWER_MODES = ["interval", "gap", "tyres"]`.
  - `Broadcast.js:52-131` pinta la fila con pos/franja/código/valor/marca de vuelta rápida.
  - No hay sectores, última vuelta, paradas, rombo de incidente ni bandera a cuadros por fila.
  - El neumático no muestra %, solo el compuesto y la edad.
- **Propuesta**:
  - Extender la lista de modos a `lastLap`, `sectors`, `stops` y `tyres%`.
  - Nuevos `flags`: `incident` (rombo), `finished` (cuadros), `outLap` e `inLap`.
  - La lista de modos y su orden por era van en `data/balance/hud.json` → `tower.modes`. Por ejemplo, el desgaste en % solo si la era tiene datos de neumático; los sectores están disponibles en todas.
  - Los sectores salen de los cruces de `circuit.sectors` que ya usa la sesión (`SessionLive` → `Sectors`).
- **Requisitos**: RF-WKD-07, RF-3D-04, RNF-07, RNF-09; DESIGN §5.5.

### 3.2 `flag-header-sectors` (P1, S)

- **Observado** (`race-1`, `race-2`, `dynamics`): con bandera amarilla, la cabecera de la torre se vuelve amarilla y alterna entre «bandera», «sector N» y «vuelta». Duraciones observadas de 2 a 19 s. En las sesiones se ve lo mismo (P1 54:23).
- **Hoy**:
  - La franja de estado (`StatusStrip`) muestra «Amarilla · T7…» por curva (`LiveRace.js:580-581`), no por sector.
  - La torre no cambia de color.
  - En libres y en clasificación solo existen verde y bandera a cuadros (`SessionLive.js:372`): las amarillas por incidente no llegan a la sesión.
- **Propuesta**:
  - `TimingTower` recibe `flag` y tiñe la cabecera con tokens de DESIGN (`--mn-flag-yellow`; con texto, nunca solo color).
  - La correspondencia de curva a sector se lee de `circuit.sectors`.
  - `sessionSim` emite `yellow` cuando hay un `mistake` (los datos de `raceControl.yellow` ya existen en el balance de carrera); `SessionLive` lo pinta.
- **Requisitos**: RF-SIM-10, RF-WKD-02, RNF-09; DESIGN §6.5.

### 3.3 `event-banners` (P1, M)

- **Observado**:
  - Banners arriba en el centro para adelantamientos, bloqueos, trompos, choques, investigaciones, vuelta rápida (con nombre y tiempo), DRS activado, vueltas restantes (15, 10, 3), última vuelta y meta, cada uno con acceso a su repetición.
  - El banner llega unos 13 s después del cambio en la torre: espera a la confirmación en un punto de cronometraje.
  - En sesiones aparecen además el aviso de Dirección de Carrera, el inicio de sesión y el DRS.
- **Hoy**: solo «Se apagan los semáforos» (`LiveRace.js:635`), la bandera a cuadros (`:636-641`) y el chip de pelea (`:643-648`). Los demás eventos solo salen en el `Feed`.
- **Propuesta**:
  - Componente `EventBanner` en `Broadcast.js` con una cola (uno cada vez) y `durationSec`, `confirmDelaySec` y `kinds` en `hud.json`.
  - Botón «Ver repetición» si el buffer lo cubre (punto 1.5).
  - Los avisos de vueltas restantes, en `hud.json` → `lapsToGoCallouts: [15, 10, 3, 1]`.
  - Coherencia: DRS de 2011 a 2025, activado en la V3 y no en la V2 como hace el juego (RF-SIM-8; `race-1` lo señala); en 2026, aerodinámica activa.
- **Requisitos**: RF-SIM-08, RF-SIM-10, RF-CMD-03, RF-3D-04, RNF-07, RNF-08.

### 3.4 `auto-speed-drop` (P1, S)

- **Observado** (`practice-quali` §2, `race-2`): en eventos clave la velocidad vuelve sola a ×1: salida del garaje, entrada a boxes propia, bandera a cuadros e incidente. Los menús de parada y de boxes pausan la sesión.
- **Hoy**: `setSpeed` solo cambia a mano (`LiveRace.js:300,704`). `SessionLive.js:169` no baja sola de ×10 o ×30 cuando un coche sale del garaje.
- **Propuesta**:
  - En `hud.json` (o `broadcast.json`): `autoSpeed { onUserPitEntry: 1, onGarageExit: 1, onChequered: 1, onIncidentUser: 1, restoreAfter: true }`.
  - Un pequeño hook `useAutoSpeed(events, setSpeed)` compartido por `LiveRace` y `SessionLive`, que restaura la velocidad previa al terminar la secuencia.
- **Requisitos**: RF-CMD-04, RNF-07.

### 3.5 `speeds-unify` (P1, S)

- **Observado**: la misma escala 1, 2, 4, 8, 16 en todas las sesiones, con un rótulo grande al cambiar.
- **Hoy**: carrera `[1, 2, 4, 8, 16]` (`LiveRace.js:46`); sesiones `[1, 4, 10, 30, 60]` (`SessionLive.js:33`). Las dos listas están escritas en el código y no siguen la misma escala. RF-CMD-04 fija ×1…×16.
- **Propuesta**:
  - Mover `speeds` a `data/balance/sessions.json` (para las sesiones) y a `race-sim.json` (para la carrera), con `default` por tipo de sesión.
  - Si las sesiones necesitan ×30 o ×60 para que libres de 60 min sean jugables, documentarlo como excepción en el SRS (RF-CMD-04 dice hoy ×1–×16).
  - Rótulo central temporal al cambiar de velocidad.
- **Requisitos**: RF-CMD-04, RNF-07.

### 3.6 `driver-panel-units` (P1, M)

- **Observado** (`race-1` §7, `race-2`, `practice-quali`):
  - Panel de estado con desgaste en %, temperatura del neumático en °C con flecha de tendencia (roja por encima de unos 120 °C), delta de combustible en kg respecto al objetivo, temperatura del motor, batería en % con modo.
  - Cabecera con DRS (verde cuando está en rango) y ventana de parada.
  - Cuatro pestañas: estado, tácticas, telemetría y boxes.
  - Un tooltip de telemetría con marcha, km/h y rpm.
- **Hoy** (`LiveRace.js:736-902`):
  - Temperatura de neumático como `Meter` de 0 a 100 sin °C.
  - Combustible en vueltas (`fuelMargin … v`).
  - Batería en MJ (`store.soc`); sin temperatura de motor.
  - Sin ventana de parada ni tooltip de telemetría.
  - Las tácticas (aire limpio, pianos, compañero) solo aparecen como órdenes de equipo.
- **Propuesta**:
  - Pestañas dentro de `DriverCard`.
  - Unidades físicas (°C, kg, %) leídas del estado del motor de simulación. Si la simulación no guarda °C, convertir con `race-physics.json` → `tyreThermal { coldC, optC, hotC }` por compuesto y era (calibrado con Pirelli y OpenF1); no copiar los 116–125 °C del juego.
  - Tooltip de telemetría con `pose.v`, `pose.gear` y `pose.rpm`.
  - Ventana de parada calculada por `strategyCall`.
  - Coherencia: sin batería antes de 2009; KERS en 2009 y de 2011 a 2013; delta de combustible solo sin repostaje.
- **Requisitos**: RF-CMD-01, RF-SIM-03, RF-SIM-04, RF-SIM-05, RF-SIM-13, SRS §6.2, RNF-07.

### 3.7 `pit-widget-and-dialog` (P1, M)

- **Observado** (`race-1` §6, `race-2` §2.1):
  - Al pedir la parada se abre una ventana que pausa la sesión. Incluye los juegos de neumáticos con su desgaste, la comparación entre el montado y el planificado, la regla de compuestos, el tiempo total estimado, la posición estimada a la salida, el selector de vuelta y avisos de conflicto con el compañero (doble parada).
  - El botón de parada muestra la distancia a la entrada del pit en km.
  - Durante la parada hay un widget: tiempo en pit, tiempo parado en rojo y total congelado en la línea de salida.
- **Hoy**:
  - La parada se pide con botones de compuesto dentro de la tarjeta (`LiveRace.js:845-860`), sin pausa, posición estimada, distancia ni aviso de doble parada.
  - Durante la parada, solo la etiqueta `BOX x.xs` sobre el coche (`Race3D.js:518-519`).
- **Propuesta**:
  - `components/PitDialog.js` (con `Sheet` de DESIGN §6.4) que pausa el reloj al abrirse (dato `pauseOnOpen`). Contenido:
    - la previsión de posición, con `raceClock.standingsAt` adelantado lo que dura la pérdida en boxes;
    - la distancia a `circuit.pit.entry`;
    - el aviso cuando el compañero tiene la parada pedida en la misma vuelta.
  - `PitTimer` en el overlay, que lee `pitPhase`/`pitStage` y los tiempos de parada que ya calcula `pitStop.js`.
- **Requisitos**: RF-CMD-02, RF-SIM-12, RF-SIM-13, RNF-07.

### 3.8 `status-strip-data` (P2, S)

- **Observado**: bloque de condiciones con la hora local real de la sesión (14:30, 18:00…), el aire, la pista, el agua en mm, la goma y el agarre, que evolucionan.
- **Hoy**:
  - Hora fija de las 15:00 (`LiveRace.js:512`: `15 * 3600`).
  - Aire calculado como `trackTemp*0.62+4` (`:591`).
  - Goma por `displayLap/(laps*0.55)` (`:514`).
  - Agua en mm como `wetness*3` (`Broadcast.js:160`).
  - Etiquetas con umbrales en el código (`Broadcast.js:128-129`).
  - Todo es balance escrito en código (RNF-07).
- **Propuesta**:
  - La hora local de inicio sale del pack (calendario de f1db o FIA por sesión).
  - El aire, de la línea de tiempo meteorológica (`engine/weather`, calibrada con OpenF1 `weather`).
  - La goma, del modelo de evolución que ya existe en `sessions.json` → `evolution` (y su equivalente en carrera).
  - Los milímetros y los umbrales de las etiquetas, en `race-weather.json` → `display { mmPerWetness, rubberBands, gripBands }`.
- **Requisitos**: RF-SIM-11, RF-WKD-03, RNF-07.

### 3.9 `finish-ui` (P2, S)

- **Observado**: el aviso de vueltas restantes sustituye al contador; luego «Última vuelta» en rojo y «Terminado»; cuadros por fila; el panel del piloto que ha terminado se pliega; radio de meta.
- **Hoy**: el contador de vuelta (`LiveRace.js:655-657`), el banner de cuadros y `lv-card__status` «Terminado» (`:898`). La tarjeta no se pliega y la fila no lleva cuadros.
- **Propuesta**: flag `finished` en la torre (punto 3.1), la clase `is-finished` en `DriverCard` que pliega las órdenes, y el texto de última vuelta en `StatusStrip`. Los umbrales de los avisos de vueltas, en `hud.json`.
- **Requisitos**: RF-WKD-07, RNF-08.

---

## 4. Salida, pit lane, SC/VSC y sin solapes (presentación)

### 4.1 `sc-pose-from-sim` (P1, M)

- **Observado**: no se vio SC ni VSC en el vídeo (solo el SC aparcado en la parrilla). La referencia para la velocidad bajo SC, el delta y la separación tiene que salir de la FIA y de OpenF1.
- **Hoy**:
  - La vista coloca el SC a 90 m del líder en dos sitios (`LiveRace.js:450-455` en 2D y `Race3D.js:418-430` en 3D).
  - La simulación no envía su posición (`raceClock.js:369` solo envía ventanas).
  - Las luces del SC no parpadean (emisivo fijo, `Race3D.js:48`).
  - No hay cámara ni banner de «SC entra esta vuelta» ni delta de VSC en el HUD.
- **Propuesta**:
  - `stepRace` publica `safetyCarPose { progress, v, lightsOn }` en el espejo del worker.
  - La vista solo lo dibuja; se borran los 90 m del código.
  - En `hud.json`, `sc { inThisLapBanner, vscDeltaDisplay }`.
  - Para el VSC, un delta frente al tiempo objetivo en la tarjeta del piloto; ese tiempo sale de `balance.safetyCar.virtualLapFactor`, que ya existe.
  - Parpadeo de la barra de luces, con su frecuencia en `broadcast.json`.
  - El realizador, al desplegarse el SC, pone un plano del coche de seguridad saliendo de boxes (`sequences.scDeploy`).
  - Coherencia: SC desde 1993 y VSC desde 2015.
- **Requisitos**: RF-SIM-10, RF-3D-04, SRS §6.2, RNF-07.

### 4.2 `no-overlap-view` (P1, S)

- **Observado** (`race-1`, `dynamics`): nunca se ven coches solapados. En paralelo hay un hueco lateral de 0,3 a 0,7 m, se ven unos 3 s rueda con rueda, y el que va en la estela se coloca a 2–3 largos y se abre un ancho de coche en unos 1,5 s.
- **Hoy**:
  - La carrera por pasos envía `pose.lateral` y la vista lo respeta (`Race3D.js:315-317`).
  - En la repetición rápida, la vista separa 2,3 m a quien está a menos de 9 m (`Race3D.js:317-320`); son constantes en el código y no comprueba solapes reales.
  - No hay ninguna comprobación en la vista: si la simulación envía dos coches en el mismo punto, se dibujan uno dentro del otro.
- **Propuesta**:
  - En `Race3D.step`, una pasada de seguridad que comprueba cajas orientadas entre vecinos (los anchos se leen de `spec`) y desplaza al de detrás lo justo, con el mínimo `minLateralGapM` sacado de `race-physics.json`.
  - Contar cada corrección con un contador en desarrollo, para detectar bugs de la simulación sin taparlos en silencio.
  - Pasar a datos el 2,3 m y los 9 m.
- **Requisitos**: RF-SIM-07, RF-3D-04, RNF-07.

### 4.3 `garage-exit-presentation` (P1, S)

- **Observado** (`practice-quali` §4, `dynamics` §5):
  - En sesión pasan de 26 a 30 s de juego desde la orden hasta estar en pista: unos 5 s del garaje a la calle, unos 10 s hasta la incorporación y unos 12 s por el carril de incorporación.
  - En el pit lane el coche va a 80–83 km/h y alcanza el límite en ~1 s.
  - El estado «saliendo del pit lane» se ve en la tarjeta.
- **Hoy**:
  - `SessionLive` pasa por `queued` («Saliendo») y luego a `out`; el pit lane de la sesión es un tiempo fijo (`sessions.json` → `laps.pitLaneSec: 14`).
  - La cámara se queda en el plano del garaje mientras `pose.garage` (`Race3D.js:446`).
  - No se muestra el coche recorriendo el pit lane a la velocidad límite como en carrera.
- **Propuesta**:
  - Que `sessionSim` use `engine/sim/pitLane.js` (el mismo perfil v(s) de la carrera, con el `pitLaneSpeed` de la era) para el recorrido del garaje a la incorporación.
  - Enganchar `sequences.garageExit` (punto 1.4).
  - En la tarjeta, añadir la fase `pitExit` con distancia y tiempo.
- **Requisitos**: RF-WKD-02, RF-SIM-12, RF-3D-04, RNF-07.

---

## 5. Pantallas previas y posteriores a la sesión

### 5.1 `session-options-transition` (P2, M)

- **Observado** (`ui-menus`):
  - El bucle es siempre el mismo: centro del fin de semana, preparación con los dos coches, opciones de sesión (gestionar, simular, simular hasta Q o carrera), transición con logotipo (~6,5 s), sesión, transición, resultados (y objetivos en libres) y vuelta al centro.
  - Las transiciones se pueden saltar.
  - La pantalla de opciones pide confirmación.
- **Hoy**:
  - `Weekend.js:75-174` pasa de una fase a otra al instante.
  - Cada fase (`Practice`, `Qualifying`, `Strategy`) lleva sus propios botones de directo o simulación (`<details>` «O simularla de una vez», `Weekend.js:478-492`).
  - No hay transición ni opción de «simular hasta…».
- **Propuesta**:
  - Componente `SessionGate` común: gestionar en directo, simular esta sesión o simular hasta la siguiente fase obligatoria; la confirmación usa un `Sheet`.
  - `Transition` con el logotipo de OverCut, que se puede saltar, con `transitionSec` en `hud.json` y respetando `prefers-reduced-motion` (DESIGN §2.6).
  - Máquina de estados del fin de semana en `engine/career` (`weekend.stage` ya existe), con los subestados `gate`, `live` y `results`.
- **Requisitos**: RF-WKD-01, RF-WKD-02, RF-WKD-07, RNF-07; DESIGN §2.6.

### 5.2 `session-results-unified` (P2, M)

- **Observado**: un único componente de resultados que se adapta al tipo de sesión. Muestra un retrato del ganador y una tabla de 10 filas por página: en libres, mejor vuelta y neumático; en clasificación, Q1/Q2/Q3 con la zona de eliminación en rojo. El mejor tiempo va en morado y las filas propias resaltadas.
- **Hoy**: en carrera, `Result` (`Weekend.js:771+`) muestra el podio 3D, la clasificación, las paradas, el Mundial y el gráfico de vueltas (RF-WKD-07 cubierto). Los resultados de libres y clasificación están repartidos por cada fase.
- **Propuesta**: `SessionResults({ kind, rows })` con columnas por tipo de sesión, que reutiliza el `DataTable` de DESIGN §5 y se usa en libres, clasificación, sprint y carrera.
- **Requisitos**: RF-WKD-07, RNF-09; DESIGN §5.

### 5.3 `practice-goals-summary` (P3, S)

- **Observado**: al terminar los libres, un resumen de objetivos (aclimatación, conocimiento de piezas, preparación) y la confianza del piloto antes de la clasificación.
- **Hoy**: el *feedback* del reglaje está en `SetupBench`. No hay pantalla de resumen al terminar la sesión.
- **Propuesta**: un panel «Lo que dejó la sesión» en `SessionResults` para libres, con los deltas de confianza (RF-WKD-03, 6 niveles) y del reglaje que ya calcula `engine/setup.js`.
- **Requisitos**: RF-WKD-03, RF-WKD-07.

### 5.4 `pre-race-briefing` (P3, S)

- **Observado**: antes del fin de semana llega un informe del circuito (longitud, vueltas, récord, probabilidad de SC, pérdida en el pit lane en verde y con SC, plan recomendado).
- **Hoy**: `CircuitCard` y `Practice` muestran el perfil y la facilidad para adelantar (`Weekend.js:389`). No hay probabilidad de SC ni pérdida en boxes.
- **Propuesta**: añadir a `CircuitCard` la pérdida en boxes (de `pitLane.js` con el `pitLaneSpeed` de la era) y la probabilidad de SC (del histórico de f1db u OpenF1 `race_control` por circuito, guardado en el pack). Sin textos copiados.
- **Requisitos**: RF-INB-01, RF-SIM-10, RF-SIM-12, SRS §6.3.

---

## 6. Ficheros de datos nuevos o ampliados (resumen de esquemas)

| Fichero | Bloques | Esquema |
| --- | --- | --- |
| `data/balance/broadcast.json` (nuevo) | `rigTemplate`, `framing`, `zonesPolicy { avoidRepeat, seedSalt }`, `sequences { pitStop, garageExit, preRace, start, finish, scDeploy }`, `replay`, `inserts`, `start`, `autoSpeed`, `cycleOrder`, `defaultView` | `engine/packs/schema/broadcast.schema.json` |
| `data/balance/cameras.json` (nuevo) | `onboard[] { id, mount, fovDeg, near, shake, eras }`, `heli { heightM, offset }` | `cameras.schema.json` |
| `data/circuits/<splineId>/camera-zones.json` (nuevo, opcional) | `zones[] { fromM, toM, cams[] }` | `camera-zones.schema.json` |
| `data/balance/hud.json` (nuevo) | `tower.modes`, `banners { kinds, durationSec, confirmDelaySec }`, `lapsToGoCallouts`, `transitionSec`, `sc` | `hud.schema.json` |
| `data/balance/audio.json` (ampliar) | `shiftProfiles[]`, `voicing.downshift`, `voicing.pitLimiter`, `mixer.cameras.mix.{paused,replay,menu}`, `crossfadeMs`, `ambience.{startLights,gridRevs,fieldBed,kerb,safetyCar}`, `ui` | `audio.schema.json` (existente) |
| `race-weather.json` (ampliar) | `display { mmPerWetness, rubberBands, gripBands }` | existente |
| pack de temporada | hora local de inicio por sesión y probabilidad de SC por circuito | SRS §6.3 |

## 7. Lo que no se pudo comparar

- **SC, VSC, bandera roja y daños visibles**: no aparecen en el vídeo. Las propuestas de los puntos 2.9 y 4.1 se apoyan en el reglamento y en OpenF1, no en la referencia.
- **Resultados de la carrera y podio**: el vídeo acaba antes. El podio 3D actual de OverCut no tiene contrapartida con la que compararlo.
