# Simulación física por pasos — investigación y diseño

- Fecha: 2026-11-22 · Estado: en implementación (ver §7) · Rama: `feature/overcut-manager`
- Requisitos afectados: RF-SIM-01, 02, 06, 07, 08, 09, 10, 12, 15; RF-CMD-01, 02, 04; RF-3D-03, 04; RF-STF-02, 07;
  RNF-01, 02, 05, 07, 09, 11; SRS §2.3, §4.2 (equivalencia ±2 %), §6.2, criterio 7.2 (spline).
- Alcance: colocación del coche (desplazamiento lateral y trazada), perfil de velocidad (curvas, frenadas, rectas),
  aire sucio y rebufo, duelos (adelantamiento y defensa), IA (ritmo, agresividad, errores), pit lane (entrada,
  limitador, box, salida) y parada por etapas.

**Regla legal (SRS §1.4, §7.3).** De F1 Manager 24 solo se ha leído la estructura: nombres reflejados en las cadenas
del ejecutable y el esquema de la base SQLite del guardado propio del usuario (`save0.sav` copiado al scratchpad,
original intacto). No se han abierto `.pak/.utoc/.ucas`, no se ha buscado ninguna clave, no se ha leído memoria y no
se ha copiado ningún valor de ajuste. Además, las tablas `Save_*` de carrera tenían 0 filas: no había valores que
leer. Todas las cifras de calibración de este documento vienen de fuentes reales y llevan cita (tabla §4).

---

## 1. Qué nos dice la estructura de F1M24 (solo ideas)

| # | Idea | De dónde sale (cadena o tabla/columna) | Qué tomamos para OverCut |
|---|---|---|---|
| 1 | El coche es un punto 1D sobre una *spline* precalculada (LUT por distancia) más un **desplazamiento lateral con signo respecto a la trazada**, que se mueve hacia un objetivo con una velocidad y una «urgencia» | `Save_SimpleSimCars`: `SplineDistance`, `SplineT`, `SplineLUTID`, `OffRaceLineDistance`, `OffRaceLineTarget`, `OffRaceLineVelocity`, `OffRaceLineUrgency(Target)`; cadenas `TrackLUT`, `SplineDistanceStep`, `DistanceFromRacingLine` | Estado `s` (m) + `n` (m, lateral respecto a la trazada) + `nTarget` + `nRate`; una LUT por circuito |
| 2 | Hay una *spline* aparte para el pit lane, con nodo de entrada y de salida en la pista | `m_pitSplineDistance`, `m_pitEntrance_RaceTrackNodeID`, `m_pitExit_RaceTrackNodeID`, `m_pitNodeID`, `m_pitLoopNodeID`, `ENodeType::PitLane` | El pit lane es una segunda trazada con su propia distancia, no un multiplicador de ritmo |
| 3 | La pista es una lista de **nodos** con tipo (acelerar, mantener, pit lane), tipo de curva y velocidad máxima; el coche mira el siguiente nodo | `TrackNode`, `NextTrackNode`, `NextNodeMaxSpeed`, `NodeSpeedFractionToEnd`, `EBendType` (Straight/Short/Medium/LongCorner), `ENodeType` (AccelerateOut/MaintainSpeed/PitLane) | Tabla de segmentos por circuito: recta, curva (lenta/media/rápida), zona de frenada, con `vMax` |
| 4 | Una máquina de estados longitudinal por coche, con zonas de frenada que fijan nodo y velocidad objetivo | `EAccelerationState` (Accelerating, Coasting, CornerEntryCoasting, Braking, LockedUpBrakes); `BrakingZoneActive`, `BrakingZoneTargetNode`, `BrakingZoneTargetSpeed`, `BrakingZoneMinDistUntilBrake`, `CurrentBrakeDecel` | Estado longitudinal explícito (acelera / levanta / frena / bloqueo) para errores y para la vista |
| 5 | La velocidad en curva es una base escalada por estadísticas, precisión del piloto (re-tirada por vuelta y por curva), agarre, agua y tácticas | `CornerSpeedMultiplier`, `DriverSkillCornerSpeedModifiers`, `GripCornerSpeedModifiers`, `LapAccuracy`, `CornerAccuracy`, `RaceLineAccuracyOffset`, `LastAccuracyRollTrackNode`, `WaterCornerSpeedMultipliers`, `AvoidKerbsCornerSpeedMultiplier` | Ruido por curva (no solo por vuelta), sesgo lateral por precisión, modificador de pianos |
| 6 | Estadísticas del coche separadas por banda de velocidad, incluidas las de aire sucio | `ECarStat`: TopSpeed, Acceleration, Braking, Low/Medium/HighSpeedCornering, Low/Medium/HighSpeedDownforce, DRS, DirtyAirLow/Medium/HighSpeedCornering | Agarre por banda (lenta/media/rápida) en lugar de un único `grip` |
| 7 | Rebufo y aire sucio son un escalar por coche según distancia y velocidad; el rebufo sube aceleración y punta, el aire sucio baja paso por curva y calienta motor y frenos | `Save_RaceSimCars.Slipstream`, `.DirtyAir`; `SlipstreamMin/MaxDist`, `SlipstreamTopSpeedMultiplier`, `DirtyAirMaxDist`, `DirtyAirMin/MaxSpeed`, `DirtyAirCoolingMultiplier`, `DirtyAirBrakeCoolingMultiplier` | Ventanas en **metros** y por banda de velocidad, no en segundos |
| 8 | DRS como máquina de 4 estados | `EDRSState` (Disabled, Enabled, Detected, Active); `DRSTimeLastDetected1-3` | Igual que ya hacemos, explícito en el estado |
| 9 | Estado de batalla por coche | `ERaceBattleState` (Running, Cruising, Chasing, Attacking, Defending, InDRSTrain); `Save_CarAI_Race.BattleState` | Máquina de duelo con estados propios (ver §3.5) |
| 10 | Un intento de adelantamiento elige lado y curva objetivo, tira el éxito **una vez al empezar** y cambia el paso por curva de atacante y defensor; hay contraataque con intentos restantes, contador por defensor y enfriamiento | `Save_RaceSimCars_Overtake`: `TargetOTDirection`, `TargetOTCornerNodeID`, `OvertakeSuccessRoll`, `AttackerCorneringMultiplier`, `DefenderCorneringMultiplier`, `CanSwitchback`, `SwitchbackAttemptsRemaining`, `OvertakeAttemptsOnCurrentDefender`, `OvertakeEventCooldownStartTime`, `AllowSqueeze` | Ya lo tenemos en parte (`duel.js`); añadir lado, intentos por defensor y «apretar» (squeeze) |
| 11 | La curva disputada se «reclama» (hasta 3 coches) y el reclamo tira **un** incidente: choque interior a la entrada, exterior a la salida, o apretón a la salida (cede o saca de pista) | `Save_RaceSim_CornerClaim`: `ClaimState`, `CarIndex1-3`, `LeadCarIndex`, `IncidentRolled`, `IncidentOffset`; `ERacingIncident` (CornerEntryInsideCollision, CornerExitOutsideCollision, CornerExitSqueezeBackOut, CornerExitSqueezePushWide, Spin, Lockup, RunWide, Crash) | Tipos de incidente de duelo con consecuencia geométrica (sale ancho, cede) |
| 12 | Defensa en tres estilos; riesgo de ataque en tres niveles | `EDefenceStrategy` (Block, HoldCarBehind, HoldRacingLine); `EOvertakeRiskStrategy` (Low, Medium, High) | Ya en `race-sim.json`; mantener |
| 13 | Los errores los elige un «director de incidentes»: tasa por coche ponderada por riesgo, enfoque, confianza, clima, batalla y táctica; el incidente se fija a un nodo y pasa por recuperación | `Save_RaceSimCars_Incident`: `WantedRacingIncident`, `ActiveRacingIncident`, `RacingIncidentNodeID`, `RecoveryState`, `HasLeftTrack`; `EIncidentModifierScore` (InBattle, DampTrack, DrivingStyle…, OvertakeRiskStrategy_High…); `EConfidenceState` (Hesitant, Neutral, Peak) | Error tirado por vuelta (como ahora, para la equivalencia) y **colocado** en una curva con fase de recuperación |
| 14 | IA con nivel de riesgo, tipo de control y enfoque | `Save_CarAI`: `RiskLevel`, `ControlType`, `Approach` (Cautious, Standard, Aggressive) | Agresividad del piloto (RF-STF-02) como «enfoque» de la IA |
| 15 | Pit lane por estados: pedido → entrando → cola (doble parada) → aproximación al box → parado → gatos → esperando suelta → soltando → saliendo hasta el final del limitador | `EPitStopState` (None, Requested, Entering, Queuing, PitStopApproach, Stopped, JackUp, Releasing, WaitingForRelease, Exiting, PitStopPenalty, InGarage, CarSetup); `reachedPitExitLimiter`, `CostOfDoubleStacking`, `PitLaneEntranceTime`, `DelayPitByOneLap` | Máquina de pit lane explícita (ver §3.8) |
| 16 | La pérdida del pit lane en verde y bajo SC es un dato **por circuito** | `Races_Tracks`: `PitLaneTimeLoss`, `GreenFlagTimeLoss`, `SafetyCarTimeLoss`; `NeutralisedPitlaneTimeLoss` | La pérdida debe salir de la geometría y el límite de velocidad de cada circuito (y validarse contra la real) |
| 17 | Parada por etapas ordenadas, con tiempo previsto por etapa según estadísticas del *pit crew*, una tirada de error que elige etapa, gravedad, lugar y retraso, y fatiga que modifica la probabilidad | `Staff_Enum_PitStopStage`: 0 RaiseCar, 1 LoosenTyres, 2 RemoveUsedTyres, 3 ReplaceNewTyres, 4 TightenTyres, 5 LowerCar, 6 ReleaseCar, 7 WingReplacement, 8 WingAdjustment; `Save_RaceSimCars_PitStop` (`PitStop*Time`, `MistakeStage`, `MistakeSeverity`, `MistakeLocation`, `MistakeDelay`); `EPitStopRole` (FrontJack, RearJack, WheelGun, WheelOff, WheelOn, FrontWing…); `Staff_PitCrew_RaceWeekendFatigue` | Etapas con rol responsable, error por etapa, fatiga (RF-SIM-12, RF-STF-07) |
| 18 | SC por fases: espera en boxes → recoge al líder → agrupa → deja pasar doblados → listo para terminar → entra | `ESafetyCarState` (WaitingInPits, GatheringLeader, GatheringPack, CarsGrouped, AllowingLappedCarsThrough, ReadyToEnd, Ending, EndUnderSafetyCar); `ESafetyCarUnlappingState` | Fases del SC con el coche de seguridad físico en pista |
| 19 | Cronometraje por puntos de control a distancias fijas: el intervalo es el tiempo de paso frente al primero que pasó | `Save_TimingManager_Checkpoints` (`RaceDistance`, `TimeFirstPassed`, `FirstPassedCarId`); `ESectorState` (IntoPit, OutFromPit…) | Minisectores para gaps en vivo (hoy solo en la línea) |
| 20 | Doblados ceden hacia un lado, con distancia de inmunidad a la bandera azul | `Save_RaceSimCars.YieldDirection`, `BlueFlagImmunityDistance`, `LappingYieldDistance` | El doblado se aparta lateralmente (hoy solo pierde tiempo) |

