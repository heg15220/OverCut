# Pipeline de assets de OverCut Manager (fase 2)

Convierte los GLB de [heg15220/f1-3d-assets](https://github.com/heg15220/f1-3d-assets) en assets listos para el
juego, según [ADR-001](../../docs/manager/ADR-001-pila-3d.md) y el SRS (§4.3, RF-3D-01…06, RNF-02…04, criterios 7.2).
Blender solo se usa aquí, sin conexión; el juego carga el resultado con three.js.

## Requisitos

- GitHub CLI (`gh`) con sesión iniciada.
- Blender 5.2 (`BLENDER_BIN`, por defecto `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`).
- Node 22+ y `npm install` en esta carpeta (gltf-transform 4.5.1, meshoptimizer 1.3.0).
- `toktx` de KTX-Software 4.4.2 para KTX2 (`KTX_BIN`). Sin instalar nada: descargar
  `KTX-Software-4.4.2-Windows-x64.exe` de su release y extraerlo con 7-Zip en `.cache/ktx/`.
- Para detectar modelos reflejados y elegir la configuración del GP: `.cache/geo/f1-circuits.geojson` de
  [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT).

## Uso

```bash
python tools/assets/build_assets.py                 # coches, circuitos y manifiesto
python tools/assets/build_assets.py cars --jobs 3   # solo coches
python tools/assets/build_assets.py circuits --only monza-7
python tools/assets/build_assets.py manifest        # reescribe el manifiesto con lo que haya
```

Qué se procesa lo dice `assets.config.json`: temporadas de coches (los GLB por equipo salen de
`data/seasons/curated/car-assets.json`) y circuitos asignados por `layoutId` de f1db.

Salidas:

| Ruta | Qué | ¿En git? |
| --- | --- | --- |
| `overcut/frontend/public/manager-assets/` | GLB comprimidos (Meshopt + KTX2), miniaturas, splines completas, transcodificador Basis | No: se generan y los sirve nginx |
| `overcut/frontend/src/modules/overcutManager/data/manager-assets.json` | Manifiesto (SRS 4.3) con autor y licencia de cada asset | Sí |
| `overcut/frontend/src/modules/overcutManager/data/splines.json` | Splines compactas (cada 6 m) que usa el motor | Sí |
| `tools/assets/.cache/` | Descargas, intermedios, registros y vistas de revisión | No |

## Coches (`blender/normalize_car.py`)

Escala real, morro a −Z, origen en el eje trasero a ras de suelo y nodos `wheel_fl/fr/rl/rr` con origen en el
buje. Las ruedas se encuentran por geometría, porque los GLB no las nombran: piezas cilíndricas en las esquinas,
agrupando flancos y banda si vienen partidos. Si los neumáticos están soldados a la suspensión, el coche sale
con ruedas fijas (`metrics.wheels = "static"`). LOD con Decimate (1 / 0,4 / 0,12) y texturas de 1024 / 512 / 256.
Autor y licencia salen de `asset.extras` de cada GLB (Sketchfab los guarda ahí).

## Circuitos (`blender/extract_spline.py` → `align_spline.mjs` → `blender/prepare_circuit.py`)

1. **Asfalto.** Las mallas se rasterizan (caras horizontales) y se esqueletizan; el asfalto es la malla larga
   con ancho de pista. Las explanadas pegadas a la pista (paddock) se descartan por piezas conexas.
2. **La vuelta del GP.**
   - Con trazado real (`geoId`): se ajusta el trazado georreferenciado sobre el esqueleto (ICP rígido, con
     reflexión) y se ciñe al asfalto. Así se distingue el GP de las configuraciones interior, exterior o de
     resistencia que comparten malla.
   - Sin trazado real (trazados antiguos): de entre los ciclos del grafo del esqueleto se elige el de longitud
     más cercana a la real.
3. **Centro.** Se recentra con rayos verticales contra los bordes. Usa las líneas pintadas si cubren al menos
   el 60 % de la vuelta y, si no, el borde del asfalto. La **desviación** es la mediana de 5 muestras de
   |d_izq − d_der| / 2, medida solo donde el ancho está entre 0,8 y 1,2 veces su mediana local.
   `measuredShare` dice en qué parte de la vuelta se pudo medir.
4. **Sentido y meta.** El sentido sale de f1db (`circuit.direction`). La meta se toma de la calle de boxes si
   se detecta (confianza media) o del boceto de `layouts.js` (muy baja). En ambos casos la confirma la
   revisión manual.
5. **Reflexión.** Si el ajuste con el trazado real sale mejor reflejado, se refleja el GLB y la spline
   (`--mirror`).

### Revisión manual

Por cada circuito se genera `.cache/preview/<splineId>.png`: spline en rojo, meta en blanco y sentido en
amarillo. Lo revisado se anota en `assets.config.json`, en el campo `review` del circuito:

```json
"review": { "approved": true, "mirror": true, "startShiftM": -180, "startReviewed": true, "note": "…" }
```

Una spline entra en el motor solo si cumple el criterio 7.2 (desviación máxima ≤ 2 m medida en ≥ 60 % de la
vuelta) o si tiene `approved: true`. El manifiesto guarda `meetsCriterion` y `reviewApproved` por separado.

## Estado (2026-11-22)

- Coches: 66, de las temporadas 2005, 2007, 2008, 2010, 2012, 2013 y 2014. El LOD0 más pesado ocupa 6,7 MB tras
  comprimir. BMW Sauber y McLaren de 2008 llevan ruedas fijas.
- Circuitos en el motor y en 3D (8):
  - cumplen el criterio 7.2: Silverstone 1999 (máx. 0,88 m) y Montreal (0,66 m);
  - aprobados por revisión (desviación no medible en buena parte de la vuelta): Monza, Spa, Shanghái, Hungaroring,
    Interlagos y Bahrain.
  - Ninguno está reflejado: lo confirma un ICP recortado contra el trazado real.

## Pendiente

- Suzuka: el trazado en ocho cruza el puente y no es un ciclo simple del esqueleto 2D. Hay que separar por altura.
- Mónaco: el túnel y el puente se superponen en la vista cenital y la línea ondula. No está aprobado.
- Nürburgring GP: el trazado real ajusta a 28 m de media y ningún ciclo se acerca a la longitud real.
- Calle de boxes: el motor la sigue colocando por su cuenta, desplazada 22 m hacia dentro, y en un GLB cae sobre
  edificios. Hay que sacarla de la malla, que ya se detecta en Hungaroring y Shanghái.
- Cámaras TV: las posiciones de borde de pista salen del trazado procedural y no siguen el relieve del GLB.
- Numeración de curvas: la curvatura de una spline calibrada da más curvas que la numeración oficial (Shanghái
  llega a 23). Una curva que cruza la meta se numera dos veces.
- `riskRipped` está sin verificar (`null`) en todos los assets: las builds públicas los excluyen.
- Mercedes 2010: al modelo del pack le falta la carrocería (`status: review`).
