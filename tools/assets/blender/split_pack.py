"""Separa un GLB «pack» con varios coches en un GLB por coche (SRS 3.1, ADR-001).

Uso:
  blender -b --python split_pack.py -- <pack.glb> <carpeta salida> <prefijo> [--expect N] [--gap <unidades>]
                                       [--no-metres] [--size 640x360]

Resultado en la carpeta de salida:
  <prefijo>-<k>.glb          un coche por archivo (k = 1..n, ordenado por posición en el pack), centrado en el
                             origen (centro de la planta, a ras de suelo) y en metros; la orientación no es la
                             final: después pasa por normalize_car.py
  <prefijo>-<k>.png          miniatura a tres cuartos, para que una persona asigne coche -> equipo
  <prefijo>-<k>.top.png      vista cenital (la decoración del capó y los pontones se ve mejor)
  <prefijo>-overview.png     el pack entero visto desde arriba, coche 1 a la izquierda
  <prefijo>-sheet.png        todas las miniaturas en rejilla (k cuadraditos negros = coche k)
  <prefijo>.split.json       por coche: archivo, tamaño, posición en el pack, triángulos, materiales, pistas de
                             identificación; y asset.extras del pack (autor, licencia, fuente)

Cómo se encuentran los coches (los packs de Sketchfab comparten mallas entre coches: ruedas, chasis...):
  1. Si algún nodo de la jerarquía tiene hijos que son, cada uno, un coche entero, se usan esos nodos.
  2. Si no, se calculan las piezas sueltas (islas) de todas las mallas con numpy, sin separarlas, y se cortan
     recursivamente en X e Y por los huecos de su proyección en el plano del suelo (corte XY). Cada grupo con
     forma de coche (largo/ancho 2-4, alto/largo 0,1-0,35) es un coche; las piezas pequeñas que caen dentro de
     un coche se le añaden; el resto (suelo, gradas, carteles) se descarta y se anota.
  3. La escala se deduce del ancho (1,8 m en todas las eras de este pipeline): un pack exportado en otra
     unidad se pasa a metros salvo con --no-metres.
Los materiales y las texturas no se tocan (allowRecolor=false): cada coche exporta los que usan sus caras.
"""

import json
import math
import os
import re
import struct
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import import_glb, log, script_args, world_bbox, write_json  # noqa: E402
from normalize_car import flatten, islands_of, select_only, triangles  # noqa: E402

VERSION = 1
CAR_WIDTH_M = 1.8
TEAMS = {
    "red-bull": ["redbull", "red_bull", "red bull", "rb6", "rb9", "rb10", "infiniti"],
    "mclaren": ["mclaren", "mp4", "vodafone"],
    "ferrari": ["ferrari", "f10", "f138", "f14t", "f14 t", "santander", "marlboro"],
    "mercedes": ["mercedes", "amg", "petronas", "w01", "w04", "w05", "mgp"],
    "renault": ["renault", "r30"],
    "williams": ["williams", "fw32", "fw35", "fw36", "martini", "rbs"],
    "force-india": ["force india", "forceindia", "force_india", "vjm"],
    "toro-rosso": ["toro rosso", "tororosso", "toro_rosso", "str5", "str8", "str9"],
    "lotus-racing": ["lotus racing", "t127"],
    "lotus-f1": ["lotus", "e21", "e22", "genii"],
    "hrt": ["hrt", "hispania", "f110"],
    "sauber": ["sauber", "c29", "c32", "c33"],
    "virgin": ["virgin", "vr-01", "vr01"],
    "caterham": ["caterham", "ct03", "ct05"],
    "marussia": ["marussia", "mr02", "mr03"],
}


def parse():
    args = script_args()
    if len(args) < 3:
        raise SystemExit(__doc__)
    source, out_dir, prefix = args[0], args[1], args[2]
    options = {"expect": None, "gap": None, "metres": True, "size": (640, 360)}
    i = 3
    while i < len(args):
        if args[i] == "--expect":
            options["expect"] = int(args[i + 1]); i += 2
        elif args[i] == "--gap":
            options["gap"] = float(args[i + 1]); i += 2
        elif args[i] == "--no-metres":
            options["metres"] = False; i += 1
        elif args[i] == "--size":
            w, h = args[i + 1].lower().split("x")
            options["size"] = (int(w), int(h)); i += 2
        else:
            raise SystemExit(f"argumento desconocido {args[i]}")
    return source, os.path.abspath(out_dir), prefix, options


