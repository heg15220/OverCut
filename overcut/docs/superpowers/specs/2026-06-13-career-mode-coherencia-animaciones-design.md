# Career Mode: coherencia de sucesos + animaciones

Fecha: 2026-06-13

## Problema

En la simulación de carrera del Career Mode (`frontend/src/modules/careerMode`):

1. **Incoherencia temporal**. Los eventos neutrales y de jugador se generan con
   vueltas aleatorias y luego se ordenan. El catálogo contiene frases que
   mencionan safety car, resalida, bandera roja y lluvia, que pueden caer en
   vueltas anteriores al suceso real (o sin que el suceso ocurra nunca).
2. **Spoiler en el panel**. `cm-race-meta` muestra `Safety car: Vx` y
   `Bandera roja: Vx`: información que el usuario no debe conocer por adelantado.
3. **Faltan animaciones/iconos** para safety car, transición seco→lluvia y
   bandera roja.

## Decisiones tomadas

- Coherencia mediante **máquina de estados por vuelta** (no filtrado ligero).
- Spoiler: **quitar del panel y revelar solo cuando ocurre** durante la
  reproducción.
- Animaciones: **overlay prominente** sobre el `cm-track-scene` con iconos SVG
  custom.

## Diseño

### 1. Motor de estados por vuelta (`careerModeEngine.js`)

- Ampliar `conditionPlan`:
  - Ventana de Safety Car: `scStart` / `scEnd` (duración 3–5 vueltas).
  - Posible llegada de lluvia en carrera seca (prob. ligada a `chaos`):
    transición seco→intermedios/lluvia a mitad de carrera.
  - Fases de clima ordenadas `[{ fromLap, condition }]` derivadas del clima
    inicial + `weatherSwitches`.
  - Marcadores derivados: `rainArrivalLap`, `dryReturnLap`.
- `raceStateAtLap(lap)` → `{ condition, scActive, scHappenedBefore,
  redFlagActive, redFlagHappenedBefore, rainArrived, dryReturned }`.
- Reescribir `simulateCareerRace` para que cada evento se cree conociendo el
  estado de su vuelta:
  - Eventos de SC / resalida → solo en/después de `scStart`.
  - Eventos de bandera roja / resalida parada → solo en/después del red flag.
  - Eventos de lluvia → solo tras `rainArrivalLap`; "trazada seca vuelve" solo
    tras `dryReturnLap`.
- Adjuntar el timeline al resultado (`conditions.timeline`) para que la UI
  calcule el estado actual sin renderizar vueltas futuras como texto.

### 2. Catálogo con elegibilidad (`careerRaceEventCatalog.js`)

- Etiqueta `needs: "safetyCar" | "redFlag" | "wet" | "dryReturn" | "restart"`
  en las plantillas afectadas.
- `pick` filtra el pool por el `state` de la vuelta; plantillas sin etiqueta
  siempre válidas.
- Sacar las plantillas que **despliegan** SC / bandera roja del pool genérico de
  incidentes; solo las usan los eventos planificados. VSC y amarillas locales se
  quedan como caución transitoria genérica.
- `renderRestartEvent` recibe `kind: "safetyCar" | "redFlag"`.

### 3. Animaciones e iconos (`CareerMode.js` + `CareerMode.css`)

- Quitar `Safety car` y `Bandera roja` del `cm-race-meta`.
- `Clima` y nuevo `Estado de pista` calculados del estado en la vuelta actual
  (última vuelta visible).
- Overlay sobre `cm-track-scene` activado por el estado de la vuelta actual:
  - Safety Car: flash amarillo + icono SVG coche de seguridad + "SAFETY CAR".
  - Bandera roja: barrido rojo + icono SVG bandera + "BANDERA ROJA".
  - Lluvia: gotas cayendo + viraje del fondo a tono lluvia mientras siga mojado.
- Iconos SVG inline custom: `SafetyCarIcon`, `RedFlagIcon`, `RainIcon`.

### 4. Verificación (`careerModeCoherence.test.js`, nuevo)

Test Jest sobre muchos seeds que afirma:
- ningún evento de SC con `lap < scStart`,
- ningún evento de bandera roja antes del red flag,
- ningún evento de lluvia antes de `rainArrivalLap`,
- resalidas solo tras una neutralización,
- el estado en la vuelta actual no expone vueltas futuras.

## Ampliación (mismo día): objetivos de contrato realistas

Los objetivos de cada oferta deben reflejar el rendimiento real del equipo en
esa temporada/década, no una escala fija.

- `buildContractObjectives({ team, field, scoring, raceCount, playerStatus })`
  (exportada).
- `expectedConstructorRank(team, field)`: puesto esperado del equipo en la tabla
  de constructores, escalado a una parrilla de 11 según su rating ajustado a la
  década frente al campo real.
- `realisticSeasonPoints(rank, scoring, raceCount)`: puntos realistas del piloto
  usando el **sistema de puntos de la época** (`scoring.points`) proyectado sobre
  la longitud real del calendario, con un suelo oportunista para coleros.
- `constructorPosition = clamp(rank, 1, 10)`: a un colero no se le pide el top.
- Verificación (`careerContracts.test.js`): los puntos escalan con la época,
  nunca superan una temporada perfecta del coche líder, mejores coches → objetivos
  más exigentes, y el orden por rating se respeta.

## Ampliación (mismo día): nivelador de condiciones húmedas

En mixto/lluvia los equipos con peor rendimiento deben poder destacar más, con
lógica y sin exagerar: la lluvia neutraliza parte de la ventaja del coche.

- `wetLevelFromPlan(plan, lapCount)`: fracción de vueltas mojadas (0–1) derivada
  del timeline de clima.
- `levelledCarRating(teamRating, meanTeamRating, wetLevel)`: acerca el rating del
  equipo a la media del campo según `wetLevel × CAR_WET_COMPRESSION` (0.45 a tope),
  preservando el orden. El rating del piloto mantiene su peso completo.
- Cableado en `simulateCareerRace`: `raceScore` usa la base de coche comprimida;
  `randomSwing`, `weatherSkill` y el riesgo de accidente escalan de forma continua
  con `wetLevel`.
- Verificación (`careerWetLeveler.test.js`): unitarios de ambas funciones puras +
  test estadístico de que el tercio inferior por rating termina, de media, mejor
  en mojado que en seco.
