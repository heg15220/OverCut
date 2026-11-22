# OverCut — instrucciones para Claude

## OverCut Manager: la especificación manda

Todo trabajo sobre el modo Manager (simulación, gestión, datos de temporadas, 3D, assets) se rige por la
especificación de requisitos completa, que se carga entera aquí:

@docs/manager/SRS.md

y por la decisión de pila 3D:

@docs/manager/ADR-001-pila-3d.md

Reglas:

- Antes de diseñar o cambiar algo del Manager, localizar los requisitos afectados (RF-xxx-nn, RNF-nn, criterios
  7.2) y citarlos en el plan, en los tests y en el mensaje de commit.
- Trabajar siempre y solo en este repo (OverCut). No editar `BackUp-OverCutServer` ni otras carpetas; el
  backup solo fue la fuente de la fase 0.
- Seguir el orden de fases del SRS §7.4. Fase 0 hecha el 2026-11-22: el módulo vive en
  `overcut/frontend/src/modules/overcutManager/` (portado del commit `0748b33` del backup), con rutas
  `/careerMode`, `/careerMode/deep`, `/careerMode/trayectoria` y `/careerMode/manager`. Se amplía, no se reescribe.
- Fase 1 (datos) hecha el 2026-11-22 para 2005, 2008 y 2012: packs en
  `overcut/frontend/src/modules/overcutManager/data/seasons/` (ver su README), generados con
  `overcut/src/main/resources/scripts/generate_season_packs.py` desde f1db v2026.20.0; validador y cargador en
  `engine/packs/`. Los packs no se editan a mano. RF-CAR-02 hecho el 2026-11-22: `engine/packs/packWorld.js` (`worldForSeason`) construye el mundo desde el pack cuando el año lo tiene (inscritos por GP, sustitutos reales, equipos parciales no elegibles, calendario, reglamento y puntos vía `eraOf`); los coeficientes de rating están en `data/balance/pack-world.json` (RNF-07). Los packs se cargan en `createContext(bootstrap, reference, packs)`. Fase 3 (en curso, 2026-11-22): `race.js` ya no decide reglas por año; todo sale de `engine/rules.js` (`rulesFor(era)`, `commandsFor`, `drsOpen`) con el pack o `data/seasons/curated/era-defaults.json`, y el balance por era en `data/balance/race-eras.json`. Dirección de carrera (RF-SIM-10) y energía por era (RF-SIM-05) en `race.js`. Simulación por pasos de 0,25 s en `engine/sim/` (RF-SIM-01/06/07/15; balance en `data/balance/race-sim.json`); `race.js` queda como modo rápido. Enmiendas propuestas a la tabla 6.2: sin DRS en 2026 (aero activa y modo adelantamiento), repostaje legal en 1982-83, KERS opcional en 2011-12, procedimiento de bandera roja y años de cada tipo de sanción (pendientes en era-defaults.json).
  Enmienda propuesta al SRS 6.2: en 2010–2013 los diez primeros salen con el neumático de Q3 (no Q2).
- Fase 2 (assets) hecha el 2026-11-22: pipeline offline en `tools/assets/` (ver su README: Blender 5.2 headless +
  gltf-transform/KTX2; `python tools/assets/build_assets.py`). Genera `data/manager-assets.json` (66 coches de 2005,
  2007, 2008, 2010, 2012, 2013, 2014; 8 circuitos) y `data/splines.json` (motor), versionados; los GLB van a
  `overcut/frontend/public/manager-assets/` (ignorado por git, servido por nginx). Runtime en `three/assets/`
  (manifiesto, cargador con Cache Storage, LOD, adaptador de ruedas); `venue.circuitFor` usa la spline calibrada.
  Una spline entra solo si cumple el criterio 7.2 o tiene `review.approved` en `tools/assets/assets.config.json`.
  Enmienda propuesta al criterio 7.2: en circuitos con escapatorias de asfalto el "centro de la malla" no es el centro
  de la pista; medir contra líneas pintadas o trazado real y exigir revisión manual.
- Tests del Manager: `CI=true npx react-scripts test --watchAll=false --testPathPattern overcutManager`.
  `npm install` necesita `--legacy-peer-deps` (conflicto previo de react-vis con React 18).
- Ningún valor de balance en código (RNF-07): va a los packs de temporada con esquema JSON.
- Coherencia histórica (SRS §6): nada fuera de su era (p. ej. DRS en 2008, repostaje en 2012); inscritos y
  calendario reales por GP; regla de sensibilidad RF-HIS-00 (accidentes mortales nunca simulados).
- Los datos de la tabla 6.2 y el recuento de equipos de la 3.1 están escritos de memoria: verificarlos contra
  f1db (`overcut/src/main/resources/scripts/*.json`) o el reglamento FIA antes de fijarlos en un pack.
- 3D: three.js en el navegador; Blender solo en el pipeline de assets sin conexión (ADR-001).
- De F1 Manager 24 solo se toman ideas y estructura de datos: ningún asset, texto ni código suyo.
- Si un cambio contradice el SRS, avisar y proponer la enmienda en vez de desviarse en silencio.
  Fuente original editable: https://claude.ai/artifact/2ZaMbCs2RJZtKSwU1Hugi4 (PDF en `docs/manager/`).

## Proyecto

- Backend: Java 17, Spring Boot 3.1 (Maven multi-módulo: `f1Hub`, `overcut`, `overcutPredictions`). `mvn spring-boot:run` en `overcut` (puerto 8080).
- Frontend: React 18 (CRA) en `overcut/frontend`: `npm start`, `npm test`, `npm run build`.
- Datos históricos de f1db en `overcut/src/main/resources/scripts/`.
