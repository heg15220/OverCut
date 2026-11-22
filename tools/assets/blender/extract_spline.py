"""Eje central del asfalto de un circuito GLB -> spline JSON (RF-3D-03, criterio 7.2: desviación <= 2 m).

Uso:
  blender -b --python extract_spline.py -- <circuito.glb> <salida.json> --km <longitud real> [--res 1.0]

Los GLB de f1-3d-assets no nombran sus materiales (`BUILDF_12`, `Material_41.001_7`), así que el asfalto se
encuentra por su forma:

1. Cada malla se rasteriza (solo caras horizontales) en una rejilla de `res` metros y se esqueletiza
   (Zhang-Suen). Ancho medio = área / longitud del esqueleto. El asfalto es la malla larga (>= 0,6 x la
   vuelta) con ancho de pista (6-30 m); las mallas contiguas con el mismo perfil se unen (recta de boxes,
   tramos partidos). El terreno (caras > 3 km^2) se descarta.
2. El esqueleto se convierte en grafo (cruces = nodos, tramos = aristas), se podan las ramas muertas y se
   enumeran los ciclos simples. La vuelta del GP es el ciclo cuya longitud más se acerca a la real: así se
   separa del trazado National/International, enlaces y calle de boxes que comparten malla.
3. El ciclo se suaviza, se remuestrea cada 2 m y se recentra con rayos verticales contra la malla del asfalto
   (bordes izquierdo y derecho por bisección). La desviación final por punto es |d_izq - d_der| / 2: la
   distancia de la spline al centro real de la malla. En cruces y entradas (ancho > 1,6 x la mediana) no se
   mide ni se corrige; se informa la fracción medida.

La salida está en coordenadas glTF (Y arriba), las mismas en que three.js carga el GLB, así que la spline
queda alineada con la malla sin transformar nada. El sentido de giro y la línea de meta los fija después
`align_spline.mjs` contra el boceto del circuito.
"""

import math
import os
import sys

import bmesh  # noqa: F401  (disponible en Blender; se deja para depurar)
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(__file__))
from common import gltf_from_blender, import_glb, log, script_args, write_json  # noqa: E402

VERSION = 1
TERRAIN_AREA = 3.0e6
WIDTH_RANGE = (6.0, 30.0)


# ----------------------------------------------------------------- arguments

def parse():
    args = script_args()
    source, target = args[0], args[1]
    options = {"km": None, "res": 1.0, "min_share": 0.6, "geo": None, "geo_id": None, "method": "auto"}
    i = 2
    while i < len(args):
        if args[i] == "--km":
            options["km"] = float(args[i + 1]); i += 2
        elif args[i] == "--geo":
            options["geo"] = args[i + 1]; i += 2
        elif args[i] == "--geo-id":
            options["geo_id"] = args[i + 1]; i += 2
        elif args[i] == "--method":
            options["method"] = args[i + 1]; i += 2
        elif args[i] == "--res":
            options["res"] = float(args[i + 1]); i += 2
        else:
            raise SystemExit(f"argumento desconocido {args[i]}")
    if not options["km"]:
        raise SystemExit("--km es obligatorio: la longitud real elige el ciclo del GP")
    return source, target, options


# --------------------------------------------------------------- rasterising

def triangles_of(ob):
    """Triángulos en coordenadas de mundo (n, 3, 3) y sus normales."""
    mesh = ob.data
    mesh.calc_loop_triangles()
    count = len(mesh.loop_triangles)
    if not count:
        return None, None
    verts = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", verts)
    verts = verts.reshape(-1, 3)
    m = np.array(ob.matrix_world)
    verts = verts @ m[:3, :3].T + m[:3, 3]
    idx = np.empty(count * 3, dtype=np.int64)
    mesh.loop_triangles.foreach_get("vertices", idx)
    tri = verts[idx.reshape(-1, 3)]
    normal = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    return tri, normal


def horizontal(tri, normal):
    length = np.linalg.norm(normal, axis=1)
    keep = (length > 1e-9) & (np.abs(normal[:, 2]) > 0.85 * np.maximum(length, 1e-9))
    return tri[keep], length[keep] / 2.0


def components(tri):
    """Etiqueta de pieza conexa por triángulo (vértices soldados a 1 cm: glTF duplica en las costuras UV)."""
    keys = np.round(tri.reshape(-1, 3) * 100).astype(np.int64)
    _, vid = np.unique(keys, axis=0, return_inverse=True)
    vid = vid.reshape(-1, 3)
    label = np.arange(vid.max() + 1)
    while True:
        low = label[vid].min(axis=1)
        new = label.copy()
        np.minimum.at(new, vid.ravel(), np.repeat(low, 3))
        new = new[new]
        if np.array_equal(new, label):
            return label[vid[:, 0]]
        label = new


def ribbon_parts(tri, area, res, rng, max_half_width):
    """Solo las piezas con forma de cinta: las que se esqueletizan antes de `max_half_width` iteraciones."""
    label = components(tri)
    keep = np.zeros(len(tri), dtype=bool)
    blob = np.zeros(len(tri), dtype=bool)
    order = np.argsort(label)
    bounds = np.flatnonzero(np.diff(label[order])) + 1
    for group in np.split(order, bounds):
        part_area = area[group].sum()
        if part_area < 300:
            keep[group] = True
            continue
        pts = sample_points(tri[group], area[group], res, rng)
        if pts is None:
            continue
        origin = pts.min(axis=0) - 2 * res
        shape = tuple(np.ceil((pts.max(axis=0) - origin) / res).astype(int) + 3)
        crop = erode(dilate(rasterise(pts, origin, res, shape), 1), 1)
        if thin(crop, max_iter=max_half_width) is not None:
            keep[group] = True
        else:
            blob[group] = True
    return tri[keep], area[keep], tri[blob], area[blob]


