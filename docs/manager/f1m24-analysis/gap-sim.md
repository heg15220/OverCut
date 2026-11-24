# gap-sim: simulación y lógica de carrera, F1 Manager 24 frente a OverCut Manager

Clave `gap-sim`. Comparo lo que vieron los siete analistas (ui-menus, practice-quali, race-1, race-2, cameras, audio y dynamics) con el motor de OverCut a 24/11/2026: `engine/sim/`, `race.js`, `rules.js`, `sessionSim/`, `incidents.js`, `energy.js`, `weather/`, `drivers/`, `data/balance/` y `docs/manager/SIM-FISICA.md` (estado en su §7).

Reglas que sigo:
- Del juego de referencia solo tomo ideas y estructura. Sus cifras sirven de referencia; la calibración sale de la FIA, f1db y OpenF1.
- Ningún valor de balance va en el código (RNF-07): todo en `data/balance/*.json`, con esquema en `engine/packs/schema/`.
- Coherencia por era (SRS §6): cada regla nueva entra en `data/seasons/curated/era-defaults.json` o en los packs como tramos `{from, to, value}`. Las que salen de memoria van con `status: "pending"` (NV).
- Prioridad: **P1** se ve en todas las sesiones en directo; **P2** da profundidad; **P3** es pulido.

## 0. Resumen

El motor está muy por delante en física de base:
- Traza física por era.
- Pit lane físico con parada real en el box y pérdida a ±1 s de la real.
- Parada por etapas.
- Tren motriz contrastado con OpenF1.
- ERS/KERS con los límites de la FIA.
- Combustible por caudal.
- Clima ERA5.
- Doce atributos de piloto sacados de f1db.

En todo eso, OverCut es más riguroso que el juego. Los huecos están en otro sitio:

1. **Neutralizaciones**: el SC y el VSC son solo un tope de ritmo uniforme. No hay coche de seguridad, fases, doblados ni reanudación (`stepRace.js:802-806`).
2. **Contacto entre coches**: la separación lateral es de centro a centro igual al ancho del coche, es decir, holgura 0. Solo se compara con el coche de delante, y hay saltos de posición al cerrar un duelo (`stepRace.js:1489`, `:1531-1539`).
3. **Libres y clasificación**: no usan el motor por pasos. Las vueltas se deciden al empezar, el pit lane es fijo de 14 s y no hay tráfico (`sessions.json:14`, `session.js:274`).
4. **Salida de carrera y eventos**: no hay semáforo ni vuelta de formación en el motor. Los eventos de duelo son pobres y no hay cambio automático de velocidad.
5. **Deuda RNF-07** en `race.js`: el modelo térmico, la probabilidad de pase, los errores y la salida tienen literales en el código.

Ningún analista vio SC, VSC, bandera roja, daños visibles ni lluvia en el vídeo. Para eso la referencia es el reglamento FIA y OpenF1 `race_control`/`laps`, no el juego.

## 1. Tabla de huecos

| id | Área | P | Esfuerzo | Requisitos |
|---|---|---|---|---|
| sc-fisico | SC con coche, fases y reanudación | P1 | XL | RF-SIM-10, RF-SIM-01, RF-SIM-15, RF-3D-04, §6.2, RNF-07 |
| vsc-delta | VSC por delta de sector y fin anunciado | P1 | M | RF-SIM-10, RF-SIM-15, §6.2 |
| no-solape | Holgura lateral, detección de todos los vecinos, sin teletransporte | P1 | M | RF-SIM-07, RF-SIM-01, RF-3D-03, RNF-05 |
| incorporacion-pit | Salida del pit lane que respeta el tráfico y la línea blanca | P1 | M | RF-SIM-12, RF-SIM-10, RF-3D-04 |
| salida-boxes-sesion | Pit lane físico y salida del garaje en libres y clasificación | P1 | M | RF-WKD-02, RF-SIM-12, RF-3D-04 |
| salida-carrera | Vuelta de formación, semáforo en el motor, apagado aleatorio | P1 | M | RF-SIM-10, RF-SIM-15, RF-3D-04, §6.2 |
| eventos-duelo | Estado de batalla y eventos de intento, defensa y pase confirmado | P1 | M | RF-SIM-07, RF-CMD-03, RF-3D-04 |
| auto-velocidad | Vuelta automática a 1x y pausa en menús de parada | P1 | S | RF-CMD-04, RF-3D-04 |
| duelo-geometrico | Contraataque, intentos por defensor, tres en paralelo, apretón | P2 | L | RF-SIM-07, RF-STF-02 |
| curvas-lentas | Mínimas en curva lenta demasiado bajas | P2 | M | RF-SIM-01, RF-SIM-02, RNF-07 |
| termica-neumatico | Temperatura en °C por paso, calentamiento tras la parada | P2 | L | RF-SIM-03, RF-SIM-07, §6.2 |
| reglas-sc-era | Doblados, pit lane cerrado bajo SC, línea de reanudación por era | P2 | M | RF-SIM-10, §6.2, criterio 7.2 |
| duracion-neutralizacion | Duración del SC/VSC según el incidente y el lugar; tasa por circuito | P2 | M | RF-SIM-10, RF-SIM-09 |
| trafico-sesion | Libres y clasificación sobre el motor por pasos, con tráfico y rebufo | P2 | L | RF-WKD-02, RF-SIM-01, RF-SIM-06 |
| reloj-sesion | Hora local, pausas entre Q1/Q2/Q3, temperatura por hora | P2 | M | RF-WKD-01, RF-SIM-11 |
| evolucion-q | Evolución de la pista calibrada con los tiempos de Q1/Q2/Q3 de f1db | P2 | S | RF-WKD-02, RF-SIM-11 |
| trabajo-garaje | Coste en tiempo de sesión de cada cambio en boxes | P2 | S | RF-WKD-03 |
| tacticas | Evitar pianos, aire limpio y ayuda de ERS en batalla como órdenes | P2 | M | RF-CMD-01, RF-SIM-05, RF-SIM-09 |
| rnf07-race | Literales de balance en `race.js` y `stepRace.js` | P2 | S | RNF-07, RF-SIM-03, RF-SIM-07, RF-SIM-09 |
| tren-por-pu | Cambio por fabricante, marcha fija con limitador, marchas largas bajo SC | P2 | M | RF-SIM-01, RF-DEV-05, RF-3D-04 |
| amarilla-sector | Amarilla por sector de comisarios, doble amarilla, vuelta anulada | P2 | S | RF-SIM-10, RF-WKD-02 |
| errores-visibles | Estado longitudinal de bloqueo, límites de pista, reincorporación | P2 | M | RF-SIM-09, RF-SIM-10 |
| buffer-repeticion | Buffer de instantáneas y pausa del motor para repeticiones | P2 | M | RF-3D-04, RF-SIM-15, RNF-05 |
| previsión-parada | Pérdida, posición estimada a la salida y distancia a la entrada del pit | P2 | S | RF-CMD-02, RF-SIM-12, RF-SIM-13 |
| danos-visibles | Daño por pieza en la instantánea y radio | P3 | S | RF-DEV-08, RF-SIM-09, RF-CMD-03 |
| vuelta-enfriamiento | Vuelta tras la bandera a cuadros y orden de llegada | P3 | S | RF-WKD-07, RF-3D-04 |

