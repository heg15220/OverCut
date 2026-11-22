/**
 * The team's headquarters: the shell of every screen outside the race weekend
 * (DESIGN.md, "Shell"). A left rail with the sections of the job, a context bar
 * that always says where you are - team, round, next Grand Prix, money, the
 * board - with the Continue button that moves the calendar on, and the content.
 * On phones the rail becomes a bottom bar and Continue docks above it. The race
 * weekend and the moments open over all of it.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PHASES, currentRace } from "../engine/career";
import { circuitFor } from "../engine/venue";
import { canRender3D } from "../three/support";
import { prefetchForCareer } from "../three/assets/prefetch";
import ContinueButton from "./ContinueButton";
import { useManager } from "./context";
import { Flag, Meter, Sheet, TeamBadge } from "./atoms";
import {
  IconBriefcase, IconCalendar, IconDownload, IconExit, IconHeadset, IconHelmet, IconHome, IconInbox, IconMore,
  IconSave, IconTransfer, IconTrophy, IconTyre,
} from "./icons";
import { money, raceName, shortDate, t } from "./texts";
import logo from "../../app/components/Resources/LogoOverCut.png";
import Central from "./Central";
import Inbox from "./Inbox";
import Drivers from "./Drivers";
import Car from "./Car";
import Market from "./Market";
import Staff from "./Staff";
import Standings from "./Standings";
import Calendar from "./Calendar";
import Office from "./Office";
import Moments from "./Moments";
import SaveSheet from "./SaveSheet";

// The weekend (sessions, live race, broadcast) is the heaviest screen: its own chunk, prefetched once the hub is idle.
const loadWeekend = () => import(/* webpackChunkName: "manager-weekend" */ "./Weekend");
const Weekend = React.lazy(loadWeekend);

export const SECTIONS = [
  { id: "central", group: "desk", icon: IconHome, label: () => t("Central", "Home") },
  { id: "inbox", group: "desk", icon: IconInbox, label: () => t("Bandeja", "Inbox") },
  { id: "drivers", group: "team", icon: IconHelmet, label: () => t("Pilotos", "Drivers") },
  { id: "car", group: "team", icon: IconTyre, label: () => t("Coche e I+D", "Car & R&D") },
  { id: "staff", group: "team", icon: IconHeadset, label: () => t("Personal", "Staff") },
  { id: "market", group: "team", icon: IconTransfer, label: () => t("Mercado", "Market") },
  { id: "office", group: "team", icon: IconBriefcase, label: () => t("Oficina", "Office") },
  { id: "standings", group: "season", icon: IconTrophy, label: () => t("Mundial", "Standings") },
  { id: "calendar", group: "season", icon: IconCalendar, label: () => t("Calendario", "Calendar") },
];

const GROUPS = [
  { id: "desk", label: () => t("Despacho", "Desk") },
  { id: "team", label: () => t("Equipo", "Team") },
  { id: "season", label: () => t("Temporada", "Season") },
];

const BODIES = { central: Central, inbox: Inbox, drivers: Drivers, car: Car, market: Market, staff: Staff, standings: Standings, calendar: Calendar, office: Office };
const PHONE_NAV = ["central", "inbox", "car", "standings"];

/**
 * The site's own header is fixed over the page. Measure it so the rail and the
 * context bar stick under it, and pad the shell by whatever it covers at the top.
 */
