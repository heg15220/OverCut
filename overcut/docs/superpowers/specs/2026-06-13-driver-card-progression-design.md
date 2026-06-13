# Sistema de cartas y progresión de piloto (Modo Trayectoria)

Fecha: 2026-06-13
Estado: aprobado por el usuario

## Objetivo

Dar al piloto del Modo Trayectoria una **carta estilo F1 25** (4 atributos + global)
que evoluciona con la **experiencia ganada en cada carrera**, más rápido cuanto más
joven es el piloto y siempre condicionada a obtener los **resultados esperados o
superiores**. La trayectoria empieza a los **18 años** y termina, como máximo, en la
temporada en la que cumple **41**.

Investigación de la fuente externa (F1 25, EA): cada piloto tiene 4 atributos —
**Pace (PAC)**, **Racecraft (RAC)**, **Awareness (AWA)**, **Experience (EXP)** — y un
**Overall (RTG)** en el que el Ritmo (Pace) es el de mayor peso. Las cartas se
actualizan dinámicamente según el rendimiento. Diferencia clave: en F1 25 los
atributos solo afectan a la IA porque el humano conduce; aquí **todo se simula**, así
que la carta del jugador gobierna sus resultados simulados.

## Decisiones de producto

- Modelo de atributos **fiel a F1 25**: 4 atributos + global. Las dimensiones de
  gestión (neumáticos, lluvia/mixto, gestión de carrera) son **fuentes de XP**, no
  atributos separados.
- Curva de edad: **crecimiento que se ralentiza con la edad, sin declive**. Los
  atributos nunca bajan.
- UI: **carta visual** con barras por atributo y **animación de subida** tras cada
  carrera.

## 1. Modelo de datos (perfil)

La carta es la fuente de verdad. El perfil añade:

```js
profile = {
  // ...existente: name, helmetColor, reputation, seasons, status, stats
  age: 18,
  card: { pace, racecraft, awareness, experience },     // enteros 1–99
  cardXp: { pace, racecraft, awareness, experience },   // acumuladores fraccionarios >= 0
  overall,        // derivado (ver §2)
  rating: overall // se mantiene = overall por compatibilidad del motor
}
```

Carta inicial (rookie 18 años): `PAC 58, RAC 56, AWA 60, EXP 18` → global ~55.
Se eliminan `consistency`/`aggression` como entradas primarias; el motor las deriva
de la carta (§4).

## 2. Global (RTG)

```
overall = round(0.45·PAC + 0.25·RAC + 0.20·AWA + 0.10·EXP)
```

Ritmo el de mayor peso (fiel a EA). Acotado a [1, 99].

## 3. Sistema de XP por carrera

Tras cada carrera se analiza `raceResult` y se reparte XP por canal:

| Canal | Fuente de XP |
|---|---|
| Experiencia | Plano por participar/terminar (siempre, incluso DNF da algo). Independiente del resultado. |
| Pilotaje (RAC) | Posiciones ganadas (llegada vs salida), adelantamientos, gestión de neumáticos en alta degradación. |
| Ritmo (PAC) | Clasificación vs nivel del coche y vs compañero, ritmo de carrera, vuelta rápida, batir al compañero. |
| Conciencia (AWA) | Carrera limpia (sin incidente/DNF propio). Incidente/sanción la reduce. |
| Bonus condiciones | Lluvia/mixto gestionado por encima de lo esperado → extra PAC+AWA. |

### Gating por resultado

Se calcula una **posición esperada** del piloto a partir de la competitividad del
coche y la parrilla. El `factor de resultado ∈ [0.4, 1.8]` multiplica el **XP de
rendimiento** (no el de experiencia):

- finish ≈ esperado → factor ≈ 1.0
- finish muy por encima → hasta ~1.8
- finish por debajo → baja hasta un suelo de 0.4 (siempre se aprende algo)

### Multiplicador por edad

Convierte XP en puntos de atributo. Alto de joven, decae hacia un suelo, nunca
produce bajadas:

```
g(age) = clamp(1.0 - (age - 18) * 0.045, 0.25, 1.0)
```

(18 → 1.0, 27 → ~0.6, 33 → ~0.33, ≥34 → 0.25)

### Rendimientos decrecientes

Cada atributo tiene un acumulador de XP. Sube un punto cuando el acumulado supera el
umbral, y el umbral crece con el valor del atributo:

```
xpForNextPoint(value) = XP_BASE * (1 + (value / 99) ^ 2.2)
```

Efecto: joven + atributo bajo = sube rápido; veterano + atributo alto = casi plano.
Tope 99.

`applyRaceXp` añade `rawXp · g(age)` al acumulador de cada canal, consume umbrales
para incrementar enteros, recalcula `overall`, y devuelve los **deltas** por atributo
para la animación.

## 4. Integración con el motor de simulación

`simulateCareerRace` simula al piloto con su carta **viva** (la mejora se nota ya en
la siguiente carrera de la temporada):

- Clasificación → ponderada por **PAC**.
- Ritmo de carrera → **PAC** + **RAC** + reputación.
- Salida → **EXP/AWA** (sustituye a `consistency`).
- Riesgo de incidente/DNF → **AWA** (más conciencia = menos incidentes; sustituye a
  `consistency`/`aggression`).
- `rating = overall` se sigue usando para construir parrilla, rivales y display.

Helper `engineInputsFromProfile(profile)` deriva `{ rating, pace, racecraft,
awareness, consistency, aggression }` para mantener la matemática existente y a la vez
alimentar PAC/RAC donde mejora la fidelidad. Tolera perfiles antiguos sin carta
(deriva una carta por defecto desde `rating`).

## 5. Flujo y ciclo de vida

- XP se aplica **tras cada carrera**: al ver el resultado, un overlay muestra `+XP`
  por canal y las subidas de atributos animadas, luego "Continuar temporada".
- Edad +1 por temporada. Tras la temporada a los **41**, se fuerza el retiro.
- `evaluateSeason` mantiene reputación/estatus/stats y edad+1, pero **ya no
  recalcula `rating`** (viene de la carta).

## 6. Componentes / archivos

- `driverCard.js` (lógica pura, núcleo TDD): `createDriverCard`, `computeOverall`,
  `analyzeRaceXp(raceResult, season, profile)`, `ageGrowthMultiplier(age)`,
  `xpForNextPoint(value)`, `applyRaceXp(card, cardXp, xpGains, age)`.
- `careerModeEngine.js`: integración (§4), init de perfil con carta+edad, retiro a 41,
  `engineInputsFromProfile`.
- `CareerMode.js`: `DriverCardView` (carta visual con barras) + animación post-carrera;
  cableado del flujo y del init del perfil.
- `CareerMode.css`: estilos de carta y animación.

## 7. Estrategia de tests

TDD sobre `driverCard.js` (deterministas):
- `computeOverall` con la ponderación correcta.
- `ageGrowthMultiplier` decreciente con suelo.
- `xpForNextPoint` creciente con el valor.
- `analyzeRaceXp`: más XP de Pilotaje al ganar posiciones; XP de Conciencia cae con
  DNF; bonus en lluvia; gating por resultado esperado.
- `applyRaceXp`: un joven gana más puntos que un veterano con idéntico rendimiento;
  rendimientos decrecientes; nunca baja; tope 99; deltas correctos.

Integración del motor: simular carrera + aplicar XP sube atributos; `rating` sigue
igual a `overall`.

## 8. Fuera de alcance (YAGNI)

- Persistencia/guardado (el perfil vive en estado de React).
- Sub-skills granulares visibles (gestión, salidas) — son fuentes de XP, no atributos.
- Declive de atributos por edad.
