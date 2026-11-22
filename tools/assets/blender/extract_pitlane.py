"""Calle de boxes real de un circuito GLB -> <id>.pitlane.json (RF-3D-03; complementa a extract_spline.py).

Uso:
  blender -b --python extract_pitlane.py -- <circuito preparado.glb> <spline alineada.json> <salida.pitlane.json>
          [--preview <vista.png>] [--debug <mapa.png>] [--reach 1300] [--max-offset 90]

Entradas: el GLB preparado (`.cache/out/circuits/<id>.glb`) y la spline alineada (`.cache/splines/<id>.json`),
en las mismas coordenadas glTF: puntos [x, y (altura), z] cada 2 m desde la meta en el sentido de carrera.

Cómo se encuentra (los materiales de los GLB no tienen nombres útiles, así que se mira la forma y el color):

1. Rejilla en coordenadas de pista (s, d): s a lo largo de la spline (cada 2 m, ±`reach` m alrededor de la
   meta) y d en perpendicular (cada 0,5 m, ±`max-offset` m; d > 0 es la izquierda del sentido de carrera).
   En cada celda se lanza un rayo vertical contra todas las mallas: altura de la superficie más alta.
2. Se renderiza la vista cenital (Workbench, color de textura sin iluminación) y se lee el color de cada celda.
3. Cada celda se clasifica: ALTO (> 3 m sobre el suelo de alrededor: garajes, tribunas, árboles), RESALTE (muro
   o valla: sube > 0,4 m respecto a lo que hay a 2 m) y, a ras de suelo, por color: ASFALTO (gris, blanco o
   negro), PINTURA (roja o azul: pianos, líneas de boxes), HIERBA, OTRO (grava, tierra).
4. Control: la spline debe ir sobre asfalto en el 80 % de ±300 m alrededor de la meta. Si no (pasa por tejados,
   hierba o la propia calle de boxes), la calle no se puede referir a ella y se informa `found: false`.
5. Por fila y lado, el borde de la pista sale del lado contrario (semiancho entre 4,5 y 10 m); la candidata es
   la primera cinta pavimentada más allá de ese borde (pegada o separada por muro o hierba). Las cintas se
   encadenan a lo largo de s (solapan, el centro se mueve poco; huecos de hasta 60 m bajo tejados o pórticos) y
   se unen las cadenas que siguen la misma calle. Puntuación: metros con garajes (ALTO a menos de 12 m del
   borde exterior, cinta >= 6 m) x2 + metros separados de la pista + 0,2 x metros fundidos con ella, penalizando
   lejos de la meta, centros a más de 30 m y anchos de menos de 8 m. Hace falta al menos 100 m con garajes.
6. Zona de boxes: el tramo más largo de la cadena con garajes al lado. Desde sus extremos la calle sigue la
   cadena hasta que la cinta se funde con la pista y se estrecha (entrada y salida), se acaba, pasa de 450 m o
   sigue fundida sin estrecharse 60 m (escapatoria: se corta). Se suaviza en el plano y se añaden 20 m de
   transición hasta el eje de la pista, así que el primer y el último punto de la calle están sobre la spline.

Salida (coordenadas glTF, metros): `points` [[x, y, z], ...] cada 2 m de la entrada a la salida; `entry` y
`exit` con el índice de la spline de 2 m y su fracción de vuelta; `lineShare` (fracción de la calle donde cruza
la meta); `box` (fracciones de la calle y de la vuelta); `side`; `offsetM`, `widthM`, `lengthM` y `quality`.
"""

import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import gltf_from_blender, import_glb, log, script_args, write_json  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402

VERSION = 1
CELL = 0.5          # m entre celdas laterales
STEP = 2.0          # m entre puntos de la spline alineada
HIGH = 3.0          # m sobre la pista: edificio, tribuna, árbol
RAISED = 0.4        # m de resalte en 2 m: muro, valla, barrera
LANE_WIDTH = (4.0, 36.0)
MIN_CORE = 120.0    # m mínimos de cadena
CORE_WIDTH = 6.0    # m: más estrecho es un arcén o una acera, no la calle de boxes junto a los garajes
MIN_GARAGES = 100.0 # m de calle con garajes al lado para aceptarla
MIN_ON_ASPHALT = 0.8  # fracción de ±300 m alrededor de la meta con la spline sobre asfalto; si no, la spline está mal
MAX_ROAD = 450.0    # m máximos de calle de entrada o de salida más allá de los garajes
MAX_GAP = 30        # filas (60 m) sin cinta visible dentro de una calle: tramos cubiertos, pórticos
BLEND_M = 20.0      # m de transición entre el eje de la pista y la calle