def sample_points(tri, area, res, rng):
    """Puntos repartidos sobre los triángulos, unos dos por celda."""
    per = np.maximum(1, np.ceil(area / (res * res * 0.5))).astype(np.int64)
    total = int(per.sum())
    if total > 60_000_000:
        return None
    which = np.repeat(np.arange(len(tri)), per)
    u = rng.random(total)
    v = rng.random(total)
    flip = u + v > 1
    u[flip] = 1 - u[flip]
    v[flip] = 1 - v[flip]
    a, b, c = tri[which, 0], tri[which, 1], tri[which, 2]
    pts = a + (b - a) * u[:, None] + (c - a) * v[:, None]
    # Los vértices también, para que los triángulos finos no dejen huecos.
    return np.concatenate([pts[:, :2], tri.reshape(-1, 3)[:, :2]])


def rasterise(points, origin, res, shape):
    ij = np.floor((points - origin) / res).astype(np.int64)
    ok = (ij[:, 0] >= 0) & (ij[:, 1] >= 0) & (ij[:, 0] < shape[0]) & (ij[:, 1] < shape[1])
    grid = np.zeros(shape, dtype=bool)
    grid[ij[ok, 0], ij[ok, 1]] = True
    return grid


# ------------------------------------------------------------ morphology

def shift(a, di, dj):
    out = np.zeros_like(a)
    h, w = a.shape
    out[max(0, di):h + min(0, di), max(0, dj):w + min(0, dj)] = a[max(0, -di):h + min(0, -di), max(0, -dj):w + min(0, -dj)]
    return out


def dilate(a, r=1):
    out = a.copy()
    for _ in range(r):
        out = out | shift(out, 1, 0) | shift(out, -1, 0) | shift(out, 0, 1) | shift(out, 0, -1)
    return out


def erode(a, r=1):
    out = a.copy()
    for _ in range(r):
        out = out & shift(out, 1, 0) & shift(out, -1, 0) & shift(out, 0, 1) & shift(out, 0, -1)
    return out


def thin(a, max_iter=None):
    """Zhang-Suen, vectorizado. Con `max_iter`, devuelve None si la forma no se ha reducido a una línea
    en esas iteraciones: es más ancha que una pista (hierba, aparcamientos) y no hace falta seguir."""
    img = a.copy()
    iterations = 0
    while True:
        iterations += 1
        if max_iter is not None and iterations > max_iter:
            return None
        changed = False
        for step in (0, 1):
            p2, p3, p4, p5 = shift(img, 1, 0), shift(img, 1, -1), shift(img, 0, -1), shift(img, -1, -1)
            p6, p7, p8, p9 = shift(img, -1, 0), shift(img, -1, 1), shift(img, 0, 1), shift(img, 1, 1)
            ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
            b = sum(x.astype(np.uint8) for x in ring[:8])
            transitions = sum(((~ring[k]) & ring[k + 1]).astype(np.uint8) for k in range(8))
            if step == 0:
                cond = ~(p2 & p4 & p6) & ~(p4 & p6 & p8)
            else:
                cond = ~(p2 & p4 & p8) & ~(p2 & p6 & p8)
            remove = img & (b >= 2) & (b <= 6) & (transitions == 1) & cond
            if remove.any():
                img &= ~remove
                changed = True
        if not changed:
            return img


def fill_holes(mask, max_area):
    """Rellena los huecos interiores pequeños (islas de hierba, juntas de malla) que darían ciclos falsos."""
    from collections import deque
    h, w = mask.shape
    outside = np.zeros_like(mask)
    queue = deque()
    for i in range(h):
        for j in (0, w - 1):
            if not mask[i, j] and not outside[i, j]:
                outside[i, j] = True
                queue.append((i, j))
    for j in range(w):
        for i in (0, h - 1):
            if not mask[i, j] and not outside[i, j]:
                outside[i, j] = True
                queue.append((i, j))
    while queue:
        i, j = queue.popleft()
        for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
            if 0 <= a < h and 0 <= b < w and not mask[a, b] and not outside[a, b]:
                outside[a, b] = True
                queue.append((a, b))
    holes = ~mask & ~outside
    if not holes.any():
        return mask
    # Cada hueco por separado: solo se rellenan los pequeños.
    filled = mask.copy()
    seen = np.zeros_like(mask)
    for i, j in np.argwhere(holes):
        if seen[i, j]:
            continue
        group, queue = [], deque([(i, j)])
        seen[i, j] = True
        while queue:
            a, b = queue.popleft()
            group.append((a, b))
            for c, d in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                if 0 <= c < h and 0 <= d < w and holes[c, d] and not seen[c, d]:
                    seen[c, d] = True
                    queue.append((c, d))
        if len(group) <= max_area:
            for a, b in group:
                filled[a, b] = True
    return filled


# ------------------------------------------------------------ skeleton graph

NEIGH = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def neighbours(skel, i, j):
    h, w = skel.shape
    out = []
    for di, dj in NEIGH:
        a, b = i + di, j + dj
        if 0 <= a < h and 0 <= b < w and skel[a, b]:
            out.append((a, b))
    return out


