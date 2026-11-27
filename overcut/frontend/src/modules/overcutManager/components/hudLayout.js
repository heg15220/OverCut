/**
 * VIEW-01 (F1M24-CHINA §2.5; RF-3D-04, RNF-09, RNF-07, RF-WKD-07): the live HUD by zones.
 *
 * The capture of OverCut in China 2013 (1280×720) left under a quarter of the picture free: the site
 * header, the GP stepper, a two-row playback bar and two 250 px driver cards on top of a full-height
 * tower and side column. Here each block has its zone over the picture - the tower top left, the
 * playback bar top centre on one row, the conditions top right, the map (and the radio, opened on
 * demand) bottom right, your driver cards bottom left and right, folding to one line - with its
 * maximum size from data/balance/hud.json layout, in % of the viewport where the picture matters and
 * in px where the type does.
 *
 *   hudZonesOf(viewport, state)   the rectangle of every block, or { zoned: false } below
 *                                 layout.minViewportPx (the stacked layout of always)
 *   freeShareOf(rects, viewport)  the share of a grid of points (layout.target.grid) that no block
 *                                 covers: the unit twin of the Playwright check with elementsFromPoint
 *   zoneStyleOf(zones)            the CSS custom properties components/styles/hudZones.css reads
 *   cardOpenOf(...)               whether a driver card is open (folded to one line otherwise)
 *
 * Pure functions; the view calls them on every repaint. Nothing here touches the engine (RNF-05).
 */

import HUD from "../data/balance/hud.json";

export const LAYOUT = HUD.layout;

const pct = (value, of) => (value / 100) * of;

/**
 * The rectangles ({ x, y, w, h } in px from the top left) of the live HUD's blocks at viewport
 * `{ w, h }`. `state`: `cards` - one `{ open }` per driver card; `mid` - the team-orders box between
 * them is there; `towerRows` - rows the tower shows now (all when open, layout.blocks.tower.foldedRows
 * and yours when folded); `towerFlag` / `towerModes` - the tower shows its flag line / its mode picker;
 * `feedOpen` - the radio is open under the map; `map` - the map is drawn (not in the map view).
 */
export const hudZonesOf = ({ w, h }, state = {}, layout = LAYOUT) => {
  const min = layout.minViewportPx;
  if (!(w >= min.w && h >= min.h)) return { zoned: false, w, h, rects: null };
  const { cards = [], mid = false, towerRows = layout.blocks.tower.foldedRows, towerFlag = true, towerModes = true, feedOpen = layout.blocks.side.feedOpen, map = true } = state;
  const g = layout.gapPx;
  const B = layout.blocks;

  const tower = { x: g, y: g, w: B.tower.widthPx, h: 0 };
  const towerFull = B.tower.headPx + (towerFlag ? B.tower.flagPx : 0) + (towerModes ? B.tower.modesPx : 0) + towerRows * B.tower.rowPx + B.tower.morePx;
  tower.h = Math.min(pct(B.tower.maxHeightPct, h), towerFull);

  const statusW = pct(B.status.maxWidthPct, w);
  const status = { x: w - g - statusW, y: g, w: statusW, h: B.status.heightPx };

  // The playback bar on one row, centred in what the tower and the conditions leave at the top.
  const playFrom = tower.x + tower.w + g;
  const playTo = status.x - g;
  const playW = Math.max(0, Math.min(pct(B.play.maxWidthPct, w), playTo - playFrom));
  const play = { x: playFrom + (playTo - playFrom - playW) / 2, y: g, w: playW, h: B.play.heightPx };

  const sideH = (map ? B.side.mapHeightPx : 0) + (feedOpen ? pct(B.side.feedHeightPct, h) + (map ? g : 0) : 0);
  const side = { x: w - g - B.side.widthPx, y: h - g - sideH, w: B.side.widthPx, h: sideH };

  // Your cards along the bottom, between the left edge and the side column: the first on the left,
  // the second on the right, the team orders between them. An open card never climbs into the tower.
  const rowFrom = g;
  const rowTo = side.x - g;
  const cardW = Math.min(B.cards.maxWidthPx, pct(B.cards.widthPct, w), (rowTo - rowFrom - (mid ? B.cards.midWidthPx + 2 * g : g)) / Math.max(1, Math.min(2, cards.length)));
  const cardRects = cards.slice(0, 2).map((card, index) => {
    const x = index === 0 ? rowFrom : rowTo - cardW;
    const underTower = x < tower.x + tower.w && x + cardW > tower.x;
    const room = underTower ? h - g - (tower.y + tower.h + g) : h - 2 * g;
    const tall = card.open ? Math.min(pct(B.cards.openMaxHeightPct, h), room) : B.cards.foldedHeightPx;
    const height = Math.max(B.cards.foldedHeightPx, tall);
    return { x, y: h - g - height, w: cardW, h: height };
  });
  const midRect = mid && cardRects.length > 1
    ? { x: (cardRects[0].x + cardRects[0].w + cardRects[1].x - B.cards.midWidthPx) / 2, y: h - g - B.cards.midHeightPx, w: B.cards.midWidthPx, h: B.cards.midHeightPx }
    : null;

  return { zoned: true, w, h, rects: { tower, status, play, side: sideH > 0 ? side : null, cards: cardRects, mid: midRect } };
};