## 2. Detalle por punto

### P1

#### sc-fisico: coche de seguridad con fases (P1, XL)
- **Observado.** No se ve en el vídeo; según race-1, race-2, dynamics, cameras y audio solo aparece aparcado en la parrilla (55:54). El mensaje previo al GP da «pérdida en el pit lane 22 s en verde y 16 s con SC» y «75 % de probabilidad de SC» (ui-menus, 10:30). La estructura del juego (SIM-FISICA §1, n.º 18) separa fases: esperando en boxes, recoger al líder, agrupar, dejar pasar a los doblados, listo para terminar, entra.
- **OverCut hoy.**
  - `stepRace.js:802-806`: con SC, cada coche se limita a `1 / (baseLap × lapFactor)` con `lapFactor` 1,42 (`race-sim.json:158-164`). El que está a más de 25 m del de delante recupera a 1,6 veces ese ritmo.
  - No hay coche de seguridad en pista, ni fases, ni «SC entra esta vuelta», ni un líder que marque el ritmo en la reanudación. No hay prohibición de adelantar hasta la línea.
  - La duración se sortea en vueltas: `race.js:1806`, `scLaps [3,5]` en `race-eras.json:141`.
  - El factor es el mismo en todas las eras y circuitos.
- **Propuesta.**
  1. `engine/sim/safetyCar.js` (nuevo) con un coche más en el anillo (`sim.sc`) que sale del pit lane por `pitLane.js` (exitBlend).
  2. Fases propias: `DEPLOYED`, `PICKUP`, `TRAIN`, `UNLAPPING`, `IN_THIS_LAP`, `RESTART`.
  3. El SC lleva su traza física con la potencia y el agarre de un coche de calle de la era. Los coches siguen con `traffic.minGapMetres` y un máximo de 10 largos (regla de la FIA).
  4. En `RESTART` el líder marca el ritmo desde la línea de SC 1 y no se adelanta hasta la línea de control.
  5. Datos en `race-sim.json` `safetyCar.phases`, más un bloque `safetyCar.cars[]` por era `{from, to, powerKw, topKmh, source}` (Porsche 911 1993-95, Mercedes desde 1996, Aston Martin desde 2021; NV, verificar).
  6. La equivalencia §4.2 excluye las vueltas de SC, como ya hace el test.
  7. El modo rápido sigue con `lapFactor`, pero calibrado por circuito y era con el ritmo real bajo SC de OpenF1 `laps` + `race_control` (2023+) y FastF1 `track_status` (2018+).
  8. Instantánea: `sc {phase, s, lap}` para la vista y la cámara.
  9. Tests: nadie adelanta al SC ni a otro coche bajo SC salvo los doblados autorizados; el tren queda agrupado (≤ 10 largos) antes de `IN_THIS_LAP`; misma semilla, mismo resultado.
- **Ficheros.** `engine/sim/safetyCar.js` (nuevo), `engine/sim/stepRace.js` (`advance`, `raceControl`), `data/balance/race-sim.json`, `engine/packs/schema/race-sim.schema.json` (nuevo o ampliado), `engine/race.js` (`debrisResponse`).
- **Fuente.** FIA F1 Sporting Regulations, artículos del Safety Car de cada año. OpenF1 `race_control` y `laps`, FastF1 `track_status`.

#### vsc-delta: VSC por delta (P1, M)
- **Observado.** Sin VSC en el vídeo (todos los analistas). SIM-FISICA §4.6: la FIA no publica el porcentaje; el VSC va un 30-40 % más lento.
- **OverCut hoy.** `stepRace.js:804`: con VSC, `rate = min(rate, 1/(baseLap × 1,36))` en toda la vuelta (`virtualLapFactor`). No hay delta por sector de comisarios, ni aviso «VSC terminando» con la vuelta a verde en un punto cualquiera de la pista, ni margen positivo o negativo sobre el delta. El VSC dura en vueltas enteras (`vscLaps [1,3]`).
- **Propuesta.**
  - Delta de referencia por minisector: tiempo de la traza × `vsc.deltaFactor` (por era desde 2015, `race-sim.json` `vsc`). El piloto puede ir hasta `vsc.marginSec` por encima del delta según su precisión (atributo de RF-STF-02).
  - Fin con aviso: `vsc.endingWarnSec [10, 15]` (FIA) y luego verde en cualquier punto, sin esperar a la línea.
  - Duración en segundos según el incidente (ver duracion-neutralizacion), no en vueltas.
  - Instantánea `vsc {delta, ending}` para la cabecera de la torre.
- **Ficheros.** `engine/sim/stepRace.js`, `engine/sim/safetyCar.js`, `data/balance/race-sim.json`, `data/seasons/curated/era-defaults.json` (`vsc` desde 2015, ya existe).
- **Fuente.** FIA Sporting Regulations, artículo del VSC (2015+); OpenF1 `race_control` («VSC ENDING»); OpenF1 `laps` para el factor real.

#### no-solape: holgura lateral y detección mutua (P1, M)
- **Observado.**
  - En paralelo van a 0,3-0,7 m de hueco lateral, solapados ½ coche, unos 3 s en T1, sin contacto (dynamics 5459-5476; race-1 5224-5226).
  - El de detrás se queda a 1 coche en la frenada (race-1 §4) y nunca se ven siluetas solapadas (race-1, race-2, cameras).
  - En la vuelta 54 van tres coches en paralelo (race-2 118:05).
- **OverCut hoy.**
  - `stepRace.js:1531-1539` solo mira al coche de delante (`sim.ahead[i]`) y separa a `L.carWidth` = 2,0 m de centro a centro (`race-sim.json:182`). Con coches de 2,0 m de ancho eso es **0 m de holgura**: ruedas que se tocan.
  - La corrección es un salto de lateral en un solo paso (`sim.lat[i] = …`), no un movimiento limitado por `rate`.
  - Con tres coches en paralelo, el tercero no se compara con el primero.
  - Al agotar el duelo, `stepRace.js:1489` coloca al atacante delante con `P[i] = P[other] + minGap × 1,05`, un salto de ~8 m visible a 1x.
  - El ancho del coche no cambia con la era: 2,0 m hasta 1997 y desde 2017, 1,8 m entre 1998 y 2016 (verificar en el reglamento técnico).
