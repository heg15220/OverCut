/**
 * Loading-time plumbing (RNF-02, RNF-03, RNF-04): download priorities, the
 * idle prefetch plan, the one-off WebGL probe and the shader compile gate.
 */

import { priorityOf, PREFETCH } from "./cacheStore";
import { prefetchPlan } from "./prefetch";
import { carAssetFor, circuitAssetFor, assetUrl } from "./manifest";
import { gateRenderer } from "./compileGate";
import { canRender3D, resetRender3DProbe } from "../support";
import manifest from "../../data/manager-assets.json";

describe("download priorities", () => {
  it("lightest LOD first, then circuits and splines, then LOD1 and LOD0; prefetches behind everything", () => {
    const order = ["cars/2012/x.lod0.glb", "circuits/monza-7.glb", "cars/2012/x.lod2.glb", "splines/monza-7.json", "cars/2012/x.lod1.glb"]
      .map((url) => [url, priorityOf(`/manager-assets/${url}?v=1`)])
      .sort((a, b) => a[1] - b[1])
      .map(([url]) => url);
    expect(order).toEqual(["cars/2012/x.lod2.glb", "circuits/monza-7.glb", "splines/monza-7.json", "cars/2012/x.lod1.glb", "cars/2012/x.lod0.glb"]);
    expect(PREFETCH).toBeGreaterThan(priorityOf("x.lod0.glb"));
  });
});

describe("idle prefetch plan (RNF-04)", () => {
  const car = manifest.cars.find((entry) => entry.lods?.length === 3);
  const circuit = manifest.circuits.find((entry) => entry.splineId && entry.spline);

  it("own car lightest then LOD0, then the circuit's spline and model, then the grid's LOD2 only", () => {
    const others = manifest.cars.filter((entry) => entry.season === car.season && entry.teamRef !== car.teamRef).slice(0, 3);
    const plan = prefetchPlan({ year: car.season, teamRef: car.teamRef, gridTeamRefs: [car.teamRef, ...others.map((entry) => entry.teamRef)], splineId: circuit.splineId });
    const own = carAssetFor(car.season, car.teamRef);
    const expected = [own.lods[own.lods.length - 1], own.lods[0]].map((lod) => assetUrl(lod.file));
    const track = circuitAssetFor({ splineId: circuit.splineId });
    expected.push(assetUrl(track.spline), assetUrl(track.file));
    others.forEach((entry) => {
      const asset = carAssetFor(entry.season, entry.teamRef);
      if (asset) expected.push(assetUrl(asset.lods[asset.lods.length - 1].file));
    });
    expect(plan).toEqual(expected);
  });

  it("asks for nothing a team or circuit without a model would not show (RF-3D-02)", () => {
    expect(prefetchPlan({ year: 1950, teamRef: "nobody", gridTeamRefs: ["nobody"], splineId: "nowhere" })).toEqual([]);
  });
});

describe("WebGL probe", () => {
  afterEach(() => {
    resetRender3DProbe();
    delete window.WebGLRenderingContext;
  });

  it("creates one probe context per page, however often screens ask, and releases it", () => {
    window.WebGLRenderingContext = function WebGLRenderingContext() {};
    const loseContext = jest.fn();
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({ getExtension: () => ({ loseContext }) }));
    try {
      resetRender3DProbe();
      for (let k = 0; k < 20; k += 1) expect(canRender3D()).toBe(true);
      expect(getContext).toHaveBeenCalledTimes(1);
      expect(loseContext).toHaveBeenCalledTimes(1);
    } finally {
      getContext.mockRestore();
    }
  });

  it("the no-3D switch still wins after a successful probe", () => {
    window.WebGLRenderingContext = function WebGLRenderingContext() {};
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({}));
    try {
      expect(canRender3D()).toBe(true);
      window.__OVERCUT_NO_3D__ = true;
      expect(canRender3D()).toBe(false);
    } finally {
      delete window.__OVERCUT_NO_3D__;
      getContext.mockRestore();
    }
  });
});

describe("shader compile gate (RNF-02)", () => {
  const fakeRenderer = ({ parallel }) => {
    const programs = new WeakMap();
    let ready = false;
    const renderer = {
      draws: 0,
      target: null,
      extensions: { has: () => parallel },
      properties: { get: (material) => (programs.has(material) ? programs.get(material) : programs.set(material, {}).get(material)) },
      getRenderTarget: () => renderer.target,
      setRenderTarget: (target) => {
        renderer.target = target;
      },
      compile: (scene) => {
        scene.traverse((object) => {
          renderer.properties.get(object.material).currentProgram = { isReady: () => ready };
        });
      },
      render: () => {
        renderer.draws += 1;
      },
      finish: () => {
        ready = true;
      },
    };
    return renderer;
  };
  const sceneOf = (...materials) => {
    const objects = materials.map((material) => ({ isMesh: true, material }));
    return { traverse: (fn) => objects.forEach(fn), traverseVisible: (fn) => objects.forEach(fn) };
  };

  it("skips frames while new programs link, then draws; renders into a target are never skipped", async () => {
    {
      const renderer = gateRenderer(fakeRenderer({ parallel: true }));
      const scene = sceneOf({}, {});
      renderer.render(scene, {});
      renderer.render(scene, {});
      expect(renderer.draws).toBe(0);
      renderer.setRenderTarget({});
      renderer.render(scene, {});
      expect(renderer.draws).toBe(1);
      renderer.setRenderTarget(null);
      renderer.finish();
      await new Promise((resolve) => setTimeout(resolve, 80));
      renderer.render(scene, {});
      expect(renderer.draws).toBe(2);
    }
  });

  it("leaves renderers without parallel compile alone", () => {
    const renderer = fakeRenderer({ parallel: false });
    const render = renderer.render;
    expect(gateRenderer(renderer).render).toBe(render);
  });
});
