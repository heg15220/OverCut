/**
 * The inbox (RF-INB-01, RF-INB-02): messages, the decisions some of them are
 * waiting for - each answer with its typed effects - and the season's real
 * history, delivered on its date with its source. Styles: ./styles/inbox.css.
 */

import React, { useMemo, useState } from "react";
import { markAllRead, markRead } from "../engine/inbox";
import { resolveEvent } from "../engine/events";
import { useManager } from "./context";
import { Badge, EmptyState, PageHeader, Panel, Tabs } from "./atoms";
import { IconAlert, IconArrowDown, IconArrowUp, IconCheck, IconInbox, IconTyre, IconWallet } from "./icons";
import { IconArrowLeft, IconBook, IconExternal, IconFork } from "./icons";
import { effectsOf } from "./eventEffects";
import { AREA, FINANCE_INBOX, eventOutcome, eventText, inboxBody, inboxTitle, money, shortDate, t } from "./texts";
import "./styles/inbox.css";

const ALERTS = new Set(["board-warning", "investors-warning", "sacked", "investors-out", "bankrupt", "part-damage", "unit-penalty", "cost-cap-breach", "cost-cap-fine", "rd-failed", "design-failed"]);
const FINANCE = new Set(["sponsor-offers", "sponsor-deal", "sponsor-bonus", "board-midseason", "prize-instalment", "race-income", "cost-cap-breach", "objectives"]);
const CAR = new Set(["rd-done", "design-done", "parts-built", "upgrade-done", "upgrade-start", "hq-upgrade"]);

/** Which shelf a message sits on: a decision, history, a warning, or the rest of the team's mail. */
export const inboxCategory = (item) => {
  if (item.kind === "event") return "decision";
  if (item.kind === "history-event") return "history";
  if (ALERTS.has(item.kind)) return "alert";
  return "team";
};

const iconFor = (item) => {
  const category = inboxCategory(item);
  if (category === "decision") return IconFork;
  if (category === "history") return IconBook;
  if (category === "alert") return IconAlert;
  if (FINANCE.has(item.kind)) return IconWallet;
  if (CAR.has(item.kind)) return IconTyre;
  return IconInbox;
};

const historyLabel = (item) =>
  item.sensitive ? t("En memoria", "In memoriam") : item.anchor === "guided" ? t("En la historia real", "In real history") : t("Historia", "History");

/** The title without the history label in front of it (the label is drawn as a badge). */
const titleOf = (career, item) => {
  const title = inboxTitle(career, item);
  if (item.kind !== "history-event") return title;
  const [, ...rest] = title.split(" · ");
  return rest.join(" · ") || title;
};

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** One effect of an answer, as a quiet chip: what moves and which way. */
export const EffectChip = ({ effect, career }) => {
  const name = (id) => career.world.drivers[id]?.name?.split(" ").slice(-1)[0] || "";
  const Arrow = effect.dir > 0 ? IconArrowUp : effect.dir < 0 ? IconArrowDown : null;
  let label;
  switch (effect.type) {
    case "money":
      label = effect.amount
        ? `${effect.dir < 0 ? "−" : "+"}${money(effect.amount)}${effect.perRace ? t(" por GP", " per GP") : effect.perYear ? t(" al año", " a year") : ""}`
        : t("Ingreso", "Income");
      break;
    case "morale":
      label = effect.who ? t(`Moral de ${name(effect.who)}`, `${name(effect.who)}'s morale`) : t("Moral de los pilotos", "Drivers' morale");
      break;
    case "confidence":
      label = t("Confianza de la directiva", "Board confidence");
      break;
    case "car":
      label = AREA[effect.area] ? AREA[effect.area]() : t("Rendimiento del coche", "Car performance");
      break;
    case "reliability":
      label = t("Fiabilidad", "Reliability");
      break;
    case "facility":
      label = t("Fábrica +1 nivel", "Factory +1 level");
      break;
    case "fans":
      label = t("Afición", "Fans");
      break;
    case "target":
      label = t("Objetivo de constructores más alto", "Higher constructors' target");
      break;
    case "uncertain":
      label = t("Resultado incierto", "Uncertain outcome");
      break;
    case "deadline":
      label = t("Se revisa a final de temporada", "Reviewed at season end");
      break;
    case "departure":
      label = effect.staff ? t("Sale el director técnico", "The technical director leaves") : t(`${name(effect.who)} se va a final de año`, `${name(effect.who)} leaves at season end`);
      break;
    case "scouting":
      label = t("Conoces su techo", "You learn his ceiling");
      break;
    case "role":
      label = t("Ambos con el mismo trato", "Equal status for both");
      break;
    default:
      label = effect.type;
  }
  const tone = effect.type === "money" ? (effect.dir < 0 ? "neg" : "pos") : effect.type === "uncertain" || effect.type === "deadline" ? "warn" : effect.type === "target" || effect.type === "departure" ? "neg" : effect.dir > 0 ? "pos" : effect.dir < 0 ? "neg" : "neutral";
  const showArrow = Arrow && !["money", "facility", "target", "departure", "scouting", "role"].includes(effect.type);
  return (
    <span className={`mn-ib-effect is-${tone}`}>
      {showArrow && <Arrow size={12} />}
      {label}
    </span>
  );
};

