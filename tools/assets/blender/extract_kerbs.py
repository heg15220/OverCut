"""Pianos de un circuito GLB -> data/circuits/<splineId>/kerbs.json (RF-3D-03, RF-3D-04; F1M24-GAMEPLAY kerbs-wind).

Uso:
  blender -b --python extract_kerbs.py -- <circuito preparado.glb> <spline alineada.json> <anchos.json> <salida kerbs.json>
          [--debug <tiras.png>] [--px 0.2] [--tile 400]

Entradas, en las mismas coordenadas glTF (como extract_pitlane.py): el GLB preparado
(`.cache/out/circuits/<id>.glb`), la spline alineada (`.cache/splines/<id>.json`, puntos [x, y, z] cada 2 m desde la
meta en el sentido de carrera) y sus anchos (`.cache/splines/<id>.widths.json`, `left`/`right` en metros desde la
spline hasta la línea pintada del borde, uno por punto).

Cómo se encuentra (los materiales de los GLB no tienen nombres útiles, así que se mira el color, como hace
extract_pitlane.py con la pintura):

1. Por cada metro de spline y lado, una franja de muestras justo fuera del borde pintado (de -0,25 a +1,75 m).
2. Se renderiza la vista cenital por baldosas (Workbench, color de textura sin iluminación) y se lee el color de
   cada muestra.
3. Una muestra es «piano» si es pintura saturada roja, azul o amarilla (el verde se descarta: es hierba). Un metro
   de un lado es piano si al menos `MIN_HITS` de sus muestras lo son (los pianos son franjas rojas y blancas: lo
   blanco no se distingue del asfalto ni de las líneas).
4. Los metros se unen en tramos: huecos de hasta `MAX_GAP_M` (el blanco entre dos franjas rojas) no cortan, y un
   tramo de menos de `MIN_RUN_M` se descarta (una línea de boxes, un logotipo).

Salida: `{generator, splineId, frame, lengthM, kerbs: [{fromM, toM, side, edgeM}]}`. `fromM`/`toM` son metros a lo
largo de la spline desde la meta (el lector los pasa a fracción de vuelta con `lengthM`); `side` es "left" o
"right" del sentido de carrera, y `edgeM` la mediana de la distancia del borde pintado a la spline en el tramo.
No se escribe en trackTables.js: lo lee three/audio/kerbs.js.
"""

import json
import math
import os
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from common import import_glb, log, script_args, write_json  # noqa: E402

VERSION = 1
STEP = 2.0             # m entre puntos de la spline alineada
ROW = 1.0              # m entre filas de muestras
BAND = (-0.25, 0.25, 0.75, 1.25, 1.75)  # m fuera del borde pintado
MIN_HITS = 2           # muestras pintadas de una fila para contarla como piano
MAX_GAP_M = 3.0        # m de blanco entre franjas que no cortan un piano
MIN_RUN_M = 5.0        # m mínimos de un piano
MIN_SAT = 0.3
MIN_VALUE = 0.12


def parse():
    args = script_args()
    if len(args) < 4:
        raise SystemExit(__doc__)
    source, spline_path, widths_path, target = (os.path.abspath(a) for a in args[:4])
    options = {"debug": None, "px": 0.2, "tile": 400.0}
    i = 4
    while i < len(args):
        key = args[i].lstrip("-")
        if key not in options:
            raise SystemExit(f"argumento desconocido {args[i]}")
        options[key] = args[i + 1] if key == "debug" else float(args[i + 1])
        i += 2
    return source, spline_path, widths_path, target, options