def build_graph(skel):
    """Nodos (cruces y extremos, agrupados) y aristas (listas de píxeles) del esqueleto."""
    pix = set(map(tuple, np.argwhere(skel)))
    nb = {p: neighbours(skel, *p) for p in pix}
    special = {p for p in pix if len(nb[p]) != 2}
    node_of, nodes = {}, []
    for p in special:
        if p in node_of:
            continue
        node_of[p] = len(nodes)
        stack, members = [p], []
        while stack:
            q = stack.pop()
            members.append(q)
            for r in nb[q]:
                if r in special and r not in node_of:
                    node_of[r] = len(nodes)
                    stack.append(r)
        nodes.append(members)
    visited, edges = set(), []
    for p in special:
        for q in nb[p]:
            if q in special or q in visited:
                continue
            path, prev, cur, end = [p, q], p, q, None
            visited.add(q)
            while True:
                nxt = [r for r in nb[cur] if r != prev]
                hit = [r for r in nxt if r in special and not (len(path) == 2 and node_of[r] == node_of[p])]
                if hit:
                    end = hit[0]
                    path.append(end)
                    break
                nxt = [r for r in nxt if r not in special and r not in visited]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
                visited.add(cur)
                path.append(cur)
            if end is None:
                continue
            a, b = node_of[p], node_of[end]
            if a == b and len(path) < 20:
                continue
            edges.append({"a": a, "b": b, "path": path})
    # Anillos sin ningún cruce.
    remaining = pix - special - visited
    while remaining:
        start = remaining.pop()
        path, prev, cur = [start], None, start
        while True:
            nxt = [r for r in nb[cur] if r != prev and r in remaining]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            remaining.discard(cur)
            path.append(cur)
        if len(path) > 50:
            nodes.append([start])
            edges.append({"a": len(nodes) - 1, "b": len(nodes) - 1, "path": path + [start]})
    return nodes, edges


def path_length(path, res):
    return sum(math.dist(path[k], path[k + 1]) for k in range(len(path) - 1)) * res


def prune(edges):
    """Una rama muerta nunca está en un ciclo: se quitan hasta que no quede ninguna."""
    while True:
        degree = {}
        for e in edges:
            degree[e["a"]] = degree.get(e["a"], 0) + 1
            degree[e["b"]] = degree.get(e["b"], 0) + 1
        dead = [e for e in edges if e["a"] != e["b"] and (degree[e["a"]] == 1 or degree[e["b"]] == 1)]
        if not dead:
            return edges
        edges = [e for e in edges if e not in dead]


def contract(edges, res, tiny=15.0):
    """Une las aristas que pasan por nodos de grado 2 y quita los bucles diminutos del adelgazamiento,
    hasta que solo quedan los cruces reales."""
    edges = [dict(e) for e in edges]
    while True:
        changed = False
        # Bucles y aristas paralelas cortas: artefactos.
        kept, seen = [], {}
        for e in edges:
            length = path_length(e["path"], res)
            if e["a"] == e["b"] and length < 4 * tiny:
                changed = True
                continue
            key = (min(e["a"], e["b"]), max(e["a"], e["b"]))
            if key in seen and length < tiny and path_length(seen[key]["path"], res) < tiny:
                changed = True
                continue
            seen.setdefault(key, e)
            kept.append(e)
        edges = kept
        incident = {}
        for k, e in enumerate(edges):
            incident.setdefault(e["a"], []).append(k)
            if e["b"] != e["a"]:
                incident.setdefault(e["b"], []).append(k)
        node = next((n for n, ks in incident.items() if len(ks) == 2 and ks[0] != ks[1]), None)
        if node is None:
            if not changed:
                return edges
            continue
        k1, k2 = incident[node]
        e1, e2 = edges[k1], edges[k2]
        p1 = e1["path"] if e1["b"] == node else list(reversed(e1["path"]))
        a = e1["a"] if e1["b"] == node else e1["b"]
        p2 = e2["path"] if e2["a"] == node else list(reversed(e2["path"]))
        b = e2["b"] if e2["a"] == node else e2["a"]
        merged = {"a": a, "b": b, "path": p1 + p2[1:]}
        edges = [e for k, e in enumerate(edges) if k not in (k1, k2)] + [merged]


def simple_cycles(edges, limit=300000):
    """Ciclos simples de un grafo no dirigido con multiaristas, como listas de aristas."""
    adj = {}
    for k, e in enumerate(edges):
        adj.setdefault(e["a"], []).append((k, e["b"]))
        adj.setdefault(e["b"], []).append((k, e["a"]))
    cycles = []
    found = set()
    for k, e in enumerate(edges):
        if e["a"] == e["b"]:
            cycles.append([k])
    for start in sorted(adj):
        stack = [(start, [], {start})]
        while stack and len(cycles) < limit:
            node, used, visited = stack.pop()
            for k, other in adj[node]:
                if k in used or edges[k]["a"] == edges[k]["b"]:
                    continue
                if other == start and used:
                    key = frozenset(used + [k])
                    if key not in found:
                        found.add(key)
                        cycles.append(used + [k])
                    continue
                if other in visited or other < start:
                    continue
                stack.append((other, used + [k], visited | {other}))
    return cycles


def cycle_polyline(edges, cycle):
    """Une las aristas de un ciclo en una polilínea cerrada de píxeles."""
    pieces = [list(edges[k]["path"]) for k in cycle]
    line = pieces[0]
    rest = pieces[1:]
    while rest:
        tail = line[-1]
        best, rev, gap = None, False, 1e9
        for k, piece in enumerate(rest):
            for r, end in ((False, piece[0]), (True, piece[-1])):
                d = math.dist(tail, end)
                if d < gap:
                    best, rev, gap = k, r, d
        piece = rest.pop(best)
        line.extend(reversed(piece) if rev else piece)
    return line