/** The answers to a dilemma, each with what it will change; the outcome once answered. */
export function EventChoices({ item, onDone }) {
  const { career, act } = useManager();
  const text = eventText(career, item.event);
  if (item.event.resolved) {
    const chosen = text.options[item.event.resolved.option] || item.event.resolved.option;
    return (
      <div className="mn-ib-outcome">
        <IconCheck size={16} />
        <div>
          <small>{t("Tu decisión", "Your decision")}</small>
          <strong>{chosen}</strong>
          {eventOutcome(item.event) && <p>{eventOutcome(item.event)}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="mn-ib-choices" role="group" aria-label={t("Opciones", "Options")}>
      {item.event.options.map((option) => {
        const effects = effectsOf(item.event, option);
        return (
          <button
            type="button"
            key={option}
            className="mn-ib-choice"
            onClick={() => {
              act((c) => resolveEvent(c, item.id, option));
              onDone?.();
            }}
          >
            <strong>{text.options[option] || option}</strong>
            <span className="mn-ib-choice__effects">
              {effects.length ? effects.map((effect, index) => <EffectChip key={index} effect={effect} career={career} />) : <span className="mn-ib-effect is-neutral">{t("Sin cambios", "No change")}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Message({ career, item, onBack }) {
  const category = inboxCategory(item);
  const source = item.kind === "history-event" ? FINANCE_INBOX["history-event"].source(career, item) : null;
  const when = item.kind === "history-event" && item.date ? shortDate(item.date) : `${t("Ronda", "Round")} ${Math.min(item.round + 1, career.world.races.length)} · ${item.year}`;
  const badge = {
    decision: item.event?.resolved ? <Badge tone="neutral">{t("Decidido", "Decided")}</Badge> : <Badge tone="warn" dot>{t("Decisión pendiente", "Decision pending")}</Badge>,
    history: <Badge tone={item.sensitive ? "neutral" : "info"}>{historyLabel(item)}</Badge>,
    alert: <Badge tone="neg" dot>{t("Aviso", "Warning")}</Badge>,
    team: <Badge tone="neutral">{t("Equipo", "Team")}</Badge>,
  }[category];
  return (
    <article className={`mn-ib-message is-${category}`}>
      <button type="button" className="mn-ib-message__back mn-btn mn-btn--ghost mn-btn--sm" onClick={onBack}>
        <IconArrowLeft size={16} />
        {t("Bandeja", "Inbox")}
      </button>
      <header className="mn-ib-message__head">
        <div className="mn-ib-message__tags">
          {badge}
          {item.kind === "history-event" && item.constraint && <Badge tone="neutral">{t("Hecho fijo de la temporada", "Fixed fact of the season")}</Badge>}
          <span className="mn-ib-message__when">{when}</span>
        </div>
        <h2>{titleOf(career, item)}</h2>
      </header>
      <p className="mn-ib-message__body">{inboxBody(career, item)}</p>
      {item.kind === "event" && <EventChoices item={item} />}
      {source && (
        <a className="mn-ib-source" href={source} target="_blank" rel="noopener noreferrer">
          <IconExternal size={16} />
          <span>
            {t("Fuente", "Source")}: {hostOf(source)}
          </span>
        </a>
      )}
    </article>
  );
}

export default function Inbox() {
  const { career, act } = useManager();
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(career.inbox[0]?.id || null);
  const [reading, setReading] = useState(false);
  const counts = useMemo(() => {
    const out = { all: career.inbox.length, decision: 0, history: 0, alert: 0, team: 0 };
    career.inbox.forEach((item) => {
      out[inboxCategory(item)] += 1;
    });
    return out;
    // career.version re-counts after every change to the career.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career.inbox, career.inbox.length, career.version]);
  const unread = career.inbox.filter((item) => !item.read).length;
  const pending = career.inbox.filter((item) => item.kind === "event" && !item.event.resolved).length;
  const list = career.inbox.filter((item) => filter === "all" || inboxCategory(item) === filter || (filter === "team" && inboxCategory(item) === "alert"));
  const open = career.inbox.find((item) => item.id === openId) || null;
  const choose = (item) => {
    setOpenId(item.id);
    setReading(true);
    if (!item.read) act((c) => markRead(c, item.id));
  };
  const meta = [
    t(`${unread} sin leer`, `${unread} unread`),
    pending ? t(`${pending} ${pending === 1 ? "decisión pendiente" : "decisiones pendientes"}`, `${pending} ${pending === 1 ? "decision" : "decisions"} pending`) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mn-ib" data-view={reading ? "message" : "list"}>
      <PageHeader
        title={t("Bandeja", "Inbox")}
        meta={meta}
        actions={
          <button type="button" className="mn-btn mn-btn--ghost mn-btn--sm" onClick={() => act((c) => markAllRead(c))} disabled={!unread}>
            {t("Marcar todo como leído", "Mark all as read")}
          </button>
        }
      />
      <div className="mn-ib__grid">
        <Panel flush className="mn-ib__list">
          <div className="mn-ib__tabs">
            <Tabs
              label={t("Filtrar", "Filter")}
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: t("Todo", "All"), count: counts.all },
                { value: "decision", label: t("Decisiones", "Decisions"), count: counts.decision },
                { value: "history", label: t("Historia", "History"), count: counts.history },
                { value: "team", label: t("Equipo", "Team"), count: counts.team + counts.alert },
              ]}
            />
          </div>
          {list.length ? (
            <ul className="mn-ib-rows">
              {list.map((item) => {
                const Icon = iconFor(item);
                const category = inboxCategory(item);
                const waiting = item.kind === "event" && !item.event.resolved;
                return (
                  <li key={item.id}>
                    <button type="button" className={`mn-ib-row is-${category}${waiting ? " is-waiting" : ""}${item.read ? "" : " is-unread"}${item.id === openId ? " is-open" : ""}`} onClick={() => choose(item)} aria-current={item.id === openId ? "true" : undefined}>
                      <i className="mn-ib-row__dot" aria-label={item.read ? undefined : t("Sin leer", "Unread")} />
                      <Icon size={16} className="mn-ib-row__icon" />
                      <span className="mn-ib-row__title">{titleOf(career, item)}</span>
                      <span className="mn-ib-row__meta">
                        {waiting ? <Badge tone="warn">{t("Decidir", "Decide")}</Badge> : `R${Math.min(item.round + 1, career.world.races.length)}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState compact title={t("Nada en esta bandeja", "Nothing on this shelf")} body={t("Los mensajes llegan entre carrera y carrera.", "Messages arrive between races.")} />
          )}
        </Panel>
        <Panel className="mn-ib__reader">
          {open ? <Message career={career} item={open} onBack={() => setReading(false)} /> : <EmptyState title={t("Elige un mensaje", "Pick a message")} />}
        </Panel>
      </div>
    </div>
  );
}
