/**
 * The FIA Formula One World Drivers' Championship trophy.
 *
 * Richard Fox, Fox Silver, 1995: sterling silver with 24ct gold and enamel,
 * 525mm tall, carrying the facsimile signature of every champion since 1950
 * with room left to 2050.
 *
 * It is not a cup with handles. It is a trumpet: a wide flat everted rim you
 * can see down into, a body that sweeps concave to a narrow waist, and one
 * continuous gold rope spiralling the whole way down. Below that a blue enamel
 * globe, the engraved signatures between the coils, a chequered-flag collar,
 * a fan of gold petals and a low domed foot with the championship's name
 * engraved around it.
 *
 * Drawn flat, in the game's own palette, because the trophy's two metals are
 * already its two colours. The spiral is the thing to get right: it is what
 * makes this trophy this trophy, and every turn is drawn as the shallow arc a
 * ring around a cone makes when seen slightly from above - which is the angle
 * you see the rim's opening from.
 */

import React, { useId } from "react";

const CX = 56;
const BODY_TOP = 33;
const BODY_BOTTOM = 152;
const TURNS = 13;

/** Half-width of the body at t (0 at the rim, 1 at the waist). Concave. */
const halfAt = (t) => 10 + 23 * (1 - t) ** 2.05;

const yAt = (t) => BODY_TOP + t * (BODY_BOTTOM - BODY_TOP);

/** The silhouette, sampled rather than guessed at with control points. */
const bodyPath = () => {
  const steps = 22;
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    left.push(`${(CX - halfAt(t)).toFixed(1)} ${yAt(t).toFixed(1)}`);
    right.push(`${(CX + halfAt(t)).toFixed(1)} ${yAt(t).toFixed(1)}`);
  }
  return `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
};

/**
 * One turn of the rope. The ends sit half a step apart so the coils read as a
 * continuous helix rather than as a stack of separate rings.
 */
const coil = (index) => {
  const t = (index + 0.55) / TURNS;
  const y = yAt(t);
  const half = halfAt(t);
  const drop = (BODY_BOTTOM - BODY_TOP) / TURNS / 2;
  return `M${(CX - half).toFixed(1)} ${(y - drop).toFixed(1)} Q${CX} ${(y + half * 0.34).toFixed(1)} ${(CX + half).toFixed(1)} ${(y + drop).toFixed(1)}`;
};

/* The engraved names live on the lower body, between the coils. */
const SIGNATURE_ROWS = [0.56, 0.645, 0.73, 0.815];

const signatures = () =>
  SIGNATURE_ROWS.flatMap((t, row) => {
    const y = yAt(t) + 4;
    const half = halfAt(t) * 0.62;
    return [-1, 0, 1]
      .filter((slot) => half > 9 || slot === 0)
      .map((slot) => ({
        key: `${row}-${slot}`,
        x1: CX + slot * half * 0.72 - half * 0.26,
        x2: CX + slot * half * 0.72 + half * 0.26,
        y,
      }));
  });

/* The chequered flag around the neck, and the petals under it. */
const CHEQUER = Array.from({ length: 16 }, (_, i) => i);
const PETALS = Array.from({ length: 9 }, (_, i) => i);

export const Trophy = ({ size = 172, title }) => {
  const clip = `tr-trophy-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
  <svg
    className="tr-trophy"
    width={(size * 112) / 212}
    height={size}
    viewBox="0 0 112 212"
    role="img"
    aria-hidden={title ? undefined : "true"}
    aria-label={title}
  >
    {/* Body, then everything that is wrapped around it. */}
    <path d={bodyPath()} fill="#F3F1E9" />

    {/* The narrow decorated band that rings the throat, just under the rim. */}
    <path
      d={`M${(CX - halfAt(0)).toFixed(1)} ${BODY_TOP} L${(CX + halfAt(0)).toFixed(1)} ${BODY_TOP} L${(CX + halfAt(0.05)).toFixed(1)} ${yAt(0.05).toFixed(1)} Q${CX} ${(yAt(0.05) + 4).toFixed(1)} ${(CX - halfAt(0.05)).toFixed(1)} ${yAt(0.05).toFixed(1)} Z`}
      fill="#F2B705"
    />

    {/* Clipped to the silhouette: a coil that overshoots the body edge reads
        as a burr on the rim rather than as rope going round the back. */}
    <g fill="none" stroke="#F2B705" strokeWidth="2.4" clipPath={`url(#${clip})`}>
      {Array.from({ length: TURNS }, (_, i) => (
        <path key={i} d={coil(i)} />
      ))}
    </g>

    {/* Every champion since 1950, engraved between the coils. */}
    <g stroke="#8C93A4" strokeWidth="1.5" strokeOpacity="0.75">
      {signatures().map((line) => (
        <line key={line.key} x1={line.x1} y1={line.y} x2={line.x2} y2={line.y} />
      ))}
    </g>

    {/* The enamelled globe, where the spiral begins. */}
    <circle cx={CX} cy="47" r="7" fill="#2E7DC4" stroke="#F2B705" strokeWidth="2.2" />
    <path d="M52 45.5 q3 -2 5 0 t5 -0.5 M51.5 49 q4 2 7 0.5" fill="none" stroke="#F3F1E9" strokeWidth="1.1" strokeOpacity="0.8" />

    {/* The rim: a wide flat flange you look down into. The mouth is silver, a
        shade behind the flange - it is a polished bowl, not a hole. */}
    <ellipse cx={CX} cy="17" rx="51" ry="10.5" fill="#F3F1E9" />
    <ellipse cx={CX} cy="17.8" rx="42" ry="7.4" fill="#C4CCDA" />
    <ellipse cx={CX} cy="17.8" rx="42" ry="7.4" fill="none" stroke="#F2B705" strokeWidth="1.6" />

    {/* Blue cabochon at the foot of the body. */}
    <circle cx={CX} cy="149" r="3.4" fill="#2E7DC4" stroke="#F2B705" strokeWidth="1.4" />

    {/* The chequered flag collar. */}
    <rect x="41" y="155" width="30" height="9" fill="#F3F1E9" />
    <g fill="#0A0A0C">
      {CHEQUER.map((i) => (
        <rect
          key={i}
          x={41 + (i % 8) * 3.75}
          y={155 + Math.floor(i / 8) * 4.5}
          width="3.75"
          height="4.5"
          opacity={(i % 8) % 2 === Math.floor(i / 8) % 2 ? 1 : 0}
        />
      ))}
    </g>
    <rect x="40" y="153.5" width="32" height="2" fill="#F2B705" />
    <rect x="40" y="164" width="32" height="2" fill="#F2B705" />

    {/* The fan of petals under it. */}
    <path d="M40 166 H72 L80 182 H32 Z" fill="#F2B705" />
    <g stroke="#0A0A0C" strokeWidth="1.4" strokeOpacity="0.72">
      {PETALS.map((i) => (
        <line key={i} x1={41 + i * 3.9} y1="166.5" x2={33.5 + i * 5.7} y2="181.5" />
      ))}
    </g>

    {/* The domed foot, with the championship's name engraved around it. */}
    <path d="M32 182 H80 C88 182 98 190 100 199 H12 C14 190 24 182 32 182 Z" fill="#F3F1E9" />
    <path d="M22 194 Q56 202 90 194" fill="none" stroke="#8C93A4" strokeWidth="1.6" strokeOpacity="0.8" />
    <rect x="10" y="199" width="92" height="5" fill="#F3F1E9" />

    <defs>
      <clipPath id={clip}>
        <path d={bodyPath()} />
      </clipPath>
    </defs>
    </svg>
  );
};

export default Trophy;