NONE, TALL, WALL, ROAD, PAINT, GRASS, OTHER = range(7)
PAVED = (ROAD, PAINT)


# ----------------------------------------------------------------- arguments

def parse():
    args = script_args()
    if len(args) < 3:
        raise SystemExit(__doc__)
    source, spline_path, target = args[0], args[1], args[2]
    options = {"preview": None, "debug": None, "reach": 1300.0, "max_offset": 90.0}
    i = 3
    while i < len(args):
        key = args[i].lstrip("-").replace("-", "_")
        if key not in options:
            raise SystemExit(f"argumento desconocido {args[i]}")
        value = args[i + 1]
        options[key] = value if key in ("preview", "debug") else float(value)
        i += 2
    for key in ("preview", "debug"):
        if options[key]:
            options[key] = os.path.abspath(options[key]).replace("\\", "/")
    return os.path.abspath(source), os.path.abspath(spline_path), os.path.abspath(target), options


# ------------------------------------------------------------------ geometry

def make_bvh(objects):
    """Un BVH con todas las mallas en coordenadas de mundo (como el de extract_spline.py, pero propio: ese
    script lo mantiene otro paso del pipeline)."""
    verts, polys = [], []
    for ob in objects:
        m = ob.matrix_world
        base = len(verts)
        verts.extend(m @ v.co for v in ob.data.vertices)
        polys.extend([base + i for i in p.vertices] for p in ob.data.polygons)
    return BVHTree.FromPolygons(verts, polys, all_triangles=False)


def spline_frame(data):
    """Puntos de la spline en el plano de Blender (x, y), su altura y la normal izquierda suavizada (±10 m)."""
    pts = np.array([[x, -z] for x, _, z in data["points"]], dtype=np.float64)
    height = np.array([y for _, y, _ in data["points"]], dtype=np.float64)
    ahead = np.roll(pts, -5, axis=0) - np.roll(pts, 5, axis=0)
    tangent = ahead / np.maximum(np.linalg.norm(ahead, axis=1, keepdims=True), 1e-9)
    normal = np.stack([-tangent[:, 1], tangent[:, 0]], axis=1)
    return pts, height, tangent, normal


def cast_grid(bvh, pts, height, normal, rows, offsets, top):
    """Altura de la superficie más alta en cada celda (NaN si no hay nada)."""
    z = np.full((len(rows), len(offsets)), np.nan)
    down = Vector((0, 0, -1))
    for r, k in enumerate(rows):
        base = pts[k]
        nx, ny = normal[k]
        for c, d in enumerate(offsets):
            hit = bvh.ray_cast(Vector((base[0] + nx * d, base[1] + ny * d, top)), down, 1e5)
            if hit[0] is not None:
                z[r, c] = hit[0].z
    return z


def render_colours(xy, path, max_px=4096, px_m=0.5):
    """Vista cenital sin iluminación de la zona; devuelve el color RGB (0-1) de cada punto xy."""
    lo, hi = xy.min(axis=0) - 5, xy.max(axis=0) + 5
    span = float(max(hi - lo))
    size = int(min(max_px, max(256, math.ceil(span / px_m))))
    centre = (lo + hi) / 2
    scene = bpy.context.scene
    cam = bpy.data.objects.new("pit_cam", bpy.data.cameras.new("pit_cam"))
    scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = span
    cam.data.clip_end = 1e6
    cam.location = (centre[0], centre[1], 20000)
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "TEXTURE"
    scene.view_settings.view_transform = "Standard"
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(path, check_existing=False)
    pix = np.array(image.pixels[:], dtype=np.float32).reshape(image.size[1], image.size[0], image.channels)[:, :, :3]
    bpy.data.images.remove(image)
    u = np.clip(((xy[:, 0] - (centre[0] - span / 2)) / span * size).astype(int), 0, size - 1)
    v = np.clip(((xy[:, 1] - (centre[1] - span / 2)) / span * size).astype(int), 0, size - 1)
    bpy.data.objects.remove(cam, do_unlink=True)
    return pix[v, u]


def rolling_min(a, half, axis):
    out = a.copy()
    for k in range(1, half + 1):
        out = np.minimum(out, np.roll(a, k, axis=axis))
        out = np.minimum(out, np.roll(a, -k, axis=axis))
    return out


