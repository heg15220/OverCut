/**
 * Feature detection for the 3D views, kept free of three.js imports so that
 * screens can decide between 3D and 2D without loading the 3D engine (and so
 * tests, which have no WebGL, never touch it).
 */

/** Whether this browser can draw WebGL at all (tests and old devices cannot). */
export const canRender3D = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__OVERCUT_NO_3D__) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
};
