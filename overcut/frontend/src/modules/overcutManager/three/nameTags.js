/**
 * Name tags over the cars in 3D (CAM-C4, VIEW-11, F1M24-CHINA §2.3; RF-3D-04, RNF-09, RNF-07).
 *
 * The policy is data/balance/hud.json `tags` (the HUD-C1 contract, read here and never redefined):
 *   focus        only the car you follow;
 *   focus+rival  that car and the rival it is racing (the default);
 *   all          every car in shot;
 *   none         no tag.
 * Outside `all` no more than `maxVisible` tags are drawn (focus first, then the rival). A car narrower on
 * screen than `hideBelowWidthShare` of the canvas width carries no tag: in the wide shots the tags used
 * to hide the cars they named. What is left is laid out with a 1D repulsion along the screen's x: tags
 * that would overlap are pushed apart sideways, then one sweep left to right guarantees no two boxes
 * intersect (IoU = 0, the acceptance of VIEW-11). Pure: Race3D.js measures, this decides, Race3D draws.
 */

import hud from "../data/balance/hud.json";

export const TAGS = hud.tags;

/** The policy in force: `override` when it is one hud.json knows, else hud.json tags.policy. */
export const tagPolicyOf = (override) => (TAGS.policies.includes(override) ? override : TAGS.policy);

/**
 * The cars that may carry a tag under `policy`, in priority order (focus, rival, then the rest for
 * `all`). `ids` are the cars in shot.
 */
export const tagSubjects = ({ policy = TAGS.policy, focusId = null, rivalId = null, ids = [] } = {}) => {
  if (policy === "none") return [];
  const present = new Set(ids);
  const first = [focusId, policy === "focus" ? null : rivalId].filter((id) => id !== null && id !== undefined && present.has(id));
  if (policy === "all") return [...new Set([...first, ...ids])];
  return [...new Set(first)].slice(0, TAGS.maxVisible);
};

/** Intersection over union of two boxes { left, top, w, h }. */
export const iou = (a, b) => {
  const ix = Math.max(0, Math.min(a.left + a.w, b.left + b.w) - Math.max(a.left, b.left));
  const iy = Math.max(0, Math.min(a.top + a.h, b.top + b.h) - Math.max(a.top, b.top));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
};

const rowsOverlap = (a, b, gap) => a.top < b.top + b.h + gap && b.top < a.top + a.h + gap;
const colsOverlap = (a, b, gap) => a.left < b.left + b.w + gap && b.left < a.left + a.w + gap;

/**
 * Lay the tags out. `candidates`: [{ id, x, y, w, h, carWidthPx }] - `x, y` the point over the car the
 * tag hangs from (px; the tag sits centred above it, its bottom `liftShare` of its height above the
 * point, as the old CSS translate(-50%, -130%)), `w, h` its measured size, `carWidthPx` the car's width
 * on screen. Returns [{ id, left, top, w, h, visible }] in the order of `candidates`; the visible ones
 * never overlap.
 */
export const layoutTags = (candidates, { policy = TAGS.policy, focusId = null, rivalId = null, viewWidth = 1280, gapPx = 4, liftShare = 1.3, passes = 4 } = {}) => {
  const minCar = (TAGS.hideBelowWidthShare || 0) * viewWidth;
  const wide = candidates.filter((c) => Number.isFinite(c.x) && Number.isFinite(c.y) && !(c.carWidthPx < minCar));
  const allowed = new Set(tagSubjects({ policy, focusId, rivalId, ids: wide.map((c) => c.id) }));
  const boxes = wide
    .filter((c) => allowed.has(c.id))
    .map((c) => ({ id: c.id, left: Math.min(Math.max(0, c.x - c.w / 2), Math.max(0, viewWidth - c.w)), top: c.y - c.h * liftShare, w: c.w, h: c.h }));
  // 1D repulsion: overlapping neighbours share the overlap, half each way along x.
  for (let pass = 0; pass < passes; pass += 1) {
    boxes.sort((a, b) => a.left - b.left);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (!rowsOverlap(a, b, 0) || !colsOverlap(a, b, gapPx)) continue;
        const push = (a.left + a.w + gapPx - b.left) / 2;
        a.left -= push;
        b.left += push;
      }
    }
  }
  // The sweep: left to right, each box clears every box already placed in its row.
  boxes.sort((a, b) => a.left - b.left || String(a.id).localeCompare(String(b.id)));
  const placed = [];
  boxes.forEach((box) => {
    let moved = true;
    while (moved) {
      moved = false;
      for (let k = 0; k < placed.length; k += 1) {
        const other = placed[k];
        if (rowsOverlap(box, other, 0) && colsOverlap(box, other, gapPx)) {
          box.left = other.left + other.w + gapPx;
          moved = true;
        }
      }
    }
    placed.push(box);
  });
  const byId = new Map(placed.map((box) => [box.id, box]));
  return candidates.map((c) => {
    const box = byId.get(c.id);
    return box ? { ...box, visible: true } : { id: c.id, left: 0, top: 0, w: c.w || 0, h: c.h || 0, visible: false };
  });
};