def classify(z, height_rows, rgb):
    """Clase de cada celda a partir de la altura y del color.

    ALTO se mide contra el suelo de alrededor (mínimo a ±20 m en d y ±10 m en s), no contra la pista: un
    circuito en un valle (Hungaroring) tiene laderas varios metros por encima de la recta."""
    cls = np.full(z.shape, OTHER, dtype=np.int8)
    filled = np.where(np.isnan(z), np.inf, z)
    bump = z - rolling_min(filled, 4, axis=1)
    ground = rolling_min(rolling_min(filled, int(20 / CELL), axis=1), int(10 / STEP), axis=0)
    ground = np.where(np.isinf(ground), height_rows[:, None], ground)
    above = z - ground
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    vmax = np.max(rgb, axis=-1)
    vmin = np.min(rgb, axis=-1)
    sat = np.where(vmax > 1e-6, (vmax - vmin) / np.maximum(vmax, 1e-6), 0)
    span = np.maximum(vmax - vmin, 1e-6)
    hue = np.zeros_like(vmax)
    hue = np.where(vmax == r, ((g - b) / span) % 6, hue)
    hue = np.where(vmax == g, (b - r) / span + 2, hue)
    hue = np.where(vmax == b, (r - g) / span + 4, hue)
    hue = hue * 60.0
    grey = (sat < 0.2) | (vmax < 0.09)
    paint = ~grey & (sat >= 0.3) & ((hue <= 18) | (hue >= 330) | ((hue >= 195) & (hue <= 255)))
    green = ~grey & (hue > 55) & (hue < 175)
    cls[grey] = ROAD
    cls[paint] = PAINT
    cls[green] = GRASS
    cls[bump > RAISED] = WALL
    cls[above > HIGH] = TALL
    cls[np.isnan(z)] = NONE
    return cls


# ------------------------------------------------------------ lane search

def runs(mask):
    """Intervalos [a, b] (inclusive) de True en un vector."""
    padded = np.concatenate([[False], np.asarray(mask, dtype=bool), [False]]).astype(np.int8)
    diff = np.diff(padded)
    starts = np.flatnonzero(diff == 1)
    ends = np.flatnonzero(diff == -1) - 1
    return list(zip(starts.tolist(), ends.tolist()))


def side_profiles(cls, centre_col, sign):
    """Clases de un lado, columna 0 = eje de la pista, hacia fuera."""
    return cls[:, centre_col:] if sign > 0 else cls[:, centre_col::-1]


def paved_mask(profiles):
    paved = np.isin(profiles, PAVED)
    # Huecos de una celda (juntas, conos, una línea fina) no cortan el asfalto.
    fill = ~paved & np.roll(paved, 1, axis=1) & np.roll(paved, -1, axis=1)
    paved = paved | fill
    paved[:, 0] = True
    return paved


def continuous_edge(paved):
    """Última celda pavimentada seguida desde el eje, por fila."""
    blocked = ~paved
    blocked[:, -1] = True
    return np.argmax(blocked, axis=1) - 1


def row_runs(paved_row, profile_row, t0, edge):
    """Cintas pavimentadas más allá del borde de la pista (t0) en una fila de un lado."""
    out = []
    reach = int(12 / CELL)
    for a, b in runs(paved_row[t0:]):
        a += t0
        b += t0
        width = (b - a + 1) * CELL
        if width < 3.0 or a * CELL > 70:
            continue
        merged = a == t0 and edge >= t0
        tall = bool(np.any(profile_row[b + 1:b + 1 + reach] == TALL))
        out.append({"inner": a, "outer": b, "width": width, "merged": merged, "tall": tall, "wide": width > LANE_WIDTH[1], "t0": t0})
        # Solo la primera cinta desde la pista: lo que hay detrás de los garajes (paddock) no es la calle.
        break
    return out


def join_chains(chains, max_gap=MAX_GAP):
    """Une cadenas que siguen la misma calle: consecutivas (cortada por un pórtico, un tejado o un cambio
    brusco de ancho) o entrelazadas (la primera cinta salta de fila en fila entre dos anchos)."""
    def centre(item):
        return (item["inner"] + item["outer"]) / 2

    def compatible(a, b):
        lo, hi = max(a["first"], b["first"]), min(a["last"], b["last"])
        if lo <= hi:  # se solapan: centros parecidos en el tramo común
            ca = [centre(a["runs"][r]) for r in a["runs"] if lo - 10 <= r <= hi + 10]
            cb = [centre(b["runs"][r]) for r in b["runs"] if lo - 10 <= r <= hi + 10]
            return bool(ca and cb) and abs(np.median(ca) - np.median(cb)) <= 6 / CELL
        first, second = (a, b) if a["last"] < b["first"] else (b, a)
        gap = second["first"] - first["last"]
        if gap > max_gap:
            return False
        x = first["runs"][first["last"]]
        y = second["runs"][second["first"]]
        return abs(centre(x) - centre(y)) <= 4 / CELL + gap and y["inner"] <= x["outer"] + 6 and y["outer"] >= x["inner"] - 6

    chains = list(chains)
    merged = True
    while merged:
        merged = False
        chains.sort(key=lambda c: c["first"])
        for i in range(len(chains)):
            for j in range(i + 1, len(chains)):
                if compatible(chains[i], chains[j]):
                    a, b = chains[i], chains[j]
                    for r, item in b["runs"].items():
                        a["runs"].setdefault(r, item)
                    a["first"], a["last"] = min(a["runs"]), max(a["runs"])
                    del chains[j]
                    merged = True
                    break
            if merged:
                break
    return chains