**No aparece** en las cadenas: exceso de velocidad en pit lane, suelta insegura, vuelta de formación, *speed trap*
ni minisectores (solo `reachedPitExitLimiter` y un aviso de radio `PitLimiter`). En OverCut ya existen como
sanciones (`race-eras.json` `penalties.offences.pitSpeeding`, `unsafeRelease`); aquí se proponen con causa física.

---

## 2. Huecos de nuestro motor, medidos

Medido el 2026-11-22 con una sonda temporal de Jest (borrada) sobre el motor real: carrera por pasos completa
(`fromQuickRace` + `runStepToFinish`), semilla `probe`, Ferrari como equipo del jugador, packs de 2005, 2012 y 2024.
Datos reales de f1db v2026.20.0 (`tools/assets/.cache/f1db/f1db.db`).

### 2.1 Tiempos por vuelta

| Circuito-año | Pole real | Clasif. simulada | Δ | V. rápida real | V. rápida sim | Δ | Media ganador real | Sim | Δ |
|---|---|---|---|---|---|---|---|---|---|
| Monza 2012 | 84,010 | 92,316 | **+9,9 %** | 87,239 | 86,432 | −0,9 % | 90,212 | 88,019 | −2,4 % |
| Mónaco 2012 | 74,301 | 77,788 | +4,7 % | 77,296 | 77,333 | 0,0 % | 81,623 | 80,450 | −1,4 % |
| Baréin 2024 | 89,165 | 92,226 | +3,4 % | 92,608 | 92,712 | +0,1 % | 96,574 | 94,553 | −2,1 % |
| Baréin 2012 | 92,422 | 95,459 | +3,3 % | 96,379 | 96,263 | −0,1 % | 100,193 | 102,122 | +1,9 % |
| Silverstone 2005 | 79,905 | 80,678 | +1,0 % | 80,502 | 53,747 ¹ | — | 84,493 | 85,657 | +1,4 % |
| Monza 2005 | 80,878 ² | 80,411 | −0,6 % | 81,504 | 82,036 | +0,7 % | 84,314 | 85,202 | +1,1 % |

¹ Vuelta 11 tras la bandera roja: al formar la parrilla los coches se recolocan y quedan vueltas de 53–70 s (defecto, §2.6).
² 2005: clasificación agregada; se usa la mejor vuelta individual.

- La vuelta rápida de carrera ya cuadra (±1 %). **La clasificación sale lenta (+1 a +10 %)**: su ritmo se deriva de
  `baseLap = vuelta media de carrera × 0,985` (`packWorld.js`), y la vuelta media real incluye paradas y SC. En la
  realidad la pole es 3–6 % más rápida que la vuelta rápida de carrera; en la simulación es igual o más lenta.

### 2.2 Velocidades en pista

La carrera por pasos recorre una «traza de velocidad» de forma (`trackGeometry.speedTrace`, coche de punto con el
`envelopeFor(year)` por era) y la **escala entera** para que dure el presupuesto de vuelta. La velocidad mostrada en
cada punto es `traza × vueltaDeForma / presupuesto`.

| Circuito-año | Vuelta de forma (s) | Pole real | Punta sim (v. rápida) | Punta real | Mínima sim | Mínima real |
|---|---|---|---|---|---|---|
| Monza 2012 | 82,4 | 84,0 | 316 km/h | 346,0 (carrera, Räikkönen) | 89 (T2) | 76–85 (T1, frenada Brembo) |
| Mónaco 2012 | 65,3 | 74,3 | **243** | 285,1 (Rosberg) | **64** | 45–48 (horquilla) |
| Baréin 2024 | 81,0 | 89,2 | **289** | 332,2 (Hülkenberg) | 75 (T1) | 66 (T1, 2025) |
| Monza 2005 | 85,1 | 80,9 | 337 | 372,6 (Montoya, fuente discutida) | 94 | — |
| Silverstone 2024 | **56,6** | 85,8 | — | — | 159 | 120 (T3, Brembo 2024) |

Causas:

1. **Fallo del modelo de curva.** `cornerSpeed` usa `v² = g·grip·r / (1 − g·aero·r)`. Con `aero = 0,0021`
   (2017+) el denominador se anula para `r ≥ 46 m` (2005: `r ≥ 61 m`): **toda curva de más de 46 m de radio se
   toma a fondo**. La carga equivale a ~15 g laterales a 290 km/h (real: 5–6 g). Por eso Silverstone «da» 56,6 s.
2. **Escalado uniforme.** El tiempo que sobra se reparte en proporción a la velocidad: las rectas pierden lo mismo
   en proporción que las curvas. Resultado: punta 9–15 % baja y curvas lentas 15–40 % rápidas.
3. El radio sale del eje central suavizado de la malla, no de la trazada; la anchura de pista no se conoce.

### 2.3 Colocación lateral

| Capa | Dónde | Máximo medido | Observación |
|---|---|---|---|
| Trazada exterior-interior-exterior | `three/racingLine.js` (vista) | 4,8 m | Ancho fijo `HALF_ROAD = 6,5 m` para todos los circuitos; solo estética, no cambia el radio ni la velocidad |
| Lateral del motor (duelo, bloqueo) | `stepRace.lateral` (`race-sim.json` `lateral`) | 2,6 m (límite 5,5 m) | Se suma encima de la trazada en `raceClock.liveCarAt` |
| Apartarse del rebufo | `Race3D.js` `lateralTarget` ±2,3 m | 2,3 m | Decidido en la vista, sin saber el lado del motor |

- Las tres capas se suman: hasta ~9,7 m del centro frente a una media anchura de 6,5 m (coches sobre el piano o
  fuera del asfalto). La vista puede poner al atacante en un lado y el motor en el otro.
- La altura del coche sale de `heightAt(progress)` muestreado a lo largo del eje; con 5–9 m de desplazamiento en
  peralte o bombeo el coche flota o se hunde (en el pit lane ya se usa `field.floorNear`).