- **Propuesta.**
  - `engine/sim/lateral.js` (WP4, previsto en SIM-FISICA y aún sin hacer). Por cada coche, una lista de vecinos a menos de `carLength` por delante o por detrás, ordenados por `P` (cuesta O(n) sobre el anillo ya ordenado). La restricción es `|lat_i − lat_j| ≥ carWidth(era) + lateral.clearanceMetres` (0,3-0,5 m).
  - Se resuelve con un objetivo lateral y `nV` limitado (`lateral.maxRate`, `maxAccel`). Si no cabe en la pista (media anchura medida de `splines.json`, no los 5,5 m fijos), el de detrás levanta: velocidad limitada a la del de delante, nunca salto.
  - El cierre del duelo: el pase se completa por velocidad (el defensor pierde `passDefenderLoss` hasta quedar `minGap` por detrás), sin mover `P` a mano.
  - Datos: `race-physics.json` `eras[].carWidth`, `carLength` (con fuente FIA TR) y `lateral.clearanceMetres`.
  - Test nuevo en `raceView.test.js` o `stepRace.test.js`: con 64 carreras de 2024 y 1988, la distancia mínima entre las cajas de dos coches es ≥ 0 en todo paso y la holgura lateral en paralelo es ≥ 0,3 m en el 99 % de los pasos. El avance de `P` por paso es ≤ `v·dt` + ε (sin teletransporte).
- **Ficheros.** `engine/sim/lateral.js` (nuevo), `engine/sim/stepRace.js` (`lateral`, `settleDuels`), `engine/sim/duel.js`, `data/balance/race-physics.json`, `data/balance/race-sim.json` (`lateral` migra a race-physics, como dice SIM-FISICA §3.10).
- **Fuente.** FIA Technical Regulations (ancho máximo por año); OpenF1 `location` (x, y a ~3,7 Hz) para medir huecos laterales reales en duelos de 2023-24.

#### incorporacion-pit: salida del pit lane con tráfico (P1, M)
- **Observado.** La salida y la incorporación tienen un carril propio de ~12 s, con la línea blanca y los galones (practice-quali, Q3 2867). Radio «cuidado con la línea blanca» al soltar (race-2, 6358.9). Plano alto de la incorporación a T1 (cameras §7). La salida está ~350 m antes del vértice de T1 (dynamics §5).
- **OverCut hoy.** `pitLane.js:247` solo limita la velocidad desde `exitBlendS`. `EXIT_ROAD` no mira el tráfico de la pista: el coche que sale se fusiona en la trazada aunque pase otro coche, y el anti-solape solo actúa después. No hay línea blanca de salida, ni sanción por cruzarla, ni preferencia del coche que viene por pista.
- **Propuesta.**
  - Marca `exitLineTo` (fin de la línea blanca) en `splines.json`, sacada en `tools/assets/blender/extract_pitlane.py` o a mano en `assets.config.json`.
  - Entre `exitBlend` y `exitLineTo` el coche que sale va pegado al lado interior (`lane = PIT_EXIT`, lateral fijo del lado del pit) y no puede invadir la trazada.
  - Al acabar la línea entra en la trazada solo si el hueco con el coche más cercano por detrás en pista es ≥ `pitLane.mergeGapMetres`. Si no, levanta y se coloca detrás.
  - Ofensa `pitExitLine` en `race-eras.json` `penalties.offences` con año de inicio por verificar (NV) y probabilidad por agresividad del piloto.
  - Lo mismo a la entrada: `entryLine`; quien la cruza tarde, sanción.
- **Ficheros.** `engine/sim/pitLane.js`, `engine/sim/lateral.js`, `data/balance/race-pit.json` (+ `race-pit.schema.json`), `data/splines.json`, `tools/assets/blender/extract_pitlane.py`, `data/balance/race-eras.json`.
- **Fuente.** FIA Sporting Regulations (líneas de entrada y salida del pit lane); geometría de las mallas.

#### salida-boxes-sesion: pit lane físico en libres y clasificación (P1, M)
- **Observado.** Desde «sacar el coche» hasta estar en pista pasan 26-30 s de juego (5 medidas): unos 5 s del garaje a la calle, unos 10 s de calle y unos 12 s de incorporación. Solo la primera salida del fin de semana tiene cinemática. En el pit lane va a 83 km/h estables y llega al límite en ~1 s (dynamics §5). Cuando está llamado a boxes se ve la distancia hasta la entrada del pit (3,87 km). Q3 empieza con todos en el garaje.
- **OverCut hoy.**
  - `session.js:274-275` y `:557-558` suman `pitLaneSec` 14 + `boxStopSec` 2 (`sessions.json:14`) en cualquier circuito y era.
  - La fase `pitlane` de la vista es una fracción del tiempo (`session.js:627`).
  - No se usa el perfil de `pitLane.js` (límite por era y circuito, geometría de la malla) ni el garaje real del equipo. No hay cola en la salida al abrirse el semáforo de la sesión, ni estado propio de «saliendo».
- **Propuesta.**
  - Nueva fase de sesión `GARAGE_EXIT`: `sessions.json` `garage.exitSec` (rodar del garaje al carril, NV), seguida de `pitLane.js` desde el box del equipo hasta `exitLineTo` con el `vLimit` de la era. La vuelta de entrada acaba en el garaje del equipo.
  - El tiempo de salida y entrada sale de `pitLossFor` / perfil, no de constantes.
  - Al empezar cada segmento, los coches que salgan a la vez forman cola en el semáforo de salida del pit (orden de llegada, separación `queueOffsetMetres` que ya existe).
  - Instantánea: `distanceToPitEntry` cuando hay `boxRequest`.
  - Se borra `laps.pitLaneSec` y `boxStopSec` de `sessions.json`.
- **Ficheros.** `engine/sessionSim/session.js`, `data/balance/sessions.json`, `engine/sim/pitLane.js` (exportar perfil de garaje a salida), `engine/sessionSim/session.test.js`.
- **Fuente.** Solo comportamiento; el límite sale de FIA (ya en `era-defaults.json` `pitLaneSpeed`). Comprobación: tiempo de garaje a línea frente a OpenF1 `pit` / `laps` (out-lap) de libres 2024.

#### salida-carrera: vuelta de formación y semáforo en el motor (P1, M)
- **Observado.**
  - Cinco luces a 0,97-1,03 s y apagado 1,60 s después de la quinta (race-1 a 30 fps; audio). El HUD aparece +0,9 s después y los motores lanzados ~0,4 s después del apagado.
  - El vértice de T1 llega ~11,5 s después del apagado, con un mínimo de 30-60 km/h por el tráfico (dynamics).
  - No se ve la vuelta de formación (race-1). En parrilla, el SC está aparcado.