def asset_extras(path):
    """asset.extras del GLB (Sketchfab guarda ahí autor, licencia y fuente): solo se lee el bloque JSON."""
    with open(path, "rb") as handle:
        head = handle.read(20)
        if head[:4] != b"glTF":
            return {}
        length = struct.unpack("<I", head[12:16])[0]
        data = json.loads(handle.read(length).decode("utf-8"))
    asset = data.get("asset", {})
    return {"extras": asset.get("extras", {}), "generator": asset.get("generator")}


# --- Forma de coche --------------------------------------------------------------------------------------

def plan_dims(lo, hi):
    """(largo, ancho, alto) de una caja: largo y ancho en el plano del suelo (XY de Blender)."""
    sx, sy, sz = hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]
    return max(sx, sy), min(sx, sy), sz


def car_shaped(lo, hi):
    length, width, height = plan_dims(lo, hi)
    if length <= 0 or width <= 0:
        return False
    return 2.0 <= length / width <= 4.0 and 0.1 <= height / length <= 0.35


# --- 1. Jerarquía ------------------------------------------------------------------------------------------

def by_hierarchy(meshes):
    """Grupos por nodo: el primer nivel de la jerarquía con varios hijos, si cada hijo es un coche."""
    def subtree_meshes(ob):
        out = [ob] if ob.type == "MESH" else []
        for child in ob.children:
            out += subtree_meshes(child)
        return out
    roots = [ob for ob in bpy.context.scene.objects if ob.parent is None]
    level = roots
    while len(level) == 1 and level[0].children:
        level = list(level[0].children)
    groups = [(ob.name, subtree_meshes(ob)) for ob in level]
    groups = [(name, obs) for name, obs in groups if obs]
    if len(groups) < 2:
        return None
    cars = [(name, obs) for name, obs in groups if car_shaped(*[tuple(v) for v in world_bbox(obs)])]
    total = sum(len(ob.data.polygons) for _, obs in groups for ob in obs)
    covered = sum(len(ob.data.polygons) for _, obs in cars for ob in obs)
    if len(cars) < 2 or covered < 0.9 * total:
        return None
    log("coches por jerarquía:", [name for name, _ in cars])
    return cars


# --- 2. Islas y corte XY -----------------------------------------------------------------------------------

def cut(lo, hi, idx, gap):
    """Corte XY recursivo: divide los índices por los huecos (> gap) de la proyección en X o en Y."""
    import numpy as np
    out, stack = [], [idx]
    while stack:
        part = stack.pop()
        split = None
        for axis in (0, 1):
            order = part[np.argsort(lo[part, axis])]
            reach = np.maximum.accumulate(hi[order, axis])
            gaps = np.nonzero(lo[order[1:], axis] - reach[:-1] > gap)[0]
            if len(gaps):
                split = np.split(order, gaps + 1)
                break
        if split is None:
            out.append(part)
        else:
            stack.extend(split)
    return out


