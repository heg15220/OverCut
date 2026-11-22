"""Utilidades compartidas por los scripts de Blender del pipeline (ADR-001).

Se ejecutan con:  blender -b --python <script>.py -- <argumentos>
Todo lo que reciben va detrás de "--". Ningún script modifica el GLB de origen.
"""

import json
import sys
import time

_T0 = time.time()

import bpy
from mathutils import Vector


def script_args():
    argv = sys.argv
    return argv[argv.index("--") + 1:] if "--" in argv else []


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path):
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=path)
    return [ob for ob in bpy.context.scene.objects if ob.type == "MESH"]


def world_bbox(objects):
    lo = Vector((1e18, 1e18, 1e18))
    hi = Vector((-1e18, -1e18, -1e18))
    for ob in objects:
        for corner in ob.bound_box:
            w = ob.matrix_world @ Vector(corner)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return lo, hi


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=1)
        handle.write("\n")


def gltf_from_blender(x, y, z):
    """Blender es Z arriba; glTF/three.js es Y arriba: (x, y, z)_blender -> (x, z, -y)_gltf."""
    return [x, z, -y]


def log(*parts):
    print(f"[overcut-assets {time.time() - _T0:7.1f}s]", *parts, flush=True)