def spline_on_asphalt(cls, centre_col):
    """Por fila, si hay una franja pavimentada de >= 6 m a menos de 4 m del eje."""
    paved = np.isin(cls, PAVED)
    paved = paved | (~paved & np.roll(paved, 1, axis=1) & np.roll(paved, -1, axis=1))
    near = int(4 / CELL)
    hits = np.zeros(len(paved), dtype=bool)
    for k, row in enumerate(paved):
        for a, b in runs(row):
            if a <= centre_col + near and b >= centre_col - near and (b - a + 1) * CELL >= 6:
                hits[k] = True
                break
    return hits


def track_chains(per_row, max_gap=MAX_GAP):
    """Encadena las cintas de fila en fila: misma posición lateral (solapan y el centro se mueve poco)."""
    done, active = [], []
    for r, items in enumerate(per_row):
        still = []
        for chain in active:
            (done if r - chain["last"] > max_gap else still).append(chain)
        active = still
        taken = set()
        for item in items:
            if item["wide"]:
                continue
            c = (item["inner"] + item["outer"]) / 2
            best = None
            for k, chain in enumerate(active):
                if k in taken:
                    continue
                gap = r - chain["last"]
                prev = chain["runs"][chain["last"]]
                pc = (prev["inner"] + prev["outer"]) / 2
                overlap = item["inner"] <= prev["outer"] + 2 and item["outer"] >= prev["inner"] - 2
                if overlap and abs(c - pc) <= 5 + 2 * gap:
                    if best is None or abs(c - pc) < best[0]:
                        best = (abs(c - pc), k)
            if best is None:
                active.append({"first": r, "last": r, "runs": {r: item}})
                taken.add(len(active) - 1)
            else:
                chain = active[best[1]]
                chain["last"] = r
                chain["runs"][r] = item
                taken.add(best[1])
    return done + active


def score_chain(chain, start_row):
    """Metros con garajes al lado (G), separados de la pista sin garajes (S) y fundidos con ella (M)."""
    rows = sorted(chain["runs"])
    lane = [r for r in rows if chain["runs"][r]["width"] >= CORE_WIDTH]
    G = sum(1 for r in lane if chain["runs"][r]["tall"]) * STEP
    S = sum(1 for r in lane if not chain["runs"][r]["tall"] and not chain["runs"][r]["merged"]) * STEP
    M = sum(1 for r in rows if not chain["runs"][r]["tall"] and chain["runs"][r]["merged"]) * STEP
    far = 0 if rows[0] <= start_row <= rows[-1] else min(abs(rows[0] - start_row), abs(rows[-1] - start_row)) * STEP
    widths = np.array([chain["runs"][r]["width"] for r in rows])
    offset = float(np.median([(chain["runs"][r]["inner"] + chain["runs"][r]["outer"]) / 2 for r in rows])) * CELL
    width = float(np.median(widths))
    factor = max(0.05, 1 - far / 500) * (0.5 if width > 25 else min(1.0, width / 8)) * (1.0 if offset <= 30 else max(0.2, 1 - (offset - 30) / 30))
    return (2 * G + S + 0.2 * M) * factor, G, S, M, far


def garage_zone(chain, n_rows):
    """Tramo más largo de la cadena con garajes al lado (huecos de hasta 30 m rellenos), o None."""
    flags = np.zeros(n_rows, dtype=bool)
    for r, item in chain["runs"].items():
        if item["tall"] and item["width"] >= CORE_WIDTH:
            flags[r] = True
    segs = []
    for a, b in runs(flags):
        if segs and a - segs[-1][1] <= 15:
            segs[-1] = (segs[-1][0], b)
        else:
            segs.append((a, b))
    segs = [sg for sg in segs if (sg[1] - sg[0]) * STEP >= 40]
    return max(segs, key=lambda sg: sg[1] - sg[0]) if segs else None


