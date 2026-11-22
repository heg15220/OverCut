/**
 * Home: the next Grand Prix, how the last one went, where you stand and what
 * the paddock is saying. In the winter it turns into the off-season desk.
 */

import React from "react";
import { LuCloudRain, LuFastForward, LuGauge, LuTriangleAlert } from "react-icons/lu";
import { PHASES, constructorStandings, currentRace, driverStandings, nextAction, unresolvedEvents } from "../engine/career";
import { objectiveStatus } from "../engine/board";
import { carRankOf, seatsFor } from "../engine/market";
import { carRatingOf } from "../engine/car";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Bar, Empty, Flag, Panel, Pill, Rating, Stat, TeamBadge } from "./atoms";
import ContinueButton from "./ContinueButton";
import { AREA, OBJECTIVE_STATE, gapText, money, newsText, objectiveText, ordinal, raceName, shortDate, t } from "./texts";

export default function Central() {
  const { career } = useManager();
  const winter = career.phase === PHASES.REVIEW || career.phase === PHASES.OFFSEASON;
  return (
    <div className="mn-grid mn-grid--central">
      {winter ? <WinterDesk /> : <NextRace />}
      <LastRace />
      <MiniStandings />
      <Objectives />
      <News />
    </div>
  );
}

function NextRace() {
  const { career, quickWeekend } = useManager();
  const race = currentRace(career);
  const pending = unresolvedEvents(career);
  if (!race) return null;
  const profile = race.profile;
  const action = nextAction(career);
  return (
    <Panel className="mn-next" title={career.phase === PHASES.PRESEASON ? t("Pretemporada · primera carrera", "Preseason · first race") : t("Próximo Gran Premio", "Next Grand Prix")}>
      <div className="mn-next__head">
        <Flag code={race.country} width={36} />
        <div>
          <strong>{raceName(race.name)}</strong>
          <span>
            {t("Ronda", "Round")} {race.round} · {shortDate(race.date)} · {race.laps} {t("vueltas", "laps")}
            {race.location ? ` · ${race.location}` : ""}
          </span>
        </div>
      </div>
      <div className="mn-next__profile">
        <Bar label={t("Adelantar", "Overtaking")} value={profile.overtaking * 100} caption={`${Math.round(profile.overtaking * 100)}`} />
        <Bar label={t("Motor", "Power")} value={profile.power * 100} caption={`${Math.round(profile.power * 100)}`} tone="steel" />
        <Bar label={t("Aerodinámica", "Downforce")} value={profile.aero * 100} caption={`${Math.round(profile.aero * 100)}`} tone="steel" />
        <Bar label={t("Riesgo de lluvia", "Rain risk")} value={profile.rain * 100 * 2} caption={`${Math.round(profile.rain * 100)}%`} tone="blue" />
      </div>
      {pending.length > 0 && (
        <p className="mn-warn">
          <LuTriangleAlert aria-hidden="true" /> {t("Tienes decisiones pendientes en la bandeja.", "You have decisions waiting in the inbox.")}
        </p>
      )}
      <div className="mn-next__actions">
        <ContinueButton size="lg" />
        {action.kind === "race" && action.stage === "preview" && (
          <button type="button" className="mn-btn mn-btn--ghost" onClick={quickWeekend}>
            <LuFastForward aria-hidden="true" />
            {t("Simular el fin de semana", "Simulate the weekend")}
          </button>
        )}
      </div>
      <CarSummary />
    </Panel>
  );
}

function CarSummary() {
  const { career, go } = useManager();
  const team = career.world.teams[career.teamId];
  const rank = carRankOf(career, team.id);
  const total = Object.keys(career.world.teams).length;
  const drivers = driversOf(career.world, team.id);
  return (
    <div className="mn-car-summary">
      <button type="button" className="mn-car-summary__car" onClick={() => go("car")}>
        <LuGauge aria-hidden="true" />
        <span>
          {t("Coche", "Car")} <Rating value={carRatingOf(team.car)} size="sm" /> · {t(`${rank}.º de ${total}`, `${rank} of ${total}`)}
        </span>
      </button>
      {drivers.map((driver) => (
        <button type="button" key={driver.id} className="mn-car-summary__driver" onClick={() => go("drivers")}>
          <Flag code={driver.nat} width={14} />
          <span>{driver.name}</span>
          <Rating value={driver.rating} size="sm" />
        </button>
      ))}
    </div>
  );
}

