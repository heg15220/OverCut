/**
 * The moments that stop the calendar: the welcome, a decision on the desk, a
 * warning, the end of a season, a new one, and the end of the road.
 */

import React, { useEffect } from "react";
import { constructorStandings, driverStandings } from "../engine/career";
import { carRankOf } from "../engine/market";
import { isRegulationReset } from "../engine/car";
import { objectiveStatus } from "../engine/board";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Flag, Livery, Rating, Stat, TeamBadge } from "./atoms";
import { EventChoices } from "./Inbox";
import { OBJECTIVE_STATE, inboxBody, inboxTitle, money, objectiveText, ordinal, t } from "./texts";

const Frame = ({ kicker, title, children, actions, tone = "" }) => (
  <div className="mn-moment-layer" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`mn-moment ${tone}`}>
      {kicker && <span className="mn-kicker">{kicker}</span>}
      <h2>{title}</h2>
      <div className="mn-moment__body">{children}</div>
      {actions && <div className="mn-moment__actions">{actions}</div>}
    </div>
  </div>
);

export default function Moments() {
  const { career, moments, setMoments, toOffseason, takeJob, leave, go } = useManager();
  const moment = moments[0];
  const invalid = Boolean(moment && career && !renderable(moment, career));
  // A moment whose message has gone (or an unknown one) is skipped, never drawn.
  useEffect(() => {
    if (invalid) setMoments((current) => current.slice(1));
  }, [invalid, setMoments]);
  if (!moment || !career || invalid) return null;
  const dismiss = () => setMoments((current) => current.slice(1));
  const team = career.world.teams[career.teamId];

  if (moment.type === "welcome") {
    const status = objectiveStatus(career);
    return (
      <Frame
        kicker={`${career.year} · ${career.owner ? t("Equipo propio", "Your own team") : t("Jefe de equipo", "Team principal")}`}
        title={team.name}
        tone="mn-moment--team"
        actions={
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={dismiss}>
            {t("A trabajar", "Let's get to work")}
          </button>
        }
      >
        <div className="mn-welcome">
          <TeamBadge team={team} size={64} />
          <Livery color={team.color} color2={team.color2} width={340} height={200} year={career.year} name={team.name} />
        </div>
        <p>
          {career.owner
            ? t(`${team.name} se estrena en la parrilla de ${career.year}. Tu coche es ${carRankOf(career, team.id)}.º de ${Object.keys(career.world.teams).length} en ritmo.`, `${team.name} debuts on the ${career.year} grid. Your car is ${carRankOf(career, team.id)} of ${Object.keys(career.world.teams).length} on pace.`)
            : t(`Tomas el mando con el ${carRankOf(career, team.id)}.º coche más rápido de ${Object.keys(career.world.teams).length}.`, `You take charge with the ${carRankOf(career, team.id)} fastest car of ${Object.keys(career.world.teams).length}.`)}
        </p>
        <ul className="mn-objectives">
          {status.map((objective) => (
            <li key={objective.id}>
              <span>{objectiveText(career, objective)}</span>
            </li>
          ))}
        </ul>
        <p className="mn-hint">{t("Antes de cada Gran Premio: encarga piezas en «Coche e I+D», revisa a tus pilotos y pulsa Continuar.", "Before every Grand Prix: commission parts in 'Car & R&D', check your drivers and press Continue.")}</p>
      </Frame>
    );
  }

  if (moment.type === "event" || moment.type === "notice") {
    const item = career.inbox.find((entry) => entry.id === moment.inboxId);
    const resolved = item.kind !== "event" || item.event.resolved;
    return (
      <Frame
        kicker={item.kind === "event" ? t("Decisión", "Decision") : t("Aviso", "Notice")}
        title={inboxTitle(career, item)}
        tone={item.kind.includes("warning") || item.kind === "sacked" ? "mn-moment--bad" : ""}
        actions={
          resolved && (
            <button type="button" className="mn-btn mn-btn--primary" onClick={dismiss}>
              {t("Entendido", "Got it")}
            </button>
          )
        }
      >
        <p>{inboxBody(career, item)}</p>
        {item.kind === "event" && <EventChoices item={item} />}
      </Frame>
    );
  }

  if (moment.type === "review") {
    const review = career.review;
    const constructors = constructorStandings(career);
    const drivers = driverStandings(career);
    const own = constructors.find((row) => row.teamId === career.teamId);
    return (
      <Frame
        kicker={t(`Final de ${career.year}`, `End of ${career.year}`)}
        title={review.titles > 0 ? t("¡Campeones!", "Champions!") : t("Resumen de la temporada", "Season review")}
        tone={review.titles > 0 ? "mn-moment--gold" : ""}
        actions={
          <button
            type="button"
            className="mn-btn mn-btn--primary mn-btn--xl"
            onClick={() => {
              dismiss();
              if (!career.ended) {
                toOffseason();
                go("central");
              }
            }}
          >
            {career.ended ? t("Continuar", "Continue") : t("Al invierno", "Into the winter")}
          </button>
        }
      >
        <div className="mn-stats-row">
          <Stat label={t("Constructores", "Constructors")} value={ordinal(own?.position)} accent />
          <Stat label={t("Puntos", "Points")} value={own?.total ?? 0} />
          <Stat label={t("Nota", "Grade")} value={Math.round(review.grade * 100)} hint={t(`Confianza ${review.confidenceDelta >= 0 ? "+" : ""}${review.confidenceDelta}`, `Confidence ${review.confidenceDelta >= 0 ? "+" : ""}${review.confidenceDelta}`)} />
        </div>
        <p>
          {t(`Campeón: ${drivers[0]?.name} (${career.world.teams[drivers[0]?.teamId]?.name}). Constructores: ${career.world.teams[constructors[0]?.teamId]?.name}.`, `Champion: ${drivers[0]?.name} (${career.world.teams[drivers[0]?.teamId]?.name}). Constructors: ${career.world.teams[constructors[0]?.teamId]?.name}.`)}
        </p>
        <ul className="mn-objectives">
          {review.status.map((objective) => (
            <li key={objective.id} className={`is-${objective.state}`}>
              <span>{objectiveText(career, objective)}</span>
              <em>{OBJECTIVE_STATE[objective.state] ? OBJECTIVE_STATE[objective.state]() : ""}</em>
            </li>
          ))}
        </ul>
        <p className="mn-hint">{t(`Caja: ${money(career.finances.balance)} · Reputación ${review.reputationDelta >= 0 ? "+" : ""}${review.reputationDelta}`, `Balance: ${money(career.finances.balance)} · Reputation ${review.reputationDelta >= 0 ? "+" : ""}${review.reputationDelta}`)}</p>
      </Frame>
    );
  }

  if (moment.type === "new-season") {
    const drivers = driversOf(career.world, career.teamId);
    return (
      <Frame
        kicker={t("Nueva temporada", "New season")}
        title={`${career.year}`}
        tone="mn-moment--team"
        actions={
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={dismiss}>
            {t("Empezar", "Start")}
          </button>
        }
      >
        <div className="mn-welcome">
          <TeamBadge team={team} size={56} />
          <div>
            <strong>{team.name}</strong>
            <p>{t(`Coche ${carRankOf(career, team.id)}.º de ${Object.keys(career.world.teams).length} en ritmo.`, `Car ${carRankOf(career, team.id)} of ${Object.keys(career.world.teams).length} on pace.`)}</p>
          </div>
        </div>
        <ul className="mn-driver-list">
          {drivers.map((driver) => (
            <li key={driver.id}>
              <Rating value={driver.rating} size="sm" />
              <Flag code={driver.nat} width={16} />
              <span>{driver.name}</span>
              <em>{driver.age}</em>
            </li>
          ))}
        </ul>
        {isRegulationReset(career.year) && <p className="mn-hint">{t("Reglamento nuevo: el orden de la parrilla se ha barajado.", "New regulations: the grid order has been reshuffled.")}</p>}
        {career.world.generated && <p className="mn-hint">{t("Más allá de la historia: a partir de aquí el mundo evoluciona por su cuenta.", "Beyond history: from here the world evolves on its own.")}</p>}
      </Frame>
    );
  }

  if (moment.type === "ended") {
    const reason = career.ended?.reason;
    const offers = career.jobOffers.filter((offer) => career.world.teams[offer.teamId]);
    return (
      <Frame
        kicker={t("Fin del camino", "End of the road")}
        title={reason === "sacked" ? t("Destituido", "Sacked") : reason === "bankrupt" ? t("Quiebra", "Bankrupt") : t("Los inversores se retiran", "The investors pull out")}
        tone="mn-moment--bad"
        actions={
          <button type="button" className="mn-btn" onClick={() => { setMoments([]); leave(); }}>
            {t("Volver al menú", "Back to the menu")}
          </button>
        }
      >
        <p>{t(`Tu etapa en ${team.name} termina en ${career.year}. ${career.history.length} temporadas completas, ${career.trophies.length} títulos.`, `Your time at ${team.name} ends in ${career.year}. ${career.history.length} full seasons, ${career.trophies.length} titles.`)}</p>
        {offers.length > 0 ? (
          <div className="mn-offers">
            <h4>{t("Pero alguien te quiere", "But someone wants you")}</h4>
            {offers.map((offer) => (
              <div key={offer.id} className="mn-offer">
                <TeamBadge team={career.world.teams[offer.teamId]} size={30} />
                <span>{career.world.teams[offer.teamId].name}</span>
                <button type="button" className="mn-btn mn-btn--sm mn-btn--primary" onClick={() => takeJob(offer.teamId)}>
                  {t(`Aceptar para ${career.year + 1}`, `Accept for ${career.year + 1}`)}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mn-hint">{t("Nadie llama. Puedes empezar otra partida desde el menú.", "Nobody calls. You can start another career from the menu.")}</p>
        )}
      </Frame>
    );
  }

  return null;
}

const renderable = (moment, career) => {
  if (moment.type === "event" || moment.type === "notice") return career.inbox.some((entry) => entry.id === moment.inboxId);
  if (moment.type === "review") return Boolean(career.review);
  return ["welcome", "new-season", "ended"].includes(moment.type);
};
