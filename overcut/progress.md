Original prompt: Siguiente paso, el texto de la narrativa de la carrera en la simulación en la vista de móvil se ve demasiado grande la letra. Por otro lado, para OverCutRacing no implementaste las vistas personalizadas para los dispositivos de tipo tablet.

Notes:
- OverCutRacing responsive CSS currently has generic max-width 1050px and mobile max-width 720px rules.
- Need smaller race narrative text on mobile and a tablet-specific layout for 721px-1050px.
- Added tablet-specific 721px-1050px CSS with a two-column draft/season layout and adjusted tablet typography.
- Reduced mobile simulation/result narrative text sizing and compacted simulation spacing.

New prompt: Implementar un nuevo modo trayectoria con nombre de piloto, color de casco, tirada aleatoria de decada/anio, contratos de equipos medios/bajos, simulacion de temporada F1 con narracion vuelta a vuelta, ofertas por reputacion, despido por incumplimiento y retirada con resumen.

Progress:
- Added `frontend/src/modules/careerMode/components/careerModeEngine.js`.
- The new engine reuses `/overcutRacing/bootstrap`, fallback data, decade buckets and team decade ratings.
- Engine covers contract generation, season grid, weather/degradation/safety car/red flag/accident race simulation, lap events, standings, season evaluation and retirement summary.
- Added `CareerMode.js` and `CareerMode.css` with setup, helmet color picker, dice rolls, contract selection, season dashboard, live race feed, review and retirement screens.
- Wired route `/minigames/careerMode`, fullscreen app shell behavior and a new MinigamesHome card.
- Added `careerRaceEventCatalog.js`: bilingual procedural race-event catalog with circuit-specific corners, overtakes, incidents, leader events, strategy calls, weather changes, red flags and restarts. Minimum generated combinations reported by `eventCatalogStats()` is well above 500.
- Integrated the catalog into `simulateCareerRace`, so live race narration now uses contextual Spanish/English text for player events and general race events.
- Added an additional dynamic event block with 10 phases, 10 actions, 10 outcomes and 6 contexts: 6,000 extra bilingual combinations beyond the earlier catalog.
- Connected `renderExtraDynamicEvent()` into neutral race narration and late-race player-highlight narration.
- Slowed live race reveal speed: normal is now 1500ms per event, x2 is 750ms per event. The skip button still jumps straight to the race result.
- Added another new pressure-management event block with 8 triggers, 8 reactions and 8 consequences: 512 extra bilingual combinations. Integrated through `renderPressureManagementEvent()`.
- Added a player-specific event catalog with 10 setups, 10 actions, 10 results and 7 contexts: 7,000 combinations focused only on our driver (overtakes, defenses, position losses, incidents, collisions, driver errors, strategy and recovery).
- Race events now carry `positionDelta`/`playerPosition`; `simulateCareerRace` attaches a player-position timeline from grid position to final result.
- Live race UI now shows the current narrated player position in the car badge and prefixes important player events with `P<n>`.
- Improved player-specific overtake/defense phrases to be more natural F1 race language.
- Player battle rivals now come from the simulated race context: start events use nearby grid rivals; mid/late player events estimate the player's live position and choose the real simulated driver ahead/behind from the race order.
- Rebalanced driver-card progression for a full 18-41 career: growth now peaks in the 28-33 prime window, PAC learns very little after 33 and declines yearly in late career, while RAC/EXP keep meaningful post-prime growth. Added unit/integration tests for prime growth and age-related PAC decline.
- Added OverCutRacing final-race title shock logic: when 3-4 drivers are mathematically alive and P3/P4 need P1/P2 to collapse, the last race can now produce a controlled rare DNF/incident/strategy failure for one or both leaders. The result exposes `titleShock` and the race-result UI shows a "Golpe al mundial" callout.
- Added silly-season/precontract flow for Career Mode, including in-season offers based on status/performance and an end-of-season choice to honor the precontract or inspect the wider market.
- Reworked the live race track view so the player marker uses the OverCutRacing single-seater silhouette, painted in the signed team's colors, on a lateral ground-level track where P22 maps left and P1 maps right.
- Added era-aware race knowledge for 1950 onward and connected it to race narration so DRS, VSC, safety car, refuelling-era strategy, rain threats and drying-track messages only appear in coherent seasons.
- Added explicit DNF narration and automatic position gains when rivals retire; player and team-mate mechanical retirements can now happen at low probability weighted by team status/reliability and era.
- Added explicit pit-entry tyre-change notices before pit-lane/box-exit strategy events.
- Expanded race-event variety for green-flag rhythm, rain arrival warnings, drying-track windows, safety car/VSC states and era-specific normal-race scenarios.
- Contract objectives now consume real constructor points when the season lineup data provides them: the driver's required minimum and base points objective become half of the team's real constructor total, with estimated objectives retained only as fallback.
- Added `career_constructor_standings.json`, generated from f1db final `constructorStandings`, plus `generate_career_constructor_standings.py`; the backend exposes it as `constructorStandingsByYear` and merges points/position into career lineups.