def trim_chain(chain, zone):
    """Calle útil: la zona de garajes y, a cada lado, la cadena mientras sigue siendo calle. Se para donde la
    cinta se funde con la pista y se estrecha (la cuña de entrada o de salida), donde la cadena se acaba, a
    MAX_ROAD m de los garajes o donde un tramo fundido no se estrecha en 60 m (escapatoria o arcén ancho: se
    corta 30 m después de fundirse)."""
    rows = sorted(chain["runs"])

    def walk(start, direction):
        r = start
        merged_from = None
        first_width = None
        while True:
            ahead = [k for k in rows if 0 < (k - r) * direction <= MAX_GAP]
            if not ahead:
                break
            nxt = min(ahead, key=lambda k: abs(k - r))
            if abs(nxt - start) * STEP > MAX_ROAD:
                return r, "max-length"
            item = chain["runs"][nxt]
            if not item["merged"] or item["tall"]:
                merged_from, first_width = None, None
                r = nxt
                continue
            if merged_from is None:
                merged_from, first_width = nxt, item["width"]
            if item["width"] <= 4.0:
                return nxt, "merged"
            if abs(nxt - merged_from) * STEP > 60:
                if item["width"] > 0.7 * first_width:
                    return merged_from + direction * 15, "merged-cut"
                return nxt, "merged"
            r = nxt
        last = chain["runs"][r]
        return r, ("merged" if last["merged"] or last["inner"] * CELL < 14 else "lost")

    end, end_how = walk(zone[1], 1)
    begin, begin_how = walk(zone[0], -1)
    return begin, end, begin_how, end_how


# --------------------------------------------------------------------- main

