# Packs de temporada (SRS §6.3, fase 1)

Un JSON por temporada (`<año>.json`). Es la única fuente de parrilla, calendario, reglamento, resultados reales,
ratings y eventos de esa temporada. Sin pack válido, la temporada no se puede jugar
(`engine/packs/seasonPacks.js` lo valida al cargarlo).

| Fichero | Qué es | Cómo cambia |
| --- | --- | --- |
| `2005.json`, `2008.json`, `2012.json` | Packs generados | **No se editan a mano**: se regeneran |
| `season-pack.schema.json` | Esquema JSON del pack (v1) | A mano, subiendo `schemaVersion` si rompe compatibilidad |
| `curated/regulations.json` | Reglamento por año con procedencia de cada campo (`f1db`, `source` con cita, `pending`) | A mano; al verificar un campo, pasar `pending` → `source` con URL y cita |
| `curated/era-rules.json` | Restricciones por era que el validador aplica a cualquier año (criterio 7.2) | A mano |
| `curated/events.json` | Eventos históricos con nivel de ancla y fuente (RF-INB-02, RF-HIS-00) | A mano |
| `curated/car-assets.json` | GLB de `f1-3d-assets` por equipo y año (RF-3D-02) | A mano, comprobando la release |

## Regenerar

```bash
# 1. Base f1db fijada (CC BY 4.0). Comprobar el SHA-256 con checksums_sha256.txt de la misma release.
gh release download v2026.20.0 -R f1db/f1db -p f1db-sqlite.zip -p checksums_sha256.txt
unzip f1db-sqlite.zip                      # -> f1db.db

# 2. Generar (desde la raíz del repo OverCut)
python overcut/src/main/resources/scripts/generate_season_packs.py --f1db f1db.db --years 2005 2008 2012

# 3. Validar
cd overcut/frontend && CI=true npx react-scripts test --watchAll=false --testPathPattern overcutManager/engine/packs
```

El generador es determinista (misma f1db y mismos curados → ficheros idénticos) y se detiene si un valor curado
contradice a f1db: esquema de puntos frente a los puntos reales, fórmula de motor, sprints, proveedores de
neumáticos y formatos de clasificación.

## Ratings `v1-qualifying-gap` (RF-STF-03)

Derivados de la clasificación real, nunca puestos a mano:

- **Equipo**: `medianQualifyingGapPct` = mediana por carrera de la diferencia (%) entre el mejor coche del equipo
  y la pole; `paceIndex = clamp(100 − 12 × gap, 0, 100)`. Fiabilidad: abandonos mecánicos, por accidente y otros.
- **Piloto**: duelo de clasificación con el compañero y `medianGapToTeammatePct`;
  `teammateIndex = clamp(75 − 20 × gap, 40, 99)`. Es **relativo al compañero**: para comparar pilotos de equipos
  distintos hay que combinarlo con el `paceIndex` del equipo (fase 3).

## Añadir una temporada

1. Añadir su reglamento a `curated/regulations.json` (y comprobar que `curated/era-rules.json` cubre el año).
2. Añadir eventos en `curated/events.json` y GLB en `curated/car-assets.json`.
3. Regenerar con `--years <año>` y registrar el año en `LOADERS` de `engine/packs/seasonPacks.js`.
4. Añadir al test los hechos fijos del año.
