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
python tools/assets/build_assets.py heroes --jobs 5 # solo el nivel hero del showroom (sin Blender)
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

**Nivel hero (solo showroom, RF-3D-06).** `<id>.hero.glb`: la geometría del LOD0 con el color base hasta 2048 px
(ETC1S) y los mapas normales/rugosidad/oclusión a 1024 (UASTC). Lo carga solo el showroom cuando el lienzo tiene
al menos ~700 px de dispositivo (pantalla Coche, móvil a 2x); la carrera sigue con LOD0-2 a 1024/512/256, así que
no cambia la descarga del GP ni la memoria de vídeo de los 22 coches. Escalera 2048/1024 → 1536/1024: el primero
que cabe en 7,6 MiB (contrato de 8 MiB por fichero, RNF-03). No hay hero si el original no tiene texturas mayores
que las del LOD0 (packs de 2010 y 2013, a 1024) o si el LOD0 ya pasa de 6,8 MiB (la geometría llena el
presupuesto: McLaren 1988, Arrows 1999…); entonces el showroom usa el LOD0. El manifiesto lo publica como
`hero: { file, bytes, sha256, triangles, textureSize: [base, mapas] }`.

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

- Coches: 157 de 455 equipos en las 38 temporadas (completas 2010, 2012, 2013, 2014; sin modelos en 1995 y 1996; ver carCoverage.test.js). Casi todos tienen ruedas giratorias: para mallas
  troceadas en miles de piezas (BMW Sauber y McLaren de 2008), `normalize_car.py` ajusta el cilindro de cada neumático
  y recorta sus caras.
- Circuitos (11): Monza, Spa, Silverstone 1999, Shanghái, Hungaroring, Interlagos, Montreal, Bahrain, Mónaco, Suzuka y
  Nürburgring GP.
  - Cumplen el criterio 7.2 por medición: Silverstone, Shanghái, Interlagos, Montreal, Bahrain, Mónaco, Suzuka y
    Nürburgring.
  - Monza, Spa y Hungaroring entran con revisión aprobada.
  - El ocho de Suzuka y los túneles y puentes (Mónaco, Nürburgring) se separan por capas de altura.
  - Los tejados y gradas quedan fuera de la máscara de asfalto.
  - Las alturas siguen la superficie de la carretera por continuidad.
  - Ninguno está reflejado (ICP recortado contra el trazado real).
- Calle de boxes: `blender/extract_pitlane.py` la saca de la malla (garajes y carril paralelo) y el motor la usa en 9
  circuitos. Silverstone 1999 no tiene garajes en el modelo; Spa y Shanghái vuelven a la calle procedural.

## Procedencia y licencias (`provenance.json`)

Se revisaron las páginas de Sketchfab de cada asset (API pública) y los nombres internos de los GLB.

- Todo lo que usamos lo subió una sola cuenta (Tyler_Dave, que firma "Dave Love"/"Dave Bored").
  - En su perfil dice que reutiliza modelos ajenos y etiqueta los circuitos como `Ripped`.
  - Los materiales delatan mods de rFactor/Assetto Corsa, nombres de Codemasters y exportaciones de Roblox.
- Resultado: `riskRipped: true` en 66 assets (55 coches y los 11 circuitos) y `null` en los 11 coches del pack de 2014. Las builds públicas
  (`REACT_APP_PUBLIC_BUILD=true`) no muestran ningún modelo real, solo los procedurales.
- **Para publicar con modelos reales hace falta sustituirlos por modelos de autoría propia o con licencia verificable.**

## Pendiente

- Calle de boxes en Silverstone, Spa y Shanghái (sin garajes detectables o con la calle fuera de la meta).
- Sustituir los assets extraídos de juegos antes de cualquier publicación (SRS 7.3).
- Mercedes 2010: al modelo del pack le falta la carrocería (`status: review`).
