/**
 * The team's headquarters: a header that always says where you are in the
 * season, the sections of the job, and the Continue button that moves the
 * calendar on. The race weekend and the moments open over it.
 */

import React, { useState } from "react";
import {
  LuArrowLeftRight, LuBriefcase, LuCalendarDays, LuDownload, LuEllipsis, LuHouse, LuLogOut, LuMail, LuSave,
  LuTrophy, LuUserCog, LuUsers, LuWrench,
} from "react-icons/lu";
import { PHASES } from "../engine/career";
import ContinueButton from "./ContinueButton";
import { useManager } from "./context";
import { ManagerBackLink, Sheet, TeamBadge } from "./atoms";
import { money, raceName, t } from "./texts";
import Central from "./Central";
import Inbox from "./Inbox";
import Drivers from "./Drivers";
import Car from "./Car";
import Market from "./Market";
import Staff from "./Staff";
import Standings from "./Standings";
import Calendar from "./Calendar";
import Office from "./Office";
import Weekend from "./Weekend";
import Moments from "./Moments";
import SaveSheet from "./SaveSheet";

export const SECTIONS = [
  { id: "central", icon: LuHouse, label: () => t("Central", "Home") },
  { id: "inbox", icon: LuMail, label: () => t("Bandeja", "Inbox") },
  { id: "drivers", icon: LuUsers, label: () => t("Pilotos", "Drivers") },
  { id: "car", icon: LuWrench, label: () => t("Coche e I+D", "Car & R&D") },
  { id: "market", icon: LuArrowLeftRight, label: () => t("Mercado", "Market") },
  { id: "staff", icon: LuUserCog, label: () => t("Personal", "Staff") },
  { id: "standings", icon: LuTrophy, label: () => t("Mundial", "Standings") },
  { id: "calendar", icon: LuCalendarDays, label: () => t("Calendario", "Calendar") },
  { id: "office", icon: LuBriefcase, label: () => t("Oficina", "Office") },
];

const BODIES = { central: Central, inbox: Inbox, drivers: Drivers, car: Car, market: Market, staff: Staff, standings: Standings, calendar: Calendar, office: Office };
const PHONE_NAV = ["central", "car", "market", "standings"];

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