def frame_rows(spline, widths):
    """Filas cada ROW m: punto (plano de Blender), normal izquierda y anchos izquierdo y derecho."""
    pts = np.array([[x, -z] for x, _, z in spline["points"]], dtype=np.float64)
    n = len(pts)
    ahead = np.roll(pts, -5, axis=0) - np.roll(pts, 5, axis=0)
    tangent = ahead / np.maximum(np.linalg.norm(ahead, axis=1, keepdims=True), 1e-9)
    normal = np.stack([-tangent[:, 1], tangent[:, 0]], axis=1)
    median = float(spline.get("medianWidthM") or 12.0) / 2
    def clean(values):
        arr = np.array([v if isinstance(v, (int, float)) and v > 0 else np.nan for v in values[:n]], dtype=np.float64)
        if len(arr) < n:
            arr = np.concatenate([arr, np.full(n - len(arr), np.nan)])
        return np.where(np.isnan(arr), median, arr)
    left, right = clean(widths["left"]), clean(widths["right"])
    per = int(round(STEP / ROW))
    rows = []
    for k in range(n):
        j = (k + 1) % n
        for s in range(per):
            f = s / per
            p = pts[k] * (1 - f) + pts[j] * f
            nv = normal[k] * (1 - f) + normal[j] * f
            nv = nv / max(np.linalg.norm(nv), 1e-9)
            rows.append((p, nv, left[k] * (1 - f) + left[j] * f, right[k] * (1 - f) + right[j] * f))
    return rows


def samples_of(rows):
    """xy de cada muestra: [fila, lado (0 izquierda, 1 derecha), banda]."""
    xy = np.zeros((len(rows), 2, len(BAND), 2))
    for r, (p, nv, wl, wr) in enumerate(rows):
        for b, o in enumerate(BAND):
            xy[r, 0, b] = p + nv * (wl + o)
            xy[r, 1, b] = p - nv * (wr + o)
    return xy


def render_tiles(flat, tile, px_m, workdir):
    """Color RGB (0-1) de cada punto xy, renderizando solo las baldosas de `tile` m que tienen puntos."""
    out = np.zeros((len(flat), 3), dtype=np.float32)
    lo = flat.min(axis=0)
    keys = np.floor((flat - lo) / tile).astype(int)
    size = int(math.ceil(tile / px_m))
    scene = bpy.context.scene
    cam = bpy.data.objects.new("kerb_cam", bpy.data.cameras.new("kerb_cam"))
    scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = tile
    cam.data.clip_end = 1e6
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "TEXTURE"
    scene.view_settings.view_transform = "Standard"
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    unique = sorted({(int(a), int(b)) for a, b in keys})
    for count, (tx, ty) in enumerate(unique):
        centre = lo + (np.array([tx, ty]) + 0.5) * tile
        cam.location = (centre[0], centre[1], 20000)
        path = os.path.join(workdir, f"kerb_tile_{tx}_{ty}.png").replace("\\", "/")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        image = bpy.data.images.load(path, check_existing=False)
        pix = np.array(image.pixels[:], dtype=np.float32).reshape(image.size[1], image.size[0], image.channels)[:, :, :3]
        bpy.data.images.remove(image)
        os.remove(path)
        mask = (keys[:, 0] == tx) & (keys[:, 1] == ty)
        pts = flat[mask]
        u = np.clip(((pts[:, 0] - (centre[0] - tile / 2)) / tile * size).astype(int), 0, size - 1)
        v = np.clip(((pts[:, 1] - (centre[1] - tile / 2)) / tile * size).astype(int), 0, size - 1)
        out[mask] = pix[v, u]
        log(f"baldosa {count + 1}/{len(unique)}")
    bpy.data.objects.remove(cam, do_unlink=True)
    return out


