/**
 * Feature detection for the 3D views, kept free of three.js imports so that
 * screens can decide between 3D and 2D without loading the 3D engine (and so
 * tests, which have no WebGL, never touch it).
 */

let probed = null;

/**
 * Whether this browser can draw WebGL at all (tests and old devices cannot).
 *
 * Screens call this on every render (Livery, the weekend, the moments), so the
 * probe runs once per page: each probe creates a real WebGL context, which costs
 * milliseconds, and Chrome keeps at most 16 alive - past that it drops the
 * oldest one, which can be the showroom or the race on screen (RNF-02). The
 * probe's own context is released straight away.
 */
export const canRender3D = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__OVERCUT_NO_3D__) return false;
  if (!window.WebGLRenderingContext) return false;
  if (probed !== null) return probed;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    probed = Boolean(gl);
    gl?.getExtension?.("WEBGL_lose_context")?.loseContext();
  } catch {
    probed = false;
  }
  return probed;
};

/** Forget the probe (tests). */
export const resetRender3DProbe = () => {
  probed = null;
};
