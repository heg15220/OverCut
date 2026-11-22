/**
 * Small pieces of the "Data screen" template (DESIGN.md §6.3) shared by the
 * Office, Staff, Market, Calendar and Standings screens. The layout classes
 * live in styles/datascreen.css, imported here once.
 */

import React from "react";
import { money } from "./texts";
import "./styles/datascreen.css";

const MINUS = "−";

/** A signed amount of money: +$3,2M in green, −$497K in red, right-aligned by its column. */
export const Amount = ({ value, signed = true, tone = true }) => {
  const rounded = Math.round(value || 0);
  const cls = !tone ? "" : rounded > 0 ? " is-pos" : rounded < 0 ? " is-neg" : " is-zero";
  const text = money(Math.abs(rounded));
  return <span className={`mn-ds-amount${cls}`}>{signed && rounded !== 0 ? `${rounded > 0 ? "+" : MINUS}${text}` : text}</span>;
};

/** A signed plain number (+3, −0.5), coloured by sign. */
export const Delta = ({ value, digits = 0, suffix = "" }) => {
  const rounded = Number((value || 0).toFixed(digits));
  const cls = rounded > 0 ? " is-pos" : rounded < 0 ? " is-neg" : " is-zero";
  const text = Math.abs(rounded).toFixed(digits);
  return <span className={`mn-ds-amount${cls}`}>{`${rounded > 0 ? "+" : rounded < 0 ? MINUS : ""}${text}${suffix}`}</span>;
};

/** On phones the side panel sits below the table: bring it into view after a row is picked. */
export const revealOnPhone = (node) => {
  if (!node || typeof window === "undefined" || !window.matchMedia?.("(max-width: 760px)").matches) return;
  node.scrollIntoView?.({ behavior: "smooth", block: "start" });
};

/** Key/value rows for side panels. items: [[label, value], ...] */
export const Facts = ({ items, label }) => (
  <dl className="mn-ds-facts" aria-label={label}>
    {items.filter(Boolean).map(([key, value], index) => (
      <div key={index}>
        <dt>{key}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
);