def painted(rgb):
    """Pintura saturada roja, azul o amarilla (no verde: hierba)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    vmax = np.max(rgb, axis=-1)
    vmin = np.min(rgb, axis=-1)
    span = np.maximum(vmax - vmin, 1e-6)
    sat = np.where(vmax > 1e-6, (vmax - vmin) / np.maximum(vmax, 1e-6), 0)
    hue = np.zeros_like(vmax)
    hue = np.where(vmax == r, ((g - b) / span) % 6, hue)
    hue = np.where(vmax == g, (b - r) / span + 2, hue)
    hue = np.where(vmax == b, (r - g) / span + 4, hue)
    hue = hue * 60.0
    red = (hue <= 18) | (hue >= 330)
    blue = (hue >= 195) & (hue <= 255)
    yellow = (hue >= 40) & (hue <= 62)
    return (sat >= MIN_SAT) & (vmax >= MIN_VALUE) & (red | blue | yellow)


def runs_of(mask, n_rows):
    """Tramos [a, b] de filas, con la vuelta cerrada (un piano puede cruzar la meta)."""
    gap = int(round(MAX_GAP_M / ROW))
    filled = mask.copy()
    idx = np.flatnonzero(mask)
    for a, b in zip(idx, np.roll(idx, -1)):
        d = (b - a) % n_rows
        if 1 < d <= gap + 1:
            for k in range(1, d):
                filled[(a + k) % n_rows] = True
    if filled.all():
        return [(0, n_rows - 1)]
    start = int(np.flatnonzero(~filled)[0])
    order = [(start + k) % n_rows for k in range(n_rows)]
    out, cur = [], None
    for r in order:
        if filled[r]:
            cur = [r, r] if cur is None else [cur[0], r]
        elif cur is not None:
            out.append(tuple(cur))
            cur = None
    if cur is not None:
        out.append(tuple(cur))
    return [(a, b) for a, b in out if ((b - a) % n_rows + 1) * ROW >= MIN_RUN_M]


def main():
    source, spline_path, widths_path, target, options = parse()
    with open(spline_path, encoding="utf-8") as handle:
        spline = json.load(handle)
    with open(widths_path, encoding="utf-8") as handle:
        widths = json.load(handle)
    import_glb(source)
    rows = frame_rows(spline, widths)
    xy = samples_of(rows)
    flat = xy.reshape(-1, 2)
    rgb = render_tiles(flat, options["tile"], options["px"], os.path.dirname(target)).reshape(len(rows), 2, len(BAND), 3)
    hits = painted(rgb).sum(axis=2) >= MIN_HITS
    kerbs = []
    for side, name in ((0, "left"), (1, "right")):
        for a, b in runs_of(hits[:, side], len(rows)):
            span = [(a + k) % len(rows) for k in range((b - a) % len(rows) + 1)]
            edge = float(np.median([rows[r][2 + side] for r in span]))
            kerbs.append({"fromM": round(a * ROW, 1), "toM": round((b + 1) * ROW, 1), "side": name, "edgeM": round(edge, 2)})
    kerbs.sort(key=lambda k: (k["fromM"], k["side"]))
    sid = os.path.splitext(os.path.basename(spline_path))[0]
    length = float(spline.get("lengthM") or len(spline["points"]) * STEP)
    total = sum(((k["toM"] - k["fromM"]) % length) or length for k in kerbs)
    data = {
        "$comment": "GENERADO por tools/assets/blender/extract_kerbs.py desde la malla GLB (pintura saturada junto al borde pintado). No editar a mano: volver a generar.",
        "generator": f"extract_kerbs.py v{VERSION}",
        "splineId": sid,
        "source": os.path.basename(source),
        "frame": "spline: metros desde la meta en el sentido de carrera; side left/right del sentido de carrera",
        "lengthM": round(length, 1),
        "kerbs": kerbs,
        "quality": {"rows": len(rows), "kerbRows": {"left": int(hits[:, 0].sum()), "right": int(hits[:, 1].sum())}, "kerbMetres": round(total, 1)},
    }
    os.makedirs(os.path.dirname(target), exist_ok=True)
    write_json(target, data)
    if options["debug"]:
        img = np.zeros((2 * 8, len(rows), 3), dtype=np.float32)
        for side in (0, 1):
            img[side * 8:side * 8 + 8, :, 0] = hits[:, side]
        image = bpy.data.images.new("kerb_debug", len(rows), 16)
        image.pixels = np.concatenate([img, np.ones((16, len(rows), 1), dtype=np.float32)], axis=2).ravel()
        image.filepath_raw = options["debug"]
        image.file_format = "PNG"
        image.save()
    log(sid, len(kerbs), "pianos,", round(total), "m")


if __name__ == "__main__":
    main()