- **OverCut hoy.**
  - `stepRace.js:343` apaga las luces en el instante 0. Solo la vista muestra un rótulo (`LiveRace.js:635`).
  - El tiempo de reacción y la arrancada sí están en `incidents.js:212` (bien).
  - No hay vuelta de formación (calienta neumáticos y frenos; puede abortar la salida o mandar a un coche a salir desde el pit lane), ni fase `LIGHTS` con instantes de cada luz, ni retardo aleatorio con semilla.
  - El procedimiento no cambia por era.
- **Propuesta.**
  - Fase `PRE_START` en `stepRace` con eventos `formation` → `grid` → `light{n}` → `lightsOut`, en el flujo `control` con semilla.
  - Datos en `race-sim.json` `start {lightIntervalSec: 1, holdSec: [0.2, 3.0]}` (FIA) y en `era-defaults.json` `startProcedure` por era (cinco rojas que se apagan; antes, ¿rojo→verde? NV, verificar en los reglamentos de los años 70-90).
  - Vuelta de formación opcional a 1x o saltable. Si se simula, es una vuelta a `formation.lapFactor` con zigzag que sube `tyreTemp` (ver termica-neumatico). `formation.abortChance` por era (NV), `pitStart` si el coche sale del pit lane.
  - Instantánea `start {phase, lights, t}` para el sonido (golpe por luz) y la cámara.
  - Determinismo: los instantes salen de la semilla, no del reloj de la vista.
- **Ficheros.** `engine/sim/stepRace.js` (`lightsOut`), `engine/race.js` (vuelta 1), `data/balance/race-sim.json`, `data/seasons/curated/era-defaults.json`, `engine/sim/stepRace.test.js`.
- **Fuente.** FIA Sporting Regulations (procedimiento de salida: intervalo de 1 s y espera aleatoria); OpenF1 `race_control` (formation lap, aborted start).

#### eventos-duelo: estado de batalla y eventos ricos (P1, M)
- **Observado.**
  - Ciclo de radio en el ataque: «ganando al rival» → «adelantamiento fallido» → «adelantamiento conseguido».
  - El banner llega ~13 s después del cambio en la torre, como si se confirmara en un punto de cronometraje (race-2).
  - 11 banners de pase o incidente en 34 min (race-2). Rachas de 2-3 cortes de menos de 1,5 s en las peleas (cameras).
  - DRS en verde «dentro de rango».
  - SAI está 3-4 vueltas a menos de 0,6 s antes de pasar (race-2).
- **OverCut hoy.**
  - Eventos de carrera: `pass`, `swap`, `contact`, `mistake`, `lead`, `fastest`, `call`, `pit`, `sc`, `vsc`, `red`, `restart`, `yellow`, `investigation`, `penalty`, `flag`, `issue`, `dnf` (`race.js`, `stepRace.js`, `duel.js:197`).
  - No hay evento de intento, de defendido ni de contraataque, ni estado de batalla por coche (`ERaceBattleState` en SIM-FISICA §3.5 no está hecho). Hay `snapshot.lane`, que es lateral.
  - El pase se emite al cambiar el orden, no al confirmarse en un checkpoint, aunque los checkpoints existen (`stepRace.js:1017`).
- **Propuesta.**
  - `battle[i]` ∈ {RUNNING, FOLLOWING, ATTACKING, DEFENDING, TRAIN} en `sim` y en la instantánea.
  - Eventos `duel` con `{phase: start|alongside|resolved, side, corner, result: passed|defended|contact, attempt}`.
  - `pass` confirmado en el siguiente checkpoint (minisector) con `confirmedAt`.
  - `battle.followGap` y `attackGap` en `race-physics.json` `duel` (ya previsto en §3.10).
  - Radio del ingeniero (RF-CMD-03) atada a esos eventos con umbrales en `race-sim.json` `radio`.
  - El director de cámara (gap-cam) usa `battle` para su subestado BATTLE_CUTS y el sonido, para el público.
- **Ficheros.** `engine/sim/duel.js`, `engine/sim/stepRace.js` (`snapshot`, checkpoints), `engine/race.js` (radio), `data/balance/race-sim.json`, `data/balance/race-physics.json`.
- **Fuente.** Solo comportamiento; los pases por carrera siguen calibrados contra f1db (`measured.passes`).

#### auto-velocidad: vuelta a 1x y pausa automáticas (P1, S)
- **Observado.**
  - Selector 1/2/4/8/16x. La velocidad baja sola de 8x a 2x y a 1x al llegar el coche propio a la entrada del pit (race-2), con la bandera de cuadros de Q y al sacar el coche (practice-quali).
  - El menú de opciones de parada **pausa** la sesión: el contador avanza 0,35 s en 6 s de vídeo (race-1).
  - Durante la repetición la simulación se detiene (cameras: avance de 0,007-0,037 de vuelta en 14-23 s).
- **OverCut hoy.**
  - Carrera: `SPEEDS = [1,2,4,8,16]`, que empieza en 4x o 8x (`LiveRace.js:46,300`).
  - Sesiones: `[1,4,10,30,60]`, que empieza en 30x o 10x (`SessionLive.js:33,169`).
  - No hay cambio automático por eventos ni pausa al abrir el diálogo de parada. `stepToNextEvent` existe (`stepRace.js:1681`), pero solo sirve para saltar.
- **Propuesta.**
  - El motor marca cada evento con `priority` y `ownCar` (sin cambiar el estado ni las tiradas: RNF-05).
  - Tabla nueva `data/balance/live-view.json` (con esquema) `autoSpeed: [{event: "pitEntry", own: true, speed: 1}, {event: "sc", speed: 1}, {event: "lastLap", speed: 1}, {event: "chequered", speed: 1}, {event: "garageExit", speed: 1}]` y `pauseOn: ["pitDialog", "setupDialog", "replay"]`.
  - `LiveRace.js` y `SessionLive.js` la aplican.
  - Las sesiones pasan a `[1,2,4,8,16]` + saltar al siguiente evento, como pide RF-CMD-04.
- **Ficheros.** `engine/sim/stepRace.js` (prioridad de evento), `engine/sessionSim/session.js`, `components/LiveRace.js`, `components/SessionLive.js`, `data/balance/live-view.json` (nuevo), `engine/packs/schema/live-view.schema.json`.
- **Fuente.** Solo comportamiento.

### P2