- Los coches doblados no se apartan lateralmente: pierden `lappedDelay` a `slowFactor` (0,8) de velocidad.

### 2.4 Pit lane y parada

| Medida | Monza 2012 | Mónaco 2012 | Baréin 2024 | Baréin 2012 | Silverstone 2005 | Monza 2005 |
|---|---|---|---|---|---|---|
| Pit lane | malla, 707 m | **procedural** | malla, 801 m | malla | **procedural** | malla |
| Pérdida de carril del modelo (`0,21 × baseLap`) | 18,7 s | 16,9 | 20,0 | 20,7 | 17,5 | 17,4 |
| Pérdida total simulada (vuelta de entrada + salida − 2 × mediana) | 22,0 | 20,1 | 22,0 | 23,3 | 23,5 (repostaje) | 25,2 (repostaje) |
| Paradas simuladas / reales (f1db) | 23 / 31 | **106 / 26** | 20 / 43 | 32 / 71 | 21 / 38 | 37 / 47 |
| Tiempo en el pit lane real (f1db, mediana entrada→salida) | 22,3 s | 25,9 | 24,9 | 22,9 | 23,9 | 26,9 |
| Pérdida real publicada (2025, FastF1) | 25,1 | 17,9 | 23,0 | — | — | — |

- La pérdida **no depende** de la longitud del pit lane ni del límite de velocidad: es un 21 % de la vuelta para
  todos los circuitos (14–34 s), ×0,5 bajo SC. No hay límite de velocidad de pit lane en ningún dato
  (`era-defaults.json`, `race-eras.json`): solo una probabilidad de sanción por exceso desde 1994.
- **En la carrera por pasos el coche nunca se detiene en el box.** `intoLane` reparte carril + parada como una
  velocidad constante reducida (`pitRate = tramo / (tramo + extra)`, en Monza ≈ 0,28 de la velocidad de carrera)
  desde la entrada hasta la línea; la parada es invisible y la grúa del equipo no aparece. Desde la línea hasta la
  salida (`inPit = 2`) el coche va **a ritmo de carrera dentro del pit lane** (~250 km/h). En la repetición rápida
  (`raceClock.carAt`) sí para en su box.
- Mónaco, Silverstone, Spa y Shanghái usan el pit lane procedural (22 m paralelo a la recta), sin malla.
- La parada es un único número (`stationary` por era × habilidad + parada lenta 4 %): no hay etapas, roles ni
  errores por etapa; el repostaje no corre en paralelo con las ruedas.

### 2.5 Duelos, aire sucio, IA

- Aire sucio y rebufo: ventana lineal de **1,0 s** (no metros), aire sucio solo en curva y rebufo solo en recta;
  valor por vuelta por era (`race-eras.json` `dirtyAir`: 0,42 s/vuelta en 1977–2021, 0,24 desde 2022). No depende
  de la velocidad de la curva (en la realidad pesa en curva rápida y casi nada en la lenta).
- Duelo: punto de ataque fijo 160 m antes de la frenada, tirada con modificadores calibrada para que la
  probabilidad por vuelta iguale al modo rápido; el resultado no depende de geometría (solape, punto de frenada,
  lado). El lateral es solo presentación.
- IA: el ritmo de los rivales es el presupuesto del modo rápido; los errores se tiran por vuelta y cuestan tiempo a
  `slowFactor 0,35` en la curva, sin salirse de la trazada, sin bloqueo ni trompo visibles.

### 2.6 Otros defectos vistos

- Bandera roja (Silverstone 2005, vuelta 11): al formar la parrilla quedan vueltas de 53–70 s que pueden contar
  como vuelta rápida.
- Mónaco 2012 con 106 paradas frente a 26 reales: estrategia o clima fuera de rango (no es de este documento,
  pero afecta a cualquier calibración de pit lane).
- Rendimiento: carrera por pasos completa en 376–576 ms (Node, Jest, un hilo). Margen para RNF-01 (≤ 2 s): ~1,4 s.

### 2.7 Comprobación en vivo (Playwright)

Servidor propio en el puerto 3041, Chrome con WebGL (ANGLE), carrera de 2024 en Baréin con Ferrari.

- Libres en vivo (cámaras TV, persecución, dron, helicam, Tcam, visor, morro, mapa): los coches en salida y entrada
  de box van por el pit lane de la malla y paran en su garaje. Ahí se usa `raceClock.carAt`, que sí detiene el coche en
  el box. Las capturas están en el scratchpad de la sesión (`simfis/`).
- **No se llegó a la carrera en vivo.** Tras cerrar los libres, el botón «Volver al fin de semana» no respondía a los
  clics de Playwright, ni siquiera forzados (hilo principal ocupado o capa encima). Se intentó tres veces y se paró.
  El comportamiento del pit lane en la carrera por pasos (§2.4: sin parada en el box y a ritmo de carrera entre la
  línea y la salida) sale del código (`stepRace.intoLane`, `raceClock.laneAt`) y de la sonda. Hay que confirmarlo con
  capturas cuando se arregle el flujo: forma parte del test de WP9.

---

## 3. Modelo propuesto

### 3.0 Principio: el presupuesto decide, la física reparte

La equivalencia con el modo rápido (§4.2, ±2 % en media y varianza) se mantiene **por construcción**: en cada paso
por la línea el tiempo de vuelta en aire limpio sigue saliendo de `lapModel.planLap` (el mismo `lapBudget` de
`race.js`). Lo nuevo es **cómo** se gasta ese presupuesto a lo largo de la vuelta y qué pasa cuando hay tráfico:

1. Cada coche tiene su propia traza física `vRef_i(s)` (sección 3.2), calculada al empezar la carrera.
2. El presupuesto `B` se convierte en un factor `k = T_phys,i / B` que, si la calibración está bien, queda cerca de
   1 (±3 %). La velocidad en cada punto es `v = k_t · vRef_i(s)` donde la corrección se reparte **por bandas**
   (curva lenta, media, rápida, recta) según su causa: neumático y combustible pesan sobre todo en curva, la potencia
   (modo de motor, ERS) en recta. Así la punta y las mínimas salen reales y el tiempo total sigue siendo `B`.
3. Tráfico, aire sucio, rebufo, DRS, duelos, amarillas, SC y pit lane actúan **fuera** del presupuesto, como hoy.

### 3.1 Trazada y desplazamiento lateral

**Datos nuevos de pista (pipeline, ADR-001).** `extract_spline.py` exporta además la media anchura izquierda y
derecha por punto (`wl`, `wr`, dm) y, si se puede, los pianos. La trazada se calcula **sin conexión** en
`tools/assets/` (o una vez por circuito en el motor, cacheada) como trazada de curvatura mínima dentro de
`[−wl + m, wr − m]` (margen `m` = media anchura del coche + 0,3 m), con suavizado; se guarda en `splines.json`
como `line: [n0, n1, …]` (dm). En circuitos procedurales se usa el algoritmo actual de `racingLine.js` movido al
motor.

**Estado por coche** (arrays tipados en `sim`):

| Variable | Unidad | Significado |
|---|---|---|
| `n[i]` | m | Desplazamiento respecto a la trazada (+ derecha) |
| `nT[i]` | m | Objetivo lateral |
| `nV[i]` | m/s | Velocidad lateral, limitada por `lateral.maxRate` y `lateral.maxAccel` |
| `lane[i]` | enum | `RACING`, `ATTACK_IN`, `ATTACK_OUT`, `DEFEND`, `YIELD`, `PIT_ENTRY`, `PIT`, `PIT_EXIT`, `OFF` |

- Posición dibujada = eje + `line(s)` + `n` en la normal; el motor es **la única fuente** del lateral. Se quita el
  `lateralTarget` de `Race3D.js` y la suma doble de `onRacingLine` + `liveCarAt`.
- Límite duro: `|line(s) + n| ≤ w(s) − media anchura del coche` (si no, estado `OFF`: pista fuera, hierba, grava).
- Coste de ir fuera de trazada: en curva el radio efectivo baja; se aproxima con
  `vOff = vLine · sqrt(max(rMin, r_line − σ·n·sign) / r_line)` usando la curvatura de la trazada en `s` (tabla
  precalculada `kappa[s]`). Por fuera de la trazada hay además pérdida de agarre por gravilla de goma (*marbles*):
  `grip × (1 − marbles(stintLap, |n|))`, `data/balance/race-physics.json` `lateral.marbles`.
- El doblado pasa a `YIELD` hacia el lado de fuera de la próxima curva y pierde solo lo que le cueste la línea.

### 3.2 Perfil de velocidad por curvatura (por era y por coche)

Modelo de coche de punto cuasi estático, el mismo esquema que `speedTrace` pero con física acotada y por banda:

