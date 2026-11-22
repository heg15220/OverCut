"""Prepara un circuito GLB para el juego (RF-3D-01, RF-3D-03, ADR-001).

Uso:
  blender -b --python prepare_circuit.py -- <circuito.glb> <salida.glb> [--mirror]

Aplana la jerarquía de Sketchfab y aplica transformaciones, de modo que las coordenadas glTF de salida sean
las mismas en que se extrajo la spline. Con `--mirror` refleja el modelo en X (y da la vuelta a las caras):
los circuitos extraídos de juegos con ejes de mano izquierda vienen reflejados respecto al trazado real, y
`align_spline.mjs` lo detecta comparando con el trazado georreferenciado. La spline se refleja igual
(x -> -x), así que siguen alineadas. CC BY permite la adaptación; un GLB CC BY-ND nunca se refleja.
"""

import os
import sys

import bmesh
import bpy
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(__file__))
from common import import_glb, log, script_args  # noqa: E402


def main():
    args = script_args()
    source, target = args[0], args[1]
    mirror = "--mirror" in args
    meshes = import_glb(source)
    for ob in meshes:
        world = ob.matrix_world.copy()
        ob.parent = None
        ob.matrix_world = world
    for ob in list(bpy.context.scene.objects):
        if ob.type != "MESH":
            bpy.data.objects.remove(ob, do_unlink=True)
    for ob in meshes:
        if ob.data.users > 1:
            ob.data = ob.data.copy()
    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if mirror:
        flip = Matrix.Scale(-1, 4, (1, 0, 0))
        for ob in meshes:
            ob.data.transform(flip)
            bm = bmesh.new()
            bm.from_mesh(ob.data)
            bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
            bm.to_mesh(ob.data)
            bm.free()
            ob.data.update()
    bpy.ops.export_scene.gltf(filepath=target, export_format="GLB", export_yup=True, export_apply=True, export_extras=True, use_selection=False)
    log("circuito", os.path.basename(target), "reflejado" if mirror else "sin reflejar", len(meshes), "mallas")


if __name__ == "__main__":
    main()
