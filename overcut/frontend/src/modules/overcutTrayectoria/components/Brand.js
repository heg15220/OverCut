/**
 * The game's logo, as worn in the header.
 *
 * The square card art is a poster; a header needs a lockup, so this is the
 * horizontal cut of the same identity: the OverCut seam and the helmet in an
 * emblem, then the family name over the mode name.
 *
 * The emblem is the parent logo distilled to what still reads at forty pixels
 * - one hard diagonal and one flat object. The parent puts a car on the gold;
 * this puts the helmet, because a helmet is what this game is about and it is
 * the shape the player spends the first screen painting.
 *
 * The mode name is a slot rather than a fixed word: the game calls itself
 * Trayectoria in Spanish and Career in English, and the header has always said
 * whichever the player reads.
 */

import React from "react";
import { Helmet } from "./atoms";
import { t } from "../i18n";

/* Bone on both halves of the seam, so the emblem reads the same whichever side
   of the diagonal a given pixel of the helmet lands on. Held as an object
   because `style` is a DOM prop name and a bare string trips the linter. */
const EMBLEM_HELMET = { primary: "#F3F1E9", secondary: "#F3F1E9", style: "solid" };

export const Brand = ({ compact = false }) => (
  <div className={`tr-brand${compact ? " tr-brand--compact" : ""}`}>
    <span className="tr-brand__emblem" aria-hidden="true">
      <Helmet {...EMBLEM_HELMET} size={compact ? 22 : 27} />
    </span>
    <span className="tr-brand__words">
      <span className="tr-brand__kicker">{t.kicker}</span>
      <span className="tr-brand__title">{t.title}</span>
    </span>
  </div>
);

export default Brand;
