/**
 * OverCut Manager's own line icons (DESIGN.md, "Iconography").
 *
 * One grid (24 x 24), one stroke (1.6, round caps and joins), no fills except
 * where a shape is a solid signal (the save dot, the play triangle). Drawn for
 * this game - a helmet for drivers, a tyre for the car, a pit board for the
 * calendar - not copied from any icon set. Every icon takes `currentColor`, so
 * it wears the text role of the label next to it, and `size` in px (16 in
 * tables and buttons, 18 in the rail).
 */

import React from "react";

const make = (name, body) => {
  const Icon = ({ size = 18, className = "", title, ...rest }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mn-ico ${className}`.trim()}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      {body}
    </svg>
  );
  Icon.displayName = `Icon${name}`;
  return Icon;
};

/** The pit garage: a roof over a door. */
export const IconHome = make("Home", (
  <>
    <path d="M3.5 10.5 12 4l8.5 6.5" />
    <path d="M5.5 9v10.5h13V9" />
    <path d="M9.5 19.5v-5h5v5" />
  </>
));

export const IconInbox = make("Inbox", (
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4 7 8 6 8-6" />
  </>
));

/** A helmet in profile, visor down. */
export const IconHelmet = make("Helmet", (
  <>
    <path d="M4 15.5c0-5.2 3.6-9 8.6-9 4.3 0 7.4 3.2 7.4 7.6v3.4H8.5" />
    <path d="M4 15.5c0 1.7 1.3 3 3 3h1.5" />
    <path d="M11.5 11h8.3" />
  </>
));

/** A tyre seen from the side: the car and its development. */
export const IconTyre = make("Tyre", (
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3" />
  </>
));

export const IconTransfer = make("Transfer", (
  <>
    <path d="M4 8.5h14" />
    <path d="m14.5 5 3.5 3.5-3.5 3.5" />
    <path d="M20 15.5H6" />
    <path d="M9.5 12 6 15.5 9.5 19" />
  </>
));

/** A headset: the people on the pit wall and in the factory. */
export const IconHeadset = make("Headset", (
  <>
    <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
    <rect x="3.5" y="13" width="4" height="6" rx="1" />
    <rect x="16.5" y="13" width="4" height="6" rx="1" />
    <path d="M18.5 19c0 1.2-1.6 2-4 2h-2" />
  </>
));

export const IconTrophy = make("Trophy", (
  <>
    <path d="M7.5 4.5h9v4a4.5 4.5 0 0 1-9 0z" />
    <path d="M7.5 6.5H4.5c0 2.5 1.3 4 3.4 4.2M16.5 6.5h3c0 2.5-1.3 4-3.4 4.2" />
    <path d="M12 13v3.5M8.5 19.5h7M9.5 19.5l.7-3h3.6l.7 3" />
  </>
));

/** A pit board with the round on it. */
export const IconCalendar = make("Calendar", (
  <>
    <rect x="4" y="5.5" width="16" height="14" rx="1.5" />
    <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
    <path d="M8 14h3M8 16.5h6" />
  </>
));

export const IconBriefcase = make("Briefcase", (
  <>
    <rect x="3.5" y="7.5" width="17" height="11.5" rx="1.5" />
    <path d="M9 7.5V5.5h6v2M3.5 12.5h17" />
  </>
));

export const IconSave = make("Save", (
  <>
    <path d="M5.5 4.5h10l3 3v12h-13z" />
    <path d="M8.5 4.5v4h6v-4M8.5 19.5v-5h7v5" />
  </>
));

export const IconDownload = make("Download", (
  <>
    <path d="M12 4.5v10" />
    <path d="m8 10.5 4 4 4-4" />
    <path d="M5 19.5h14" />
  </>
));

export const IconExit = make("Exit", (
  <>
    <path d="M10 4.5H5.5v15H10" />
    <path d="M14 8l4 4-4 4M18 12H9.5" />
  </>
));

export const IconMore = make("More", (
  <>
    <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </>
));

export const IconPlay = make("Play", <path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" />);

export const IconFastForward = make("FastForward", (
  <>
    <path d="M4.5 6.5 11 12l-6.5 5.5z" />
    <path d="M12.5 6.5 19 12l-6.5 5.5z" />
  </>
));

export const IconChevronRight = make("ChevronRight", <path d="m9.5 6 6 6-6 6" />);
export const IconChevronLeft = make("ChevronLeft", <path d="m14.5 6-6 6 6 6" />);
export const IconClose = make("Close", <path d="M6 6l12 12M18 6 6 18" />);

/** The rail's collapse handle: a panel with its edge. */
export const IconRail = make("Rail", (
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M9 4.5v15" />
  </>
));

export const IconGauge = make("Gauge", (
  <>
    <path d="M4 16.5a8 8 0 1 1 16 0" />
    <path d="m12 16.5 4-5" />
    <path d="M6.5 16.5h.01M17.5 16.5h.01" />
  </>
));

export const IconAlert = make("Alert", (
  <>
    <path d="M12 4 21 19.5H3z" />
    <path d="M12 10v4.5M12 17h.01" />
  </>
));

export const IconRain = make("Rain", (
  <>
    <path d="M7 14.5a4 4 0 0 1 .6-8 5 5 0 0 1 9.4 1.5 3.3 3.3 0 0 1 0 6.5z" />
    <path d="m8.5 17.5-1 2M12.5 17.5l-1 2M16.5 17.5l-1 2" />
  </>
));

export const IconWallet = make("Wallet", (
  <>
    <path d="M4.5 7.5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" />
    <path d="M4.5 7.5 15 4.5v3" />
    <path d="M15.5 13.5h4" />
  </>
));

/** Chequered flag: results and the weekend. */
export const IconFlag = make("Flag", (
  <>
    <path d="M5.5 20.5v-16" />
    <path d="M5.5 4.5h13v9h-13" />
    <path d="M9.8 4.5v9M14.2 4.5v9M5.5 9h13" />
  </>
));

export const IconClock = make("Clock", (
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>
));

export const IconRadio = make("Radio", (
  <>
    <circle cx="12" cy="12" r="2" />
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
  </>
));

export const IconCheck = make("Check", <path d="m5 12.5 4.5 4.5L19 7.5" />);

export const IconArrowUp = make("ArrowUp", <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />);
export const IconArrowDown = make("ArrowDown", <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />);

/** Every icon, for the DESIGN.md inventory and a quick visual check. */
export const ICONS = {
  IconHome, IconInbox, IconHelmet, IconTyre, IconTransfer, IconHeadset, IconTrophy, IconCalendar, IconBriefcase,
  IconSave, IconDownload, IconExit, IconMore, IconPlay, IconFastForward, IconChevronRight, IconChevronLeft, IconClose,
  IconRail, IconGauge, IconAlert, IconRain, IconWallet, IconFlag, IconClock, IconRadio, IconCheck, IconArrowUp, IconArrowDown,
};

/* ---- Added for the setup, inbox and moments (append-only block) ---- */

export const IconArrowRight = make("ArrowRight", <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />);
export const IconArrowLeft = make("ArrowLeft", <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />);

export const IconUpload = make("Upload", (
  <>
    <path d="M12 15.5v-11" />
    <path d="m8 8.5 4-4 4 4" />
    <path d="M5 19.5h14" />
  </>
));

export const IconTrash = make("Trash", (
  <>
    <path d="M4.5 7h15M9.5 7V4.5h5V7" />
    <path d="M6.5 7l1 12.5h9l1-12.5" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </>
));

export const IconCopy = make("Copy", (
  <>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M15.5 8.5v-3a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" />
  </>
));

/** Leaves the game for another site (sources). */
export const IconExternal = make("External", (
  <>
    <path d="M13.5 4.5h6v6M19.5 4.5 11 13" />
    <path d="M17.5 14v5.5h-13v-13H10" />
  </>
));

export const IconShuffle = make("Shuffle", (
  <>
    <path d="M4 7.5h3.5c4 0 5 9 9 9H20M4 16.5h3.5c1.6 0 2.7-1.4 3.6-3M13 10.5c.9-1.6 2-3 3.5-3H20" />
    <path d="m17.5 5 2.5 2.5-2.5 2.5M17.5 14l2.5 2.5-2.5 2.5" />
  </>
));

export const IconPlus = make("Plus", <path d="M12 5v14M5 12h14" />);

/** An open book: what really happened (history events). */
export const IconBook = make("Book", (
  <>
    <path d="M12 6.5c-2-1.5-4.5-2-7.5-2v13c3 0 5.5.5 7.5 2 2-1.5 4.5-2 7.5-2v-13c-3 0-5.5.5-7.5 2z" />
    <path d="M12 6.5v13" />
  </>
));

/** Two branching paths: a decision on the desk. */
export const IconFork = make("Fork", (
  <>
    <path d="M12 20.5v-6.5M12 14 6.5 8.5M12 14l5.5-5.5" />
    <path d="M4 10.5V6h4.5M20 10.5V6h-4.5" />
  </>
));

/** A padlock: history fixed (strict mode). */
export const IconLock = make("Lock", (
  <>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14v2.5" />
  </>
));

/** Diverging lines: history as a starting point (free mode). */
export const IconBranch = make("Branch", (
  <>
    <circle cx="6.5" cy="5.5" r="1.8" />
    <circle cx="6.5" cy="18.5" r="1.8" />
    <circle cx="17.5" cy="8.5" r="1.8" />
    <path d="M6.5 7.3v9.4M17.5 10.3c0 4-6 3.2-9.6 6.6" />
  </>
));

export const ICONS_SETUP = { IconArrowRight, IconArrowLeft, IconUpload, IconTrash, IconCopy, IconExternal, IconShuffle, IconPlus, IconBook, IconFork, IconLock, IconBranch };
/* IconWrench and IconStar come from the blocks below (other screens added them first in parallel). */

/* ---- Race weekend and live sessions (appended for Weekend.js, SessionLive.js, LiveRace.js, Broadcast.js) */

export const IconPause = make("Pause", (
  <>
    <path d="M9 6v12M15 6v12" />
  </>
));

/** Skip to the next event: a play triangle against a stop bar. */
export const IconNextEvent = make("NextEvent", (
  <>
    <path d="M6 6.5 14 12l-8 5.5z" />
    <path d="M18 6v12" />
  </>
));

/** One lap: a loop with its arrow. */
export const IconLap = make("Lap", (
  <>
    <path d="M19 12a7 7 0 1 1-2.05-4.95" />
    <path d="M17.5 3.5v3.8h-3.8" />
  </>
));

/** The broadcast camera. */
export const IconCamera = make("Camera", (
  <>
    <rect x="3.5" y="7" width="12" height="10" rx="1.5" />
    <path d="m15.5 10.5 5-3v9l-5-3" />
  </>
));

export const IconThermometer = make("Thermometer", (
  <>
    <path d="M10 14.2V5.5a2 2 0 1 1 4 0v8.7a3.5 3.5 0 1 1-4 0z" />
    <path d="M12 9v6.5" />
  </>
));

export const IconDroplet = make("Droplet", <path d="M12 4.5s5.5 6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-3.5 5.5-9.5 5.5-9.5z" />);

export const IconSun = make("Sun", (
  <>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
  </>
));

export const IconCloud = make("Cloud", <path d="M7 18.5a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6 1.3 3.4 3.4 0 0 1-.2 6.7z" />);

/** A stopwatch: fastest lap. */
export const IconTimer = make("Timer", (
  <>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 10v3.5l2 1.5M10 3.5h4M12 3.5v3" />
  </>
));


/* Appended for the data screens (Market shortlist, Office facilities). */

const STAR = "M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8z";
const IconStarOutline = make("Star", <path d={STAR} />);
const IconStarFilled = make("StarFilled", <path d={STAR} fill="currentColor" />);

/** A five-point star, outline; `filled` for a shortlisted driver. */
export const IconStar = ({ filled = false, ...rest }) => (filled ? <IconStarFilled {...rest} /> : <IconStarOutline {...rest} />);

/** A wrench, for repairs. */
export const IconWrench = make("Wrench", (
  <path d="M14.5 5.2a4 4 0 0 0-4.9 5.1L4.5 15.4a1.5 1.5 0 0 0 0 2.1l2 2a1.5 1.5 0 0 0 2.1 0l5.1-5.1a4 4 0 0 0 5.1-4.9l-2.4 2.4-2.6-.6-.6-2.6z" />
));

/** Up a level: a chevron over a bar. */
export const IconLevelUp = make("LevelUp", (
  <>
    <path d="M7 11l5-5 5 5" />
    <path d="M7 17h10" />
  </>
));