def by_islands(meshes, gap):
    import numpy as np
    per_object, boxes = {}, []
    for ob in meshes:
        inv, parts = islands_of(ob)
        per_object[ob.name] = (inv, parts)
        for k, part in enumerate(parts):
            boxes.append((ob.name, k, tuple(part.lo), tuple(part.hi)))
    log("islas", len(boxes))
    lo = np.array([b[2] for b in boxes])
    hi = np.array([b[3] for b in boxes])
    extent = (hi.max(axis=0) - lo.min(axis=0))
    if gap is None:
        gap = max(1e-5, 1e-3 * float(extent[:2].max()))
    removed = np.zeros(len(boxes), dtype=bool)
    rejected = []
    # Una isla que cruza varios coches (suelo, cartel) une todo: se quita y se vuelve a cortar.
    for _ in range(8):
        groups = cut(lo, hi, np.nonzero(~removed)[0], gap)
        cars = [g for g in groups if car_shaped(lo[g].min(axis=0), hi[g].max(axis=0))]
        lengths = [plan_dims(lo[g].min(axis=0), hi[g].max(axis=0))[0] for g in cars]
        ref = float(np.median(lengths)) if lengths else None
        bridged = False
        for g in groups:
            glo, ghi = lo[g].min(axis=0), hi[g].max(axis=0)
            length = plan_dims(glo, ghi)[0]
            if car_shaped(glo, ghi) and (ref is None or length < 1.6 * ref):
                continue
            if ref is not None and length < 1.6 * ref:
                continue
            span = (hi[g, :2] - lo[g, :2]).max(axis=1)
            big = g[span > 0.5 * length]
            if len(big) and len(big) < len(g):
                removed[big] = True
                bridged = True
                for b in big:
                    rejected.append({"what": "isla que cruza varios coches", "object": boxes[b][0], "sizeUnits": [round(float(v), 3) for v in hi[b] - lo[b]]})
        if not bridged:
            break
    if not cars:
        raise SystemExit("ningún grupo con forma de coche")
    ref_len = float(np.median(lengths))
    car_boxes = [(lo[g].min(axis=0), hi[g].max(axis=0)) for g in cars]
    members = [list(g) for g in cars]
    # Grupos con forma de coche pero de tamaño raro (maqueta, pieza suelta grande): fuera.
    keep = [k for k, (a, b) in enumerate(car_boxes) if 0.7 * ref_len <= plan_dims(a, b)[0] <= 1.3 * ref_len]
    for k in set(range(len(cars))) - set(keep):
        a, b = car_boxes[k]
        rejected.append({"what": "grupo con forma de coche pero fuera de tamaño", "sizeUnits": [round(float(v), 3) for v in b - a]})
    car_boxes = [car_boxes[k] for k in keep]
    members = [members[k] for k in keep]
    cars_set = {id(g) for g in cars}
    margin = 0.15 * ref_len
    for g in groups:
        if id(g) in cars_set:
            continue
        glo, ghi = lo[g].min(axis=0), hi[g].max(axis=0)
        centre = (glo + ghi) / 2
        best, best_d = None, None
        for k, (a, b) in enumerate(car_boxes):
            d = float(np.linalg.norm(np.maximum(0, np.maximum(a[:2] - centre[:2], centre[:2] - b[:2]))))
            if best_d is None or d < best_d:
                best, best_d = k, d
        if plan_dims(glo, ghi)[0] < 0.6 * ref_len and best is not None and best_d <= margin:
            members[best].extend(g)
        else:
            rejected.append({"what": "pieza o grupo que no es un coche", "islands": len(g), "sizeUnits": [round(float(v), 3) for v in ghi - glo]})
    # Etiqueta de coche por isla -> por cara.
    island_car = {}
    for k, g in enumerate(members):
        for b in g:
            island_car[(boxes[b][0], boxes[b][1])] = k
    assignment = {}
    for ob in meshes:
        inv, parts = per_object[ob.name]
        if not len(parts):
            continue
        owner = np.array([island_car.get((ob.name, k), -1) for k in range(len(parts))], dtype=np.int64)
        assignment[ob.name] = owner[inv]  # por vértice
    return len(members), assignment, rejected, gap


def split_objects(meshes, vert_car, n):
    """Separa cada malla en un objeto por coche (atributo de cara + separate), sin tocar materiales."""
    import numpy as np
    cars = [[] for _ in range(n)]
    for ob in list(meshes):
        vc = vert_car.get(ob.name)
        if vc is None:
            continue
        starts = np.empty(len(ob.data.polygons), dtype=np.int64)
        ob.data.polygons.foreach_get("loop_start", starts)
        loop_vert = np.empty(len(ob.data.loops), dtype=np.int64)
        ob.data.loops.foreach_get("vertex_index", loop_vert)
        face_car = vc[loop_vert[starts]]
        ids = sorted(set(face_car.tolist()))
        if ids == [-1]:
            bpy.data.objects.remove(ob, do_unlink=True)
            continue
        if len(ids) == 1:
            cars[ids[0]].append(ob)
            continue
        attr = ob.data.attributes.new("_split_car", "INT", "FACE")
        attr.data.foreach_set("value", face_car.tolist())
        for k in ids:
            values = np.empty(len(ob.data.polygons), dtype=np.int64)
            ob.data.attributes["_split_car"].data.foreach_get("value", values)
            left = sorted(set(values.tolist()))
            if left == [k]:
                if k >= 0:
                    cars[k].append(ob)
                else:
                    bpy.data.objects.remove(ob, do_unlink=True)
                break
            select_only([ob])
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="DESELECT")
            bpy.ops.object.mode_set(mode="OBJECT")
            ob.data.polygons.foreach_set("select", (values == k).tolist())
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.separate(type="SELECTED")
            bpy.ops.object.mode_set(mode="OBJECT")
            new = [o for o in bpy.context.selected_objects if o is not ob]
            if k >= 0:
                cars[k].extend(new)
            else:
                for o in new:
                    bpy.data.objects.remove(o, do_unlink=True)
    for group in cars:
        for ob in group:
            if "_split_car" in ob.data.attributes:
                ob.data.attributes.remove(ob.data.attributes["_split_car"])
            # Separar deja los vértices sueltos de las otras partes: fuera.
            select_only([ob])
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="SELECT")
            bpy.ops.mesh.delete_loose(use_verts=True, use_edges=False, use_faces=False)
            bpy.ops.object.mode_set(mode="OBJECT")
    return [g for g in cars]


