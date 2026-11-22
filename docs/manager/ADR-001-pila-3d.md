# ADR-001 — Pila 3D de OverCut Manager: three.js en ejecución, Blender en el pipeline de assets

- Fecha: 2026-11-22
- Estado: aceptada
- Requisitos afectados: RF-3D-01 … RF-3D-06, RNF-02, RNF-03, RNF-04, criterios 7.2 (spline ≤ 2 m, coche visible por equipo, licencias en showroom)

## Decisión

Se usan **las dos**, con papeles que no se solapan:

| Herramienta | Dónde corre | Para qué | Nunca para |
| --- | --- | --- | --- |
| **three.js 0.170** | Navegador del jugador (React 18, `modules/overcutManager/three/`) | Todo lo que se ve en el juego: carga de GLB, coche y circuito procedurales de respaldo, liveries, cámaras TV/persecución/onboard/helicóptero, showroom, mapa 2D alternativo | Procesar o modificar assets en caliente |
| **Blender 5.2** (modo consola, `blender -b --python`) | Máquina de desarrollo o CI, una vez por asset | Pipeline de importación: normalizar, separar packs, generar LOD, sacar la spline del circuito, renderizar miniaturas | Ejecutarse en el juego o en el servidor de producción |
| **gltf-transform** (Node, complemento) | Mismo pipeline, tras Blender | Compresión Meshopt y texturas KTX2, que el exportador glTF de Blender no genera | — |

## Por qué

1. OverCut es una app web (React + Spring Boot). Blender no corre en el navegador, así que el render en el juego solo puede hacerse con three.js. El módulo Manager del backup ya usa three.js 0.170 (`Race3D.js`, `cameras.js`, `carModel.js`, `trackScene.js`).
2. Los GLB de `f1-3d-assets` no son utilizables tal cual (SRS §3): escalas y ejes distintos, ruedas sin nombre, packs con varios coches (2010, 2013, 2014), MCL39 de 116 MB, circuitos sin trazada. Arreglar eso en el navegador en cada partida costaría tiempo de carga y memoria (RNF-02, RNF-03). Hacerlo una vez, sin conexión y con Blender, es lo correcto.
3. Blender tiene importador y exportador glTF oficiales y API Python completa: permite automatizar los ~180 assets útiles y repetir el proceso cuando cambie el repo de assets.
4. La spline calibrada (RF-3D-03) necesita geometría: Blender puede sacar el eje central de la malla de asfalto y exportarlo a JSON. Ese JSON lo usan tanto el motor de simulación (sin three.js) como la vista 3D.

## Pipeline (fase 2 del SRS)

```text
f1-3d-assets (GitHub Releases)
   │  gh release download
   ▼
tools/assets/blender/  (blender -b --python, un script por tarea)
   ├─ normalize_car.py      escala real (~5,6 m), eje delantero -Z, origen en el eje trasero a nivel de suelo,
   │                        renombra ruedas a wheel_fl/fr/rl/rr, aplica transformaciones
   ├─ split_pack.py         separa los packs 2010/2013/2014 en un GLB por equipo
   ├─ make_lods.py          LOD0/LOD1/LOD2 con el modificador Decimate (objetivo ≤ 8 MB coche, ≤ 60 MB circuito)
   ├─ extract_spline.py     eje central del asfalto → splines/<circuitRef>-<versión>.json (puntos cada 2 m)
   ├─ thumbnails.py         render del showroom (EEVEE/Cycles con OptiX en la RTX 5070 Ti)
   └─ respeta allowRecolor=false (CC BY-ND): no toca materiales de esos GLB
   ▼
gltf-transform  meshopt + KTX2
   ▼
public/manager-assets/  + manager-assets.json (SRS §4.3)  → servido por nginx (sin depender de CORS de GitHub)
   ▼
three.js en el navegador: GLTFLoader + MeshoptDecoder + KTX2Loader (+ DRACOLoader si hace falta)
```

## Consecuencias

- El juego nunca depende de Blender en ejecución; si un asset no ha pasado el pipeline, se usa el procedural de su era (RF-3D-02).
- Los scripts de Blender se versionan en el repo y se ejecutan con la ruta `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (configurable por variable `BLENDER_BIN`).
- Las splines generadas exigen revisión manual y un test que compruebe la desviación ≤ 2 m frente a la malla (criterio 7.2).
- Licencias: el pipeline copia autor y licencia de cada `ATTRIBUTION.txt` al manifiesto; los assets `riskRipped` se excluyen de builds públicas.