def main():
    source, spline_path, target, options = parse()
    data = json.load(open(spline_path, encoding="utf-8"))
    pts, height, tangent, normal = spline_frame(data)
    n = len(pts)
    meshes = import_glb(source)
    log("mallas", len(meshes), "; spline", n, "puntos")
    bvh = make_bvh(meshes)
    top = max((ob.matrix_world @ Vector(c)).z for ob in meshes for c in ob.bound_box) + 10

    half_rows = int(min(options["reach"] / STEP, n / 2 - 2))
    rows = [k % n for k in range(-half_rows, half_rows + 1)]
    offsets = np.arange(-options["max_offset"], options["max_offset"] + CELL / 2, CELL)
    centre_col = int(np.argmin(np.abs(offsets)))
    z = cast_grid(bvh, pts, height, normal, rows, offsets, top)
    log("rejilla", z.shape, "celdas")
    xy = (pts[rows][:, None, :] + normal[rows][:, None, :] * offsets[None, :, None]).reshape(-1, 2)
    scratch = os.path.splitext(target)[0] + ".colour.png"
    rgb = render_colours(xy, scratch).reshape(len(rows), len(offsets), 3)
    cls = classify(z, height[rows], rgb)
    if options["debug"]:
        save_debug(options["debug"], cls, None, centre_col)

    profiles = {sign: side_profiles(cls, centre_col, sign) for sign in (1, -1)}
    paved = {sign: paved_mask(profiles[sign]) for sign in (1, -1)}
    edges = {sign: continuous_edge(paved[sign]) for sign in (1, -1)}
    # Semiancho de la pista: el lado más estrecho, mediana de la zona (limitado a 4,5-9 m).
    half_width = float(np.clip(np.median(np.minimum(edges[1], edges[-1])) * CELL, 4.5, 9.0))
    # Por fila y lado, el borde de la pista se toma del lado contrario (mediana de ±20 m), entre ese semiancho
    # y 10 m: una pista de 15-20 m no se confunde así con el arranque de la calle.
    t0s = {}
    for sign in (1, -1):
        other = edges[-sign].astype(float) * CELL
        med = np.array([np.median(other[max(0, r - 10):r + 11]) for r in range(len(other))])
        t0s[sign] = np.ceil((np.clip(med, half_width, 10.0) + 0.5) / CELL).astype(int)
    # ¿Va la spline por el asfalto? (si no, la calle encontrada no se puede referir a ella)
    on_rows = spline_on_asphalt(cls, centre_col)
    tall_centre = cls[:, centre_col] == TALL
    near = slice(max(0, half_rows - int(300 / STEP)), half_rows + int(300 / STEP) + 1)
    on_track = float(on_rows.mean())
    on_near = float(on_rows[near].mean())
    tall_near = float(tall_centre[near].mean())
    log(f"spline cerca de la meta (±300 m): sobre asfalto {on_near * 100:.0f} %, bajo algo alto {tall_near * 100:.0f} %")
    log(f"semiancho de pista {half_width:.1f} m; spline sobre asfalto en el {on_track * 100:.0f} % de la zona")

    candidates = []
    for sign in (1, -1):
        per_row = [row_runs(paved[sign][r], profiles[sign][r], int(t0s[sign][r]), edges[sign][r]) for r in range(len(rows))]
        for chain in join_chains(track_chains(per_row)):
            rws = sorted(chain["runs"])
            if (rws[-1] - rws[0]) * STEP < MIN_CORE:
                continue
            score, G, S, M, far = score_chain(chain, half_rows)
            centres = np.array([(chain["runs"][r]["inner"] + chain["runs"][r]["outer"]) / 2 * CELL for r in rws])
            candidates.append({"sign": sign, "chain": chain, "score": score, "G": G, "S": S, "M": M, "far": far,
                               "offset": float(np.median(centres)), "width": float(np.median([chain["runs"][r]["width"] for r in rws])),
                               "first": rws[0], "last": rws[-1]})
    candidates.sort(key=lambda c: -c["score"])
    for c in candidates[:6]:
        log(f"  candidata {'izq' if c['sign'] > 0 else 'der'}: {(c['first'] - half_rows) * STEP:.0f}..{(c['last'] - half_rows) * STEP:.0f} m, "
            f"centro {c['offset']:.1f} m, ancho {c['width']:.1f} m, garajes {c['G']:.0f} m, separada {c['S']:.0f} m, "
            f"fundida {c['M']:.0f} m, puntuación {c['score']:.0f}")

    best = next((c for c in candidates if c["G"] >= MIN_GARAGES and garage_zone(c["chain"], len(rows))), None)
    reason = None
    if on_near < MIN_ON_ASPHALT:
        best, reason = None, (f"la spline no va por el asfalto cerca de la meta (solo el {on_near * 100:.0f} % a ±300 m; el {tall_near * 100:.0f} % "
                              "pasa bajo tejados o tribunas): hay que corregirla antes")
    elif best is None:
        reason = f"ninguna cinta pavimentada de al menos {CORE_WIDTH:.0f} m corre junto a la pista con garajes al lado ({MIN_GARAGES:.0f} m)"
    if best is None:
        write_json(target, {"generator": f"extract_pitlane.py v{VERSION}", "source": os.path.basename(source), "spline": os.path.basename(spline_path),
                            "found": False, "reason": reason, "splineOnAsphaltShare": round(on_near, 3), "splineUnderRoofShare": round(tall_near, 3),
                            "candidates": [{"side": "left" if c["sign"] > 0 else "right", "offsetM": round(c["offset"], 1), "garageM": round(c["G"]),
                                            "fromLineM": (c["first"] - half_rows) * STEP, "toLineM": (c["last"] - half_rows) * STEP}
                                           for c in candidates[:3]]})
        log("sin calle de boxes:", reason)
        if options["preview"]:
            preview(options["preview"], data, None, None, None, None, None)
        return

    sign, chain = best["sign"], best["chain"]
    zone = garage_zone(chain, len(rows))
    begin, end, begin_how, end_how = trim_chain(chain, zone)
    log(f"calle: {(begin - half_rows) * STEP:.0f}..{(end - half_rows) * STEP:.0f} m ({begin_how} / {end_how})")
    span_rows = list(range(begin, end + 1))
    known = [r for r in span_rows if r in chain["runs"]]
    centre_known = np.array([(max(chain["runs"][r]["inner"], chain["runs"][r]["t0"]) + chain["runs"][r]["outer"]) / 2 * CELL for r in known])
    centre_m = sign * np.interp(span_rows, known, centre_known)
    win = 7
    padded = np.concatenate([np.repeat(centre_m[:1], win // 2), centre_m, np.repeat(centre_m[-1:], win // 2)])
    centre_m = np.convolve(padded, np.ones(win) / win, mode="valid")
    blend = int(BLEND_M / STEP)
    smooth = lambda u: u * u * (3 - 2 * u)  # noqa: E731
    pre = [begin - blend + i for i in range(blend)]
    post = [end + 1 + i for i in range(blend)]
    offs = ([centre_m[0] * smooth(i / blend) for i in range(blend)] + list(centre_m)
            + [centre_m[-1] * smooth(1 - (i + 1) / blend) for i in range(blend)])
    path_rows = pre + span_rows + post
    keys = [r - half_rows for r in path_rows]
    idx = [k % n for k in keys]
    world = np.array([pts[i] + normal[i] * d for i, d in zip(idx, offs)])
    # Suavizado en el plano (ventana de ±12 m, que se estrecha en los extremos): quita las ondas que la
    # propia spline tiene en la recta sin mover la entrada ni la salida, que quedan sobre la spline.
    half = 6
    smooth_xy = world.copy()
    for k in range(1, len(world) - 1):
        h = min(half, k, len(world) - 1 - k)
        smooth_xy[k] = world[k - h:k + h + 1].mean(axis=0)
    world = smooth_xy
    zs = []
    for (x, y), i in zip(world, idx):
        hit = bvh.ray_cast(Vector((x, y, height[i] + 2.5)), Vector((0, 0, -1)), 10)
        zs.append(hit[0].z if hit[0] is not None else height[i])
    world_len = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(world, axis=0), axis=1))])
    total = float(world_len[-1])
    t = np.linspace(0, total, max(2, int(round(total / STEP)) + 1))
    rx = np.interp(t, world_len, world[:, 0])
    ry = np.interp(t, world_len, world[:, 1])
    rz = np.interp(t, world_len, np.array(zs))
    rkey = np.interp(t, world_len, np.array(keys, dtype=float))
    points = [[round(v, 2) for v in gltf_from_blender(float(x), float(y), float(h))] for x, y, h in zip(rx, ry, rz)]
    line_share = float(np.interp(0, rkey, t) / total) if keys[0] < 0 <= keys[-1] else None

    def path_share(row):
        return float(np.interp(row - half_rows, rkey, t) / total)

    box_a, box_b = zone
    box_source = "garages"
    box = {"fromShare": round(path_share(box_a), 4), "toShare": round(path_share(box_b), 4),
           "midShare": round(path_share((box_a + box_b) / 2), 4),
           "fromIndex": int((box_a - half_rows) % n), "toIndex": int((box_b - half_rows) % n),
           "lengthM": round((box_b - box_a) * STEP), "source": box_source}

    span_items = [chain["runs"][r] for r in span_rows if r in chain["runs"]]
    separated = sum(1 for it in span_items if not it["merged"]) / max(1, len(span_rows))
    garage_share = sum(1 for it in span_items if it["tall"]) / max(1, len(span_rows))
    core_items = [it for it in span_items if not it["merged"] or it["tall"]] or span_items
    core_centres = np.array([(max(it["inner"], it["t0"]) + it["outer"]) / 2 * CELL for it in core_items])
    widths = np.array([it["width"] for it in core_items])
    confidence = "high"
    if {begin_how, end_how} - {"merged"}:
        confidence = "medium"
    if line_share is None or best["G"] < 150:
        confidence = "low"
    entry_key, exit_key = keys[0], keys[-1]
    result = {
        "generator": f"extract_pitlane.py v{VERSION}",
        "source": os.path.basename(source),
        "spline": os.path.basename(spline_path),
        "frame": "gltf",
        "found": True,
        "stepM": STEP,
        "side": "left" if sign > 0 else "right",
        "entry": {"index": int(entry_key % n), "share": round((entry_key % n) / n, 5), "metresFromLine": round(entry_key * STEP, 1), "how": begin_how},
        "exit": {"index": int(exit_key % n), "share": round((exit_key % n) / n, 5), "metresFromLine": round(exit_key * STEP, 1), "how": end_how},
        "lineShare": None if line_share is None else round(line_share, 4),
        "box": box,
        "lengthM": round(total, 1),
        "offsetM": round(float(np.median(core_centres)), 1),
        "widthM": round(float(np.median(widths)), 1),
        "trackHalfWidthM": round(half_width, 1),
        "splineOnAsphaltShare": round(on_near, 3), "splineUnderRoofShare": round(tall_near, 3),
        "quality": {
            "confidence": confidence,
            "separatedShare": round(separated, 3),
            "garageShare": round(garage_share, 3),
            "garageM": round(best["G"]),
            "offsetSpreadM": round(float(np.percentile(core_centres, 90) - np.percentile(core_centres, 10)), 1),
            "score": round(best["score"]),
            "alternatives": [{"side": "left" if c["sign"] > 0 else "right", "offsetM": round(c["offset"], 1), "garageM": round(c["G"]),
                              "fromLineM": (c["first"] - half_rows) * STEP, "toLineM": (c["last"] - half_rows) * STEP, "score": round(c["score"])}
                             for c in candidates[1:4]],
        },
        "points": points,
    }
    write_json(target, result)
    log("calle de boxes", result["side"], f"{total:.0f} m", f"a {result['offsetM']} m;",
        f"entrada {entry_key * STEP:.0f} m, salida {exit_key * STEP:.0f} m de la meta;", "boxes", box["source"], box["lengthM"], "m; confianza", confidence)
    if options["debug"]:
        save_debug(options["debug"], cls, {"rows": path_rows, "offs": offs, "box": (box_a, box_b)}, centre_col)
    if options["preview"]:
        preview(options["preview"], data, rx, ry, rz, box, line_share)
    try:
        os.remove(scratch)
    except OSError:
        pass