/** Every block's rectangle in a flat list (the empty ones left out). */
export const rectsOf = (zones) => {
  if (!zones?.rects) return [];
  const { tower, status, play, side, cards, mid } = zones.rects;
  return [tower, status, play, side, mid, ...(cards || [])].filter((rect) => rect && rect.w > 0 && rect.h > 0);
};

/**
 * The share of the picture no block covers, sampled at the centres of a `cols × rows` grid
 * (layout.target.grid) - what the Playwright check reads with document.elementsFromPoint.
 */
export const freeShareOf = (rects, { w, h }, grid = LAYOUT.target.grid) => {
  const [cols, rows] = grid;
  let free = 0;
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      const px = ((i + 0.5) / cols) * w;
      const py = ((j + 0.5) / rows) * h;
      if (!rects.some((rect) => px >= rect.x && px < rect.x + rect.w && py >= rect.y && py < rect.y + rect.h)) free += 1;
    }
  }
  return free / (cols * rows);
};

const px = (value) => `${Math.round(value * 10) / 10}px`;

/** The zones as CSS custom properties (components/styles/hudZones.css). Empty when not zoned. */
export const zoneStyleOf = (zones) => {
  if (!zones?.zoned) return {};
  const style = {};
  const put = (name, rect) => {
    if (!rect) return;
    style[`--z-${name}-x`] = px(rect.x);
    style[`--z-${name}-y`] = px(rect.y);
    style[`--z-${name}-w`] = px(rect.w);
    style[`--z-${name}-h`] = px(rect.h);
  };
  const { tower, status, play, side, cards, mid } = zones.rects;
  put("tower", tower);
  put("status", status);
  put("play", play);
  put("side", side);
  put("mid", mid);
  (cards || []).forEach((rect, index) => put(`card${index}`, rect));
  style["--z-tower-row"] = px(LAYOUT.blocks.tower.rowPx);
  style["--z-gap"] = px(LAYOUT.gapPx);
  return style;
};

/**
 * Whether driver card `id` is open: the viewer's own fold if there is one, else layout.cards.defaultOpen
 * (focus = the car you follow, if it is yours; none; all). In a session, a car in its garage has its card
 * open (layout.cards.openInGarage: the run is prepared there). Not zoned (the stacked layout), every card is open.
 */
export const cardOpenOf = ({ id, zoned, folds = {}, focusId = null, userIds = [], inGarage = false, layout = LAYOUT }) => {
  if (!zoned || !layout.cards.foldable) return true;
  if (folds[id] === undefined && inGarage && layout.cards.openInGarage) return true;
  if (folds[id] !== undefined) return !folds[id];
  if (layout.cards.defaultOpen === "all") return true;
  if (layout.cards.defaultOpen === "none") return false;
  const followed = userIds.includes(focusId) ? focusId : userIds[0];
  return id === followed;
};

/** The rows the tower shows folded: the first layout.blocks.tower.foldedRows, plus your cars and the one you follow. */
export const towerRowsShown = ({ rows, open, layout = LAYOUT }) => {
  if (open) return rows.length;
  const first = layout.blocks.tower.foldedRows;
  return rows.filter((row, index) => index < first || row.flags?.user || row.flags?.focus).length;
};