export default function Hub({ backTo, fallbackMode }) {
  const { career, section, go, unread, saveState, leave, weekendOpen } = useManager();
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const team = career.world.teams[career.teamId];
  const Body = BODIES[section.id] || Central;
  const races = career.world.races.length;
  const phaseLabel = {
    [PHASES.PRESEASON]: t("Pretemporada", "Preseason"),
    [PHASES.RACING]: t(`Ronda ${Math.min(career.round + 1, races)} de ${races}`, `Round ${Math.min(career.round + 1, races)} of ${races}`),
    [PHASES.REVIEW]: t("Final de temporada", "Season over"),
    [PHASES.OFFSEASON]: t(`Invierno ${career.year}-${career.year + 1}`, `Winter ${career.year}-${career.year + 1}`),
  }[career.phase] || "";

  return (
    <div className="mn-hub">
      <div className="mn-head">
        <header className="mn-top">
          <button type="button" className="mn-top__brand" onClick={() => go("central")} aria-label={t("Ir a la central", "Go home")}>
            <TeamBadge team={team} size={38} />
            <span className="mn-top__team">
              <strong>{team.name}</strong>
              <small>
                {career.managerName} · {career.year} · {phaseLabel}
              </small>
            </span>
          </button>
          <div className="mn-top__money">
            <small>{t("Caja", "Balance")}</small>
            <strong className={career.finances.balance < 0 ? "is-bad" : ""}>{money(career.finances.balance)}</strong>
          </div>
          <div className="mn-top__confidence" title={career.owner ? t("Confianza de los inversores", "Investor confidence") : t("Confianza de la directiva", "Board confidence")}>
            <small>{career.owner ? t("Inversores", "Investors") : t("Directiva", "Board")}</small>
            <span className="mn-meter">
              <i style={{ width: `${career.board.confidence}%` }} className={career.board.confidence < 30 ? "is-bad" : career.board.confidence < 50 ? "is-warn" : ""} />
            </span>
          </div>
          <div className="mn-top__actions">
            <button type="button" className={`mn-icon-btn mn-save-dot is-${saveState}`} onClick={() => setSaving(true)} aria-label={t("Guardar y exportar", "Save and export")} title={t("Guardado automático · Exportar", "Autosave · Export")}>
              <LuSave />
            </button>
            <ContinueButton />
          </div>
        </header>
        <nav className="mn-nav" aria-label={t("Secciones", "Sections")}>
          {SECTIONS.map((entry) => (
            <button type="button" key={entry.id} className={section.id === entry.id ? "is-active" : ""} aria-current={section.id === entry.id ? "page" : undefined} onClick={() => go(entry.id)}>
              <entry.icon aria-hidden="true" />
              <span>{entry.label()}</span>
              {entry.id === "inbox" && unread > 0 && <b className="mn-badge-count">{unread}</b>}
            </button>
          ))}
        </nav>
        <SeasonStrip />
      </div>

      <div className="mn-main" key={section.id}>
        <Body params={section.params} />
      </div>

      <footer className="mn-foot">
        <ManagerBackLink to={backTo}>{t("Salir al Modo Carrera", "Exit to Career Mode")}</ManagerBackLink>
        <span className={`mn-source${fallbackMode ? " is-offline" : ""}`}>{fallbackMode ? t("Sin conexión", "Offline") : "f1db · CC BY 4.0"}</span>
        <button type="button" className="mn-link" onClick={leave}>
          {t("Menú principal", "Main menu")}
        </button>
      </footer>

      <nav className="mn-bottom" aria-label={t("Navegación", "Navigation")}>
        {PHONE_NAV.map((id) => {
          const entry = SECTIONS.find((item) => item.id === id);
          return (
            <button type="button" key={id} className={section.id === id ? "is-active" : ""} onClick={() => go(id)} aria-current={section.id === id ? "page" : undefined}>
              <entry.icon aria-hidden="true" />
              <span>{entry.label()}</span>
            </button>
          );
        })}
        <button type="button" className={!PHONE_NAV.includes(section.id) ? "is-active" : ""} onClick={() => setMore(true)}>
          <LuEllipsis aria-hidden="true" />
          <span>{t("Más", "More")}</span>
          {unread > 0 && <b className="mn-badge-count">{unread}</b>}
        </button>
      </nav>
      <div className="mn-fab">
        <ContinueButton size="lg" />
      </div>

      <Sheet open={more} onClose={() => setMore(false)} title={t("Más secciones", "More sections")}>
        <div className="mn-more-grid">
          {SECTIONS.filter((entry) => !PHONE_NAV.includes(entry.id)).map((entry) => (
            <button type="button" key={entry.id} onClick={() => { setMore(false); go(entry.id); }} className={section.id === entry.id ? "is-active" : ""}>
              <entry.icon aria-hidden="true" />
              <span>{entry.label()}</span>
              {entry.id === "inbox" && unread > 0 && <b className="mn-badge-count">{unread}</b>}
            </button>
          ))}
          <button type="button" onClick={() => { setMore(false); setSaving(true); }}>
            <LuDownload aria-hidden="true" />
            <span>{t("Exportar partida", "Export career")}</span>
          </button>
          <button type="button" onClick={() => { setMore(false); leave(); }}>
            <LuLogOut aria-hidden="true" />
            <span>{t("Menú principal", "Main menu")}</span>
          </button>
        </div>
      </Sheet>

      <SaveSheet open={saving} onClose={() => setSaving(false)} />
      {weekendOpen && <Weekend />}
      <Moments />
    </div>
  );
}