#### duelo-geometrico: contraataque, intentos y tres en paralelo (P2, L)
- **Observado.** NOR y LEC se pasan 4 veces en 3 vueltas, con pase y devolución (race-2). Tres coches en paralelo (race-2, 118:05). El de fuera vuelve a pasar en la salida de T1-T3 (dynamics). Pasa varias vueltas en rango antes de pasar (race-2).
- **OverCut hoy.** SIM-FISICA §7: WP4 parcial. `duel.js` tiene lado, cobertura, frenada tardía y `alongside`; `maxClaim` 3 en `race-sim.json`, pero sin geometría de tres coches. No hay contraataque (`SWITCHBACK`), ni contador de intentos por defensor ni enfriamiento por pareja (solo `cooldownSec` global), ni apretón a la salida.
- **Propuesta.**
  - Estado `SWITCHBACK` a la salida si el defensor sigue a menos de `duel.switchback.gapMetres` y le quedan intentos.
  - `attempts[i][a]` por pareja con enfriamiento.
  - Reclamo de curva con hasta 3 coches (`claim{cars, lead}`) y una tirada de incidente por reclamo: interior a la entrada, exterior a la salida o apretón.
  - La probabilidad por vuelta sigue calibrada con `equivalence.test.js` (pases 0,88 frente al rápido hoy).
  - Datos: `race-physics.json` `duel.switchback`, `duel.squeeze`, `duel.attemptsPerDefender`.
- **Ficheros.** `engine/sim/duel.js`, `engine/sim/lateral.js`, `data/balance/race-physics.json`.
- **Fuente.** f1db (cambios netos de posición por era, ya en `measurePasses.js`); OpenF1 `position`/`intervals` (2023+) para pases de ida y vuelta.

#### curvas-lentas: mínimas demasiado bajas (P2, M)
- **Observado.** Mínimas de Baréin en el juego: T1 68, T4 112, T8 83, T10 75, T11 142, T13 131 y T14 120 km/h; punta 303-313 (dynamics). Reales (SIM-FISICA §4.2): T1 66 km/h (2025, Brembo); punta 332 (2024). El audio: el juego baja el motor a 6.000-6.700 rpm en las horquillas, cuando en la realidad rara vez baja de 9.000.
- **OverCut hoy.** SIM-FISICA §7, fila del tren motriz: «las curvas lentas simuladas van más despacio que las reales (Baréin mínima 49 frente a 71 km/h) y bajan una o dos marchas de más». El reparto del presupuesto carga la lentitud sobre todo en la curva lenta (`race-physics.json` `budget`: lenta 1,5).
- **Propuesta.**
  - Test por curva numerada frente a OpenF1 `car_data` (Baréin 2024 y Monza 2024 ya en `__fixtures__/openf1-powertrain.json`): mínima de cada curva ±10 % y marcha en el vértice ±1.
  - Ajustar en el JSON `mu.slow` de la era y el peso `budget.slow` (mover tiempo a la curva media y a la frenada, no a la lenta), sin tocar código.
  - Revisar `shift.downRpm` por era para no reducir de más.
  - Extender `fixtures` a un circuito lento (Mónaco o Hungaroring 2024).
- **Ficheros.** `data/balance/race-physics.json`, `data/balance/race-powertrain.json`, `engine/sim/speeds.test.js`, `engine/sim/__fixtures__/`, `overcut/src/main/resources/scripts/powertrain_from_openf1.py`.
- **Fuente.** OpenF1 `car_data` (speed, n_gear, rpm, brake).

#### termica-neumatico: temperatura en °C por paso (P2, L)
- **Observado.**
  - Blandos nuevos: 70 → 75 → 95 → 106 → 109 °C en ~100 s, con radio de «temperatura óptima» a la vuelta (race-2).
  - En rojo por encima de ~120-122 °C; 112-126 °C en carrera.
  - VER adelanta a SAI aprovechando sus gomas frías (undercut por temperatura).
- **OverCut hoy.**
  - `race.js:1179-1203` y `:1246-1248`: `tyreTemp` sin unidad (0-1), que se actualiza **por vuelta** (deriva ×0,55 hacia un objetivo).
  - Literales en el código: frío < 0,4, caliente > 0,72, castigo 3,2 y 2,5 s, desgaste ×2,2, SC 0,3.
  - El paso no tiene calentamiento dentro de la vuelta; `aheadColdTyre` es una bandera por vuelta (< 0,38).
- **Propuesta.**
  - `engine/tyres/thermal.js` (nuevo) con dos nodos (superficie y carcasa) en °C por paso. Entrada de calor por deslizamiento, que crece con g lateral y longitudinal y con el modo de ritmo; pérdida con aire y pista.
  - Ventana por compuesto y proveedor y era en `data/balance/race-tyres.json` (esquema nuevo): `blanketC` por era (mantas desde los 90, NV; 2024 70 °C, Pirelli), `windowC`, `gripCurve`.
  - El modo rápido integra la misma ecuación por vuelta, para la equivalencia.
  - Instantánea `tyreC {surface, carcass}` para la torre, el panel y la radio.
- **Ficheros.** `engine/tyres/thermal.js` (nuevo), `engine/race.js` (`lapTerms`, `endLapWear`), `engine/sim/stepRace.js`, `data/balance/race-tyres.json` (nuevo), `engine/packs/schema/race-tyres.schema.json`.
- **Fuente.** Pirelli (temperaturas de manta por temporada, notas de prensa); FIA Sporting/Technical Regulations (mantas); NV para las constantes térmicas.

#### reglas-sc-era: reglamento de neutralización por era (P2, M)
- **Observado.** No visto. El juego solo modela 2022-24.
- **OverCut hoy.** `era-defaults.json` solo tiene `safetyCar` (desde 1993) y `vsc` (desde 2015). No hay doblados que se desdoblan, ni pit lane cerrado al salir el SC, ni línea de SC 1, ni reanudación detrás del SC frente a salida parada tras el SC.
- **Propuesta.** Claves cerradas nuevas en `era-defaults.json` y en los packs (`regulations`), todas `pending` hasta leer el reglamento de cada año:
  - `scUnlapping` (doblados autorizados, varias ventanas entre 2007 y hoy, verificar).
  - `scPitClosed` (pit cerrado hasta agrupar, 2007-2008, verificar).
  - `scRestartLine` (`control`/`sc1`).
  - `scOvertakeBeforeLine`.
  - `vscEndingWarn`.
  `rules.js rulesFor` las expone y `safetyCar.js` las aplica. Un test en `rules.test.js` recorre las 38 temporadas (criterio 7.2: ninguna regla fuera de su era).
- **Ficheros.** `data/seasons/curated/era-defaults.json`, `engine/rules.js`, `engine/sim/safetyCar.js`, `overcut/src/main/resources/scripts/generate_season_packs.py`, `engine/rules.test.js`.
- **Fuente.** FIA Sporting Regulations de cada año (SC y VSC).

