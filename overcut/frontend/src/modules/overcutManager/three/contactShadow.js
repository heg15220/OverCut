/**
 * A soft contact shadow under a car (showroom, podium): the car is drawn once
 * from below into a small texture as "how close to the floor", blurred, and
 * laid on a plane under it. It grounds the car the way a real studio floor
 * does (dark under the floor and tyres, fading out), which a shadow map with a
 * single key light cannot do without hard edges. It is baked when the model
 * changes, not every frame, so it costs nothing while the car turns: the plane
 * belongs to the object, and turns with it.
 *
 * Its three programs (depth, two blurs) are linked in the background first
 * (`compileAsync`, KHR_parallel_shader_compile) so the bake never stalls the
 * page waiting for the driver; until they are ready `bake` returns false and the
 * caller simply tries again on a later frame. The bake itself is one draw of
 * the car into a 256 px target and two blur passes (a few ms).
 *
 * Technique after three.js' webgl_shadow_contact example (MIT).
 */

import * as THREE from "three";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";
import { compileInBackground } from "./assets/compileGate";

export const createContactShadow = ({ size = 256, blur = 3.2, darkness = 1.6, opacity = 0.9, height = 1.4 } = {}) => {
  const target = new THREE.WebGLRenderTarget(size, size);
  target.texture.generateMipmaps = false;
  const spare = new THREE.WebGLRenderTarget(size, size);
  spare.texture.generateMipmaps = false;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: target.texture, transparent: true, opacity, depthWrite: false, toneMapped: false }),
  );
  plane.name = "contact-shadow";
  plane.renderOrder = -1;
  plane.scale.y = -1; // the texture is drawn looking up: flip it back
  plane.visible = false;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, height);
  camera.rotation.x = Math.PI / 2; // look up from the floor

  const depth = new THREE.MeshDepthMaterial();
  depth.userData.darkness = { value: darkness };
  depth.onBeforeCompile = (shader) => {
    shader.uniforms.darkness = depth.userData.darkness;
    shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader.replace(
      "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
      "gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );",
    )}`;
  };
  depth.depthTest = false;
  depth.depthWrite = false;
  depth.side = THREE.DoubleSide;

  const blurH = new THREE.ShaderMaterial(HorizontalBlurShader);
  const blurV = new THREE.ShaderMaterial(VerticalBlurShader);
  blurH.depthTest = false;
  blurV.depthTest = false;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadCamera.position.z = 0.5;
  const work = new THREE.Scene();

  const pass = (renderer, amount, from, to) => {
    quad.material = blurH;
    blurH.uniforms.tDiffuse.value = from.texture;
    blurH.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(spare);
    renderer.render(quad, quadCamera);
    quad.material = blurV;
    blurV.uniforms.tDiffuse.value = spare.texture;
    blurV.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(to);
    renderer.render(quad, quadCamera);
  };

  // Shader warm-up: one mesh per program, compiled off the main thread where the driver allows it.
  let ready = false;
  let warming = null;
  let disposed = false;
  const warm = (renderer) => {
    if (warming) return;
    const scene = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), depth);
    const h = new THREE.Mesh(quad.geometry, blurH);
    const v = new THREE.Mesh(quad.geometry, blurV);
    scene.add(box, h, v);
    let parallel = false;
    try {
      parallel = Boolean(renderer.extensions?.get?.("KHR_parallel_shader_compile"));
    } catch {
      parallel = false;
    }
    if (!parallel) {
      ready = true; // nothing to gain: link on first use, as before
      warming = Promise.resolve();
      return;
    }
    // Not three's compileAsync: it throws inside a timer if the view closes mid-link.
    warming = compileInBackground(renderer, scene, camera)
      .catch(() => null)
      .then(() => {
        box.geometry.dispose();
        if (!disposed) ready = true;
      });
  };

  /** Bounding box of the visible meshes of `object` in its own frame (the plane left out). */
  const boxOf = (object) => {
    const box = new THREE.Box3();
    const part = new THREE.Box3();
    object.updateMatrixWorld(true);
    object.traverseVisible((node) => {
      if (!node.isMesh || !node.geometry || node === plane) return;
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      part.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
      box.union(part);
    });
    return box;
  };

  /**
   * Bake the shadow of `object` (a group whose local frame has the floor at
   * y = 0) and put the plane under it, as its child.
   */
  const bake = (renderer, object) => {
    if (!ready) {
      warm(renderer);
      if (!ready) return false;
    }
    // Draw the object alone, in its own frame, with the depth material.
    const parent = object.parent;
    const saved = { position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() };
    const index = parent ? parent.children.indexOf(object) : -1;
    plane.visible = false;
    work.add(object);
    object.position.set(0, 0, 0);
    object.quaternion.identity();
    object.scale.set(1, 1, 1);
    const box = boxOf(object);
    const restore = () => {
      work.remove(object);
      object.position.copy(saved.position);
      object.quaternion.copy(saved.quaternion);
      object.scale.copy(saved.scale);
      if (parent) {
        parent.add(object);
        // Keep the child order.
        parent.children.splice(parent.children.indexOf(object), 1);
        parent.children.splice(index, 0, object);
      }
    };
    if (box.isEmpty()) {
      restore();
      return true;
    }
    const sizeX = box.max.x - box.min.x;
    const sizeZ = box.max.z - box.min.z;
    const pad = 0.55;
    const w = sizeX + pad * 2;
    const l = sizeZ + pad * 2;
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    plane.position.set(cx, Math.max(0.001, box.min.y + 0.002), cz);
    plane.scale.set(w, -1, l);
    Object.assign(camera, { left: -w / 2, right: w / 2, top: l / 2, bottom: -l / 2, far: height });
    camera.position.set(cx, Math.max(0, box.min.y), cz);
    camera.updateProjectionMatrix();

    work.overrideMaterial = depth;
    const clear = renderer.getClearColor(new THREE.Color());
    const alpha = renderer.getClearAlpha();
    const previous = renderer.getRenderTarget();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(work, camera);
    work.overrideMaterial = null;
    pass(renderer, blur, target, target);
    pass(renderer, blur * 0.4, target, target);
    renderer.setRenderTarget(previous);
    renderer.setClearColor(clear, alpha);
    restore();
    if (plane.parent !== object) object.add(plane);
    plane.visible = true;
    return true;
  };

  const dispose = () => {
    disposed = true;
    target.dispose();
    spare.dispose();
    plane.geometry.dispose();
    plane.material.dispose();
    depth.dispose();
    blurH.dispose();
    blurV.dispose();
    quad.geometry.dispose();
  };

  return { plane, bake, dispose };
};
