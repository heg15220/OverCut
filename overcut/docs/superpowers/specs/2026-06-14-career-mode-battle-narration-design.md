# Career Mode — Coherent Battle Narration

**Date:** 2026-06-14
**Status:** Approved design, pending implementation plan
**Area:** `frontend/src/modules/careerMode/components/` (`careerModeEngine.js`, `careerRaceEventCatalog.js`)

## Goal

During the racing (green-flag) phases of a career race, narrate overtakes and
wheel-to-wheel battles with rich, racing-language phrases that name both drivers,
the corner, and the **real ordinal position** the overtaker moves into. Both
Spanish and English. Every line must be coherent and follow a consistent
lap-to-lap timeline.

Examples requested by the user:
- "Piloto X se lanza al interior de la curva N y pasa al Piloto Y y se coloca Nº!"
- "Piloto X se lanza por fuera de la curva N y pasa al Piloto Y y se coloca Nº!"
- "Piloto X fuerza a Piloto Y fuera de la trazada y con la contratrazada escala a Nº!"
- "Piloto Y se defiende bien por el interior de la curva N y evita el adelantamiento!"
- "Piloto X y Piloto Y llegan en paralelo a la curva N!"
- "Piloto Y comete un error y pierde la posición!"

## Background / current state

- Rival overtakes today are decorative: `renderOvertakeEvent` (MOVE_STYLES ×
  MOVE_RESULTS × corners) fires in the green-flag neutral-event loop
  (`index % 8 === 1`) and never claims a real position.
- Corners are already a mixed token from `getCornersForRace(raceName)`: famous
  circuits use names ("Eau Rouge", "Copse"), others use numbers ("la curva 9" /
  "Turn 9"). We reuse this token as-is, so phrases are bilingual and consistent
  with the rest of the catalog without inventing new corner numbering.
- The engine does **not** simulate a per-lap running order for rivals. It knows
  each driver's `gridPosition` and final classified `position`, plus
  `interpolateRacePosition(start, final, progress)` (already used for the player
  timeline and the team-mate). The player position label is anchored to the
  classification via `attachPlayerPositionTimeline` (single source of truth, from
  the earlier coherence work).

## Decisions (from brainstorming)

1. **Ordinal source:** an estimated running order derived by interpolating every
   driver's grid→final trajectory. Coherent for both player and rivals.
2. **Integration:** the new coherent battle engine **replaces** the generic
   decorative rival overtakes in the green phase, and also narrates the player's
   battles with the real ordinal. Strategy, weather, incident and neutralisation
   narration are untouched.
3. **DRS gate:** reuse the existing era gate `isEraFeatureAllowed(year, "drs")`
   (era `pirelli-drs`, 2010+). No new threshold.

## Architecture

### 1. Estimated race order — single source of truth

New engine helper:

```
estimatedRaceOrderAtLap({ results, lap, lapCount }) -> [{ id, driver, team, rank, trend, isPlayer }]
```

- Includes only drivers still racing at `lap` (not DNF, or DNF with `dnfLap > lap`)
  — reuses the existing `liveRaceOrderAtLap` filter.
- `est = interpolateRacePosition(gridPosition, finalPosition, lap / lapCount)` per
  driver (player uses `playerGrid` / player final position).
- Sort ascending by `est`, deterministic tiebreak (`est`, then `finalPosition`,
  then `id`); assign `rank = 1..N` (the lap position).
- `trend = finalPosition − gridPosition` (negative ⇒ climbing).
- Deterministic: no fresh RNG draw needed for the order itself.

### 2. Battle selection and outcome (engine)