#### duracion-neutralizacion: duración por incidente y tasa por circuito (P2, M)
- **Observado.** El juego da un 75 % de probabilidad de SC en Baréin (ui-menus). El choque múltiple de la vuelta 31 solo provocó amarilla e investigación (race-2).
- **OverCut hoy.** `scLaps [3,5]` y `vscLaps [1,3]` se sortean sin depender del lugar ni de la gravedad (`race-eras.json:141-142`, `race.js:1806-1811`). `deployChance` es por era, sin multiplicador por circuito (urbano frente a permanente).
- **Propuesta.**
  - El incidente lleva `{s, onTrack, severity}`.
  - El tiempo de limpieza sale de `race-sim.json` `cleanup {base, perSeverity, offTrackFactor}`.
  - Coche parado en pista → SC; en escapatoria → VSC o amarilla.
  - El SC termina cuando acaba la limpieza y el tren está agrupado.
  - `calendar[].scRate` en el pack, medido de la historia del circuito.
- **Ficheros.** `engine/race.js` (`debrisResponse`, accidentes), `engine/incidents.js`, `data/balance/race-sim.json`, `generate_season_packs.py`.
- **Fuente.** OpenF1 `race_control` (2023+), FastF1 `track_status` (2018+); antes de 2018, conteo de SC de f1db si está, o fuentes publicadas (NV).

#### trafico-sesion: libres y clasificación sobre el motor por pasos (P2, L)
- **Observado.** En la clasificación, los coches comparten pista en las vueltas de salida y lanzada; amarilla en libres (54:23); salida de pista en T7 con repetición (practice-quali). Torre con la etiqueta «vuelta de salida» y con la zona de corte que se reordena en directo.
- **OverCut hoy.** `session.js` decide cada vuelta al empezar (`beginLap`, cabecera). La vista dibuja con `raceClock.carAt`, que solo aparta a los coches en la vista. No hay tráfico, ni rebufo en la clasificación (Monza), ni vueltas estropeadas por coches lentos, ni amarillas que anulen o aborten una vuelta, ni límites de pista.
- **Propuesta.**
  - `engine/sessionSim/stepSession.js` reutiliza las tablas y el avance de `stepRace` (sin duelos: modo `session`). El presupuesto de cada vuelta sigue saliendo de `qualifyingPaceOf` (equivalencia con la sesión rápida).
  - Tráfico y aire sucio por distancia, rebufo, coche lento en vuelta de salida que molesta (con tirada de sanción por estorbar, `race-eras.json` `penalties.offences.impeding`, con años por verificar).
  - Amarilla local que invalida la vuelta (ver amarilla-sector).
  - La IA espacia sus salidas con `sessions.json ai.spacingSec`.
- **Ficheros.** `engine/sessionSim/stepSession.js` (nuevo), `engine/sessionSim/session.js`, `engine/sim/stepRace.js` (exportar `advance` en modo sesión), `data/balance/sessions.json`.
- **Fuente.** Solo comportamiento; validación con los tiempos de Q de f1db (`qualifying` q1/q2/q3).

#### reloj-sesion: hora local y pausa entre segmentos (P2, M)
- **Observado.** Las horas reales de 2024 (P1 14:30, P2 18:00, P3 15:30, Q 19:00) y las duraciones 60/18/15/12 min. El reloj local de Q2 (19:25) muestra que simula sin enseñarla la pausa de 7 min entre segmentos. La temperatura de pista baja de 32,9 °C (P1) a 25,9 °C (Q1) (practice-quali).
- **OverCut hoy.** `sessions.json` `durations` tiene los minutos por era, pero no la hora de inicio ni la pausa. El tiempo de la sesión no avanza el reloj local ni la temperatura por hora (sí lo hace la carrera con ERA5).
- **Propuesta.**
  - Pack `calendar[].sessions[] {kind, startLocal}` desde f1db (horas de sesión donde existan; si no, plantilla por era `pending`).
  - `sessions.json durations.knockout[].breakMinutes`.
  - `session.js` lleva `localClock` y pide a `engine/weather` la temperatura y el estado por hora, como ya hace la carrera.
- **Ficheros.** `engine/sessionSim/session.js`, `engine/sessionSim/formats.js`, `data/balance/sessions.json`, `generate_season_packs.py`, `engine/weather/index.js`.
- **Fuente.** f1db (fechas y horas de las sesiones), FIA (horario del evento), ERA5 (ya integrado).

#### evolucion-q: evolución de la pista calibrada (P2, S)
- **Observado.** El poleman del juego mejora 0,36 s de Q1 a Q3; en la realidad, 0,85 s (practice-quali). La goma pasa de «muy baja» a «alta» a lo largo del fin de semana.
- **OverCut hoy.** `sessions.json evolution {perFieldLap −0,0028, max −0,8, carryBetweenSegments 0,6}`, escrito sin fuente.
- **Propuesta.** Script que mida en f1db la mejora mediana Q1→Q2→Q3 de los diez primeros por era y por tipo de circuito. Ajustar `perFieldLap` y `max` por era (`evolution.byEra[]`) y la herencia entre sesiones del fin de semana. Test de que la mejora simulada queda en ±0,15 s.
- **Ficheros.** `data/balance/sessions.json`, `overcut/frontend/scripts/measureEvolution.js` (nuevo), `engine/sessionSim/session.test.js`.
- **Fuente.** f1db (`qualifying` q1/q2/q3 desde 2006).

#### trabajo-garaje: coste en tiempo de sesión (P2, S)
- **Observado.** Cada cambio en boxes cuesta tiempo de sesión: reglaje 4:24, plan de tandas 14-15 s, más neumáticos y piezas. El total aparece como «tiempo de configuración» y la sesión queda en pausa mientras se decide (practice-quali).
- **OverCut hoy.** `sessions.json garage.turnaroundSec` 40, igual para cualquier cambio.
- **Propuesta.** `sessions.json garage.work {tyreSec, fuelPerKgSec, setupPerStepSec, wingSec, partSec}` (NV). El tiempo de trabajo baja con el `crew` (RF-STF-07). `session.js` suma el trabajo del plan pedido y lo enseña antes de confirmar; el reloj de la sesión no corre mientras el menú está abierto.
- **Ficheros.** `data/balance/sessions.json`, `engine/sessionSim/session.js`, `engine/setup.js`.
- **Fuente.** Solo comportamiento (NV).

#### tacticas: órdenes que faltan de RF-CMD-01 (P2, M)
- **Observado.** Casillas de evitar pianos de riesgo, ir en aire limpio y no pelear con el compañero; ayuda de ERS en batalla; agresividad de ataque alta, media o baja y defensa siempre, neutra o rara vez (race-1, race-2, practice-quali).
- **OverCut hoy.**
  - `rules.js:253-272` `commandsFor`: ritmo, energía, mezcla, levantar y dejar correr, parada y órdenes de equipo.
  - `setDefence` y `setOvertakeRisk` solo existen en el modo por pasos (`stepRace.js:1815,1822`).
  - El aire limpio solo lo usa la IA (`rivalCalls`). No hay evitar pianos ni ayuda de ERS en batalla.
