# Packs de temporada (SRS §6.3, fases 1 y 5)

Un JSON por temporada (`<año>.json`). Es la única fuente de parrilla, calendario, reglamento, resultados reales,
ratings y eventos de esa temporada. Sin pack válido, la temporada no se puede jugar
(`engine/packs/seasonPacks.js` lo valida al cargarlo).

Hay pack para las 38 temporadas jugables (SRS 1.3): 1976, 1986, 1988, 1990–2014, 2016 y 2018–2026.

| Fichero | Qué es | Cómo cambia |
| --- | --- | --- |
| `<año>.json` | Packs generados | **No se editan a mano**: se regeneran |
| `season-pack.schema.json` | Esquema JSON del pack (v2) | A mano, subiendo `schemaVersion` si rompe compatibilidad |
| `curated/regulations.json` | Reglamento por año con procedencia de cada campo (`f1db`, `source` con url y cita literal, `pending`); `roundPointsFactor` (medios puntos, puntos dobles) y `standingsAdjustments` (puntos retirados) con fuente | A mano; al verificar un campo, pasar `pending` → `source` con URL y cita |
| `curated/era-rules.json` | Restricciones por era que el validador aplica a cualquier año (criterio 7.2) | A mano |
| `curated/era-defaults.json` | Reglamento por defecto de los años **sin** pack (mismas claves que `regulations`, más compuestos, sanciones, bandera roja y penalizaciones de unidades). Lo lee `engine/rules.js`; un test exige que cumpla `era-rules.json` en 1950-2026 | A mano; `status: pending` = de memoria |
| `curated/events.json` | Eventos históricos con nivel de ancla y fuente (RF-INB-02, RF-HIS-00) | A mano |
| `curated/circuit-timezones.json` | Zona IANA de cada circuito con horas de sesión en f1db (desde 2024): el generador pasa las horas UTC a `calendar[].sessions[]` en hora local (reloj-sesion, F1M24-GAMEPLAY §2.12.3) | A mano; el generador se para si falta un circuito |
| `curated/car-assets.json` | GLB de `f1-3d-assets` por equipo y año (RF-3D-02) | A mano, comprobando la release |

## Qué cambió en el esquema v2

- `regulations.engineFormulas`: conjunto de fórmulas de motor de f1db (en 1976–1999 conviven V8/V10/V12/F12 y en 2006
  Toro Rosso corrió con un V10 restringido); `engineFormula` queda como descripción del reglamento.
- `pointsScheme.bestResultsSplit` (1976: mejores 7 de las rondas 1–8 y 7 de las 9–16) y
  `pointsScheme.dropScoresConstructors` (si los descartes también valen para constructores).
- `calendar[].pointsFactor` (factor real de la ronda: 0,5 en Australia 1991, Malasia 2009 y Bélgica 2021; 2 en Abu
  Dabi 2014) y `calendar[].resultsAvailable` (la temporada en curso: f1db aún no tiene esas carreras).
- `entries[].projected`: en las rondas sin disputar, la parrilla es la de la última ronda con resultados.
- `sprintResults` y `standingsAdjustments` (1995 Benetton y Williams en Brasil, 2000 McLaren en Austria, 2007 McLaren,
  2018 Force India, 2020 Racing Point).
- `qualifyingFormats` admite `ELIMINATION` (2016, rondas 1–2).
- Eventos: `body` y `effect` opcionales.

## Regenerar

```bash
# 1. Base f1db fijada (CC BY 4.0). Comprobar el SHA-256 con checksums_sha256.txt de la misma release.
gh release download v2026.20.0 -R f1db/f1db -p f1db-sqlite.zip -p checksums_sha256.txt
unzip f1db-sqlite.zip                      # -> f1db.db

# 2. Generar (desde la raíz del repo OverCut): todas las temporadas de curated/regulations.json, o --years
python overcut/src/main/resources/scripts/generate_season_packs.py --f1db f1db.db --all

# 3. Validar
cd overcut/frontend && CI=true npx react-scripts test --watchAll=false --testPathPattern overcutManager/engine/packs
```

El generador es determinista (misma f1db y mismos curados → ficheros idénticos) y se detiene si un valor curado
contradice a f1db: puntos de cada resultado y de cada sprint (con el factor de la ronda), las dos clasificaciones
(con descartes, mejor coche y ajustes), fórmulas de motor y sprints; también si un evento apunta a una ronda o fecha
que no existe, si un evento sensible no es nota o si `car-assets.json` nombra un equipo que no corrió. Los años sin
eventos o sin GLB son válidos. Un inscrito que no llegó a correr ningún GP (March 1993, Larrousse 1995) no entra en el
pack; un piloto que f1db lista dos veces en un GP (Stommelen, Alemania 1976) se queda con el coche que corrió.

## Carga (RF-CAR-02)

Nada se carga al arrancar salvo el pack más reciente (la temporada en la que abre el asistente).
`seasonPackYears()` lista los años sin cargarlos y `ensureSeasonPack(context, año)` descarga, valida y añade un pack a
`context.packs`: el año elegido en el asistente, el de una partida guardada o importada y el siguiente, y el siguiente
antes de empezar la nueva temporada (`startNextSeason` es síncrono y, sin pack, usa el mundo del bootstrap).

## Ratings `v1-qualifying-gap` (RF-STF-03)

Derivados de la clasificación real, nunca puestos a mano:

- **Equipo**: `medianQualifyingGapPct` = mediana por carrera de la diferencia (%) entre el mejor coche del equipo
  y la pole; `paceIndex = clamp(100 − 12 × gap, 0, 100)`. Fiabilidad: abandonos mecánicos, por accidente y otros.
- **Piloto**: duelo de clasificación con el compañero y `medianGapToTeammatePct`;
  `teammateIndex = clamp(75 − 20 × gap, 40, 99)`. Es **relativo al compañero**: para comparar pilotos de equipos
  distintos hay que combinarlo con el `paceIndex` del equipo (fase 3).

## Añadir una temporada

1. Añadir su reglamento a `curated/regulations.json` (y comprobar que `curated/era-rules.json` cubre el año).
2. Añadir eventos en `curated/events.json` y GLB en `curated/car-assets.json` (opcionales).
3. Regenerar con `--years <año>` y registrar el año en `LOADERS` de `engine/packs/seasonPacks.js`.
4. Añadir al test los hechos fijos del año.