| Fuerza | Ecuación |
|---|---|
| Carga | `Fz = m·g + ½ρ·ClA·v²` |
| Agarre lateral | `a_lat,max = μ_b · Fz / m`, con `μ_b` por banda (lenta < 120 km/h, media, rápida > 200 km/h) |
| Velocidad límite en curva | `v² · κ = μ_b·(g + ½ρ·ClA·v²/m)` → `v = sqrt(μ_b g / (κ − μ_b ½ρ ClA/m))`, recortado a `vTop` |
| Tracción | `a_x = min(P/(m·v), μ_x·Fz/m) − ½ρ·CdA·v²/m − c_rr·g`, con la elipse de fricción `(a_x/a_x,max)² + (a_lat/a_lat,max)² ≤ 1` |
| Frenada | `a_brk = μ_brk · Fz/m + ½ρ·CdA·v²/m`, limitada por `brakeMax` de la era |
| Punta | resuelve `P = ½ρ·CdA·v³ + c_rr·m·g·v` |

- La singularidad del modelo actual desaparece si `ClA` es realista: con `m ≈ 880 kg`, `μ ≈ 1,8` y `ClA ≈ 4,5 m²`
  (orden de magnitud, sin fuente pública: calibrar), el radio a partir del cual la curva es a fondo es
  `m / (μ·½ρ·ClA) ≈ 180 m`, no 46 m; y la punta con `P = 746 kW` y `CdA ≈ 1,6` da ~331 km/h (Baréin 2024 real 332).
- Parámetros por era en `data/balance/race-physics.json` `eras[]`: `mass` (mínimos reglamentarios, tabla §4),
  `power`, `CdA`, `ClA`, `mu{slow,medium,fast}`, `muBrake`, `brakeMax`, `rho`. Por circuito, nivel de carga
  aerodinámica (`downforceLevel` del pack: Monza baja, Mónaco máxima) que escala `ClA` y `CdA` juntos.
- Por coche: las estadísticas de piezas (`engine/development`, 23 estadísticas tipo `ECarStat`) mueven `power`,
  `CdA`, `ClA` y `μ` por banda en ±x % (`race-physics.json` `carStats`). Piloto: `cornering` y `braking`
  (RF-STF-02) escalan `μ_b` y el punto de frenada.
- Coste: 22 coches × 2048 celdas × 2 pasadas al empezar (≈ 0,1 M operaciones). Se recalcula solo si cambia el
  estado (alerón nuevo, daño, lluvia por umbral), nunca por paso.
- **Calibración obligatoria**: para el coche de referencia de la era (el mejor del pack), la vuelta física en el
  circuito debe quedar a ±3 % de la **pole real** de f1db (tabla §4.1). Ese es el test que hoy falla
  (Silverstone −34 %).

### 3.3 Frenada y entrada en curva

- Zona de frenada = tramo de la pasada hacia atrás en el que `v` cae (ya calculado). Se guarda `brakeStart[s]`,
  `vEntry`, `vApex` por curva numerada.
- Estado longitudinal por coche `lon[i]` ∈ {`ACCEL`, `COAST`, `BRAKE`, `LOCKUP`, `PIT_LIMITER`, `STOPPED`}: no
  cambia el tiempo (lo marca la traza) salvo en duelo, error o pit lane; sirve para la vista (luces de freno,
  pitch) y para los incidentes de §3.6.
- Frenar más tarde en un ataque: `Δs_brk = brakeLate × riskLevel × braking`; gana `Δt ≈ Δs_brk / v_entry` y sube la
  probabilidad de `LOCKUP` / pasarse (§3.6).

### 3.4 Aire sucio, rebufo y DRS

Por distancia **en metros** al coche de delante en el mismo lado (`|n_i − n_a| < anchoCoche`):

| Efecto | Ecuación | Datos |
|---|---|---|
| Aire sucio | `ClA_eff = ClA · (1 − L_era(d))`, solo cuenta en curva media y rápida (`v > vDirtyMin`) | `L(d)` por era: 2017–21 35 % a 20 m y 47 % a 10 m; 2022 4 % a 20 m y 18 % a 10 m (F1); FIA CFD 2025: 20 % y 35 % |
| Rebufo | `CdA_eff = CdA · (1 − S_era(d))`, en recta | ganancia medida 5–7 km/h a 10–15 km/h; 0,3–0,5 s por vuelta en Monza |
| DRS | `CdA_eff × (1 − drsDrag_era)` en la zona activa | 10–12 km/h al final de la zona (estimación FIA), extremos 20–28 km/h |
| Calor | `ΔT_motor`, `ΔT_freno` por segundo en aire sucio | sin dato público: inferido, marcar en el JSON |

- Como la velocidad de la traza ya depende de `ClA` y `CdA`, el efecto sale de recalcular localmente `v` con la
  fórmula de §3.2 (una raíz por coche implicado y paso, sin tablas nuevas).
- **Equivalencia**: el test integra la pérdida por vuelta a hueco fijo (0,3 / 0,6 / 0,9 s) y exige que iguale la de
  `rulesFor(era).dirtyAir` del modo rápido ±10 %; si no, se ajusta `L(d)` en el JSON, no el código.

### 3.5 Duelo: adelantamiento y defensa

Máquina de estados por pareja (nombres propios, idea de `ERaceBattleState` y `Save_RaceSimCars_Overtake`):

```text
RUNNING ──hueco < followGap──► FOLLOWING ──Δritmo>0 y hueco < attackGap antes de punto de ataque──► ATTACKING
   ▲                              │ aire sucio > umbral y sin ritmo → TRAIN (tren de DRS)                │
   │                              ▼                                                                     ▼
   └────── cooldown ◄──── RESOLVED (pasa / defendido / incidente) ◄── CLAIM (curva reclamada, ≤ 3 coches)
                                         └── SWITCHBACK (a la salida, si sigue a < gapMetres e intentos > 0)
```

| Paso | Qué decide | Variables |
|---|---|---|
| Elegir ataque | lado (`in` en la curva objetivo, `out` si la siguiente es de signo contrario), curva objetivo | `atkSide`, `atkCorner`, `attempts[i][a]` |
| Defensa | estilo (Block / HoldCarBehind / HoldRacingLine) mueve `nT` del defensor al lado del ataque, con un solo cambio de dirección permitido | `defStyle`, `defMoves` |
| Frenada | punto de frenada de cada uno (§3.3) → **solape** al punto de giro: `overlap = (s_a − s_d + L_coche)/L_coche` | `overlap` |
| Reclamo | `overlap ≥ claimOverlap` → la curva es del atacante si va por dentro; si no, del defensor | `claim{cars, lead}` |
| Tirada | probabilidad actual de `duel.js` (base + ritmo + DRS + energía + riesgo + defensa) como **sesgo** de la tirada única al empezar (`successRoll`) | `successRoll` |
| Incidente | una tirada por reclamo: choque interior a la entrada, exterior a la salida, apretón (cede o sale ancho) | `race-sim.json` `duel.incident` ampliado |

- La probabilidad global por vuelta sigue calibrada contra el modo rápido (el test `equivalence.test.js` de pases y
  contactos se mantiene); la geometría solo decide **cuál** de los intentos termina en pase.
- Bajo amarilla local, SC, VSC o en el pit lane no hay duelo (como ahora).

### 3.6 IA: ritmo, agresividad y errores

| Parte | Modelo | Datos |
|---|---|---|
| Ritmo objetivo | modo de ritmo de 5 niveles (RF-CMD-01) → `lapBudget` (sin cambio) | `race-eras.json` |
| Gestión de hueco | en `FOLLOWING` sin ritmo para atacar, el coche puede pasar a «aire limpio» (sube hueco a `cleanAirGap`) si la orden o la IA lo piden | `race-physics.json` `ai.cleanAirGap` |
| Agresividad | atributo del piloto (RF-STF-02) → `attackGap`, `brakeLate`, `claimOverlap`, nº de intentos por defensor | `ai.aggression` |
| Errores | se tira **por vuelta** como hoy (`rollMistake`, equivalencia) y se coloca en una curva con peso por dificultad (velocidad, piano, agua, neumático frío, duelo); tipo: bloqueo (frenada), salida ancha (salida de curva, `n → borde`, puede perder puesto), trompo (parada 4–12 s, se reincorpora), choque | `mistake.kinds` |
| Recuperación | `RECOVERY`: vuelve a la trazada con `nRate` limitado y velocidad reducida; sin duelo mientras dure | `mistake.recovery` |
| Precisión | ruido por curva `±σ_corner` (además del de la vuelta), con media cero por vuelta para no tocar el presupuesto | `ai.cornerNoise` |

