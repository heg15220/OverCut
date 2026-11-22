"""Vista cenital de un circuito con su spline encima, para la revisión manual (ADR-001).

Uso:
  blender -b --python preview_spline.py -- <circuito.glb> <spline.json> <salida.png> [--size 1600]

Dibuja la spline en rojo, la línea de meta (primer punto) en blanco y la dirección de la vuelta con una
flecha amarilla a los 150 m. El terreno de gran tamaño se oculta para encuadrar la pista.
"""

import json
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import import_glb, script_args, world_bbox  # noqa: E402


def emissive(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    return mat


def polyline(name, points, radius, material, closed):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    spline.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, curve)
    ob.data.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def main():
    args = script_args()
    source, spline_path, target = args[0], args[1], args[2]
    size = int(args[args.index("--size") + 1]) if "--size" in args else 1600
    meshes = import_glb(source)
    data = json.load(open(spline_path, encoding="utf-8"))
    # glTF -> Blender: (x, y, z) -> (x, -z, y)
    pts = [Vector((x, -z, y + 3)) for x, y, z in data["points"]]
    lo, hi = Vector((min(p.x for p in pts), min(p.y for p in pts), 0)), Vector((max(p.x for p in pts), max(p.y for p in pts), 0))
    span = max(hi.x - lo.x, hi.y - lo.y)
    for ob in meshes:
        a, b = world_bbox([ob])
        if (b - a).x > 3 * span:
            ob.hide_render = True
    width = max(2.0, span / 600)
    polyline("spline", pts, width, emissive("red", (1, 0, 0)), True)
    fitted = data.get("alignment", {}).get("sketchFitted")
    if fitted:
        polyline("sketch", [Vector((x, -z, 6)) for x, z in fitted], width * 0.8, emissive("blue", (0.1, 0.3, 1)), True)
    start = pts[0]
    ahead = pts[min(len(pts) - 1, 75)]
    normal = Vector((-(pts[1] - pts[0]).y, (pts[1] - pts[0]).x, 0)).normalized()
    polyline("start", [start - normal * 25, start + normal * 25], width * 1.4, emissive("white", (1, 1, 1)), False)
    polyline("arrow", [start, ahead], width * 1.8, emissive("yellow", (1, 0.85, 0)), False)
    scene = bpy.context.scene
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = span * 1.1
    cam.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 5000)
    cam.data.clip_end = 1e6
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "MATERIAL"
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.filepath = target
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
