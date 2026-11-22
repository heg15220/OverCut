"""Normaliza un coche GLB y genera sus LOD (RF-3D-05, RNF-03, ADR-001).

Uso:
  blender -b --python normalize_car.py -- <coche.glb> <carpeta salida> <id> [--length <m>] [--lods 1,0.4,0.12]

Resultado en la carpeta de salida:
  <id>.lod0.glb, <id>.lod1.glb, <id>.lod2.glb   coche normalizado, cada vez más ligero
  <id>.json                                    medidas y nodos (lo lee build_assets.py para el manifiesto)

Convenio de salida (el que lee el cargador three.js):
  - metros; Y arriba; el morro mira a -Z (glTF);
  - origen en el centro del eje trasero, a ras de suelo;
  - un nodo por rueda, `wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr`, con origen en el buje: girar el nodo
    sobre su X local hace rodar la rueda, y girar el padre sobre Y la orienta;
  - el resto del coche en un solo nodo `body` (una malla con un primitivo por material).

Cómo se hace sin nombres fiables (los GLB de Sketchfab se llaman Object_4, Object_5...):
  - El eje largo es la longitud. La parte trasera es la del alerón: el extremo donde está el 3 % de vértices
    más altos.
  - Si la longitud no es la de un F1 (3-6,5 m: hay un McLaren 2008 exportado en centímetros) se escala a
    `--length`.
  - Las ruedas se buscan entre las piezas sueltas: cilindros de 0,45-0,8 m de diámetro con el centro a la
    altura de su radio y fuera del eje del coche. Lo que queda dentro del cilindro de cada neumático (llanta,
    tuercas, disco) va con su rueda.
  - Los LOD se hacen con el modificador Decimate (colapso), sin tocar materiales: respeta allowRecolor=false.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import import_glb, log, script_args, world_bbox, write_json  # noqa: E402

VERSION = 1
WHEELS = ("wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr")


def parse():
    args = script_args()
    source, out_dir, ident = args[0], args[1], args[2]
    options = {"length": None, "lods": [1.0, 0.4, 0.12]}
    i = 3
    while i < len(args):
        if args[i] == "--length":
            options["length"] = float(args[i + 1]); i += 2
        elif args[i] == "--lods":
            options["lods"] = [float(v) for v in args[i + 1].split(",")]; i += 2
        else:
            raise SystemExit(f"argumento desconocido {args[i]}")
    return source, out_dir, ident, options


def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objects:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def flatten(meshes):
    """Saca las mallas de la jerarquía de Sketchfab y aplica todas las transformaciones."""
    for ob in meshes:
        world = ob.matrix_world.copy()
        ob.parent = None
        ob.matrix_world = world
    for ob in list(bpy.context.scene.objects):
        if ob.type != "MESH":
            bpy.data.objects.remove(ob, do_unlink=True)
    # Las mallas compartidas (instancias) se independizan antes de aplicar.
    for ob in meshes:
        if ob.data.users > 1:
            ob.data = ob.data.copy()
    select_only(meshes)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def vertices_of(objects):
    """Vértices en coordenadas de mundo como matriz numpy (n, 3): los coches de 2008 pasan del millón."""
    import numpy as np
    chunks = []
    for ob in objects:
        count = len(ob.data.vertices)
        if not count:
            continue
        co = np.empty(count * 3, dtype=np.float64)
        ob.data.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        m = np.array(ob.matrix_world)
        chunks.append(co @ m[:3, :3].T + m[:3, 3])
    return np.concatenate(chunks) if chunks else np.zeros((0, 3))


def vertex_bbox(meshes):
    """Caja desde los vértices: `bound_box` no se actualiza tras `mesh.transform` hasta reevaluar."""
    pts = vertices_of(meshes)
    return Vector(pts.min(axis=0)), Vector(pts.max(axis=0))


def orient(meshes, wanted_length):
    """Longitud sobre +Y de Blender (= -Z glTF), morro delante, suelo en z=0, centrado en x."""
    lo, hi = vertex_bbox(meshes)
    size = hi - lo
    rotate = Matrix.Identity(4)
    if size.x > size.y:
        rotate = Matrix.Rotation(math.pi / 2, 4, "Z")
    for ob in meshes:
        ob.data.transform(rotate)
    lo, hi = vertex_bbox(meshes)
    import numpy as np
    pts = vertices_of(meshes)
    k = max(10, len(pts) // 33)
    top = pts[np.argpartition(-pts[:, 2], k)[:k]]
    mid = (lo.y + hi.y) / 2
    rear_at = float(top[:, 1].mean())
    if rear_at > mid:  # el alerón está en +Y: el morro mira a -Y, se da la vuelta
        flip = Matrix.Rotation(math.pi, 4, "Z")
        for ob in meshes:
            ob.data.transform(flip)
    lo, hi = vertex_bbox(meshes)
    length = hi.y - lo.y
    factor = 1.0
    if not 3.0 <= length <= 6.5:
        if not wanted_length:
            raise SystemExit(f"longitud {length:.3f} fuera de rango y sin --length")
        factor = wanted_length / length
    centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    m = Matrix.Scale(factor, 4) @ Matrix.Translation(-centre)
    for ob in meshes:
        ob.data.transform(m)
    return factor


class Island:
    """Una pieza suelta dentro de una malla, sin separarla en su propio objeto."""

    def __init__(self, ob, label, lo, hi):
        self.ob, self.label = ob, label
        self.lo, self.hi = Vector(lo), Vector(hi)
        self.c = (self.lo + self.hi) / 2
        self.s = self.hi - self.lo


def islands_of(ob):
    """Islas (componentes conexas por aristas) de una malla con numpy: etiqueta por vértice y cajas."""
    import numpy as np
    mesh = ob.data
    nv = len(mesh.vertices)
    if not nv or not len(mesh.polygons):
        return np.zeros(0, dtype=np.int64), []
    co = np.empty(nv * 3)
    mesh.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    edges = np.empty(len(mesh.edges) * 2, dtype=np.int64)
    mesh.edges.foreach_get("vertices", edges)
    edges = edges.reshape(-1, 2)
    label = np.arange(nv)
    while True:
        low = np.minimum(label[edges[:, 0]], label[edges[:, 1]])
        new = label.copy()
        np.minimum.at(new, edges[:, 0], low)
        np.minimum.at(new, edges[:, 1], low)
        new = new[new]
        if np.array_equal(new, label):
            break
        label = new
    uniq, inv = np.unique(label, return_inverse=True)
    lo = np.full((len(uniq), 3), np.inf)
    hi = np.full((len(uniq), 3), -np.inf)
    np.minimum.at(lo, inv, co)
    np.maximum.at(hi, inv, co)
    return inv, [Island(ob, k, lo[k], hi[k]) for k in range(len(uniq))]


def find_tyres(islands):
    """Las cuatro ruedas: en cada esquina, las piezas cilíndricas de 0,45-0,85 m de diámetro, apoyadas en el
    suelo y fuera del eje del coche. Un neumático puede venir entero o partido en flancos y banda de
    rodadura: se agrupan las piezas concéntricas y su caja conjunta es la rueda."""
    clusters = {}
    for part in islands:
        s, c, lo = part.s, part.c, part.lo
        diameter = (s.y + s.z) / 2
        if not 0.45 <= diameter <= 0.85 or abs(s.y - s.z) > 0.18 * diameter or s.x > 0.6:
            continue
        if abs(c.z - diameter / 2) > 0.12 or abs(c.x) < 0.35 or lo.z > 0.08:
            continue
        key = ("f" if c.y > 0 else "r") + ("l" if c.x < 0 else "r")
        clusters.setdefault(key, []).append((part, diameter))
    corners = {}
    for key, items in clusters.items():
        items.sort(key=lambda item: -item[1])
        ref = items[0][0].c
        group = [item for item in items if abs(item[0].c.y - ref.y) < 0.06 and abs(item[0].c.z - ref.z) < 0.06]
        lo_x = min(item[0].lo.x for item in group)
        hi_x = max(item[0].hi.x for item in group)
        diameter = max(item[1] for item in group)
        corners[key] = {"members": {id(item[0]) for item in group}, "centre": Vector(((lo_x + hi_x) / 2, ref.y, ref.z)), "diameter": diameter, "x": (lo_x, hi_x)}
    if len(corners) != 4:
        raise SystemExit(f"no se encontraron las cuatro ruedas (esquinas: {sorted(corners)})")
    return corners


def wheel_of(part, corners):
    """Neumático, llanta, tuercas y disco: lo que cabe en el cilindro de una rueda."""
    for key, corner in corners.items():
        radius = corner["diameter"] / 2
        x0, x1 = corner["x"]
        inside = math.hypot(part.c.y - corner["centre"].y, part.c.z - corner["centre"].z) < radius * 0.75 and max(part.s.y, part.s.z) <= corner["diameter"] * 1.05
        if id(part) in corner["members"] or (inside and x0 - 0.08 <= part.c.x <= x1 + 0.08):
            return key
    return None


def separate_wheels(meshes):
    """Separa de cada malla las caras de cada rueda (como mucho cuatro cortes por malla)."""
    import numpy as np
    per_object = {ob.name: islands_of(ob) for ob in meshes}
    all_islands = [part for _, parts in per_object.values() for part in parts]
    corners = find_tyres(all_islands)
    pieces = {key: [] for key in corners}
    for ob in list(meshes):
        inv, parts = per_object[ob.name]
        owner = np.array([{"fl": 0, "fr": 1, "rl": 2, "rr": 3}.get(wheel_of(part, corners), -1) for part in parts], dtype=np.int64)
        if not len(parts) or (owner < 0).all():
            continue
        vert_owner = owner[inv]
        loop_totals = np.empty(len(ob.data.polygons), dtype=np.int64)
        ob.data.polygons.foreach_get("loop_start", loop_totals)
        loop_vert = np.empty(len(ob.data.loops), dtype=np.int64)
        ob.data.loops.foreach_get("vertex_index", loop_vert)
        poly_owner = vert_owner[loop_vert[loop_totals]]
        for k, key in enumerate(("fl", "fr", "rl", "rr")):
            mask = poly_owner == k
            if not mask.any():
                continue
            select_only([ob])
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="DESELECT")
            bpy.ops.object.mode_set(mode="OBJECT")
            ob.data.polygons.foreach_set("select", mask.tolist())
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.separate(type="SELECTED")
            bpy.ops.object.mode_set(mode="OBJECT")
            new = [o for o in bpy.context.selected_objects if o is not ob]
            pieces[key].extend(new)
            # Las caras que quedan han cambiado de índice: se recalcula el reparto de esta malla.
            inv, parts = islands_of(ob)
            owner = np.array([{"fl": 0, "fr": 1, "rl": 2, "rr": 3}.get(wheel_of(part, corners), -1) for part in parts], dtype=np.int64)
            if not len(parts):
                break
            vert_owner = owner[inv]
            loop_totals = np.empty(len(ob.data.polygons), dtype=np.int64)
            ob.data.polygons.foreach_get("loop_start", loop_totals)
            loop_vert = np.empty(len(ob.data.loops), dtype=np.int64)
            ob.data.loops.foreach_get("vertex_index", loop_vert)
            poly_owner = vert_owner[loop_vert[loop_totals]]
    return corners, pieces


def join(objects, name):
    select_only(objects)
    if len(objects) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    ob.data.name = name
    return ob


def build(meshes, wanted_length):
    flatten(meshes)
    log("aplanado", len(meshes), "mallas")
    factor = orient(meshes, wanted_length)
    log("orientado")
    try:
        corners, groups = separate_wheels(meshes)
    except SystemExit as missing:
        # Neumáticos soldados a la suspensión: el coche sale entero, con ruedas fijas (sin nodos de giro).
        log("ruedas no separables:", missing)
        return build_static(meshes, factor)
    log("ruedas separadas", {key: len(v) for key, v in groups.items()})
    # Mallas que se han quedado sin caras al sacarles las ruedas: fuera, o se exportan como nodos vacíos.
    for ob in [o for o in bpy.context.scene.objects if o.type == "MESH" and not len(o.data.polygons)]:
        bpy.data.objects.remove(ob, do_unlink=True)
    in_wheels = {ob.name for group in groups.values() for ob in group}
    body_parts = [ob for ob in bpy.context.scene.objects if ob.type == "MESH" and ob.name not in in_wheels and len(ob.data.polygons)]
    rear_y = (corners["rl"]["centre"].y + corners["rr"]["centre"].y) / 2
    shift = Matrix.Translation(Vector((0, -rear_y, 0)))
    body = join(body_parts, "body")
    log("carrocería unida")
    body.data.transform(shift)
    wheels = {}
    for key, name in (("fl", "wheel_fl"), ("fr", "wheel_fr"), ("rl", "wheel_rl"), ("rr", "wheel_rr")):
        ob = join(groups[key], f"{name}_mesh")
        hub = corners[key]["centre"] + Vector((0, -rear_y, 0))
        # La malla aún está en su sitio original (sin el desplazamiento al eje trasero): se centra en su buje.
        ob.data.transform(Matrix.Translation(-corners[key]["centre"]))
        ob.location = (0, 0, 0)
        empty = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(empty)
        empty.location = hub
        ob.parent = empty
        wheels[name] = {"hub": hub.copy(), "diameter": corners[key]["diameter"], "object": ob, "empty": empty}
    return body, wheels, factor


def build_static(meshes, factor):
    body_parts = [ob for ob in bpy.context.scene.objects if ob.type == "MESH" and len(ob.data.polygons)]
    lo, hi = vertex_bbox(body_parts)
    length = hi.y - lo.y
    # Sin ruedas detectadas se estima el eje trasero a un 15 % de la longitud desde la cola.
    rear_y = lo.y + 0.15 * length
    body = join(body_parts, "body")
    body.data.transform(Matrix.Translation(Vector((0, -rear_y, 0))))
    return body, {}, factor


def metrics(body, wheels, factor):
    bpy.context.view_layer.update()
    lo, hi = vertex_bbox([body] + [w["object"] for w in wheels.values()])
    if not wheels:
        length = hi.y - lo.y
        return {
            "lengthM": round(length, 3), "widthM": round(hi.x - lo.x, 3), "heightM": round(hi.z - lo.z, 3),
            "wheelbaseM": round(0.62 * length, 3), "trackFrontM": None, "trackRearM": None,
            "wheelRadiusM": {}, "wheelHubs": {}, "noseZ": round(-hi.y, 3), "tailZ": round(-lo.y, 3),
            "scaleApplied": round(factor, 5), "wheels": "static",
        }
    front = (wheels["wheel_fl"]["hub"].y + wheels["wheel_fr"]["hub"].y) / 2
    to_gltf = lambda v: [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]  # noqa: E731
    return {
        "lengthM": round(hi.y - lo.y, 3),
        "widthM": round(hi.x - lo.x, 3),
        "heightM": round(hi.z - lo.z, 3),
        "wheelbaseM": round(front, 3),
        "trackFrontM": round(abs(wheels["wheel_fr"]["hub"].x - wheels["wheel_fl"]["hub"].x), 3),
        "trackRearM": round(abs(wheels["wheel_rr"]["hub"].x - wheels["wheel_rl"]["hub"].x), 3),
        "wheelRadiusM": {name: round(w["diameter"] / 2, 3) for name, w in wheels.items()},
        "wheelHubs": {name: to_gltf(w["hub"]) for name, w in wheels.items()},
        "noseZ": round(-hi.y, 3),
        "tailZ": round(-lo.y, 3),
        "scaleApplied": round(factor, 5),
        "wheels": "nodes",
    }


def decimate(objects, ratio):
    if ratio >= 0.999:
        return
    for ob in objects:
        mod = ob.modifiers.new("lod", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        select_only([ob])
        bpy.ops.object.modifier_apply(modifier=mod.name)


def triangles(objects):
    total = 0
    for ob in objects:
        ob.data.calc_loop_triangles()
        total += len(ob.data.loop_triangles)
    return total


def export(path):
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", export_yup=True, export_apply=True,
        export_extras=True, export_image_format="AUTO", use_selection=False,
    )


def main():
    source, out_dir, ident, options = parse()
    os.makedirs(out_dir, exist_ok=True)
    meshes = import_glb(source)
    body, wheels, factor = build(meshes, options["length"])
    info = {"generator": f"normalize_car.py v{VERSION}", "source": os.path.basename(source), "id": ident, **metrics(body, wheels, factor), "lods": []}
    meshes_now = [body] + [w["object"] for w in wheels.values()]
    base = triangles(meshes_now)
    for level, ratio in enumerate(sorted(options["lods"], reverse=True)):
        # Cada LOD parte del anterior: Decimate encadenado sobre la proporción relativa.
        previous = sorted(options["lods"], reverse=True)[level - 1] if level else 1.0
        decimate(meshes_now, ratio / previous)
        path = os.path.join(out_dir, f"{ident}.lod{level}.glb")
        export(path)
        info["lods"].append({"level": level, "ratio": ratio, "triangles": triangles(meshes_now), "file": os.path.basename(path)})
        log("LOD", level, info["lods"][-1]["triangles"], "triángulos de", base)
    write_json(os.path.join(out_dir, f"{ident}.json"), info)
    log("coche", ident, info["lengthM"], "m, batalla", info["wheelbaseM"], "m")


if __name__ == "__main__":
    main()