### 3.7 Velocidad real en pista (lo que ve el jugador)

Con §3.0–3.2 la velocidad dibujada es `v` física: punta y mínimas a ±5 % de las reales de la tabla §4.2. La vista
deja de deducir la velocidad por diferencia de posiciones y la lee del snapshot (`v[i]`, nuevo campo).

### 3.8 Pit lane: entrada, limitador, box y salida

Trazada propia del pit lane (la de la malla, `extract_pitlane.py`; procedural donde no haya), con distancias
marcadas en el JSON de la *spline*: `entryLine`, `limitFrom`, `boxFrom`/`boxTo` (huecos por equipo en orden del
pack), `limitTo`, `exitBlend`.

```text
TRACK ─(pide parada o sanción)─► ENTRY_ROAD (frena de v pista a vLimit antes de limitFrom; no puede cruzar la línea blanca)
  ─► LIMITER (v = vLimit) ─► BOX_APPROACH (frena a 0 en su box; si el compañero está parado: QUEUE)
  ─► STATIONARY (etapas §3.9) ─► RELEASE (suelta; comprueba coche que llega por el carril rápido)
  ─► LIMITER ─► EXIT_ROAD (acelera desde limitTo; se incorpora en exitBlend sin cruzar la línea) ─► TRACK
```

- Posición en la clasificación durante el pit lane: distancia equivalente de pista
  `s_eq = entry + (sPit / L_pit) × span`, como hoy, pero con el coche **parado de verdad** en su box.
- Pérdida emergente = tiempo real del recorrido − tiempo del mismo tramo en pista. Se valida contra la pérdida real
  del circuito y año ±1,0 s (tabla §4.3); si no cuadra, se corrige la geometría (`limitFrom/limitTo`) o el
  `pitLane.extraLoss` por circuito en el pack, nunca el código.
- Límite de velocidad por era y por circuito (tabla §4.4) en el reglamento del pack (`regulations.pitLaneSpeed`,
  con `exceptions` por circuito), mismo patrón de `era-defaults.json`. Sin límite antes de 1994: `vLimit` = la que
  permita la geometría del pit lane (recta: velocidad de pista menos `pitLane.noLimitMargin`).
- Bajo SC/VSC la pérdida baja sola porque el tramo de pista se recorre más lento (hoy es ×0,5/×0,62 fijo).
- Exceso de velocidad: probabilidad pequeña de `vLimit + δ` al tocar el limitador tarde (`pitLane.speeding`),
  sustituye la tirada a ciegas actual; suelta insegura: si al soltar hay un coche en el carril rápido a menos de
  `unsafeGap` metros.

### 3.9 Parada por etapas con *pit crew*

| Etapa (orden) | Rol | Tiempo | Error |
|---|---|---|---|
| Aproximación y parada en marcas | piloto | `stopPrecision` del piloto | se pasa de marca (+0,3–1,0 s) |
| Gatos arriba | gato delantero y trasero | `t_jack` | gato que falla |
| Aflojar, quitar, poner, apretar (×4 en paralelo; manda la rueda más lenta) | pistola, saca, pone | `max_rueda(t_gun + t_off + t_on + t_gun)` | tuerca cruzada (la de mayor retraso) |
| Alerón (ajuste o cambio, opcional, en paralelo) | alerón | `t_wing` | — |
| Repostaje (1982–83 opcional, 1994–2009) | repostador | `litros / caudal + t_engage`, en paralelo con ruedas | manguera que no engancha, fuego (muy raro, RF-HIS-00 no aplica) |
| Gatos abajo y suelta | gatos, *lollipop*/semáforo | `t_release` | suelta insegura (§3.8) |

- `stationary = t_marcas + t_jack + max(ruedas, alerón, repostaje) + t_release + error`. Las distribuciones por
  etapa y era van en `race-physics.json` `pitStop.eras[]`; el habilidad del equipo (`crew` actual, RF-STF-07 con
  entrenamiento y fatiga cuando exista) escala la media y la probabilidad de error.
- Calibración: mediana de la parada a ±0,2 s de la real por era (2,0–2,5 s hoy; ~2,1 s de media del premio DHL
  2024; 6–12 s en la era del repostaje), y la mejor del año cerca del récord del año (1,80 s en 2023).
- La vista ya tiene grúa y equipo (`Race3D` `buildCrew`): pasa a animarse por etapa con el estado `pitStage[i]`.

### 3.10 Tunables (RNF-07)

Nuevo `data/balance/race-physics.json` con `$comment` por bloque y esquema JSON en `engine/packs/schema`:

| Bloque | Contenido |
|---|---|
| `eras[]` | `from`, `to`, `mass`, `power`, `CdA`, `ClA`, `mu{slow,medium,fast}`, `muBrake`, `brakeMax`, `crr`, con `source` por campo (§4) |
| `bands` | límites de velocidad de las bandas (lenta/media/rápida) |
| `carStats` | cuánto mueve cada estadística de pieza a `power/CdA/ClA/mu` |
| `driver` | efecto de `cornering`, `braking`, `control`, `aggression` |
| `lateral` | `maxRate`, `maxAccel`, `margin`, `marbles`, `offLineSigma` |
| `wake` | `dirty[era]: [[d, L], …]`, `tow[era]: [[d, S], …]`, `drsDrag[era]`, `heat` |
| `duel` | `followGap`, `attackGap`, `claimOverlap`, `brakeLate`, intentos, `squeeze` |
| `mistake` | tipos, pesos por curva, `recovery` |
| `pitLane` | `noLimitMargin`, `speeding`, `unsafeGap`, `extraLoss` por defecto |
| `pitStop.eras[]` | media y desviación por etapa, probabilidad y retraso de error por gravedad |

En los packs de temporada (generados, no a mano): `regulations.pitLaneSpeed` y por evento `refLaps{pole,
fastestRaceLap, winnerAvg}` y `pitLaneTime` mediana de f1db; en `splines.json`: `wl/wr`, `line`, marcas del pit lane.
Lo que hoy está en `race-sim.json` (`lateral`, `dirtyAir.windowSec`, `slipstream`) se migra y se deja de leer.

### 3.11 Determinismo (RF-SIM-15, RNF-05)

- Mismos cuatro flujos con semilla (`laps`, `duels`, `pits`, `incidents`) más uno nuevo `crew` para las etapas;
  ninguna tirada depende del orden de llegada de mensajes del worker ni de la velocidad de reproducción (RF-CMD-04
  solo cambia cuántos pasos se piden).
- Recorrido de coches en el orden fijo del anillo (como hoy). Arrays `Float64Array` en el bucle.
- Riesgo detectado: `Math.sin/cos/atan2/hypot/exp/pow` no están garantizados bit a bit entre motores JS (V8,
  SpiderMonkey, JavaScriptCore). Las tablas se construyen con ellas en el navegador. Propuesta: en el bucle solo
  `+ − × ÷` y `Math.sqrt` (redondeo exacto IEEE); las tablas por circuito se calculan con un `engine/sim/detMath.js`
  propio (polinomios) o se precalculan en el pipeline y se versionan en `splines.json`.
- Test: dos ejecuciones con la misma semilla y órdenes → `JSON.stringify` idéntico (ya existe; se amplía con pit
  lane, lateral y etapas).

### 3.12 Rendimiento (RNF-01, RNF-02)

| Pieza | Coste estimado | Presupuesto |
|---|---|---|
| Hoy (medido) | 376–576 ms por carrera | — |
| Trazas por coche al empezar | 22 × 2048 × 2 pasadas ≈ 5 ms | 20 ms |
| Lateral + estado longitudinal por paso | ~0,6 M coche-pasos × ~40 flops | +100 ms |
| Aire sucio / rebufo (raíz por pareja cercana) | ≤ 22 raíces por paso | +60 ms |
| Pit lane y etapas | despreciable | +10 ms |
| **Total objetivo** | **≤ 900 ms en Node; ≤ 2 s en portátil medio en el worker** | test de rendimiento con margen ×1,5 |

En la vista (RNF-02) no se añade trabajo por coche: se lee `n`, `v` y `pitStage` del snapshot en lugar de
recalcular trazada y apartamientos.

### 3.13 Equivalencia con el modo rápido (§4.2)

- El tiempo de vuelta en aire limpio no cambia de fórmula (§3.0): `equivalence.test.js` debe seguir verde sin
  tocar tolerancias.
- La pérdida de pit lane del modo rápido pasa a leer la misma pérdida por circuito que produce el pit lane físico,
  medida una vez por circuito y era (tabla cacheada `pitLossFor(circuit, era, sc)`), para que los dos modos paguen
  lo mismo por parar.
