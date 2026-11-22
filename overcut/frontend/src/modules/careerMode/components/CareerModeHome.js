/**
 * The door to Career Mode.
 *
 * There are two ways to race a whole Formula 1 career, and they differ in one
 * thing: how much of it you play by hand. The deep mode gives you every Grand
 * Prix; the quick one gives you every season. The third card is the other side
 * of the garage - running the team instead of driving for it. So each choice is
 * presented as what you actually hold: a single race's worth of laps, a stack of
 * seasons, or a grid of cars with yours among them.
 *
 * It wears OverCut's own identity (docs/manager/DESIGN.md: navy graphite, one
 * gold accent, Archivo with its width axis) because it belongs to none of the
 * three modes; each card shows the grain of its mode, drawn rather than said.
 *
 * Open to anyone. This screen is not part of OverCutGames and asks for no
 * account, which is why it links home rather than to the minigames hub.
 */

import React from "react";
import { Link } from "react-router-dom";
import "./CareerModeHome.css";

const detectLocale = () => {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  return lang.startsWith("es") ? "es" : "en";
};

const STRINGS = {
  es: {
    back: "Volver a OverCut",
    kicker: "OverCut",
    title: "Modo Carrera",
    lead: "Dos formas de correr una carrera entera en la Fórmula 1 y una de dirigirla desde el muro de boxes.",
    deep: {
      name: "Carrera profunda",
      tag: "Juegas cada Gran Premio",
      copy: "Vives la temporada carrera a carrera, con narración en directo, condiciones de pista e incidentes. Firmas contratos, peleas con tu compañero y ves crecer tu carta de piloto.",
      points: [
        "Cada Gran Premio se simula y se cuenta",
        "Contratos, objetivos y duelo con tu compañero",
        "Guardas la partida con un código de exportación",
      ],
      cta: "Empezar carrera profunda",
    },
    quick: {
      name: "Simulación rápida",
      tag: "Juegas cada temporada",
      copy: "Una carrera completa desde 1950 hasta hoy. Las carreras se corren por dentro y tú decides entre temporadas: mercado, negociación, pretemporada y lo que pasa fuera de la pista.",
      points: [
        "Debuta en cualquier año desde 1950",
        "Una temporada por pantalla, no una carrera",
        "Palmarés, récords históricos y un rival de por vida",
      ],
      cta: "Empezar simulación rápida",
    },
    manager: {
      name: "Modo mánager",
      tag: "Diriges el equipo",
      copy: "Eres el jefe de equipo: desarrollas el coche, fichas pilotos, decides la estrategia en directo y respondes ante la directiva. O creas tu propio equipo y lo inscribes en la parrilla de aquel año.",
      points: [
        "38 temporadas jugables, de 1976 a 2026, con su parrilla real",
        "Crea tu equipo: nombre, colores, motor y pilotos",
        "Carrera en directo: paradas, lluvia y órdenes de equipo",
      ],
      cta: "Empezar modo mánager",
    },
    free: "Los tres se juegan sin cuenta.",
  },
  en: {
    back: "Back to OverCut",
    kicker: "OverCut",
    title: "Career Mode",
    lead: "Two ways to race a whole Formula 1 career, and one to run it from the pit wall.",
    deep: {
      name: "Deep career",
      tag: "You play every Grand Prix",
      copy: "You live the season race by race, with live narration, track conditions and incidents. You sign contracts, fight your team-mate and watch your driver card grow.",
      points: [
        "Every Grand Prix is simulated and narrated",
        "Contracts, objectives and the team-mate duel",
        "Save your game with an export code",
      ],
      cta: "Start deep career",
    },
    quick: {
      name: "Quick simulation",
      tag: "You play every season",
      copy: "A whole career from 1950 to today. The races are run internally and you decide between seasons: the market, negotiation, preseason and what happens off track.",
      points: [
        "Debut in any year from 1950",
        "One season per screen, not one race",
        "Career record, all-time books and a lifelong rival",
      ],
      cta: "Start quick simulation",
    },
    manager: {
      name: "Manager mode",
      tag: "You run the team",
      copy: "You are the team principal: you develop the car, sign drivers, call the strategy live and answer to the board. Or build your own team and enter it on that year's grid.",
      points: [
        "38 playable seasons, 1976 to 2026, with their real grids",
        "Create your team: name, colours, engine and drivers",
        "Live race: pit stops, rain and team orders",
      ],
      cta: "Start manager mode",
    },
    free: "All three play without an account.",
  },
};

const t = STRINGS[detectLocale()] || STRINGS.en;

/* A single race, in laps: the grain the deep mode is played at. */
const LAPS = Array.from({ length: 30 }, (_, i) => i);

/* A run of seasons, each a row of Grands Prix: the grain of the quick one. */
const SEASONS = [
  "...p..p.P.pP..",
  "..p.Pp.P.pPW.p",
  ".pP.WpP.PW.pPW",
  "pPW.WPW.WpPWPW",
];

/* A grid of cars on pace, yours the gold one: the grain of the manager. */
const GRID = [94, 90, 86, 83, 80, 78, 76, 73, 70, 66];
const MINE = 5;

const Card = ({ to, mode, tone, children }) => (
  <article className={`cmh-card cmh-card--${tone}`}>
    <div className="cmh-card__head">
      <h2 className="cmh-card__name">{mode.name}</h2>
      <p className="cmh-card__tag">{mode.tag}</p>
    </div>

    <div className="cmh-card__token" aria-hidden="true">
      {children}
    </div>

    <p className="cmh-card__copy">{mode.copy}</p>

    <ul className="cmh-card__points">
      {mode.points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>

    <Link className="cmh-cta" to={to}>
      <span>{mode.cta}</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
      </svg>
    </Link>
  </article>
);

export const CareerModeHome = () => (
  <main className="cmh-root">
    <div className="cmh-shell">
      <Link className="cmh-back" to="/">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />
        </svg>
        {t.back}
      </Link>

      <header className="cmh-head">
        <span className="cmh-kicker">{t.kicker}</span>
        <h1 className="cmh-title">{t.title}</h1>
        <p className="cmh-lead">{t.lead}</p>
      </header>

      <div className="cmh-cards">
        <Card to="/careerMode/deep" mode={t.deep} tone="deep">
          {/* One race, lap by lap. */}
          <span className="cmh-laps">
            {LAPS.map((lap) => (
              <i key={lap} className={lap === 22 ? "is-now" : undefined} />
            ))}
          </span>
        </Card>

        <Card to="/careerMode/trayectoria" mode={t.quick} tone="quick">
          {/* Season on season, each one a row of results. */}
          <span className="cmh-seasons">
            {SEASONS.map((season, row) => (
              <span key={season} className="cmh-seasons__row">
                {[...season].map((cell, index) => (
                  <i key={`${row}-${index}`} className={`is-${cell === "." ? "none" : cell}`} />
                ))}
              </span>
            ))}
          </span>
        </Card>

        <Card to="/careerMode/manager" mode={t.manager} tone="manager">
          {/* The grid, car by car, with yours somewhere in it. */}
          <span className="cmh-grid">
            {GRID.map((pace, index) => (
              <i key={pace} className={index === MINE ? "is-mine" : undefined} style={{ height: `${pace - 50}%` }} />
            ))}
          </span>
        </Card>
      </div>

      <p className="cmh-free">{t.free}</p>
    </div>
  </main>
);

export default CareerModeHome;
