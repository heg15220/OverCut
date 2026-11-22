"""Eje central del asfalto de un circuito GLB -> spline JSON (RF-3D-03, criterio 7.2: desviación <= 2 m).

Uso:
  blender -b --python extract_spline.py -- <circuito.glb> <salida.json> --km <longitud real> [--res 1.0]
      [--geo <f1-circuits.geojson> --geo-id <id>] [--method auto|cycle|cycle-geo|cycle-geo-2pass]
      [--group object|material] [--road <malla,...>] [--geo-scale] [--guide-reach <m>]
  blender -b --python extract_spline.py -- <circuito preparado.glb> <salida.widths.json> --widths <spline alineada.json>
      [--group object|material] [--painted <malla,...>] [--preview-bg <fondo.png> [--bg-size 6144]]

  --widths (WP1 de docs/manager/SIM-FISICA.md): no extrae nada; mide la distancia de cada punto de la spline
           alineada a los bordes izquierdo y derecho (líneas pintadas y asfalto) y, con --preview-bg, renderiza la
           vista cenital que usa tools/assets/racing_line.mjs para las vistas de revisión.

  --method auto (por defecto): con trazado real, se ajusta y se ciñe al esqueleto; si no, ciclos.
           cycle: ciclos del grafo, el de longitud más cercana a la real.
           cycle-geo: ciclos del grafo, pero solo con las aristas que siguen al trazado real ajustado
             (a menos de --guide-reach m, 30 por defecto) y elegidos por forma.
           cycle-geo-2pass: como cycle-geo, pero la guía se ajusta sobre el ciclo más parecido por forma
             (redes de calles como Mónaco, donde el ajuste directo cae en un mínimo local).
  --group material: une por material las caras de todas las mallas (modelos troceados en teselas; el material
           del asfalto recorre toda la vuelta). Activa además: ancho <= 1,6 x mediana para medir y desplazamiento
           interpolado a través de huecos cortos sin medir.
  --road: fija a mano la malla (o material) del asfalto.

Cruces a distinto nivel (puentes, túnel): si bajo un nodo del grafo hay asfalto en dos capas separadas más de
4 m, el cruce se parte en dos pasos rectos; los rayos de bordes y alturas se ciñen a la capa de la línea. Las
cintas más de 3,5 m por encima del asfalto principal (tejados de boxes, gradas) se descartan.

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

import json
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
    options = {"km": None, "res": 1.0, "min_share": 0.6, "geo": None, "geo_id": None, "method": "auto", "group": "object", "geo_scale": False, "road": None, "guide_reach": 30.0,
               "widths": None, "painted": None, "preview_bg": None, "bg_size": 6144}
    i = 2
    while i < len(args):
        if args[i] == "--widths":
            # Modo anchura (SIM-FISICA §3.1, WP1): mide los bordes de la spline ALINEADA que se pasa, sin
            # volver a extraerla. <circuito.glb> es entonces el GLB preparado (mismas coordenadas glTF).
            options["widths"] = args[i + 1]; i += 2
        elif args[i] == "--painted":
            options["painted"] = [name for name in args[i + 1].split(",") if name]; i += 2
        elif args[i] == "--preview-bg":
            options["preview_bg"] = args[i + 1]; i += 2
        elif args[i] == "--bg-size":
            options["bg_size"] = int(args[i + 1]); i += 2
        elif args[i] == "--km":
            options["km"] = float(args[i + 1]); i += 2
        elif args[i] == "--geo":
            options["geo"] = args[i + 1]; i += 2
        elif args[i] == "--geo-id":
            options["geo_id"] = args[i + 1]; i += 2
        elif args[i] == "--method":
            options["method"] = args[i + 1]; i += 2
        elif args[i] == "--group":
            # object (por defecto): cada malla es una pieza; material: se unen por material todas las mallas
            # (modelos troceados en teselas, donde ninguna malla sola tiene la vuelta entera).
            options["group"] = args[i + 1]; i += 2
        elif args[i] == "--road":
            options["road"] = args[i + 1].split(","); i += 2
        elif args[i] == "--guide-reach":
            # cycle-geo: distancia (m) a la guía para que una arista cuente; 0 = sin guía, solo forma.
            options["guide_reach"] = float(args[i + 1]); i += 2
        elif args[i] == "--geo-scale":
            options["geo_scale"] = True; i += 1
        elif args[i] == "--res":
            options["res"] = float(args[i + 1]); i += 2
        else:
            raise SystemExit(f"argumento desconocido {args[i]}")
    if not options["km"] and not options["widths"]:
        raise SystemExit("--km es obligatorio: la longitud real elige el ciclo del GP")
    return source, target, options


# --------------------------------------------------------------- rasterising

class MaterialPart:
    """Todas las caras de un material, de todas las mallas (`--group material`). Hace de objeto para el resto
    del script: nombre, triángulos de mundo y caja."""

    def __init__(self, name, tri):
        self.name = name
        self.tri = tri
        self.zmax = float(tri[:, :, 2].max())


def material_parts(meshes):
    groups = {}
    for ob in meshes:
        mesh = ob.data
        mesh.calc_loop_triangles()
        count = len(mesh.loop_triangles)
        if not count:
            continue
        verts = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
        mesh.vertices.foreach_get("co", verts)
        verts = verts.reshape(-1, 3)
        m = np.array(ob.matrix_world)
        verts = verts @ m[:3, :3].T + m[:3, 3]
        idx = np.empty(count * 3, dtype=np.int64)
        mesh.loop_triangles.foreach_get("vertices", idx)
        mat = np.empty(count, dtype=np.int64)
        mesh.loop_triangles.foreach_get("material_index", mat)
        tri = verts[idx.reshape(-1, 3)]
        slots = [s.material.name if s.material else "-" for s in ob.material_slots] or ["-"]
        for k in np.unique(mat):
            groups.setdefault(slots[min(int(k), len(slots) - 1)], []).append(tri[mat == k])
    return [MaterialPart(name, np.concatenate(chunks)) for name, chunks in groups.items()]


def top_of(objects):
    return max(ob.zmax if isinstance(ob, MaterialPart) else max((ob.matrix_world @ Vector(c)).z for c in ob.bound_box) for ob in objects)


def triangles_of(ob):
    """Triángulos en coordenadas de mundo (n, 3, 3) y sus normales."""
    if isinstance(ob, MaterialPart):
        tri = ob.tri
        return tri, np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
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


ELEVATED = 3.5  # m: una cinta cuya mediana está más alta que esto sobre el asfalto es un tejado o una grada


def height_grid(tri, area, cell=8.0, fill=3):
    """Altura media de unas caras por celda de `cell` m, extendida `fill` celdas a las vacías vecinas."""
    pts = sample_points_z(tri, area, cell, np.random.default_rng(5))
    origin = pts[:, :2].min(axis=0) - (fill + 2) * cell
    ij = np.floor((pts[:, :2] - origin) / cell).astype(np.int64)
    shape = tuple(ij.max(axis=0) + fill + 3)
    total = np.zeros(shape)
    count = np.zeros(shape)
    np.add.at(total, (ij[:, 0], ij[:, 1]), pts[:, 2])
    np.add.at(count, (ij[:, 0], ij[:, 1]), 1)
    for _ in range(fill):
        empty = count == 0
        t2, c2 = total.copy(), count.copy()
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            t2 += np.where(empty, shift(total, di, dj), 0)
            c2 += np.where(empty, shift(count, di, dj), 0)
        total, count = t2, c2
    with np.errstate(invalid="ignore", divide="ignore"):
        return total / count, origin, cell


def elevation_over(tri, area, grid):
    """Mediana de la altura de unas caras sobre la rejilla `grid` (NaN si no se solapan)."""
    z, origin, cell = grid
    pts = sample_points_z(tri, area, cell, np.random.default_rng(6))
    ij = np.floor((pts[:, :2] - origin) / cell).astype(np.int64)
    ok = (ij[:, 0] >= 0) & (ij[:, 1] >= 0) & (ij[:, 0] < z.shape[0]) & (ij[:, 1] < z.shape[1])
    d = pts[ok, 2] - z[ij[ok, 0], ij[ok, 1]]
    d = d[~np.isnan(d)]
    return float(np.median(d)) if len(d) else float("nan")


def sample_points_z(tri, area, step, rng, cap=4_000_000):
    """Puntos (x, y, z) sobre los triángulos, unos dos por celda de `step` m, más los vértices."""
    per = np.maximum(1, np.ceil(area / (step * step * 0.5))).astype(np.int64)
    if per.sum() > cap:
        per = np.maximum(1, (per * cap / per.sum()).astype(np.int64))
    which = np.repeat(np.arange(len(tri)), per)
    u = rng.random(len(which))
    v = rng.random(len(which))
    flip = u + v > 1
    u[flip] = 1 - u[flip]
    v[flip] = 1 - v[flip]
    a, b, c = tri[which, 0], tri[which, 1], tri[which, 2]
    return np.concatenate([a + (b - a) * u[:, None] + (c - a) * v[:, None], tri.reshape(-1, 3)])


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


def largest_component(skel):
    """Píxeles de la mayor pieza conexa (vecindad 8) de un esqueleto."""
    from collections import deque
    pix = set(map(tuple, np.argwhere(skel)))
    best = 0
    while pix:
        queue, size = deque([pix.pop()]), 0
        while queue:
            i, j = queue.popleft()
            size += 1
            for di, dj in NEIGH:
                q = (i + di, j + dj)
                if q in pix:
                    pix.discard(q)
                    queue.append(q)
        best = max(best, size)
    return best


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


def split_bridges(nodes, edges, res, lo, bvh, top, reach=40.0, gap=4.0):
    """Cruces a distinto nivel (puente de Suzuka): en planta las dos calzadas se funden en un cruce del grafo
    y la vuelta, que pasa dos veces por él, no es un ciclo simple. Si bajo un nodo hay asfalto en dos capas
    separadas más de `gap` m, el grupo de nodos del cruce (unidos por aristas de menos de `reach` m) se parte
    en dos nodos de paso, emparejando las cuatro aristas que salen por continuidad de rumbo. Un cruce a nivel
    (sin dos capas) no se toca. Devuelve (aristas, número de puentes partidos)."""
    used = sorted({e["a"] for e in edges} | {e["b"] for e in edges})
    centre = {n: lo + (np.mean(np.asarray(nodes[n], dtype=np.float64), axis=0) + 0.5) * res for n in used}

    def layered(n):
        x, y = centre[n]
        return any(len(h) > 1 and h[0] - h[-1] > gap for h in
                   (all_hits(bvh, x + dx, y + dy, top) for dx, dy in ((0, 0), (4, 0), (-4, 0), (0, 4), (0, -4))))

    bridges = [n for n in used if layered(n)]
    done, count = set(), 0
    next_id = len(nodes)
    for seed in bridges:
        if seed in done:
            continue
        cluster, stack = {seed}, [seed]
        while stack:
            n = stack.pop()
            for e in edges:
                if n in (e["a"], e["b"]) and path_length(e["path"], res) < reach:
                    other = e["b"] if e["a"] == n else e["a"]
                    if other not in cluster:
                        cluster.add(other)
                        stack.append(other)
        done |= cluster
        external = [k for k, e in enumerate(edges) if (e["a"] in cluster) != (e["b"] in cluster)]
        internal = [k for k, e in enumerate(edges) if e["a"] in cluster and e["b"] in cluster]
        if len(external) != 4:
            log(f"cruce a dos niveles con {len(external)} salidas: no se parte")
            continue
        mid = np.mean([centre[n] for n in cluster], axis=0)
        heads = []
        for k in external:
            e = edges[k]
            path = e["path"] if e["a"] in cluster else list(reversed(e["path"]))
            pts = lo + (np.asarray(path, dtype=np.float64) + 0.5) * res
            far = np.flatnonzero(np.linalg.norm(pts - mid, axis=1) >= 30.0)
            tip = pts[far[0]] if len(far) else pts[-1]
            d = tip - mid
            heads.append(d / max(np.linalg.norm(d), 1e-9))
        pairings = [((0, 1), (2, 3)), ((0, 2), (1, 3)), ((0, 3), (1, 2))]
        score = [sum(-float(heads[a] @ heads[b]) for a, b in pr) for pr in pairings]
        best = int(np.argmax(score))
        if score[best] < 1.5:
            log(f"cruce a dos niveles sin pasos rectos claros (rectitud {score[best]:.2f}): no se parte")
            continue
        edges = [dict(e) for e in edges]
        for a, b in pairings[best]:
            for k in (external[a], external[b]):
                e = edges[k]
                if e["a"] in cluster:
                    e["a"] = next_id
                else:
                    e["b"] = next_id
            next_id += 1
        edges = [e for k, e in enumerate(edges) if k not in internal]
        count += 1
        log(f"puente partido en dos pasos ({len(cluster)} nodos, rectitud {score[best]:.2f})")
    return edges, count


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


def kabsch(src, dst, scaled=False):
    """Giro y traslación que llevan src sobre dst (2D; con `scaled`, también escala uniforme: Umeyama)."""
    cs, cd = src.mean(axis=0), dst.mean(axis=0)
    h = (src - cs).T @ (dst - cd)
    angle = math.atan2(h[0, 1] - h[1, 0], h[0, 0] + h[1, 1])
    rot = np.array([[math.cos(angle), -math.sin(angle)], [math.sin(angle), math.cos(angle)]])
    if scaled:
        k = float(np.clip(np.sum((dst - cd) * ((src - cs) @ rot.T)) / max(np.sum((src - cs) ** 2), 1e-9), 0.97, 1.03))
        rot = rot * k
    return rot, cd - cs @ rot.T


def fit_geo(geo, skeleton_pts, scaled=False):
    """ICP rígido del trazado real sobre el esqueleto del asfalto, probando giros cada 5 grados y la
    reflexión. Devuelve (trazado colocado, distancia media, reflejado). Con `scaled` (`--geo-scale`) el ICP
    también ajusta la escala: para modelos que no están a escala real."""
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
                rot, shift = kabsch(current[keep], cloud[k[keep]], scaled)
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
        if isinstance(ob, MaterialPart):
            base = len(verts)
            verts.extend(Vector(v) for v in ob.tri.reshape(-1, 3).tolist())
            polys.extend([base + 3 * k, base + 3 * k + 1, base + 3 * k + 2] for k in range(len(ob.tri)))
            continue
        m = ob.matrix_world
        base = len(verts)
        verts.extend(m @ v.co for v in ob.data.vertices)
        polys.extend([base + i for i in p.vertices] for p in ob.data.polygons)
    return BVHTree.FromPolygons(verts, polys, all_triangles=False)


LEVEL_BAND = 3.0  # m: en un circuito con puentes, el asfalto "propio" está a menos de esto de la altura de la línea


def road_at(bvh, x, y, top):
    """Primer impacto vertical. Si `top` es (techo, z), solo vale asfalto a ±LEVEL_BAND de z: bajo un puente
    se ignora el tablero y sobre él la calzada de abajo."""
    if isinstance(top, tuple):
        ceiling, level = top
        start = ceiling
        while True:
            hit = bvh.ray_cast(Vector((x, y, start)), Vector((0, 0, -1)), 1e5)[0]
            if hit is None or hit.z < level - LEVEL_BAND:
                return None
            if hit.z <= level + LEVEL_BAND:
                return hit
            start = hit.z - 0.01
    hit = bvh.ray_cast(Vector((x, y, top)), Vector((0, 0, -1)), 1e5)
    return hit[0]


def all_hits(bvh, x, y, top, limit=12):
    """Alturas de todos los impactos verticales, de arriba abajo (sin repetir capas a menos de 0,5 m)."""
    out, start = [], top
    for _ in range(limit):
        hit = bvh.ray_cast(Vector((x, y, start)), Vector((0, 0, -1)), 1e5)[0]
        if hit is None:
            break
        if not out or out[-1] - hit.z > 0.5:
            out.append(hit.z)
        start = hit.z - 0.01
    return out


def circular_median(values, half):
    """Mediana móvil circular (±half muestras), ignorando NaN."""
    n = len(values)
    padded = np.concatenate([values[-half:], values, values[:half]])
    windows = np.lib.stride_tricks.sliding_window_view(padded, 2 * half + 1)
    with np.errstate(all="ignore"):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            return np.nanmedian(windows, axis=1)[:n]


def road_heights(bvh, line, top, jump=1.5):
    """Altura de la calzada bajo cada punto (RF-3D-03). El primer impacto desde arriba puede ser un pórtico,
    un puente o la calzada de arriba en un túnel: se toman todos los impactos contra el asfalto y se sigue la
    superficie a lo largo de la vuelta, eligiendo en cada punto el impacto más cercano a la altura prevista por
    los anteriores (altura + pendiente). Se empieza en un punto con una sola capa. Al final, los picos de menos
    de 4 muestras que se separan más de `jump` m de la mediana de 9 se sustituyen por ella."""
    hits = [all_hits(bvh, x, y, top) for x, y in line]
    n = len(hits)
    if not any(hits):
        raise SystemExit("ningún rayo vertical toca el asfalto bajo la línea")
    single = [k for k, h in enumerate(hits) if h and h[0] - h[-1] <= 1.0]
    seed = single[0] if single else next(k for k, h in enumerate(hits) if h)
    z = np.full(n, np.nan)
    prev = hits[seed][-1] if not single else hits[seed][0]
    slope = 0.0
    missed = 0
    for step in range(n):
        k = (seed + step) % n
        h = hits[k]
        if h:
            pred = prev + slope * (missed + 1)
            value = min(h, key=lambda v: abs(v - pred))
            # Solo otra capa (hueco en la calzada propia, p. ej. bajo un puente de otro material): se
            # interpola, salvo que dure más de 60 m (entonces la previsión es la que está mal).
            if abs(value - pred) > LEVEL_BAND and missed < 30:
                missed += 1
                continue
            if step:
                slope = float(np.clip(0.8 * slope + 0.2 * (value - prev) / (missed + 1), -0.5, 0.5))
            prev = value
            missed = 0
            z[k] = value
    idx = np.arange(n)
    ok = ~np.isnan(z)
    z = np.interp(idx, idx[ok], z[ok], period=n)
    smooth = circular_median(z, 4)
    return np.where(np.abs(z - smooth) > jump, smooth, z)


def level_heights(bvh, line, top, gap=4.0):
    """Altura del asfalto bajo cada punto, eligiendo en los cruces a distinto nivel la capa continua con los
    vecinos (no la más alta). Devuelve (alturas, hay_varios_niveles)."""
    hits = [all_hits(bvh, x, y, top) for x, y in line]
    n = len(hits)
    z = np.full(n, np.nan)
    ambiguous = np.zeros(n, dtype=bool)
    for k, h in enumerate(hits):
        if not h:
            continue
        if h[0] - h[-1] > gap:
            ambiguous[k] = True
        else:
            z[k] = h[0]
    if not ambiguous.any():
        return z, False
    idx = np.arange(n)
    good = ~np.isnan(z)
    if good.sum() < 2:
        return np.array([h[0] if h else np.nan for h in hits]), True
    guess = np.interp(idx, idx[good], z[good], period=n)
    for k in np.flatnonzero(ambiguous):
        z[k] = min(hits[k], key=lambda v: abs(v - guess[k]))
    return z, True


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


def bridge_gaps(offset, valid, longest=40):
    """Dentro de un tramo sin medir de hasta `longest` muestras, el desplazamiento se interpola entre los dos
    extremos medidos (en vez de 0): una línea que entra desviada en un cruce o en la entrada de boxes sale
    corregida por el otro lado. Solo con `--group material`."""
    n = len(offset)
    if valid.all() or not valid.any():
        return offset
    out = offset.copy()
    start = int(np.flatnonzero(valid)[0])
    k = 0
    while k < n:
        i = (start + k) % n
        if valid[i]:
            k += 1
            continue
        j = k
        while j < n and not valid[(start + j) % n]:
            j += 1
        gap = j - k
        if gap <= longest:
            a = offset[(start + k - 1) % n]
            b = offset[(start + j) % n]
            for m in range(gap):
                out[(start + k + m) % n] = a + (b - a) * (m + 1) / (gap + 1)
        k = j
    return out


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
        at = (top[0], float(top[1][k])) if isinstance(top, tuple) else top
        dl = line_distance(bvh, line[k], normal[k], at)
        dr = line_distance(bvh, line[k], -normal[k], at)
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
        at = (top[0], float(top[1][k])) if isinstance(top, tuple) else top
        dl = edge_distance(bvh, line[k], normal[k], at)
        dr = edge_distance(bvh, line[k], -normal[k], at)
        if dl is not None and dr is not None:
            left[k], right[k] = dl, dr
    return normal, left, right


# ------------------------------------------------------------ widths (WP1)

def render_background(meshes, line, target, size):
    """Vista cenital (Workbench, color de textura sin luz) para las vistas de revisión de racing_line.mjs.
    Encuadre igual que preview_spline.py: cuadrado centrado en la caja de la spline, lado 1,1 x su mayor lado.
    Devuelve el encuadre en coordenadas de Blender para pasar de metros a píxeles."""
    lo, hi = line.min(axis=0), line.max(axis=0)
    span = float(max(hi - lo))
    for ob in meshes:
        corners = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
        if max(c.x for c in corners) - min(c.x for c in corners) > 3 * span:
            ob.hide_render = True
    scene = bpy.context.scene
    cam = bpy.data.objects.new("widths_bg", bpy.data.cameras.new("widths_bg"))
    scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = span * 1.1
    cam.data.clip_end = 1e6
    centre = (lo + hi) / 2
    cam.location = (float(centre[0]), float(centre[1]), 20000)
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "TEXTURE"
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15
    scene.render.filepath = target
    bpy.ops.render.render(write_still=True)
    return {"file": os.path.basename(target), "size": size, "cx": round(float(centre[0]), 3), "cy": round(float(centre[1]), 3),
            "scale": round(span * 1.1, 3), "frame": "blender (x, -z_gltf)"}


def measure_widths(source, target, options):
    """Anchura de pista de la spline alineada (SIM-FISICA §3.1, WP1; RF-3D-03, criterio 7.2).

    Por cada punto (cada 2 m, desde la meta en el sentido de carrera) mide con rayos verticales la distancia
    a los bordes a la izquierda y a la derecha del sentido de carrera, con las mismas funciones que el
    recentrado: hasta las líneas pintadas (`measure_lines`) si cubren ambos bordes en >= 60 % de la vuelta (son
    los límites de pista) y siempre hasta el borde del asfalto (`measure`). No rellena huecos ni filtra: eso
    lo hace racing_line.mjs, que es quien decide qué anchura usa la trazada."""
    data = json.load(open(options["widths"], encoding="utf-8"))
    meshes = import_glb(source)
    parts = material_parts(meshes) if options["group"] == "material" else meshes
    by_name = {ob.name: ob for ob in parts}
    road = [by_name[name] for name in data["roadObjects"] if name in by_name]
    if len(road) != len(data["roadObjects"]):
        missing = [name for name in data["roadObjects"] if name not in by_name]
        raise SystemExit(f"el GLB no tiene las mallas del asfalto de la spline: {missing}")
    painted = [by_name[name] for name in (options["painted"] or []) if name in by_name]
    # glTF (x, y arriba, z) -> Blender (x, -z, y)
    pts = np.array(data["points"], dtype=np.float64)
    line = np.stack([pts[:, 0], -pts[:, 2]], axis=1)
    heights = pts[:, 1]
    bvh = make_bvh(road)
    top = top_of(road + painted) + 50
    multilevel = bool(data.get("multiLevel")) or level_heights(bvh, line, top)[1]
    # En cruces a distinto nivel los rayos se ciñen a la capa de la propia spline (su altura ya es la de la
    # calzada, road_heights), igual que en la extracción.
    probe = (top, heights) if multilevel else top
    log(f"anchura: {len(line)} puntos, asfalto {[ob.name for ob in road]}, líneas {[ob.name for ob in painted]}"
        + (", varios niveles" if multilevel else ""))
    # `measure` devuelve (normal, izquierda, derecha) con normal = tangente girada +90 grados en el plano de
    # Blender (Z arriba): la izquierda del sentido de carrera.
    _, asphalt_left, asphalt_right = measure(bvh, line, probe)
    reference = "asfalto"
    left, right = asphalt_left, asphalt_right
    painted_share = None
    if painted:
        _, line_left, line_right = measure_lines(make_bvh(painted), line, probe)
        painted_share = float(np.mean(~np.isnan(line_left + line_right)))
        log(f"líneas pintadas: ambos bordes en el {painted_share * 100:.0f} %")
        if painted_share >= 0.6:
            reference, left, right = "líneas pintadas", line_left, line_right

    def rounded(values):
        return [None if np.isnan(v) else round(float(v), 2) for v in values]

    result = {
        "generator": f"extract_spline.py v{VERSION} --widths",
        "source": os.path.basename(source),
        "spline": os.path.basename(options["widths"]),
        "frame": "gltf",
        "stepM": data.get("stepM", 2.0),
        "count": len(line),
        "edgeReference": reference,
        "paintedObjects": [ob.name for ob in painted],
        "paintedShare": None if painted_share is None else round(painted_share, 3),
        "multiLevel": bool(multilevel),
        "side": "left/right del sentido de carrera, en metros desde la spline",
        "left": rounded(left),
        "right": rounded(right),
        "asphaltLeft": rounded(asphalt_left),
        "asphaltRight": rounded(asphalt_right),
    }
    if options["preview_bg"]:
        result["background"] = render_background(meshes, line, options["preview_bg"], options["bg_size"])
    write_json(target, result)
    both = ~np.isnan(left + right)
    log("anchura", target, f"{reference}: medida en el {both.mean() * 100:.0f} %, mediana {np.nanmedian(left + right):.1f} m")


# --------------------------------------------------------------------- main

def main():
    source, target, options = parse()
    if options["widths"]:
        return measure_widths(source, target, options)
    res = options["res"]
    target_m = options["km"] * 1000.0
    rng = np.random.default_rng(7)
    # method=cycle: solo el grafo del esqueleto (sin trazado real); auto: el trazado real si lo hay.
    geo = None if options["method"] == "cycle" else load_geo(options["geo"], options["geo_id"])
    meshes = import_glb(source)
    log("mallas", len(meshes))
    if options["group"] == "material":
        meshes = material_parts(meshes)
        log("piezas por material", len(meshes))

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
        if skel is None and options["group"] == "material":
            # Un material reúne pista, calle de boxes y explanadas pegadas: se recortan las zonas donde cabe
            # un disco más ancho que una pista (apertura morfológica) y se queda la cinta.
            r = int(WIDTH_RANGE[1] / res / 2)
            wide = dilate(erode(crop, r), r + 2)
            trimmed = crop & ~wide
            skel = thin(trimmed, max_iter=r + 2)
            if skel is not None:
                # El ancho y la longitud se miden sin las explanadas; el grafo y los bordes usan la malla entera
                # (recortar partiría la recta de boxes, que va pegada a la calle de boxes).
                log(f"  {ob.name}: sin contar {int((crop & wide).sum() * res * res)} m2 de explanadas")
                cells = int(trimmed.sum())
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
            item = {"ob": ob, "crop": crop, "at": (r0, c0), "length": skel_len, "width": width, "tri": flat, "area": area}
            if options["group"] == "material":
                # Un material suelto (arcenes, aceras, bordillos) suma mucho esqueleto en trozos: para elegir el
                # asfalto cuenta solo la pieza conexa más larga.
                # (sobre el esqueleto sin recortar: recortar las explanadas puede partir la cinta en dos).
                item["length"] = largest_component(thin(fill_holes(erode(dilate(crop, 2), 2), int(600 / (res * res))))) * res
                log(f"    pieza conexa más larga {item['length']:.0f} m")
            scored.append(item)

    def place(item):
        full = np.zeros(shape, dtype=bool)
        r0, c0 = item["at"]
        h, w = item["crop"].shape
        full[r0:r0 + h, c0:c0 + w] = item["crop"][: shape[0] - r0, : shape[1] - c0]
        return full

    primary = max((s for s in scored if s["length"] >= options["min_share"] * target_m), key=lambda s: s["length"], default=None)
    if options["road"]:
        # Revisión manual (`--road`): el asfalto lo dice la configuración, no la forma (escapatorias de asfalto
        # más largas que la pista, como en Nürburgring).
        named = [s for s in scored if s["ob"].name in options["road"]]
        if not named:
            raise SystemExit(f"--road {options['road']}: ninguna malla con forma de cinta se llama así")
        primary = named[0]
        scored = named + [s for s in scored if s not in named]
        log("asfalto fijado por --road:", [s["ob"].name for s in named])
    if primary is None:
        raise SystemExit("no hay malla con forma de asfalto (ancho 6-30 m, longitud >= 0,6 x vuelta)")
    # Tejados de boxes, gradas y pasarelas también son cintas horizontales de 6-30 m: si su mediana queda más
    # de ELEVATED m por encima del asfalto principal cercano, no entran ni en la máscara ni en la nube del
    # ajuste al trazado real (la spline se iba al tejado de boxes en Spa y Bahrain).
    prim_grid = height_grid(primary["tri"], primary["area"])
    kept = []
    for item in scored:
        if item is not primary:
            up = elevation_over(item["tri"], item["area"], prim_grid)
            if up > ELEVATED:
                log(f"  {item['ob'].name}: {up:.1f} m por encima del asfalto (tejado o grada): descartada")
                continue
        kept.append(item)
    scored = kept
    bvh_cache = []

    def primary_bvh():
        if not bvh_cache:
            bvh_cache.append(make_bvh([primary["ob"]]))
        return bvh_cache[0]

    primary_top = top_of([primary["ob"]]) + 50

    def best_cycle(mask):
        mask = fill_holes(erode(dilate(mask, 2), 2), int(600 / (res * res)))
        skel = thin(mask)
        nodes, edges = build_graph(skel)
        edges = prune(edges)
        if guide is not None:
            def follows(e):
                pts = lo + (np.asarray(e["path"][::3], dtype=np.float64) + 0.5) * res
                return float(np.mean(nearest(pts, guide)[1] < options["guide_reach"])) >= 0.7
            kept = [e for e in edges if follows(e)]
            log(f"guía del trazado real: {len(kept)} de {len(edges)} aristas lo siguen")
            edges = prune(kept)
        edges = contract(edges, res)
        edges, bridges = split_bridges(nodes, edges, res, lo, primary_bvh(), primary_top)
        if bridges:
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

    # method=cycle-geo: el trazado real solo guía la elección del ciclo (redes de calles como Mónaco, donde
    # muchos ciclos miden lo mismo): se ajusta sobre el esqueleto y solo cuentan las aristas que lo siguen.
    guide = None
    if options["method"] == "cycle-geo" and geo is not None and options["guide_reach"] > 0:
        if options["group"] == "material":
            base = place(primary)
        else:
            base = np.zeros(shape, dtype=bool)
            for item in scored:
                base |= place(item)
        base = fill_holes(erode(dilate(base, 2), 2), int(600 / (res * res)))
        cloud = lo + (np.argwhere(thin(base)).astype(np.float64) + 0.5) * res
        guide, mean_d, reflected = fit_geo(geo, cloud, options["geo_scale"])
        guide, _ = resample_closed(guide, 4.0)
        log(f"trazado real como guía: distancia media {mean_d:.1f} m{' (modelo reflejado)' if reflected else ''}")
        if os.environ.get("OVERCUT_DEBUG_GUIDE"):
            write_json(os.environ["OVERCUT_DEBUG_GUIDE"], {"points": [[float(x), 0.0, -float(y)] for x, y in guide]})

    if options["method"] == "cycle-geo-2pass" and geo is not None:
        # Dos pasadas (Mónaco): en una red de calles el ICP del trazado real sobre todo el esqueleto cae en un
        # mínimo local. Primero se elige por forma el ciclo más parecido al trazado real; luego el trazado real se
        # ajusta solo sobre ese ciclo (sin ambigüedad) y hace de guía para repetir la búsqueda.
        first = best_cycle(place(primary))
        if first:
            poly = lo + (np.array(cycle_polyline(first[3], first[2]), dtype=np.float64) + 0.5) * res
            guide, mean_d, reflected = fit_geo(geo, poly[::2], options["geo_scale"])
            guide, _ = resample_closed(guide, 4.0)
            log(f"guía ajustada sobre el ciclo de la primera pasada: distancia media {mean_d:.1f} m")
            if os.environ.get("OVERCUT_DEBUG_GUIDE"):
                write_json(os.environ["OVERCUT_DEBUG_GUIDE"], {"points": [[float(x), 0.0, -float(y)] for x, y in guide]})

    geo_fit = None
    if geo is not None and scored and options["method"] == "auto":
        # Con trazado real: se ajusta sobre el esqueleto de todo el asfalto con forma de cinta y se ciñe a él.
        union = np.zeros(shape, dtype=bool)
        for item in scored:
            union |= place(item)
        union = fill_holes(erode(dilate(union, 2), 2), int(600 / (res * res)))
        skel_all = thin(union)
        cloud = lo + (np.argwhere(skel_all).astype(np.float64) + 0.5) * res
        placed, mean_d, reflected = fit_geo(geo, cloud, options["geo_scale"])
        geo_scale = float(np.linalg.norm(np.diff(np.vstack([placed, placed[:1]]), axis=0), axis=1).sum()
                          / np.linalg.norm(np.diff(np.vstack([resample_n(geo, 400), resample_n(geo, 400)[:1]]), axis=0), axis=1).sum())
        log(f"trazado real ajustado: distancia media {mean_d:.1f} m{' (modelo reflejado)' if reflected else ''}"
            f"{f', escala {geo_scale:.3f}' if options['geo_scale'] else ''}")
        if options["group"] == "material" and primary is not None:
            # Por material, las cintas vecinas son pianos, escapatorias y arcenes: se ciñe solo al asfalto.
            own = fill_holes(erode(dilate(place(primary), 2), 2), int(600 / (res * res)))
            cloud = lo + (np.argwhere(thin(own)).astype(np.float64) + 0.5) * res
        if mean_d <= 25:
            geo_fit = {"meanM": round(mean_d, 1), "reflected": bool(reflected)}
            if options["geo_scale"]:
                geo_fit["scale"] = round(geo_scale, 4)
            line, _ = resample_closed(placed, 2.0)
            # El trazado real es fiable en la forma y el esqueleto en la posición fina: se ciñe poco a poco
            # y con suavizado fuerte (50 m), para no seguir las escapatorias de asfalto.
            for reach in (30.0, 15.0, 8.0):
                snapped, share = snap_to(line, cloud, reach)
                line = smooth_closed(snapped, 25)
                line, _ = resample_closed(line, 2.0)
            log(f"ceñido al asfalto en el {share * 100:.0f} % de la vuelta")
            # Los bordes se miden contra la malla principal del asfalto, no contra todas las cintas.
            if options["road"]:
                chosen = [s for s in scored if s["ob"].name in options["road"]]
            else:
                # Asfalto partido en varias mallas (Interlagos, Spa): cuenta cada cinta por la que pasa la
                # línea al menos 60 m (a menos de 6 m de su esqueleto), no solo la más larga.
                chosen = [primary]
                for item in scored:
                    if item is primary:
                        continue
                    sk = lo + (np.argwhere(thin(item["crop"])).astype(np.float64) + 0.5) * res + np.array(item["at"]) * res
                    if len(sk) and np.count_nonzero(nearest(line, sk)[1] < 6.0) * 2.0 >= 60.0:
                        chosen.append(item)
                log("asfalto bajo la línea:", [s["ob"].name for s in chosen])
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
    top = top_of(road_objects + painted) + 50
    # Cruces a distinto nivel (puente de Suzuka, túnel de Mónaco): si bajo la línea hay asfalto en dos capas
    # separadas más de 4 m, los rayos solo cuentan la capa de la propia línea. Sin cruces, nada cambia.
    _, multilevel = level_heights(bvh, line, top)

    def probe(line):
        return (top, level_heights(bvh, line, top)[0]) if multilevel else top

    if multilevel:
        log("asfalto a varios niveles: rayos ceñidos a la capa de la línea")
    # Con escapatorias de asfalto (Tilke) el centro del asfalto no es el de la pista: si hay líneas pintadas
    # a ambos lados en la mayor parte de la vuelta, mandan ellas.
    edges = measure
    edge_bvh = bvh
    reference = "asfalto"
    if painted:
        line_bvh = make_bvh(painted)
        _, l0, r0 = measure_lines(line_bvh, line, probe(line))
        share = float(np.mean(~np.isnan(l0 + r0)))
        log(f"líneas pintadas {[ob.name for ob in painted]}: ambos bordes en el {share * 100:.0f} %")
        if share >= 0.6:
            edges, edge_bvh, reference = measure_lines, line_bvh, "líneas pintadas"
    def narrow(width):
        # Por material, la recta de boxes y la calle de boxes suelen ser una sola cinta de 30-40 m sin hueco:
        # ahí el ancho local también es grande y pasaría el filtro relativo. Se exige además <= 1,6 x la
        # mediana de toda la vuelta. Con mallas sueltas (por defecto) no cambia nada.
        if options["group"] != "material":
            return np.ones(len(width), dtype=bool)
        with np.errstate(invalid="ignore"):
            return width <= 1.6 * np.nanmedian(width)

    for _ in range(3):
        normal, left, right = edges(edge_bvh, line, probe(line))
        width = left + right
        local = local_median(width)
        valid = ~np.isnan(width) & (width <= 1.2 * local) & (width >= 0.8 * local) & narrow(width)
        offset = np.where(valid, (left - right) / 2, 0.0)
        if options["group"] == "material":
            offset = bridge_gaps(offset, valid)
        offset = smooth_closed(offset[:, None], 15 if geo_fit else 5)[:, 0]
        offset = np.clip(offset, -3.0, 3.0)
        line = line + normal * offset[:, None]
        line = smooth_closed(line, 9 if geo_fit else 3)
        line, _ = resample_closed(line, 2.0)
    normal, left, right = edges(edge_bvh, line, probe(line))
    width = left + right
    median = float(np.nanmedian(width))
    # Donde la malla se ensancha (incorporaciones, calle de boxes, enlaces) su centro no es el de la pista:
    # ahí ni se corrige ni se mide.
    local = local_median(width)
    valid = ~np.isnan(width) & (width <= 1.2 * local) & (width >= 0.8 * local) & narrow(width)
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

    heights = road_heights(bvh, line, top)
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
        "paintedObjects": [ob.name for ob in painted],
        "pitLane": pit_hint,
        "medianWidthM": round(median, 2),
        "edgeReference": reference,
        "multiLevel": bool(multilevel),
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