const useSiteHeader = (ref) => {
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host || typeof window === "undefined") return undefined;
    const measure = () => {
      const header = document.querySelector(".header, .mobile-header");
      let bottom = 0;
      if (header) {
        const style = window.getComputedStyle(header);
        const rect = header.getBoundingClientRect();
        if (style.display !== "none" && (style.position === "fixed" || style.position === "sticky") && rect.height > 0) bottom = Math.max(0, Math.round(rect.bottom));
      }
      host.style.setProperty("--mn-site-top", `${bottom}px`);
      const top = host.getBoundingClientRect().top + window.scrollY - (parseFloat(host.style.paddingTop) || 0);
      host.style.setProperty("--mn-site-pad", `${Math.max(0, Math.round(bottom - top))}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    const late = setTimeout(measure, 800);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(late);
    };
  }, [ref]);
};

function SeasonStrip() {
  const { career, go } = useManager();
  const results = career.season.results;
  return (
    <ol className="mn-strip" aria-label={t("Temporada", "Season")}>
      {career.world.races.map((race, index) => {
        const result = results[index];
        const best = result
          ? Math.min(...result.rows.filter((row) => row.teamId === career.teamId && row.status === "finished").map((row) => row.position), 99)
          : null;
        const tone = !result ? (index === career.round ? "now" : "next") : best === 1 ? "win" : best <= 3 ? "podium" : result.rows.some((row) => row.teamId === career.teamId && row.points > 0) ? "points" : "none";
        return (
          <li key={race.name + index} className={`is-${tone}`} title={`${index + 1}. ${raceName(race.name)}${best && best < 99 ? ` · P${best}` : ""}`}>
            <button type="button" onClick={() => go("calendar")} aria-label={`${index + 1}. ${raceName(race.name)}`} />
          </li>
        );
      })}
    </ol>
  );
}

function Rail({ onSave, saveState, backTo, fallbackMode }) {
  const { section, go, unread, leave } = useManager();
  return (
    <aside className="mn-rail">
      <button type="button" className="mn-rail__brand" onClick={() => go("central")} aria-label={t("Ir a la central", "Go home")}>
        <img src={logo} alt="" />
        <span>
          <strong>OverCut</strong>
          <small>Manager</small>
        </span>
      </button>
      <nav className="mn-rail__groups" aria-label={t("Secciones", "Sections")}>
        {GROUPS.map((group) => (
          <div className="mn-rail__group" key={group.id}>
            <p className="mn-rail__label">{group.label()}</p>
            {SECTIONS.filter((entry) => entry.group === group.id).map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={`mn-rail__item${section.id === entry.id ? " is-active" : ""}`}
                aria-current={section.id === entry.id ? "page" : undefined}
                title={entry.label()}
                onClick={() => go(entry.id)}
              >
                <entry.icon size={18} />
                <span>{entry.label()}</span>
                {entry.id === "inbox" && unread > 0 && <b className="mn-count is-alert">{unread}</b>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="mn-rail__foot">
        <button type="button" className="mn-rail__item" onClick={onSave} title={t("Guardado automático · Exportar", "Autosave · Export")}>
          <IconSave size={18} />
          <span>{t("Guardar y exportar", "Save and export")}</span>
          <i className={`mn-save-state is-${saveState}`} aria-hidden="true" />
        </button>
        <Link className="mn-rail__item" to={backTo || "/careerMode"} title={t("Salir al Modo Carrera", "Exit to Career Mode")}>
          <IconExit size={18} />
          <span>{t("Salir al Modo Carrera", "Exit to Career Mode")}</span>
        </Link>
        <button type="button" className="mn-rail__item" onClick={leave} title={t("Menú principal", "Main menu")}>
          <IconMore size={18} />
          <span>{t("Menú principal", "Main menu")}</span>
        </button>
        <p className={`mn-rail__source${fallbackMode ? " is-offline" : ""}`}>{fallbackMode ? t("Sin conexión", "Offline") : "f1db · CC BY 4.0"}</p>
      </div>
    </aside>
  );
}

function ContextBar({ onSave, saveState }) {
  const { career, go } = useManager();
  const team = career.world.teams[career.teamId];
  const races = career.world.races.length;
  const race = career.phase === PHASES.RACING || career.phase === PHASES.PRESEASON ? currentRace(career) : null;
  const confidence = Math.round(career.board.confidence);
  const roundLabel = {
    [PHASES.PRESEASON]: t("Pretemporada", "Preseason"),
    [PHASES.RACING]: t(`Ronda ${Math.min(career.round + 1, races)} de ${races}`, `Round ${Math.min(career.round + 1, races)} of ${races}`),
    [PHASES.REVIEW]: t("Final de temporada", "Season over"),
    [PHASES.OFFSEASON]: t(`Invierno ${career.year}-${career.year + 1}`, `Winter ${career.year}-${career.year + 1}`),
  }[career.phase] || "";

  return (
    <header className="mn-context">
      <div className="mn-context__row">
        <button type="button" className="mn-context__team" onClick={() => go("central")} aria-label={t("Ir a la central", "Go home")}>
          <TeamBadge team={team} size={36} />
          <span>
            <strong>{team.name}</strong>
            <small>
              {career.managerName} · {career.year}
              <span className="mn-context__phone-round"> · {roundLabel}</span>
            </small>
          </span>
        </button>
        <span className="mn-context__divider" />
        <div className="mn-context__item mn-context__round">
          <small>{t("Temporada", "Season")} {career.year}</small>
          <strong>{roundLabel}</strong>
        </div>
        {race && (
          <>
            <span className="mn-context__divider mn-context__divider--gp" />
            <button type="button" className="mn-context__item mn-context__gp mn-context__link" onClick={() => go("calendar")}>
              <small>
                {t("Próximo GP", "Next GP")} · {shortDate(race.date)}
              </small>
              <strong>
                <Flag code={race.country} width={18} />
                {raceName(race.name)}
              </strong>
            </button>
          </>
        )}
        <span className="mn-context__spacer" />
        <div className="mn-context__item mn-context__money">
          <small>{t("Caja", "Balance")}</small>
          <strong className={career.finances.balance < 0 ? "is-bad" : ""}>{money(career.finances.balance)}</strong>
        </div>
        <span className="mn-context__divider mn-context__divider--board" />
        <button type="button" className="mn-context__item mn-context__board mn-context__link" onClick={() => go("office")} title={career.owner ? t("Confianza de los inversores", "Investor confidence") : t("Confianza de la directiva", "Board confidence")}>
          <small>{career.owner ? t("Inversores", "Investors") : t("Directiva", "Board")}</small>
          <strong>
            <Meter value={confidence} width={64} label={t("Confianza", "Confidence")} />
            {confidence}%
          </strong>
        </button>
        <div className="mn-context__actions">
          <button type="button" className="mn-icon-btn mn-context__save" onClick={onSave} aria-label={t("Guardar y exportar", "Save and export")} title={t("Guardado automático · Exportar", "Autosave · Export")}>
            <IconSave size={18} />
            <i className={`mn-save-state is-${saveState}`} aria-hidden="true" />
          </button>
          <ContinueButton />
        </div>
      </div>
      <SeasonStrip />
    </header>
  );
}

/** Run `fn` once the browser is idle (at the latest after `timeout` ms); returns the cancel. */
const whenIdle = (fn, timeout) => {
  if (typeof window === "undefined") return () => {};
  if (window.requestIdleCallback) {
    const handle = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(fn, 1500);
  return () => window.clearTimeout(handle);
};

/**
 * While the player reads the hub: fetch the weekend's code, then put the GLB files
 * of the next Grand Prix in Cache Storage (own car, circuit, the grid's lightest LOD),
 * so opening the weekend neither waits for code nor downloads (RNF-03, RNF-04).
 */
const usePrefetch = (career) => {
  const year = career?.year;
  const round = career?.round;
  useEffect(() => whenIdle(() => loadWeekend().catch(() => {}), 4000), []);
  useEffect(() => {
    if (!career || career.ended || !canRender3D()) return undefined;
    let cancelled = false;
    const cancel = whenIdle(() => {
      if (cancelled) return;
      const race = currentRace(career);
      const team = career.world.teams[career.teamId];
      let splineId = null;
      try {
        splineId = race ? circuitFor(race, career.year)?.splineId || null : null;
      } catch {
        splineId = null;
      }
      prefetchForCareer({
        year: career.year,
        teamRef: team && !team.custom ? team.id : null,
        gridTeamRefs: Object.values(career.world.teams).filter((entry) => !entry.custom && !entry.partial).map((entry) => entry.id),
        splineId,
      });
    }, 6000);
    return () => {
      cancelled = true;
      cancel();
    };
    // The plan changes with the season and the round, not with every career mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, round]);
};

export default function Hub({ backTo, fallbackMode }) {
  const { career, section, go, unread, saveState, leave, weekendOpen } = useManager();
  usePrefetch(career);
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const host = useRef(null);
  useSiteHeader(host);
  const Body = BODIES[section.id] || Central;

  return (
    <div className="mn-hub" ref={host}>
      <Rail onSave={() => setSaving(true)} saveState={saveState} backTo={backTo} fallbackMode={fallbackMode} />

      <div className="mn-shell">
        <ContextBar onSave={() => setSaving(true)} saveState={saveState} />
        <div className="mn-main" key={section.id}>
          <Body params={section.params} />
        </div>
        <footer className="mn-foot">
          <span className={`mn-source${fallbackMode ? " is-offline" : ""}`}>{fallbackMode ? t("Sin conexión", "Offline") : "f1db · CC BY 4.0"}</span>
          <span className="mn-foot__note">{t("OverCut no está afiliado a la Fórmula 1 ni a ningún equipo", "OverCut is not affiliated with Formula 1 or any team")}</span>
        </footer>
      </div>

      <div className="mn-dock">
        <ContinueButton size="lg" />
      </div>
      <nav className="mn-bottom" aria-label={t("Navegación", "Navigation")}>
        {PHONE_NAV.map((id) => {
          const entry = SECTIONS.find((item) => item.id === id);
          return (
            <button type="button" key={id} className={section.id === id ? "is-active" : ""} onClick={() => go(id)} aria-current={section.id === id ? "page" : undefined}>
              <entry.icon size={20} />
              <span>{entry.label()}</span>
              {id === "inbox" && unread > 0 && <b className="mn-count is-alert">{unread}</b>}
            </button>
          );
        })}
        <button type="button" className={!PHONE_NAV.includes(section.id) ? "is-active" : ""} onClick={() => setMore(true)}>
          <IconMore size={20} />
          <span>{t("Más", "More")}</span>
        </button>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title={t("Más secciones", "More sections")}>
        <div className="mn-more-grid">
          {SECTIONS.filter((entry) => !PHONE_NAV.includes(entry.id)).map((entry) => (
            <button type="button" key={entry.id} onClick={() => { setMore(false); go(entry.id); }} className={section.id === entry.id ? "is-active" : ""}>
              <entry.icon size={20} />
              <span>{entry.label()}</span>
            </button>
          ))}
          <button type="button" onClick={() => { setMore(false); setSaving(true); }}>
            <IconDownload size={20} />
            <span>{t("Exportar partida", "Export career")}</span>
          </button>
          <Link to={backTo || "/careerMode"} className="mn-more-grid__link" onClick={() => setMore(false)}>
            <IconExit size={20} />
            <span>{t("Modo Carrera", "Career Mode")}</span>
          </Link>
          <button type="button" onClick={() => { setMore(false); leave(); }}>
            <IconExit size={20} />
            <span>{t("Menú principal", "Main menu")}</span>
          </button>
        </div>
      </Sheet>

      <SaveSheet open={saving} onClose={() => setSaving(false)} />
      {weekendOpen && (
        <React.Suspense fallback={<p className="mn-loading">{t("Llegando al circuito", "Arriving at the circuit")}</p>}>
          <Weekend />
        </React.Suspense>
      )}
      <Moments />
    </div>
  );
}