- **Propuesta.**
  - `setTactics(state, carId, {avoidKerbs, cleanAir, battleAssist})` en los dos modos.
  - `race-sim.json` `tactics`: `avoidKerbs` (pérdida en las curvas con piano, menos errores y daños de suelo), `cleanAir` (hueco objetivo, igual que la IA), `battleAssist` (despliegue cuando el hueco < 1 s delante o detrás, dentro de los límites de `energy.js`).
  - `commandsFor` las expone por era: `battleAssist` solo con ERS o KERS.
- **Ficheros.** `engine/race.js`, `engine/sim/stepRace.js`, `engine/energy.js`, `engine/rules.js`, `data/balance/race-sim.json`.
- **Fuente.** Solo comportamiento; los límites de la energía siguen siendo los de la FIA (ya implementados).

#### rnf07-race: literales de balance en el código (P2, S)
- **Observado.** No aplica: es deuda propia.
- **OverCut hoy.**
  - `race.js:1088-1095` `passChanceOf` repite en el código los números que ya están en `race-sim.json` `duel` (0,01, 0,2, 0,36, 0,25, 0,12, 0,06, 0,02, 0,9) sin leerlos.
  - `race.js:1179-1203`: térmica (0,72, 0,4, 2,2, 0,18, 0,008, 0,35, 3,2, 2,5) y dispersión 0,0036.
  - `race.js:1222` `startTerm` (0,55, 1,5, 0,22).
  - `race.js:1230-1240` `rollMistake` (1,2-5 s, umbrales 3,4/2,2, +0,8 de desgaste por bloqueo).
  - `race.js:1058` 0,006.
  - `race.js:1244-1248`: SC ×0,62, temperatura 0,3, 220, 0,12, deriva 0,55.
  - `stepRace.js:1253`: 1,4 y /100 de `crew`.
- **Propuesta.** Moverlos a `race-eras.json` (`tyres.thermal`, `mistake`, `start`) o leerlos de `race-sim.json duel` con esquema. El golden (`__fixtures__/quickRace.golden.json`) no debe cambiar: refactor puro con test de igualdad byte a byte.
- **Ficheros.** `engine/race.js`, `engine/sim/stepRace.js`, `data/balance/race-eras.json`, `data/balance/race-sim.json`, esquemas.
- **Fuente.** Solo comportamiento (RNF-07).

#### tren-por-pu: perfil por fabricante, limitador y SC (P2, M)
- **Observado.**
  - El cambio es determinista por marcha y distinto por equipo: Ferrari a ~11.850 rpm con caída de 0,90-0,91; McLaren ~11.560 rpm y 0,87; Red Bull ~12.000 rpm y 0,87 (audio).
  - Con el limitador del pit lane el tono es plano, idéntico a la entrada y a la salida (197,5 Hz) (audio, race-2).
  - 8.ª en la recta de Baréin a ~290 km/h (dynamics).
- **OverCut hoy.**
  - `race-powertrain.json:14` `shift` y `eras[].engine.shiftRpm`: un valor por era, no por fabricante.
  - En el pit lane, `driveStep` llama a `updateDrive` con la velocidad del perfil y las mismas reglas de cambio, así que la marcha y las rpm con el limitador salen de la caja y no de un modo «limitador» (marcha fija).
  - Bajo SC no hay marchas largas ni cambio anticipado.
- **Propuesta.**
  - `race-powertrain.json eras[].manufacturers{ferrari: {shiftRpm, ratioScale, shiftCut}}` como sobreescrituras opcionales, medidas en OpenF1 `car_data` por piloto (2023+). Fuera de eso, el valor de la era.
  - `pitLimiter {gear, rpm}` por era para que el paso deje la marcha fija.
  - `shift.underSc {shiftRpm}`.
  - La instantánea ya lleva `gear`, `rpm` y `throttle`: el sonido (gap-audio) los usa.
- **Ficheros.** `data/balance/race-powertrain.json`, `engine/packs/schema/race-powertrain.schema.json`, `engine/sim/powertrain.js`, `powertrain_from_openf1.py`.
- **Fuente.** OpenF1 `car_data` (rpm, n_gear por piloto); FIA para el límite del pit lane.

#### amarilla-sector: sector de comisarios y doble amarilla (P2, S)
- **Observado.** La cabecera de la torre se vuelve amarilla con «SECTOR 2» y un rombo en las filas implicadas; dura ~19 s y ~5 s (dynamics, race-2). Bandera amarilla en libres.
- **OverCut hoy.** `race-sim.json:167` `raceControl.yellow`: una zona de 150 m antes y 60 m después de la curva durante 30 s, a `slowFactor`, sin duelo. No hay sector en el evento, ni doble amarilla, ni efecto en las sesiones (vuelta anulada o abortada).
- **Propuesta.**
  - El evento `yellow` lleva `{sector, marshalPost, double}`; la doble amarilla, para un coche parado en pista.
  - En la sesión: vuelta abortada o tiempo borrado según la era (`era-defaults.json` `yellowLapDeleted`, `pending`).
  - Duración desde la limpieza (ver duracion-neutralizacion).
- **Ficheros.** `engine/sim/stepRace.js`, `engine/race.js`, `engine/sessionSim/session.js`, `data/balance/race-sim.json`, `data/seasons/curated/era-defaults.json`.
- **Fuente.** FIA Sporting Regulations e ISC App. H (banderas).

#### errores-visibles: bloqueo, límites de pista y reincorporación (P2, M)
- **Observado.** Avisos de bloqueo (T11 V2, T4 V17, T9 V45) y trompos (T14 V1, OCO V41) con humo, ida a la escapatoria y vuelta (dynamics, race-1, race-2). Un fallo mecánico deja al coche lento y le adelantan dos en una recta (race-1).
- **OverCut hoy.**
  - WP8 hecho en parte: tipo de error colocado en la curva, trompo con `v = 0` y salida ancha al borde (SIM-FISICA §7).
  - Falta el estado longitudinal `LOCKUP` (§3.3) para el humo y el chirrido.
  - Falta la reincorporación con trayectoria (hoy, regreso por `rate`).
  - Faltan los límites de pista (avisos, tiempo borrado en la clasificación, sanción en carrera por era: no hay ni una referencia en `engine/` ni en `data/`) y el ruido por curva (pendiente en WP8).