New engine step `buildBattleEvents` invoked for green-flag laps (replacing the
`index % 8 === 1` rival-overtake branch; it consumes that slot's cadence):

- Pick an **adjacent pair** in the estimated order: defender `Y` at `rank r`,
  attacker `X` at `rank r + 1`.
- Bias selection toward pairs where the trailing car is the faster-trending one
  (`X.trend < Y.trend`), so a pass is plausible.
- Decide the outcome with `rng`, weighted by how strongly `X` is climbing past `Y`:
  - **overtake success** → `X` moves to `rank r`; announced ordinal = `r`.
  - **defense success / side-by-side** → no position change (duel continues).
  - **defender error** → `Y` concedes; `X` moves to `rank r`.
- For non-player pairs the event is self-contained (no timeline coupling).
- When the **player** is one of the two cars, the player's announced ordinal is
  their rank; the event carries `playerPositionOverride = <player rank after the
  move>`, honored by `attachPlayerPositionTimeline` so the narrated ordinal and
  the on-screen P## label agree. Because rank tracks the interpolation baseline,
  this introduces no teleport (the convergence/no-teleport invariants still hold).

### 3. Battle phrase catalog (`careerRaceEventCatalog.js`)

- New `formatOrdinal(n, lang)` → ES `8º`, EN `8th` (handles 1st/2nd/3rd/11–13
  in EN; ES uses `Nº`).
- New `renderBattleEvent({ attacker, defender, corner-source, outcome, ordinal,
  state, year })` selecting from BATTLE phrase templates by `outcome`
  (`inside` / `outside` / `switchback` / `defense` / `sideBySide` / `error` /
  `drs` / `lockup`), each with several bilingual variants for variety. Templates
  that mention DRS carry `needs: "drs"` and respect era eligibility (reuses the
  `needs` mechanism, including multi-need arrays).
- Event `type`: `"player"` when the player is involved (important), otherwise a
  neutral/overtake flavour type so it threads through `compactRaceEvents` like
  the events it replaces.

### 4. Phrase set (initial; expandable)

Each outcome has 2–3 ES/EN variants. Representative lines:

- inside success: `{X} se lanza al interior de {corner} y supera a {Y}: ¡{ord}!`
- outside success: `{X} completa el adelantamiento por fuera de {corner} sobre {Y}: ¡{ord}!`
- switchback: `{X} obliga a {Y} a abrirse en {corner} y con la contratrazada escala a {ord}!`
- defense: `¡{Y} cierra el interior de {corner} y aguanta la posición ante {X}!`
- side by side: `¡{X} y {Y} cruzan {corner} rueda con rueda!`
- defender error: `¡{Y} comete un error en {corner} y cede la plaza a {X}!`
- DRS (needs drs): `{X} abre el DRS y despacha a {Y}: ¡{ord}!`
- failed lunge: `¡{X} se cuela tarde en {corner} pero se pasa de frenada y {Y} mantiene la plaza!`

English equivalents in proper racing language (dive down the inside, sweep around
the outside, switch back, wheel to wheel, runs wide, locks up, etc.).

## Coherence guarantees

- Ordinals are always in `1..fieldSize` and equal the attacker's real rank after
  the move (drawn from the shared estimated order).
- A successful pass always has the attacker starting **behind** the defender.
- Battles never name a driver who has already retired (reuses the single
  retirement timeline from the earlier work).
- Battles fire only under green racing state (no overtake narration during SC /
  VSC / red / yellow), extending the neutralisation-flag invariant.
- Player battle ordinal == player P## label for that event.

## Testing (TDD)

1. `formatOrdinal` ES/EN unit tests (including EN 1st/2nd/3rd/11th/13th edge cases).
2. Battle coherence over the 500-run batch: every announced ordinal ∈ `1..fieldSize`;
   on a success the attacker's rank was greater (further back) than the defender's;
   announced ordinal == attacker's post-move rank; no retired driver named in a
   battle.
3. No battle event under neutralisation (extends `careerModeCoherence.test.js`).
4. Player timeline still converges and never teleports with overrides applied.
5. DRS-bearing battle lines never appear before the DRS era (year < 2010), via
   targeted catalog unit tests at `year: 2002` (fallback sim data is 2025/26 only).

## Out of scope

- A full per-lap event-by-event race simulation for all rivals.
- Changing strategy/weather/incident narration.
- Persisting a per-lap order beyond what the estimate provides.