def find_pit_lane(cycle_px, others, res):
    """La calle de boxes: una cinta de 250-1500 m que corre paralela al bucle a 10-70 m durante todo su
    recorrido. Devuelve el intervalo de índices del bucle que acompaña (inicio, fin) o None.

    `others` son polilíneas en píxeles: aristas del grafo fuera del ciclo y esqueletos de otras mallas."""
    loop = np.asarray(cycle_px, dtype=np.float64)
    step = max(1, len(loop) // 4000)
    ref = loop[::step]
    best = None
    for poly in others:
        pts = np.asarray(poly, dtype=np.float64)
        if len(pts) < 10:
            continue
        length = np.linalg.norm(np.diff(pts, axis=0), axis=1).sum() * res
        if not 250 <= length <= 1500:
            continue
        sample = pts[:: max(1, len(pts) // 200)]
        d2 = ((sample[:, None, :] - ref[None, :, :]) ** 2).sum(axis=2)
        nearest = d2.argmin(axis=1)
        dist = np.sqrt(d2[np.arange(len(sample)), nearest]) * res
        inner = dist[len(dist) // 10: len(dist) - len(dist) // 10] if len(dist) > 10 else dist
        if not (np.all(inner <= 70) and np.median(inner) >= 8):
            continue
        idx = nearest * step
        # Intervalo circular que cubre la proyección.
        n = len(loop)
        ordered = np.sort(idx)
        gaps = np.diff(np.concatenate([ordered, ordered[:1] + n]))
        cut = gaps.argmax()
        start, end = ordered[(cut + 1) % len(ordered)], ordered[cut]
        score = float(np.median(inner))
        if best is None or score < best[0]:
            best = (score, int(start), int(end), length)
    return best


def pit_complex(cycle_px, blob_mask, res, reach=25.0):
    """El tramo recto más largo del bucle pegado a una explanada (boxes y paddock): (inicio, fin, metros)."""
    near = dilate(blob_mask, int(reach / res))
    loop = np.asarray(cycle_px).astype(int)
    h, w = near.shape
    inside = np.array([0 <= i < h and 0 <= j < w and near[i, j] for i, j in loop])
    n = len(loop)
    if inside.all() or not inside.any():
        return None
    first = int(np.argmin(inside))  # empieza en un punto sin contacto
    runs, start = [], None
    for k in range(n + 1):
        idx = (first + k) % n
        if k < n and inside[idx]:
            if start is None:
                start = k
        elif start is not None:
            runs.append((start, k - 1))
            start = None
    best = None
    for a, b in runs:
        ia, ib = (first + a) % n, (first + b) % n
        arc = (b - a) * res
        chord = math.dist(loop[ia], loop[ib]) * res
        # Solo la parte recta: se recorta desde los extremos hasta que la cuerda sea >= 97 % del arco.
        while arc >= 250 and chord < 0.97 * arc:
            a += 5
            b -= 5
            ia, ib = (first + a) % n, (first + b) % n
            arc = (b - a) * res
            chord = math.dist(loop[ia], loop[ib]) * res
        if arc >= 250 and (best is None or arc > best[2]):
            best = (ia, ib, arc)
    return best


def load_geo(path, ident):
    """Trazado real (bacinger/f1-circuits, MIT) en metros: este, norte."""
    import json
    if not path or not ident:
        return None
    data = json.load(open(path, encoding="utf-8"))
    feature = next((f for f in data["features"] if f["properties"]["id"] == ident), None)
    if not feature:
        return None
    pts = np.array(feature["geometry"]["coordinates"], dtype=np.float64)
    lat0 = pts[:, 1].mean()
    lon0 = pts[:, 0].mean()
    return np.stack([(pts[:, 0] - lon0) * 111320 * math.cos(math.radians(lat0)), (pts[:, 1] - lat0) * 110540], axis=1)


def resample_n(points, n):
    closed = np.vstack([points, points[:1]])
    seg = np.linalg.norm(np.diff(closed, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.stack([np.interp(t, s, closed[:, 0]), np.interp(t, s, closed[:, 1])], axis=1)


def shape_rms(candidate, geo, n=180):
    """RMS (m) del mejor ajuste rígido (giro + traslación, con o sin reflexión, ambos sentidos) entre dos
    bucles, sin escalar: los dos están en metros."""
    a = resample_n(geo, n)
    a = a - a.mean(axis=0)
    b0 = resample_n(candidate, n)
    b0 = b0 - b0.mean(axis=0)
    best = np.inf
    idx = np.arange(n)
    for reflect in (False, True):
        aa = a * np.array([-1.0, 1.0]) if reflect else a
        norm_a = (aa ** 2).sum()
        for direction in (1, -1):
            # Todas las correspondencias cíclicas de golpe.
            shifts = (idx[None, :] * direction + idx[:, None]) % n
            b = b0[shifts]  # (n desplazamientos, n puntos, 2)
            sxx = (aa[None, :, 0] * b[:, :, 0]).sum(axis=1)
            sxy = (aa[None, :, 0] * b[:, :, 1]).sum(axis=1)
            syx = (aa[None, :, 1] * b[:, :, 0]).sum(axis=1)
            syy = (aa[None, :, 1] * b[:, :, 1]).sum(axis=1)
            fit = np.hypot(sxx + syy, sxy - syx)
            norm_b = (b ** 2).sum(axis=(1, 2))
            rms = np.sqrt(np.maximum(0, norm_a + norm_b - 2 * fit) / n)
            best = min(best, float(rms.min()))
    return best


def nearest(points, cloud, chunk=2000):
    """Índice y distancia del punto de `cloud` más cercano a cada punto (fuerza bruta por bloques)."""
    idx = np.empty(len(points), dtype=np.int64)
    dist = np.empty(len(points))
    for start in range(0, len(points), chunk):
        block = points[start:start + chunk]
        d2 = ((block[:, None, :] - cloud[None, :, :]) ** 2).sum(axis=2)
        k = d2.argmin(axis=1)
        idx[start:start + chunk] = k
        dist[start:start + chunk] = np.sqrt(d2[np.arange(len(block)), k])
    return idx, dist


def kabsch(src, dst):
    """Giro y traslación que llevan src sobre dst (2D, sin escala)."""
    cs, cd = src.mean(axis=0), dst.mean(axis=0)
    h = (src - cs).T @ (dst - cd)
    angle = math.atan2(h[0, 1] - h[1, 0], h[0, 0] + h[1, 1])
    rot = np.array([[math.cos(angle), -math.sin(angle)], [math.sin(angle), math.cos(angle)]])
    return rot, cd - cs @ rot.T


def fit_geo(geo, skeleton_pts):
    """ICP rígido del trazado real sobre el esqueleto del asfalto, probando giros cada 5 grados y la
    reflexión. Devuelve (trazado colocado, distancia media, reflejado)."""
    g = resample_n(geo, 400)
    cloud = skeleton_pts[:: max(1, len(skeleton_pts) // 25000)]
    centre = cloud.mean(axis=0)
    best = None
    for reflect in (False, True):
        base = g * np.array([-1.0, 1.0]) if reflect else g
        base = base - base.mean(axis=0)
        starts = []
        for deg in range(0, 360, 5):
            a = math.radians(deg)
            rot = np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])
            placed = base @ rot.T + centre
            _, d = nearest(placed, cloud)
            starts.append((float(np.mean(d)), placed))
        starts.sort(key=lambda row: row[0])
        for _, placed in starts[:4]:
            current = placed
            for _ in range(40):
                k, d = nearest(current, cloud)
                keep = d < np.percentile(d, 90)
                rot, shift = kabsch(current[keep], cloud[k[keep]])
                moved = current @ rot.T + shift
                if np.abs(moved - current).max() < 0.05:
                    current = moved
                    break
                current = moved
            _, d = nearest(current, cloud)
            score = float(np.mean(d))
            if best is None or score < best[1]:
                best = (current, score, reflect)
    return best


def snap_to(line, cloud, reach):
    """Lleva cada punto al punto del esqueleto más cercano si está a menos de `reach` m."""
    k, d = nearest(line, cloud)
    out = line.copy()
    close = d < reach
    out[close] = cloud[k[close]]
    return out, float(close.mean())


# --------------------------------------------------------------- the line

def smooth_closed(points, window):
    if window <= 1:
        return points
    n = len(points)
    kernel = np.ones(window) / window
    out = np.empty_like(points)
    for axis in range(points.shape[1]):
        padded = np.concatenate([points[-window:, axis], points[:, axis], points[:window, axis]])
        out[:, axis] = np.convolve(padded, kernel, mode="same")[window:window + n]
    return out


def resample_closed(points, step):
    closed = np.vstack([points, points[:1]])
    seg = np.linalg.norm(np.diff(closed, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    total = s[-1]
    count = max(8, int(round(total / step)))
    t = np.linspace(0, total, count, endpoint=False)
    return np.stack([np.interp(t, s, closed[:, axis]) for axis in range(points.shape[1])], axis=1), total


def make_bvh(objects):
    verts, polys = [], []
    for ob in objects:
        m = ob.matrix_world
        base = len(verts)
        verts.extend(m @ v.co for v in ob.data.vertices)
        polys.extend([base + i for i in p.vertices] for p in ob.data.polygons)
    return BVHTree.FromPolygons(verts, polys, all_triangles=False)


def road_at(bvh, x, y, top):
    hit = bvh.ray_cast(Vector((x, y, top)), Vector((0, 0, -1)), 1e5)
    return hit[0]


def edge_distance(bvh, p, direction, top, limit=40.0):
    """Distancia del punto p al borde del asfalto en una dirección (bisección a 5 cm)."""
    if road_at(bvh, p[0], p[1], top) is None:
        return None
    lo, hi = 0.0, None
    s = 1.0
    def gone(at):
        # Un borde es un hueco de al menos 1 m: los agujeros sueltos de la malla no cuentan.
        return all(road_at(bvh, *(p + direction * (at + extra))[:2], top) is None for extra in (0.0, 0.5, 1.0))

    while s <= limit:
        if gone(s):
            hi = s
            break
        lo = s
        s += 1.0
    if hi is None:
        return None
    while hi - lo > 0.05:
        mid = (lo + hi) / 2
        if gone(mid):
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def local_median(values, half=50):
    """Mediana móvil circular (±half muestras), ignorando NaN."""
    n = len(values)
    out = np.empty(n)
    padded = np.concatenate([values[-half:], values, values[:half]])
    for k in range(n):
        window = padded[k:k + 2 * half + 1]
        window = window[~np.isnan(window)]
        out[k] = np.median(window) if len(window) else np.nan
    return out


def line_distance(bvh, p, direction, top, start=1.0, limit=14.0, step=0.1):
    """Distancia a la primera línea pintada en una dirección (pasos de 10 cm)."""
    s = start
    while s <= limit:
        q = p + direction * s
        if road_at(bvh, q[0], q[1], top) is not None:
            return s
        s += step
    return None


def measure_lines(bvh, line, top):
    n = len(line)
    tangent = np.roll(line, -1, axis=0) - np.roll(line, 1, axis=0)
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1, keepdims=True), 1e-9)
    normal = np.stack([-tangent[:, 1], tangent[:, 0]], axis=1)
    left = np.full(n, np.nan)
    right = np.full(n, np.nan)
    for k in range(n):
        dl = line_distance(bvh, line[k], normal[k], top)
        dr = line_distance(bvh, line[k], -normal[k], top)
        if dl is not None and dr is not None:
            left[k], right[k] = dl, dr
    return normal, left, right


def measure(bvh, line, top):
    n = len(line)
    tangent = np.roll(line, -1, axis=0) - np.roll(line, 1, axis=0)
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1, keepdims=True), 1e-9)
    normal = np.stack([-tangent[:, 1], tangent[:, 0]], axis=1)
    left = np.full(n, np.nan)
    right = np.full(n, np.nan)
    for k in range(n):
        dl = edge_distance(bvh, line[k], normal[k], top)
        dr = edge_distance(bvh, line[k], -normal[k], top)
        if dl is not None and dr is not None:
            left[k], right[k] = dl, dr
    return normal, left, right


# --------------------------------------------------------------------- main

def main():
    source, target, options = parse()
    res = options["res"]
    target_m = options["km"] * 1000.0
    rng = np.random.default_rng(7)
    # method=cycle: solo el grafo del esqueleto (sin trazado real); auto: el trazado real si lo hay.
    geo = None if options["method"] == "cycle" else load_geo(options["geo"], options["geo_id"])
    meshes = import_glb(source)
    log("mallas", len(meshes))

    candidates = []
    for ob in meshes:
        tri, normal = triangles_of(ob)
        if tri is None:
            continue
        flat, area = horizontal(tri, normal)
        if not len(flat) or area.sum() > TERRAIN_AREA or area.sum() < 2000:
            continue
        candidates.append((ob, flat, area))
    if not candidates:
        raise SystemExit("sin mallas horizontales")
    lo = np.min([c[1][:, :, :2].reshape(-1, 2).min(axis=0) for c in candidates], axis=0) - 20
    hi = np.max([c[1][:, :, :2].reshape(-1, 2).max(axis=0) for c in candidates], axis=0) + 20
    shape = tuple(np.ceil((hi - lo) / res).astype(int))
    log("rejilla", shape, "celdas de", res, "m")

    scored = []
    blobs = []
    painted = []
    for ob, flat, area in candidates:
        flat, area, blob_tri, blob_area = ribbon_parts(flat, area, res, rng, int(WIDTH_RANGE[1] / res / 2) + 2)
        if len(blob_tri):
            bp = sample_points(blob_tri, blob_area, res * 2, rng)
            if bp is not None:
                blobs.append(bp)
        if not len(flat):
            continue
        points = sample_points(flat, area, res, rng)
        if points is None:
            continue
        grid = rasterise(points, lo, res, shape)
        rows, cols = np.nonzero(grid)
        if not len(rows):
            continue
        r0, r1, c0, c1 = max(0, rows.min() - 3), rows.max() + 4, max(0, cols.min() - 3), cols.max() + 4
        crop = erode(dilate(grid[r0:r1, c0:c1], 1), 1)
        del grid
        cells = int(crop.sum())
        if cells * res * res < 0.25 * target_m * WIDTH_RANGE[0]:
            continue
        if cells * res * res > 3 * target_m * WIDTH_RANGE[1]:
            continue
        skel = thin(crop, max_iter=int(WIDTH_RANGE[1] / res / 2) + 2)
        if skel is None:
            log(f"  {ob.name}: demasiado ancha para ser pista")
            continue
        skel_len = int(skel.sum()) * res
        width = cells * res * res / max(skel_len, 1)
        log(f"  {ob.name}: esqueleto {skel_len:.0f} m, ancho {width:.1f} m")
        # Líneas pintadas de los bordes: finas y el doble de largas que la vuelta (una a cada lado).
        if 0.4 <= width <= 2.5 and skel_len >= 1.3 * target_m:
            painted.append(ob)
        if WIDTH_RANGE[0] <= width <= WIDTH_RANGE[1]:
            scored.append({"ob": ob, "crop": crop, "at": (r0, c0), "length": skel_len, "width": width})

    def place(item):
        full = np.zeros(shape, dtype=bool)
        r0, c0 = item["at"]
        h, w = item["crop"].shape
        full[r0:r0 + h, c0:c0 + w] = item["crop"][: shape[0] - r0, : shape[1] - c0]
        return full

    primary = max((s for s in scored if s["length"] >= options["min_share"] * target_m), key=lambda s: s["length"], default=None)
    if primary is None:
        raise SystemExit("no hay malla con forma de asfalto (ancho 6-30 m, longitud >= 0,6 x vuelta)")
    def best_cycle(mask):
        mask = fill_holes(erode(dilate(mask, 2), 2), int(600 / (res * res)))
        skel = thin(mask)
        nodes, edges = build_graph(skel)
        edges = contract(prune(edges), res)
        log("esqueleto", int(skel.sum()), "px;", len(nodes), "nodos;", len(edges), "aristas tras podar")
        if len(edges) > 120:
            return None
        rows = []
        for cycle in simple_cycles(edges, limit=200000):
            length = sum(path_length(edges[k]["path"], res) for k in cycle)
            rows.append((abs(length - target_m) / target_m, length, cycle))
        if not rows:
            return None
        rows.sort(key=lambda row: row[0])
        # Con el trazado real, de entre los ciclos de longitud parecida gana el de forma más parecida:
        # una red con trazados interiores, exteriores y de resistencia tiene varios del mismo largo.
        if geo is not None:
            close = [row for row in rows if row[0] <= 0.10][:400]
            if close:
                shaped = []
                for error, length, cycle in close:
                    poly = np.array(cycle_polyline(edges, cycle), dtype=np.float64)[::4] * res
                    # Píxeles (fila, columna) = (x, y) de Blender; la forma no depende del orden de ejes salvo reflexión.
                    shaped.append((shape_rms(poly, geo), error, length, cycle))
                shaped.sort(key=lambda row: row[0])
                rms, error, length, cycle = shaped[0]
                log(f"ciclos {len(rows)}; {len(close)} de longitud parecida; elegido por forma: {length:.0f} m, rms {rms:.0f} m frente al trazado real")
                return error, length, cycle, edges, rms
        log(f"ciclos {len(rows)}; mejor {rows[0][1]:.0f} m (real {target_m:.0f} m)")
        return rows[0][0], rows[0][1], rows[0][2], edges, None

    geo_fit = None
    if geo is not None and scored:
        # Con trazado real: se ajusta sobre el esqueleto de todo el asfalto con forma de cinta y se ciñe a él.
        union = np.zeros(shape, dtype=bool)
        for item in scored:
            union |= place(item)
        union = fill_holes(erode(dilate(union, 2), 2), int(600 / (res * res)))
        skel_all = thin(union)
        cloud = lo + (np.argwhere(skel_all).astype(np.float64) + 0.5) * res
        placed, mean_d, reflected = fit_geo(geo, cloud)
        log(f"trazado real ajustado: distancia media {mean_d:.1f} m{' (modelo reflejado)' if reflected else ''}")
        if mean_d <= 25:
            geo_fit = {"meanM": round(mean_d, 1), "reflected": bool(reflected)}
            line, _ = resample_closed(placed, 2.0)
            # El trazado real es fiable en la forma y el esqueleto en la posición fina: se ciñe poco a poco
            # y con suavizado fuerte (50 m), para no seguir las escapatorias de asfalto.
            for reach in (30.0, 15.0, 8.0):
                snapped, share = snap_to(line, cloud, reach)
                line = smooth_closed(snapped, 25)
                line, _ = resample_closed(line, 2.0)
            log(f"ceñido al asfalto en el {share * 100:.0f} % de la vuelta")
            # Los bordes se miden contra la malla principal del asfalto, no contra todas las cintas.
            chosen = [primary] if primary is not None else scored
            raw_length = float(np.linalg.norm(np.diff(np.vstack([line, line[:1]]), axis=0), axis=1).sum())
            error = abs(raw_length - target_m) / target_m
            geo_rms = mean_d
            pixels = None

    # Primero la malla principal sola; si no cierra la vuelta, se le van sumando las vecinas más largas.
    if geo_fit is None:
        chosen = [primary]
        mask = place(primary)
        found = best_cycle(mask)
        for s in sorted(scored, key=lambda s: -s["length"]):
            if found and (found[4] < 60 if found[4] is not None else found[0] <= 0.05):
                break
            if s is primary:
                continue
            other = place(s)
            if (dilate(other, 3) & dilate(mask, 3)).sum() <= 20:
                continue
            trial = best_cycle(mask | other)
            better = trial and (not found or (trial[4] < found[4] - 5 if trial[4] is not None and found[4] is not None else trial[0] < found[0] - 0.01))
            if better:
                chosen.append(s)
                mask |= other
                found = trial
        if not found:
            raise SystemExit("el esqueleto del asfalto no forma ningún ciclo útil")
        error, raw_length, cycle, edges, geo_rms = found
        log("asfalto:", [s["ob"].name for s in chosen], f"vuelta {raw_length:.0f} m, error {error * 100:.1f} %")
        if error > 0.12:
            raise SystemExit(f"ningún ciclo se acerca a la longitud real (mejor {raw_length:.0f} m)")

    pit_xy = None
    start_source = None
    if geo_fit is None:
        pixels = np.array(cycle_polyline(edges, cycle), dtype=np.float64)
        others = [e["path"] for k, e in enumerate(edges) if k not in cycle]
        for item in scored:
            if item in chosen:
                continue
            sk = thin(item["crop"])
            r0, c0 = item["at"]
            others.append([(i + r0, j + c0) for i, j in np.argwhere(sk)])
        pit = find_pit_lane(pixels, others, res)
        start_source = None
        if pit:
            start_source = "pit-lane"
            log(f"calle de boxes: {pit[3]:.0f} m a {pit[0]:.0f} m del bucle")
        elif blobs:
            blob_mask = rasterise(np.concatenate(blobs), lo, res, shape)
            complex_ = pit_complex(pixels, blob_mask, res)
            if complex_:
                pit = (0.0, complex_[0], complex_[1], complex_[2])
                start_source = "pit-complex"
                log(f"recta junto a boxes/paddock: {complex_[2]:.0f} m")
        if not pit:
            log("sin pista de la meta: la fijará el boceto")
        line = lo + (pixels + 0.5) * res
        pit_xy = None
        if pit:
            n_px = len(pixels)
            span = (pit[2] - pit[1]) % n_px
            pit_xy = [line[(pit[1] + k * span // 4) % n_px].copy() for k in range(5)]
        line = smooth_closed(line, max(3, int(9 / res)))
        line, _ = resample_closed(line, 2.0)

    road_objects = [s["ob"] for s in chosen]
    bvh = make_bvh(road_objects)
    top = max((ob.matrix_world @ Vector(c)).z for ob in road_objects + painted for c in ob.bound_box) + 50
    # Con escapatorias de asfalto (Tilke) el centro del asfalto no es el de la pista: si hay líneas pintadas
    # a ambos lados en la mayor parte de la vuelta, mandan ellas.
    edges = measure
    edge_bvh = bvh
    reference = "asfalto"
    if painted:
        line_bvh = make_bvh(painted)
        _, l0, r0 = measure_lines(line_bvh, line, top)
        share = float(np.mean(~np.isnan(l0 + r0)))
        log(f"líneas pintadas {[ob.name for ob in painted]}: ambos bordes en el {share * 100:.0f} %")
        if share >= 0.6:
            edges, edge_bvh, reference = measure_lines, line_bvh, "líneas pintadas"
    for _ in range(3):
        normal, left, right = edges(edge_bvh, line, top)
        width = left + right
        local = local_median(width)
        valid = ~np.isnan(width) & (width <= 1.2 * local) & (width >= 0.8 * local)
        offset = np.where(valid, (left - right) / 2, 0.0)
        offset = smooth_closed(offset[:, None], 15 if geo_fit else 5)[:, 0]
        offset = np.clip(offset, -3.0, 3.0)
        line = line + normal * offset[:, None]
        line = smooth_closed(line, 9 if geo_fit else 3)
        line, _ = resample_closed(line, 2.0)
    normal, left, right = edges(edge_bvh, line, top)
    width = left + right
    median = float(np.nanmedian(width))
    # Donde la malla se ensancha (incorporaciones, calle de boxes, enlaces) su centro no es el de la pista:
    # ahí ni se corrige ni se mide.
    local = local_median(width)
    valid = ~np.isnan(width) & (width <= 1.2 * local) & (width >= 0.8 * local)
    raw = np.where(valid, (left - right) / 2, np.nan)
    # Desviación robusta: mediana de 5 muestras (8 m). Una spline suave no puede apartarse 5 m del centro en
    # 4 m de recorrido; un pico aislado es un agujero o un solape de la malla, no un error de la línea.
    padded = np.concatenate([raw[-2:], raw, raw[:2]])
    robust = np.array([
        np.nanmedian(np.abs(padded[k:k + 5])) if not np.isnan(raw[k]) and np.count_nonzero(~np.isnan(padded[k:k + 5])) >= 3 else np.nan
        for k in range(len(raw))
    ])
    # Un punto válido entre puntos no medibles (cruces) no tiene vecinos con los que contrastar: no se mide.
    valid = valid & ~np.isnan(robust)
    deviation = robust[valid]
    raw_max = float(np.nanmax(np.abs(raw)))

    heights = []
    for x, y in line:
        hit = bvh.ray_cast(Vector((x, y, top)), Vector((0, 0, -1)), 1e5)
        heights.append(hit[0].z if hit[0] is not None else float("nan"))
    heights = np.array(heights)
    if np.isnan(heights).any():
        idx = np.arange(len(heights))
        good = ~np.isnan(heights)
        heights = np.interp(idx, idx[good], heights[good], period=len(heights))
    closed = np.vstack([line, line[:1]])
    length = float(np.linalg.norm(np.diff(closed, axis=0), axis=1).sum())

    points = [[round(v, 2) for v in gltf_from_blender(float(x), float(y), float(z))] for (x, y), z in zip(line, heights)]
    pit_hint = None
    if pit_xy is not None:
        # Índices de la spline final más cercanos al principio, mitad y final de la calle de boxes.
        marks = [int(np.argmin(((line - p) ** 2).sum(axis=1))) for p in pit_xy]
        pit_hint = {"from": marks[0], "mid": marks[2], "to": marks[-1], "lengthM": round(pit[3]), "offsetM": round(pit[0], 1), "source": start_source}
    result = {
        "generator": f"extract_spline.py v{VERSION}",
        "source": os.path.basename(source),
        "frame": "gltf",
        "stepM": 2.0,
        "lengthM": round(length, 1),
        "realKm": options["km"],
        "lengthError": round((length - target_m) / target_m, 4),
        "cycleShapeRmsM": None if geo_rms is None else round(geo_rms, 1),
        "geoFit": geo_fit,
        "roadObjects": [ob.name for ob in road_objects],
        "pitLane": pit_hint,
        "medianWidthM": round(median, 2),
        "edgeReference": reference,
        "deviation": {
            "maxM": round(float(deviation.max()), 3),
            "p95M": round(float(np.percentile(deviation, 95)), 3),
            "meanM": round(float(deviation.mean()), 3),
            "measuredShare": round(float(valid.mean()), 3),
            "rawMaxM": round(raw_max, 3),
            "method": f"mediana de 5 muestras de |d_izq - d_der| / 2 respecto a los bordes ({reference}), donde el ancho está entre 0,8 y 1,2 veces su mediana local",
        },
        "widths": [None if not v else round(float(w), 2) for v, w in zip(valid, width)],
        "offsets": [None if not v else round(float((l - r) / 2), 3) for v, l, r in zip(valid, left, right)],
        "points": points,
    }
    write_json(target, result)
    log("spline", target, f"{length:.0f} m", result["deviation"])


if __name__ == "__main__":
    main()