function WinterDesk() {
  const { career, toOffseason, go, takeJob } = useManager();
  const seats = seatsFor(career, "next");
  const review = career.review;
  const nextGains = Object.entries(career.rd.nextGains || {}).filter(([, value]) => value);
  return (
    <Panel className="mn-next mn-winter" title={t(`Invierno: preparando ${career.year + 1}`, `Winter: preparing ${career.year + 1}`)}>
      {review && (
        <div className="mn-winter__review">
          <Stat label={t("Constructores", "Constructors")} value={ordinal(review.position)} accent />
          <Stat label={t("Nota", "Grade")} value={`${Math.round(review.grade * 100)}`} />
          <Stat label={t("Reputación", "Reputation")} value={`${Math.round(career.reputation)}`} hint={`${review.reputationDelta >= 0 ? "+" : ""}${review.reputationDelta}`} />
        </div>
      )}
      <ul className="mn-checklist">
        <li className={seats.race >= 2 ? "is-ok" : "is-warn"}>
          {t(`Pilotos con contrato para ${career.year + 1}: ${seats.race}/2`, `Drivers under contract for ${career.year + 1}: ${seats.race}/2`)}
          {seats.race < 2 && (
            <button type="button" className="mn-link" onClick={() => go("market")}>
              {t("Ir al mercado", "Go to the market")}
            </button>
          )}
        </li>
        <li className={nextGains.length ? "is-ok" : ""}>
          {nextGains.length
            ? `${t("Trabajo en el coche nuevo", "Work on the new car")}: ${nextGains.map(([area, value]) => `${AREA[area]()} +${value.toFixed(1)}`).join(" · ")}`
            : t("Aún no has invertido en el coche del año que viene.", "You have not invested in next year's car yet.")}
          <button type="button" className="mn-link" onClick={() => go("car")}>
            {t("Ir a la fábrica", "Go to the factory")}
          </button>
        </li>
      </ul>
      {career.jobOffers.length > 0 && (
        <div className="mn-offers">
          <h4>{t("Te quieren otros equipos", "Other teams want you")}</h4>
          {career.jobOffers.map((offer) => {
            const team = career.world.teams[offer.teamId];
            if (!team) return null;
            return (
              <div key={offer.id} className="mn-offer">
                <TeamBadge team={team} size={30} />
                <span>{team.name}</span>
                <button type="button" className="mn-btn mn-btn--sm" onClick={() => takeJob(team.id)}>
                  {t(`Fichar para ${career.year + 1}`, `Join for ${career.year + 1}`)}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="mn-next__actions">
        {career.phase === PHASES.REVIEW ? (
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={toOffseason}>
            {t("Abrir el invierno", "Into the winter")}
          </button>
        ) : (
          <ContinueButton size="lg" />
        )}
      </div>
    </Panel>
  );
}

function LastRace() {
  const { career } = useManager();
  const last = career.season.results[career.season.results.length - 1];
  if (!last) {
    const previous = career.history[career.history.length - 1];
    return (
      <Panel title={t("Último resultado", "Last result")}>
        {previous ? (
          <p className="mn-muted">{t(`${previous.year}: ${previous.teamName} terminó ${ordinal(previous.position)} con ${previous.points} puntos.`, `${previous.year}: ${previous.teamName} finished P${previous.position} with ${previous.points} points.`)}</p>
        ) : (
          <Empty>{t("Todavía no se ha corrido ninguna carrera.", "No race has been run yet.")}</Empty>
        )}
      </Panel>
    );
  }
  const podium = last.rows.slice(0, 3);
  const own = last.rows.filter((row) => row.teamId === career.teamId);
  return (
    <Panel title={`${raceName(last.name)}`} action={<Pill tone={last.weather === "dry" ? "muted" : "blue"}>{last.weather !== "dry" && <LuCloudRain aria-hidden="true" />} {last.weather === "dry" ? t("Seco", "Dry") : last.weather === "wet" ? t("Lluvia", "Wet") : t("Cambiante", "Mixed")}</Pill>}>
      <ol className="mn-podium">
        {podium.map((row) => (
          <li key={row.driverId}>
            <b>{row.position}</b>
            <TeamBadge team={career.world.teams[row.teamId]} size={22} />
            <span>{row.name}</span>
            <em>{gapText(row)}</em>
          </li>
        ))}
      </ol>
      <div className="mn-own-results">
        {own.map((row) => (
          <div key={row.driverId} className={row.points > 0 ? "is-points" : ""}>
            <strong>{row.status === "finished" ? ordinal(row.position) : gapText(row)}</strong>
            <span>{row.name}</span>
            <small>
              {t("Sal.", "Grid")} {row.grid} · {row.points} {t("pts", "pts")}
            </small>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MiniStandings() {
  const { career, go } = useManager();
  const constructors = constructorStandings(career);
  const drivers = driverStandings(career).slice(0, 5);
  const ownIndex = constructors.findIndex((row) => row.teamId === career.teamId);
  const visible = constructors.slice(0, 5);
  if (ownIndex >= 5) visible.push(constructors[ownIndex]);
  return (
    <Panel title={t("Mundial", "Championship")} action={<button type="button" className="mn-link" onClick={() => go("standings")}>{t("Ver todo", "See all")}</button>}>
      <div className="mn-mini-tables">
        <table className="mn-table mn-table--mini">
          <tbody>
            {visible.map((row) => (
              <tr key={row.teamId} className={row.teamId === career.teamId ? "is-own" : ""}>
                <td>{row.position}</td>
                <td>
                  <TeamBadge team={career.world.teams[row.teamId]} size={18} /> {career.world.teams[row.teamId]?.name}
                </td>
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="mn-table mn-table--mini">
          <tbody>
            {drivers.length ? (
              drivers.map((row) => (
                <tr key={row.driverId} className={row.teamId === career.teamId ? "is-own" : ""}>
                  <td>{row.position}</td>
                  <td>{row.name}</td>
                  <td>{row.total}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="mn-muted">
                  {t("Sin puntos todavía", "No points yet")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Objectives() {
  const { career, go } = useManager();
  const status = objectiveStatus(career);
  return (
    <Panel title={career.owner ? t("Inversores", "Investors") : t("Directiva", "Board")} action={<button type="button" className="mn-link" onClick={() => go("office")}>{t("Oficina", "Office")}</button>}>
      <Bar label={t("Confianza", "Confidence")} value={career.board.confidence} caption={`${Math.round(career.board.confidence)}%`} tone={career.board.confidence < 30 ? "red" : "gold"} />
      <ul className="mn-objectives">
        {status.map((objective) => (
          <li key={objective.id} className={`is-${objective.state}`}>
            <span>{objectiveText(career, objective)}</span>
            <em>{OBJECTIVE_STATE[objective.state] ? OBJECTIVE_STATE[objective.state]() : ""}</em>
          </li>
        ))}
      </ul>
      <p className="mn-muted">{t(`Caja: ${money(career.finances.balance)}`, `Balance: ${money(career.finances.balance)}`)}</p>
    </Panel>
  );
}

function News() {
  const { career } = useManager();
  const news = career.news.slice(0, 7);
  return (
    <Panel title={t("Paddock", "Paddock")} className="mn-news">
      {news.length ? (
        <ul>
          {news.map((item) => (
            <li key={item.id} className={item.mine ? "is-mine" : ""}>
              <small>
                {item.year} · R{item.round}
              </small>
              <span>{newsText(career, item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("Sin noticias.", "No news.")}</Empty>
      )}
    </Panel>
  );
}