- Aire sucio: test de integral por vuelta (§3.4). Pases y contactos por carrera: los mismos umbrales de hoy.

---

## 4. Calibración con datos reales

Leyenda: **f1db** = `tools/assets/.cache/f1db/f1db.db` (v2026.20.0). **V** = página leída; **S** = cifra citada por el
buscador, página no abierta; **NV** = no verificado (memoria o sin fuente).

### 4.1 Tiempos por vuelta (f1db)

| Circuito-año | Trazado | Pole | V. rápida carrera | Media ganador | Pit lane (mediana f1db) |
|---|---|---|---|---|---|
| Monza 2012 | monza-7 | 84,010 | 87,239 | 90,212 | 22,303 (31 paradas) |
| Mónaco 2012 | monaco-6 | 74,301 | 77,296 | 81,623 | 25,906 (26) |
| Baréin 2024 | bahrain-1 | 89,165 | 92,608 | 96,574 | 24,852 (43) |
| Baréin 2012 | bahrain-1 | 92,422 | 96,379 | 100,193 | 22,903 (71) |
| Silverstone 2005 | silverstone-7 | 79,905 | 80,502 | 84,493 | 23,911 (38, con repostaje) |
| Monza 2005 | monza-7 | 80,878 | 81,504 | 84,314 | 26,908 (47, con repostaje) |
| Monza 2024 | monza-7 | 79,327 | 81,432 | 84,542 | 24,699 (30) |
| Silverstone 2024 | silverstone-8 | 85,819 | 88,293 | 95,136 | 29,341 (45) |

(La «pit lane» de f1db es el tiempo entre las líneas de entrada y salida, parada incluida; no es la pérdida.)

### 4.2 Velocidades

| Dato | Valor | Año | Fuente | Ver. |
|---|---|---|---|---|
| Punta Monza, carrera | 346,0 km/h (Räikkönen); más lento 330,4 | 2012 | https://www.motorsport-total.com/formel-1/ergebnisse/2012/grosser-preis-von-italien/rennen/topspeeds | V |
| Punta Monza, clasificación | 342,7 km/h | 2012 | …/2012/grosser-preis-von-italien/qualifying/topspeeds | V |
| Punta Monza, carrera | 357,1 km/h (*speed trap*); línea 324,6 | 2024 | https://api.fia.com/sites/default/files/2024_16_ita_f1_r0_timing_racemaximumspeeds_v01.pdf | S |
| Récord Monza | 372,6 km/h (Montoya; fuentes discrepan si fue carrera) | 2005 | https://www.guinnessworldrecords.com/world-records/fastest-speed-outright-in-a-formula-one-grand-prix | S |
| Punta Mónaco, carrera | 285,1 km/h (Rosberg) | 2012 | …/2012/grosser-preis-von-monaco/rennen/topspeeds | V |
| Punta Baréin, carrera | 332,2 km/h (Hülkenberg); clasif. 327,3 | 2024 | https://www.fia.com/sites/default/files/2024_01_brn_f1_r0_timing_racemaximumspeeds_v01.pdf | S |
| Punta Silverstone | 294,4 km/h (2006; 2005 no encontrado) | 2006 | …/2006/grosser-preis-von-grossbritannien/rennen/topspeeds | V |
| Monza T1 frenada | 334 → 76 km/h, 139 m, 2,81 s, 4,3 g | 2022 | https://www.conceptcarz.com/a47712/brembo-formula-1-monza-2022.aspx | V |
| Monza T1 frenada | 341 → 85 km/h, 139 m, 5,54 g | 2014 | https://www.formula1.it/2014/ID%20Card%20Gp%20Italia.pdf | S |
| Baréin T1 frenada | 313 → 66 km/h, 124 m, 2,89 s, 4,2 g | 2025 | https://www.f1-fansite.com/?p=306192 | S |
| Mónaco Ste Dévote | 293 → 101 km/h | reciente | https://www.conceptcarz.com/a50485/brembo-formula-1-monaco.aspx | S |
| Mónaco horquilla | 45–48 km/h mínima | 2023–24 | https://www.autosport.com/f1/news/fastest-and-slowest-turns-on-the-f1-calendar/10571441/ | S |
| Silverstone T3 frenada | 279 → 120 km/h, 102 m | 2024 | https://www.conceptcarz.com/a46970/brembo-formula-1-brake-facts-british-gp.aspx | S |
| g lateral | > 5 g (Suzuka T1, Eau Rouge, Maggotts-Becketts) | 2024 | https://mercedesamgf1.com/news/g-force-and-formula-one-explained | V |
| Velocidades de vértice por era | no encontradas | — | — | NV |

### 4.3 Pérdida por parar (verde)

| Circuito | 2025 FastF1 (A) | Otras | Fuente |
|---|---|---|---|
| Monza | 25,1 s | 23,7 (C) | A: https://www.formuladream.app/blog/f1-pit-stop-cost-measured (V); C: https://flowracers.com/blog/f1-free-pit-stop/ (V) |
| Mónaco | 17,9 | 22,0 (2026, B), 23,8 (C) | B: https://f1chronicle.com/f1-pit-stop-time-loss-data/ (V) |
| Baréin | 23,0 | 24,3 (C) | A, C |
| Silverstone | — | 21,0 (2026, B), 27,8 (C) | B, C |
| Spa | — | 18,4 (B), 22,3 (C) | B, C |
| Barcelona | 22,4 | 23,8 (B) | A, B |
| Singapur | — | 27,9 (B); ~29 s a 60 km/h, ~22–23 s a 80 | B; https://www.the-race.com/formula-1/f1-reduce-pitlane-speed-limit-some-races-explained/ (V) |
| Suzuka | 23,5 | 22,6 (C) | A, C |
| Hungaroring | 20,5 | 21,3 (C) | A, C |

Las cifras dependen del método (A: vuelta de entrada + salida menos la mediana; B: medianas por temporada) y del
límite de velocidad del año. Para épocas anteriores no hay serie publicada: la pérdida se valida contra el tiempo de
pit lane de f1db (desde 2011 aprox.) menos el tramo equivalente en pista.

### 4.4 Límite de velocidad en el pit lane

| Periodo | Límite | Fuente | Ver. |
|---|---|---|---|
| Antes de 1994 | sin límite | conocimiento general | NV |
| 1994 (tras Imola) | 80 km/h en libres, 120 km/h en carrera; otra versión: 80 km/h todo el fin de semana desde Mónaco 1994 | https://fia.com/node/51351 ; https://www.motorpasion.com/formula1/limite-velocidad-boxes-formula-1-llego-1994-antes-habia-escenas-brutales-como-esta-jean-alesi-a-fondo-pit-lane-gp-espana | S (conflicto) |
| 1995–2003 | por verificar en los reglamentos de cada año | — | NV |
| 2004 – mitad de 2013 | 100 km/h (2010, art. 30.12: 60 km/h en libres, 100 km/h el resto) | https://formula1-dictionary.net/pitlane_speed_limiter.html | V (2010) / S (2004) |
| Desde el GP de Hungría 2013 | 80 km/h todo el evento; Melbourne, Mónaco y Singapur 60 km/h | https://www.fia.com/news/fia-reinforces-f1-safety | V |
| 2025–26 | art. 34.7: 80 km/h; 60 km/h en Australia, Mónaco, Zandvoort y Singapur (Melbourne posiblemente 80 desde 2022: conflicto) | https://www.the-race.com/formula-1/f1-reduce-pitlane-speed-limit-some-races-explained/ ; https://www.formula1.com/en/latest/article/explained-why-are-there-pit-lane-speed-limits-in-f1-and-how-are-they-measured.jc4jiWVsfbRhb62QomSf0 | V |

### 4.5 Paradas

| Dato | Valor | Fuente | Ver. |
|---|---|---|---|
| Parada con repostaje (1994–2009) | 6–12 s según combustible; ~20 mecánicos | https://en.wikipedia.org/wiki/Pit_stop | V |
| Primeras paradas solo ruedas | objetivo < 3 s; gatos mecánicos prohibidos | https://www.motorsportmagazine.com/archive/article/april-2010/72/return-of-the-slick-pitstop/ | V |
| Mejor parada por GP (DHL) | 1,90–2,52 s; media ~2,1 s | 2024: https://www.formula1.com/en/results/2024/awards/fastest-pit-stops | V |
| Récord | 1,80 s (McLaren, Qatar 2023); antes 1,82 s (Red Bull, Brasil 2019) | https://www.guinnessworldrecords.com/world-records/108666-fastest-formula-one-pit-stop | S |
| Equipo moderno | ~20–22 (4 pistolas, 8 de ruedas, gatos) | https://mercedesamgf1.com/news/box-box-pitstop-explained | S |
| Caudal de repostaje | ~12 l/s | memoria | NV |
| Paradas 1976–1993 | sin dato publicado | — | NV |

