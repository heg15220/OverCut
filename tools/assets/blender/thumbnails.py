"""Miniatura del showroom de un coche normalizado (RF-3D-06, ADR-001).

Uso:
  blender -b --python thumbnails.py -- <coche.lod0.glb> <salida.png> [--size 640x360] [--engine eevee|cycles] [--view three-quarter|side|top]

Fondo transparente, cámara a tres cuartos delanteros y luz de estudio. Con `--engine cycles` usa OptiX si hay
GPU NVIDIA (RTX 5070 Ti en la máquina de desarrollo) y, si no, CPU.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import import_glb, script_args, world_bbox  # noqa: E402


def parse():
    args = script_args()
    options = {"size": (640, 360), "engine": "eevee", "view": "three-quarter"}
    i = 2
    while i < len(args):
        if args[i] == "--size":
            w, h = args[i + 1].lower().split("x")
            options["size"] = (int(w), int(h)); i += 2
        elif args[i] == "--engine":
            options["engine"] = args[i + 1]; i += 2
        elif args[i] == "--view":
            options["view"] = args[i + 1]; i += 2
        else:
            raise SystemExit(f"argumento desconocido {args[i]}")
    return args[0], args[1], options


def use_engine(scene, engine):
    if engine == "cycles":
        scene.render.engine = "CYCLES"
        scene.cycles.samples = 64
        prefs = bpy.context.preferences.addons["cycles"].preferences
        try:
            prefs.compute_device_type = "OPTIX"
            prefs.get_devices()
            for device in prefs.devices:
                device.use = True
            scene.cycles.device = "GPU"
        except Exception:  # sin GPU compatible: CPU
            scene.cycles.device = "CPU"
    else:
        scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items} else "BLENDER_EEVEE"


def main():
    source, target, options = parse()
    meshes = import_glb(source)
    scene = bpy.context.scene
    lo, hi = world_bbox(meshes)
    centre = (lo + hi) / 2
    size = max((hi - lo).length, 1.0)
    world = bpy.data.worlds.new("studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.78, 0.85, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    scene.world = world
    for name, energy, at in (("key", 900, (4, -6, 7)), ("rim", 500, (-6, 5, 4)), ("fill", 250, (6, 6, 3))):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        light.data.energy = energy
        light.data.size = 4
        light.location = centre + Vector(at)
        light.rotation_euler = (centre - light.location).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(light)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    cam.data.lens = 70
    view = {"three-quarter": Vector((0.75, 0.62, 0.3)), "side": Vector((1, 0, 0.08)), "top": Vector((0.001, 0, 1))}[options["view"]]
    cam.location = centre + view.normalized() * size * 1.55
    cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    use_engine(scene, options["engine"])
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = options["size"]
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = target
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