- **Propuesta.**
  - `lon[i]` con `LOCKUP` y `SPIN` en la instantánea.
  - `mistake.recovery.path` (sale y vuelve por la escapatoria).
  - Ofensa `trackLimits` con años en `era-defaults.json` (`pending`) y `penalties.offences.trackLimits` (avisos y sanción).
  - Probabilidad por agresividad, piano y neumático.
- **Ficheros.** `engine/sim/stepRace.js`, `engine/race.js`, `data/balance/race-physics.json` (`mistake`), `data/balance/race-eras.json`, `data/seasons/curated/era-defaults.json`.
- **Fuente.** OpenF1 `race_control` (TRACK LIMITS por GP 2023+) para la tasa; FIA para la regla.

#### buffer-repeticion: instantáneas para repetir y pausa del motor (P2, M)
- **Observado.**
  - Repeticiones de 9-22 s, mediana ~17 s, con cortinilla de 1,2 s.
  - La simulación se para durante la repetición.
  - Las disparan el pase propio, un bloqueo, un abandono o amarilla (con plano del garaje), la parada de un rival y la meta (cameras).
- **OverCut hoy.** El worker manda ticks (`engine/worker/raceSession.js`), pero no guarda un buffer de estados. Pausar es parar el reloj de la vista.
- **Propuesta.**
  - Buffer circular en el worker de `replay.seconds` (25 s) de instantáneas por coche, sin tocar el estado de la simulación.
  - Mensaje `replay(eventId)` que devuelve el tramo.
  - El motor se pausa con un mensaje explícito y no afecta a las tiradas (RNF-05: el número de pasos no depende de la vista).
  - Datos en `live-view.json` `replay {seconds, triggers}`.
- **Ficheros.** `engine/worker/raceSession.js`, `engine/worker/raceClient.js`, `data/balance/live-view.json`.
- **Fuente.** Solo comportamiento.

#### prevision-parada: estimación al llamar a boxes (P2, S)
- **Observado.** El diálogo de parada muestra el tiempo total estimado (23,736 s), la posición estimada a la salida (3.º «+2»), la distancia hasta la entrada del pit (2,19 km), avisos de conflicto con la estrategia y de que el compañero entra en la misma vuelta (race-2).
- **OverCut hoy.** `pitLossFor` y la cola de doble parada (`QUEUE`) existen, pero no hay función de previsión para la UI.
- **Propuesta.** `previewPit(state, carId, {lap, compound, wing, fuel})` pura en `engine/sim/pitLane.js` / `race.js`. Devuelve:
  - la pérdida con o sin SC;
  - el tiempo parado esperado (`pitStop.js`, mediana de la etapa);
  - la posición de salida, proyectando los huecos de la vuelta actual;
  - `teamMateSameLap` y `distanceToPitEntry`.
  Sin tiradas, para no tocar el determinismo.
- **Ficheros.** `engine/sim/pitLane.js`, `engine/sim/pitStop.js`, `engine/race.js`.
- **Fuente.** Solo comportamiento; las pérdidas ya están calibradas (SIM-FISICA §4.3).

### P3

#### danos-visibles: daño por pieza en directo (P3, S)
- **Observado.** Daños solo por radio («GASLY tiene daños») y humo en la repetición. No se ven piezas sueltas (race-2, dynamics).
- **OverCut hoy.** `incidents.js` y `duel.js` deciden el resultado (retirada, suspensión, pinchazo, alerón con s/vuelta, tiempo) y `development/damage.js` lo lleva a piezas después de la carrera. La instantánea no lleva el estado de daño por pieza.
- **Propuesta.** `snapshot.damage {frontWing, floor, tyre: puncture}` con la pérdida en s/vuelta, más radio RF-CMD-03 con sugerencia de parar a cambiar el alerón (etapa `wing` de `pitStop.js`, que ya existe). Restos en la pista como objeto para la vista y para el riesgo de pinchazo de quien pasa.
- **Ficheros.** `engine/sim/stepRace.js`, `engine/incidents.js`, `engine/race.js` (radio), `data/balance/race-reliability.json`.
- **Fuente.** f1db (abandonos por daños, ya en `reliability_from_f1db.py`).

#### vuelta-enfriamiento: tras la bandera a cuadros (P3, S)
- **Observado.** Bandera a cuadros por fila; avisos de 15, 10 y 3 vueltas para el final; «Última vuelta»; la cámara sigue a cada coche que termina durante 3-7 s; el panel del piloto que ha terminado se pliega (race-2).
- **OverCut hoy.** El evento `flag` existe (`race.js:2289`). No hay vuelta de enfriamiento simulada ni un evento `finished` por coche con su instante.
- **Propuesta.** Evento `finished {carId, t, pos}` al cruzar cada uno. Vuelta de enfriamiento a `race-sim.json cooldown.lapFactor`, sin duelos y con el pit cerrado. Avisos `lapsToGo` en la lista de `live-view.json`.
- **Ficheros.** `engine/sim/stepRace.js`, `data/balance/race-sim.json`, `data/balance/live-view.json`.
- **Fuente.** Solo comportamiento.

## 3. Lo que ya está bien (no tocar)

Comparado con el vídeo, OverCut cumple o supera:
- **Límite del pit lane por era y circuito** (80 km/h en Baréin 2024; `era-defaults.json pitLaneSpeed`).
- **Pit lane físico**: el coche se para en su box con `v = 0` y la pérdida queda a ±1 s de la real.
- **Parada por etapas** con errores. El juego da 28,2 s de pit lane; f1db da 24,9 s de mediana: la nuestra se acerca más a la real.
- **DRS** desde la vuelta 3 (`race-eras.json:127`), que corrige el error del juego (vuelta 2).
- **ERS 4 MJ / 2 MJ** y KERS 400 kJ con su potencia.
- **Combustible** por caudal.
- **Desgaste** por compuesto, con *cliff*.
- **Tren motriz** contrastado con OpenF1 (8.ª en la punta de Baréin).
- **Fiabilidad, accidentes y salida** calibrados con f1db.
- **Clima ERA5**.
- **Final de clasificación**: con el reloj a cero cuentan las vueltas ya empezadas (`session.js`).
- **Órdenes de equipo** por era.
- **Bandera roja** con la reanudación de su era.

## 4. Orden recomendado

1. no-solape y rnf07-race: base y deuda, sin cambio de golden.
2. salida-carrera, eventos-duelo y auto-velocidad: lo que se ve en cada sesión.
3. sc-fisico y vsc-delta, seguidos de reglas-sc-era y duracion-neutralizacion: necesitan el anti-solape.
4. incorporacion-pit y salida-boxes-sesion.
5. Lo demás de P2 y P3.

Cada bloque, con su test, la equivalencia de SRS §4.2 sin tocar tolerancias y los requisitos citados en el commit (CLAUDE.md).