# ------------------------------------------------------------------- outputs

PALETTE = {NONE: (0, 0, 0), TALL: (0.55, 0.2, 0.6), WALL: (1, 0.55, 0), ROAD: (0.45, 0.45, 0.45), PAINT: (0.9, 0.2, 0.2),
           GRASS: (0.15, 0.5, 0.15), OTHER: (0.75, 0.65, 0.45)}


def save_debug(path, cls, lane, centre_col):
    """Mapa (s, d) de clases, para depurar."""
    h, w = cls.shape
    img = np.zeros((h, w, 4), dtype=np.float32)
    img[..., 3] = 1
    for k, colour in PALETTE.items():
        img[cls == k, :3] = colour
    img[:, centre_col, :3] = (1, 0, 0)
    img[h // 2, :, :3] = (1, 1, 1)
    if lane:
        for r, d in zip(lane["rows"], lane["offs"]):
            if 0 <= r < h:
                c = int(round(centre_col + d / CELL))
                if 0 <= c < w:
                    inbox = lane["box"][0] <= r <= lane["box"][1]
                    img[r, max(0, c - 1):c + 2, :3] = (1, 1, 0) if inbox else (0, 1, 1)
    # Traspuesta: columnas = s (izquierda = antes de la meta), filas = d (arriba = izquierda de la marcha).
    img = np.ascontiguousarray(np.transpose(img, (1, 0, 2))[::-1])
    image = bpy.data.images.new("pit_debug", h, w, alpha=True)
    image.pixels[:] = img[::-1].ravel()
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()


def preview(path, data, rx, ry, rz, box, line_share, size=1600):
    """Vista cenital de la zona de boxes: spline en rojo, sentido en naranja (150 m desde la meta), meta en
    blanco, calle en cian con la entrada en verde, la salida en magenta y los boxes en amarillo. Sin calle,
    encuadra ±600 m alrededor de la meta."""
    def material(name, rgb):
        mat = bpy.data.materials.new(name)
        mat.diffuse_color = (*rgb, 1)
        return mat

    def polyline(name, points, radius, mat):
        curve = bpy.data.curves.new(name, "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = radius
        spline = curve.splines.new("POLY")
        spline.points.add(len(points) - 1)
        for p, co in zip(spline.points, points):
            p.co = (*co, 1)
        ob = bpy.data.objects.new(name, curve)
        ob.data.materials.append(mat)
        bpy.context.scene.collection.objects.link(ob)

    track = [Vector((x, -z, y + 4)) for x, y, z in data["points"]]
    if rx is not None:
        frame = [Vector((x, y, h + 5)) for x, y, h in zip(rx, ry, rz)]
    else:
        frame = track[-300:] + track[:300]
    lo = Vector((min(p.x for p in frame), min(p.y for p in frame), 0))
    hi = Vector((max(p.x for p in frame), max(p.y for p in frame), 0))
    span = max(hi.x - lo.x, hi.y - lo.y) * 1.15 + 80
    width = max(0.8, span / 700)
    polyline("pit_track", track + track[:1], width, material("red", (1, 0, 0)))
    polyline("pit_dir", [p + Vector((0, 0, 1)) for p in track[:76]], width * 1.6, material("orange", (1, 0.45, 0)))
    start = track[0]
    nrm = Vector((-(track[1] - track[0]).y, (track[1] - track[0]).x, 0)).normalized()
    polyline("pit_start", [start - nrm * 30, start + nrm * 30], width * 1.2, material("white", (1, 1, 1)))
    if rx is not None:
        lane = frame
        polyline("pit_lane", lane, width, material("cyan", (0, 1, 1)))
        a, b = int(box["fromShare"] * (len(lane) - 1)), int(box["toShare"] * (len(lane) - 1))
        if b > a:
            polyline("pit_box", [p + Vector((0, 0, 1)) for p in lane[a:b + 1]], width * 1.8, material("yellow", (1, 0.9, 0)))
        polyline("pit_entry", [lane[0] + Vector((0, 0, 2)), lane[min(len(lane) - 1, 8)] + Vector((0, 0, 2))], width * 2.5, material("green", (0, 1, 0)))
        polyline("pit_exit", [lane[max(0, len(lane) - 9)] + Vector((0, 0, 2)), lane[-1] + Vector((0, 0, 2))], width * 2.5, material("magenta", (1, 0, 1)))
    scene = bpy.context.scene
    cam = bpy.data.objects.new("pit_preview", bpy.data.cameras.new("pit_preview"))
    scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = span
    cam.data.clip_end = 1e6
    cam.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 20000)
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "TEXTURE"
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