### 4.6 Aerodinámica, masa y potencia

| Dato | Valor | Fuente | Ver. |
|---|---|---|---|
| Pérdida de carga siguiendo (2017–21) | 35 % a 20 m, 47 % a 10 m | https://www.formula1.com/en/latest/article/10-things-you-need-to-know-about-the-all-new-2022-f1-car.4OLg8DrXyzHzdoGrbqp6ye | V |
| Pérdida de carga siguiendo (diseño 2022) | 4 % a 20 m, 18 % a 10 m | mismo | V |
| Carga retenida, CFD FIA 2025 | ~80 % a 20 m, ~65 % a 10 m | https://www.the-race.com/formula-1/exclusive-new-data-f1-aero-losses-ruining-close-racing/ | V |
| DRS | +10–12 km/h al final de la zona; 17 km/h ≈ 0,5 s/vuelta en Barcelona | https://en.wikipedia.org/wiki/Drag_reduction_system ; https://group.renault.com/en/news-on-air/news/spanish-grand-prix-drs-the-overtaking-aid/ | S |
| Rebufo | 5–7 km/h medidos; 0,3–0,5 s/vuelta en clasificación de Monza | https://www.f1technical.net/news/28967 ; https://www.formula1.com/en/latest/article/monza-qualifying-could-be-chaotic-as-drivers-hunt-for-tow-says-russell.3eusaspt6mu3uZjyl2MkyV | S |
| Masa mínima | 595 kg (1995–2008; 605 en 2007 según otra fuente), 620 (2010), 640 (2011–12), 691 (2014), 702 (2015), 728 (2017), 752 (2021), 798 (2022), 768 (2026) | https://www.f1technical.net/news/28346 | V/S |
| Potencia | V10 2005 > 900 cv; V8 ~750 cv; híbrido 2014–25 ~1000 cv; 2026 ~750 kW total | Wikipedia (Ferrari V10), Goodwood, Red Bull, F1.com | S |
| Sensibilidad a la resistencia | 1 punto de Cd ≈ 0,09 s/vuelta en Monza, 0,038 s en Hungría | https://www.autosport.com/f1/news/tech-insight-the-risks-and-rewards-of-low-drag-5104044/5104044/ | S |
| CdA, ClA absolutos | sin fuente pública; orden Cd 0,7–1,1, L/D 3–4 | — | NV (se calibran contra pole y punta) |
| Delta de SC/VSC | la FIA no publica %; VSC ~30–40 % más lento | https://www.fia.com/news/fia-insights-developing-new-delta-double-yellow-flag-zones (V); planetf1 (S) | V/S |

---

## 5. Plan de implementación

Paquetes independientes; cada uno con sus tests (Jest: `CI=true npx react-scripts test --watchAll=false
--testPathPattern overcutManager`) y sus requisitos en el commit. El orden recomendado es WP1 → WP2 → (WP3, WP5,
WP6, WP7 en paralelo) → WP4 → WP8.

| WP | Qué | Ficheros (dueño exclusivo) | Tests | Requisitos |
|---|---|---|---|---|
| **WP1 Datos de pista** | Anchura `wl/wr`, trazada `line`, curvatura, marcas del pit lane (`limitFrom/limitTo/exitBlend`) en el pipeline; revisión manual | `tools/assets/blender/extract_spline.py`, `extract_pitlane.py`, `tools/assets/racing_line.mjs` (nuevo), `data/splines.json` (regenerado) | `calibratedCircuit.test.js`: trazada dentro del asfalto con margen; marcas en orden | RF-3D-03, 7.2 |
| **WP2 Física de traza** | `race-physics.json` (eras, bandas, coche), nuevo `engine/sim/physics.js` (traza por coche, punta, frenada), `trackGeometry` usa la trazada para el radio; quitar la singularidad de `envelopeFor` | `engine/sim/physics.js`, `data/balance/race-physics.json`, esquema, `engine/trackGeometry.js` (solo `speedTrace`/`envelopeFor`) | **calibración**: vuelta física del mejor coche ±3 % de la pole f1db en los 11 circuitos calibrados × 2005/2012/2024; punta ±5 %, mínima de la curva más lenta ±10 % (tabla §4.2) | RF-SIM-01, 02, RNF-07 |
| **WP3 Presupuesto por bandas** | §3.0: reparto del presupuesto por banda; `snapshot` con `v` | `engine/sim/stepRace.js` (avance), `engine/sim/trackTables.js` | `equivalence.test.js` sin cambiar tolerancias; `stepRace.test.js` velocidad de snapshot | §4.2, RF-SIM-01 |
| **WP4 Lateral y duelo geométrico** | estado `n/nT/nV/lane`, defensa con movimiento, solape, reclamo, incidentes de reclamo, doblados que ceden | `engine/sim/duel.js`, `engine/sim/lateral.js` (nuevo, sale de `stepRace.lateral`), `race-physics.json` `lateral/duel` | nadie fuera del asfalto; nunca dos coches solapados; pases y contactos por carrera dentro de los umbrales actuales | RF-SIM-07, RF-CMD-01 |
| **WP5 Aire sucio por metros** | `wake` por era; recalculo local de `v` | `engine/sim/wake.js` (nuevo; sustituye `airEffect`), `race-physics.json` `wake` | integral por vuelta = `rulesFor(era).dirtyAir` ±10 %; DRS +10–12 km/h al final de la zona | RF-SIM-06, 08 |
| **WP6 Pit lane físico** | máquina §3.8, límite por era/circuito en packs, parada real en el box, salida a límite, sanciones con causa | `engine/sim/pitLane.js` (nuevo), `generate_season_packs.py` + `era-defaults.json` (`pitLaneSpeed`), `race.js` `pitLaneLoss` → `pitLossFor` | pérdida ±1 s de la real (§4.3) en Monza, Baréin, Hungaroring, Suzuka; coche con `v = 0` durante la parada; nadie supera `vLimit` | RF-SIM-12, RF-SIM-10, §6.2 |
| **WP7 Parada por etapas** | etapas, roles, error por etapa, repostaje en paralelo, `crew` stream | `engine/sim/pitStop.js` (nuevo), `race.js` `pitStopTime` (delegar), `race-physics.json` `pitStop` | mediana por era ±0,2 s de la real; error en < 5 % de paradas; determinismo | RF-SIM-12, RF-STF-07 |
| **WP8 IA y errores colocados** | agresividad, aire limpio, errores con tipo y recuperación, ruido por curva | `engine/sim/ai.js` (nuevo), `lapModel.js` (colocar error) | tasa de errores por carrera igual a la del modo rápido; recuperación sin duelo | RF-SIM-09, RF-STF-02 |
| **WP9 Vista** | `Race3D`/`raceClock` leen `n`, `v`, `pitStage`; se quita el lateral propio de la vista; equipo animado por etapa; altura con `field.floorNear` cuando `|n| > 2 m` | `three/Race3D.js`, `three/racingLine.js` (pasa a reexportar del motor), `components/raceClock.js` | `raceClock.test.js`: pose dentro del asfalto; capturas Playwright de pit lane y duelo | RF-3D-03, 04, RNF-02, RNF-09 |
| **WP10 Clasificación y referencia** | `refLaps` en packs; `baseLap` y ritmo de clasificación desde pole y vuelta rápida reales, no desde la media de carrera | `generate_season_packs.py`, `engine/packs/packWorld.js`, `engine/sessionSim/session.js` | clasificación simulada del más rápido ±1,5 % de la pole real; `raceGolden.test.js` se regenera con nota en el commit | RF-SIM-02, RF-WKD-02 |
| **WP11 Defectos** | vueltas falsas tras la bandera roja; Mónaco con 106 paradas | `engine/sim/stepRace.js` (bandera roja), estrategia en `race.js` | ninguna vuelta < 0,9 × `baseLap` fuera de retiradas; paradas por carrera en rango f1db ±50 % | RF-SIM-10, 13 |

Pruebas transversales: determinismo byte a byte (RNF-05), rendimiento ≤ 900 ms por carrera en Node con 22 coches y
70 vueltas (RNF-01), cobertura ≥ 80 % de `engine/sim/` (RNF-11).


---

## 6. Enmiendas propuestas al SRS

1. **§4.2 paso 1**: añadir «La vuelta en aire limpio sale del mismo presupuesto en los dos modos; el modo por pasos
   solo la reparte a lo largo de la vuelta con un perfil físico por coche» (deja explícito cómo se cumple el ±2 %).