# --- Pistas, miniaturas, exportación -----------------------------------------------------------------------

def images_of(material):
    out = []
    if material and material.node_tree:
        for node in material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image:
                out.append(node.image)
    return out


def mean_colour(image):
    """Color medio de una textura (sin tocarla): pista para el color de la decoración."""
    import numpy as np
    try:
        w, h = image.size
        if not w or not h:
            return None
        px = np.empty(w * h * image.channels, dtype=np.float32)
        image.pixels.foreach_get(px)
        px = px.reshape(-1, image.channels)[:, :3]
        step = max(1, len(px) // 200000)
        rgb = px[::step].mean(axis=0)
        return "#" + "".join(f"{int(max(0, min(1, c)) ** (1 / 2.2) * 255):02x}" for c in rgb)
    except Exception:  # textura sin datos
        return None


ANCESTORS = {}


def remember_ancestors(meshes):
    """Nombres de los nodos padre de cada malla (se pierden al aplanar): en algunos packs dicen el equipo."""
    for ob in meshes:
        names, node = [], ob.parent
        while node is not None:
            names.append(node.name)
            node = node.parent
        ANCESTORS[ob.name] = [n for n in names if n not in ("Sketchfab_model", "root", "GLTF_SceneRootNode")]


def hints(objects, shared_materials):
    strings = set()
    materials = []
    exclusive = []
    for ob in objects:
        strings.update([ob.name, ob.data.name] + ANCESTORS.get(ob.name, []))
        for slot in ob.material_slots:
            mat = slot.material
            if not mat or mat.name in materials:
                continue
            materials.append(mat.name)
            strings.add(mat.name)
            for img in images_of(mat):
                strings.update([img.name, os.path.basename(img.filepath or "")])
            if mat.name not in shared_materials:
                exclusive.append(mat)
    text = " ".join(sorted(s for s in strings if s)).lower()
    teams = sorted(team for team, words in TEAMS.items() if any(w in text for w in words))
    names = sorted(s for s in strings if s and not re.fullmatch(r"(Object|Image|Material)_\d+(\.\d+)?", s))
    colours = []
    for mat in exclusive:
        for img in images_of(mat):
            colour = mean_colour(img)
            if colour:
                colours.append({"material": mat.name, "image": img.name, "meanColour": colour, "pixels": list(img.size)})
    return materials, {"teamKeywords": teams, "names": names[:40], "exclusiveMaterials": [m.name for m in exclusive], "textureColours": colours}


def setup_render(size):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.show_specular_highlight = True
    shading.show_cavity = True
    scene.render.film_transparent = False
    world = bpy.data.worlds.new("bg")
    scene.world = world
    world.color = (0.8, 0.82, 0.86)
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.image_settings.file_format = "PNG"
    cam = bpy.data.objects.new("split_cam", bpy.data.cameras.new("split_cam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    return cam


def render(cam, objects, all_objects, target, direction, lens=60, ortho=None, top_axis=None):
    """top_axis: vista cenital con ese eje del suelo (0 = X, 1 = Y) hacia la derecha de la imagen."""
    for ob in all_objects:
        ob.hide_render = ob not in objects
    lo, hi = world_bbox(objects)
    centre = (lo + hi) / 2
    size = max((hi - lo).length, 1e-3)
    if ortho:
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = ortho
    else:
        cam.data.type = "PERSP"
        cam.data.lens = lens
    cam.data.clip_start = size * 0.01
    cam.data.clip_end = size * 20
    cam.location = centre + direction.normalized() * size * 1.6
    if top_axis is None:
        cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
    else:
        cam.location = centre + Vector((0, 0, size * 1.6))
        cam.rotation_euler = (0, 0, 0 if top_axis == 0 else math.pi / 2)
    bpy.context.scene.render.filepath = target
    bpy.ops.render.render(write_still=True)


def nose_direction(objects):
    """Hacia dónde mira el morro en el plano del suelo: el extremo contrario al alerón (3 % de vértices más
    altos), como en normalize_car.py."""
    import numpy as np
    from normalize_car import vertices_of
    pts = vertices_of(objects)
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    axis = 0 if hi[0] - lo[0] > hi[1] - lo[1] else 1
    k = max(10, len(pts) // 33)
    top = pts[np.argpartition(-pts[:, 2], k)[:k]]
    mid = (lo[axis] + hi[axis]) / 2
    d = Vector((0, 0, 0))
    d[axis] = -1.0 if top[:, axis].mean() > mid else 1.0
    return d, axis


def contact_sheet(paths, target, columns=4):
    """Todas las miniaturas en una rejilla, numeradas por orden, para revisar el pack de un vistazo."""
    import numpy as np
    tiles = []
    for path in paths:
        img = bpy.data.images.load(path)
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        tiles.append(px.reshape(h, w, 4))
        bpy.data.images.remove(img)
    h, w = tiles[0].shape[:2]
    rows = math.ceil(len(tiles) / columns)
    sheet = np.ones((rows * h, columns * w, 4), dtype=np.float32)
    for k, tile in enumerate(tiles):
        r, c = divmod(k, columns)
        # Las filas de Blender van de abajo arriba: la primera miniatura queda arriba a la izquierda.
        y0 = (rows - 1 - r) * h
        sheet[y0:y0 + h, c * w:(c + 1) * w] = tile
        # Marca del índice: k+1 cuadraditos negros en la esquina superior izquierda.
        for d in range(k + 1):
            yy, xx = y0 + h - 14 - 14 * (d // 6), c * w + 6 + 14 * (d % 6)
            sheet[yy:yy + 10, xx:xx + 10] = (0, 0, 0, 1)
    out = bpy.data.images.new("sheet", columns * w, rows * h, alpha=True)
    out.pixels.foreach_set(sheet.ravel())
    out.filepath_raw = target
    out.file_format = "PNG"
    out.save()


def export(path):
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", export_yup=True, export_apply=True,
        export_extras=True, export_image_format="AUTO", use_selection=True,
    )


def main():
    source, out_dir, prefix, options = parse()
    os.makedirs(out_dir, exist_ok=True)
    meta = asset_extras(source)
    meshes = import_glb(source)
    # Autor, licencia y fuente viajan con cada coche (scenes[0].extras del GLB) además de ir al JSON.
    for key, value in (meta.get("extras") or {}).items():
        if isinstance(value, (str, int, float)):
            bpy.context.scene[key] = value
    bpy.context.scene["splitFrom"] = os.path.basename(source)
    remember_ancestors(meshes)
    hierarchy = by_hierarchy(meshes)
    flatten(meshes)
    meshes = [ob for ob in bpy.context.scene.objects if ob.type == "MESH"]
    rejected, method, gap = [], "hierarchy", None
    group_node = {}
    if hierarchy:
        cars = [[bpy.data.objects[ob.name] for ob in obs] for _, obs in hierarchy]
        for name, obs in hierarchy:
            for ob in obs:
                group_node[ob.name] = name
        for ob in set(meshes) - {ob for g in cars for ob in g}:
            rejected.append({"what": "malla fuera de los nodos de coche", "object": ob.name})
            bpy.data.objects.remove(ob, do_unlink=True)
    else:
        method = "islands-xy-cut"
        n, vert_car, rejected, gap = by_islands(meshes, options["gap"])
        log("coches por islas:", n)
        cars = split_objects(meshes, vert_car, n)
    cars = [g for g in cars if g]
    for item in rejected:
        log("descartado:", item)
    # Orden estable: por el eje en que más se separan los coches y, en rejilla, por filas.
    boxes = [world_bbox(g) for g in cars]
    centres = [(a + b) / 2 for a, b in boxes]
    lengths = sorted(plan_dims(a, b)[0] for a, b in boxes)
    widths = sorted(plan_dims(a, b)[1] for a, b in boxes)
    ref_len, ref_width = lengths[len(lengths) // 2], widths[len(widths) // 2]
    spread = [max(c[i] for c in centres) - min(c[i] for c in centres) for i in (0, 1)]
    main_axis = 0 if spread[0] >= spread[1] else 1
    other = 1 - main_axis
    order = sorted(range(len(cars)), key=lambda k: (round(centres[k][other] / ref_len), centres[k][main_axis]))
    cars = [cars[k] for k in order]
    boxes = [boxes[k] for k in order]
    unit = CAR_WIDTH_M / ref_width  # metros por unidad del pack
    factor = unit if options["metres"] and not 0.8 <= unit <= 1.25 else 1.0
    log(f"{len(cars)} coches; largo mediano {ref_len:.3f} u, ancho {ref_width:.3f} u, ~{unit:.4f} m/u, escala aplicada {factor:.4f}")
    # Pistas antes de mover nada (materiales que comparten varios coches no dicen de quién es cada uno).
    use = {}
    for k, g in enumerate(cars):
        for ob in g:
            for slot in ob.material_slots:
                if slot.material:
                    use.setdefault(slot.material.name, set()).add(k)
    shared = {name for name, ks in use.items() if len(ks) > 1}
    all_objects = [ob for g in cars for ob in g]
    cam = setup_render(options["size"])
    # Vista general: el pack entero desde arriba.
    lo, hi = world_bbox(all_objects)
    aspect = options["size"][0] / options["size"][1]
    span = (hi - lo)
    across, along = (span.x, span.y) if main_axis == 0 else (span.y, span.x)
    render(cam, all_objects, all_objects, os.path.join(out_dir, f"{prefix}-overview.png"), Vector((0, 0, 1)),
           ortho=max(across, along * aspect) * 1.05, top_axis=main_axis)
    result = []
    for k, (g, (a, b)) in enumerate(zip(cars, boxes), start=1):
        materials, info = hints(g, shared)
        nodes = sorted({group_node[ob.name] for ob in g if ob.name in group_node})
        centre = Vector(((a.x + b.x) / 2, (a.y + b.y) / 2, a.z))
        m = Matrix.Scale(factor, 4) @ Matrix.Translation(-centre)
        for ob in g:
            if ob.data.users > 1:
                ob.data = ob.data.copy()
            ob.data.transform(ob.matrix_world)
            ob.matrix_world = Matrix.Identity(4)
            ob.data.transform(m)
        bpy.context.view_layer.update()
        nose, axis = nose_direction(g)
        side = Vector((0, 0, 0))
        side[1 - axis] = 1.0
        base = os.path.join(out_dir, f"{prefix}-{k}")
        render(cam, g, all_objects, base + ".png", nose * 0.75 + side * 0.62 + Vector((0, 0, 0.35)))
        lo2, hi2 = world_bbox(g)
        render(cam, g, all_objects, base + ".top.png", Vector((0, 0, 1)),
               ortho=max(hi2.x - lo2.x, hi2.y - lo2.y) * 1.1, top_axis=axis)
        select_only(g)
        for ob in all_objects:
            ob.hide_set(False)
        bpy.ops.object.select_all(action="DESELECT")
        for ob in g:
            ob.select_set(True)
        export(base + ".glb")
        size = [round(float(v) * unit, 3) for v in (b - a)]
        entry = {
            "index": k, "file": os.path.basename(base + ".glb"), "thumbnail": os.path.basename(base + ".png"),
            "thumbnailTop": os.path.basename(base + ".top.png"),
            "sizeM": dict(zip(("x", "y", "z"), size)), "lengthM": round(plan_dims(a, b)[0] * unit, 3),
            "widthM": round(plan_dims(a, b)[1] * unit, 3), "heightM": round((b.z - a.z) * unit, 3),
            "packPositionUnits": [round(float(v), 3) for v in centre],
            "noseInPack": {0: "x", 1: "y"}[axis] if nose[axis] > 0 else "-" + {0: "x", 1: "y"}[axis],
            "node": nodes[0] if len(nodes) == 1 else nodes or None, "objects": len(g), "triangles": triangles(g), "materials": materials, "hints": info,
        }
        result.append(entry)
        log("coche", k, entry["lengthM"], "m", entry["triangles"], "triángulos", info["teamKeywords"])
    contact_sheet([os.path.join(out_dir, e["thumbnail"]) for e in result], os.path.join(out_dir, f"{prefix}-sheet.png"))
    expect = options["expect"]
    if expect is not None and expect != len(cars):
        log(f"AVISO: se esperaban {expect} coches y se han encontrado {len(cars)}")
    write_json(os.path.join(out_dir, f"{prefix}.split.json"), {
        "generator": f"split_pack.py v{VERSION}", "source": os.path.basename(source), "asset": meta,
        "method": method, "gapUnits": gap, "metresPerUnit": round(unit, 5), "scaleApplied": round(factor, 5),
        "layoutAxis": "xy"[main_axis], "expected": expect, "found": len(cars),
        "sharedMaterials": sorted(shared), "rejected": rejected, "cars": result,
    })


if __name__ == "__main__":
    main()