2. **RF-SIM-01**: añadir «con velocidades y posiciones laterales verosímiles: punta y mínimas a ±5 % y ±10 % de las
   reales del circuito y la era; el coche nunca fuera del asfalto salvo error o incidente».
3. **RF-SIM-12**: añadir «el coche recorre el pit lane al límite de velocidad de su era y circuito y se detiene en su
   box; la pérdida por parar sale de la geometría y se valida contra la real ±1 s».
4. **Tabla 6.2**: nueva columna «límite de pit lane» (tabla §4.4, pendiente de verificar 1994–2003 en los
   reglamentos FIA) y clave cerrada `pitLaneSpeed` en el pack (§6.3).
5. **§6.3 pack**: añadir por evento `refLaps` (pole, vuelta rápida, media del ganador) y `pitLaneTime` de f1db.
6. **Criterio 7.2**: añadir «la vuelta física del mejor coche de cada temporada queda a ±3 % de la pole real en
   cada circuito con *spline* calibrada» y «toda *spline* calibrada trae anchura de pista».
7. **RNF-05**: precisar «idéntica byte a byte en el mismo motor JS; entre navegadores, solo si las tablas se
   construyen con aritmética determinista (`detMath`) o vienen precalculadas».
8. **§2.3 punto 3**: corregir «Se reclama la curva (`CornerClaim`, hasta 3 coches)»: en el guardado el reclamo
   lleva una sola tirada de incidente con tipos de entrada, salida y apretón (`ERacingIncident`), no solo el éxito.


---

## 7. Estado de la implementación

| WP | Estado | Resultado medido |
|---|---|---|
| WP1 | Hecho (22/11); Monza enderezada a mano el 23/11 | `assets.config.json` `review.track.straighten`: dos tramos de la recta de meta (0,04–0,29 km y 5,13–5,68 km) donde la línea central de la malla se desviaba 11–26 m al unirse con el pit lane. Radio mínimo en la recta: de 33 m a 227 m (salida de la Parabólica) |
| WP2 | Hecho | Pole física: 14 de 18 poles con poco combustible a ±3 %; Monza 2005/2012 +1,9 %/+1,7 % (antes +10–13 %); 2024 +5,2 % (excepción documentada en `physics.test.js`) |
| WP3 | Hecho (23/11) | `race-physics.json` `budget`: lo que el coche va más lento que la traza se carga en curva (lenta 1,5; media 1,35; rápida 1,15) y poco en recta (0,35). Punta de carrera: Monza 2012 dentro de ±5 % de 346 km/h; Baréin 2024 dentro de ±5 % de 332 km/h (`speeds.test.js`). `snapshot` lleva `v` (m/s). El hueco en segundos usa la densidad local |
| WP4 | Parcial | En recta el atacante gana como mucho un 2 % (`race-sim.json` `duel.straight`); el resto del pase, en la frenada y la curva. Antes llegaba a 368–380 km/h en Monza |
| WP5 | Parcial | Pérdida por vuelta igual a la del modo rápido (±10 % a 0,3/0,6/0,9 s), repartida por banda (`race-physics.json` `wake.dirtyBand`: lenta 0,35, media 1, rápida 1,5); DRS +8–14 km/h al final de la zona. La ventana sigue en segundos, no en metros |
| WP6 | Hecho | Pérdida en boxes frente a la real: Monza 25,7/25,1 s, Baréin 23,2/23,0, Hungaroring 20,5/20,5, Suzuka 23,3/23,5. Parada real con `v = 0` en su box |
| WP7 | Hecho | Etapas, roles y error por etapa; mediana por era ±0,2 s |
| WP10 | Hecho | `refLaps` en los packs; pole simulada a ±1,5 % |
| WP11 | Hecho (23/11) | Paradas: el pack trae las reales de cada GP (`calendar[].pitStops`, mediana de f1db desde 1994) y `race.js strategyScales` ajusta con ellas el desgaste del circuito (sin repostaje) o lo que vale parar (con repostaje), solo en carreras secas. El plan paga el *cliff* como la carrera (vida en unidades de desgaste). Una parada no planeada ocupa el lugar de la planeada si tocaba en ≤ 10 vueltas, y la orden de *overcut* ya no para dos veces. Paradas por coche frente a las reales: Mónaco 2012 1,0/1; Baréin 2012 3,0–3,4/3; Mónaco 1998 1,0–1,1/1; Monza 2008 2,0/2 (`defects.test.js`, ±50 %). Vueltas imposibles: el SC agrupa a ritmo de carrera como máximo (modo rápido) y tras la bandera roja la parrilla se forma conduciendo (`race-sim.json` `redFlag`); 0 vueltas por debajo de 0,9 × baseLap en 40 carreras de prueba (antes 98 en el modo rápido y 2 en el de pasos). Caudal de repostaje recalibrado a 12,5 l/s (mediana de la era 8,2 s) |
| WP8 | Hecho en parte (23/11) | El error se tira por vuelta como en el modo rápido (mismo número por carrera, ±25 %) y se paga en su curva según el tipo (`race-physics.json` `mistake`): el trompo deja el coche parado (`v = 0`) el 30 % de su pérdida, la salida ancha lo lleva al borde exterior, y mientras paga y 4 s después no ataca a nadie. `snapshot.incident` para la vista. Pagar más despacio sacaba la dispersión del ±2 %. Falta la agresividad del piloto (RF-STF-02: el motor aún no tiene ese atributo) y el ruido por curva |
| WP9 | Hecho (23/11) | La vista dibuja la trazada del motor (`three/racingLine.js` lee `engine/trackData.js`, sin la media anchura fija de 6,5 m) y la suma de trazada y lateral del motor se recorta al asfalto medido. `Race3D` ya no aparta a los coches por su cuenta cuando el motor da el lateral (solo en la repetición rápida) y lee la velocidad del motor (`snapshot.v`). Las instantáneas del worker llevan `v`, fase y etapa del pit lane e incidente (`raceSession.js`, `raceClock.liveCarAt`). `components/raceView.test.js`: nadie fuera del asfalto en 45 min de carrera, `v = 0` en el box. Comprobado con Playwright sobre el build (Baréin 2024, Ferrari): pole 1:28,863 (real 1:29,179), parada de Sainz con duros de 2,3 s y salida por el pit lane |
| WP4 (doblados) | Hecho (23/11) | El doblado se aparta hacia el exterior de la curva siguiente (`race-sim.json` `blueFlags.yieldShare`) |
| Incidentes, salida y fiabilidad (RF-SIM-09, RF-SIM-14, RF-SIM-10, RF-DEV-08) | Hecho (23/11) | `engine/incidents.js` + `data/balance/race-reliability.json` (esquema en `engine/packs/schema/`), compartido por los dos modos. Objetivo contado de f1db por `overcut/src/main/resources/scripts/reliability_from_f1db.py` en 8 eras (1976-79 … 2022-26): averías por coche y carrera por grupo (motor, caja, hidráulica, electricidad, suspensión, frenos, combustible, rueda, aero), accidentes/choques/pinchazos en la apertura (`laps` 0/1) y después. Avería = tasa real de la era × fiabilidad del coche relativa a la parrilla × desgaste de la unidad (`units.js`) × daño de pieza (RF-DEV-08); la avería rompe la unidad de su grupo real. Primera curva: recorrido real de cada casilla a la primera frenada, arrancada por era (embrague, control de salida 2001-03), solape en tiempo por pareja y consistencia; consecuencias (abandono, suspensión, pinchazo con parada forzada, alerón con cambio, tiempo) y restos → amarillas/VSC/SC por era. Medido con `scripts/measureIncidents.js` (rápido 3 temporadas por pack, pasos 2), sim/real: averías por coche-carrera rápido 0,87–1,01 (1976 solo 48 carreras), pasos 0,99–1,05; accidentes+choques después de la apertura rápido 0,95–1,07, pasos 0,86–1,12; abandonos por incidente en la apertura por carrera rápido 0,96–1,09 (2000-05 1,03 tras el último ajuste), pasos 0,92–1,20. Carreras con algún abandono en la apertura: 0,92–1,29, salvo 2000-05 (1,51): en la realidad esos años tenían menos salidas con abandono pero más coches por choque. Criterio 7.2 con 200 ejecuciones: 35/38, Spearman 0,928 (antes 0,929). Equivalencia: media 0,9995, dispersión 0,984 |

Equivalencia con el modo rápido (SRS 4.2), 32 semillas: media 0,9998, dispersión 1,017. El test compara solo los coches que
paran en las mismas vueltas en los dos modos (un SC en un modo y no en el otro adelanta las paradas diez vueltas).
Medido el 23/11 sobre el código anterior al WIP: el modo por pasos ya era un 3–4 % más disperso en los residuos agrupados.
