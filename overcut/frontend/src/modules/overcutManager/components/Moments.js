/**
 * The moments that stop the calendar: the welcome, a simulated Grand Prix's
 * result, a decision on the desk, a warning, the end of a season, a new one and
 * the end of the road (with the job offers, if any).
 *
 * Drawn like a broadcast graphic but out of this system's parts: a dark stage
 * with the one 3D scene (the car, or the podium), a strap in mono over it, and a
 * column of facts beside it. The layer is portalled to the manager root so it
 * covers the site header too (atoms.js useLayerHost). Styles: ./styles/inbox.css.
 */

import React, { useEffect } from "react";
import { constructorStandings, driverStandings, modeOf } from "../engine/career";
import { carRankOf } from "../engine/market";
import { isRegulationReset } from "../engine/car";
import { objectiveStatus } from "../engine/board";
import { driversOf } from "../engine/world";
import { canRender3D } from "../three/support";
import { useManager } from "./context";
import { Badge, Flag, Livery, Rating, TeamBadge, TeamStripe, Layer, layerStyle, useLayerHost } from "./atoms";
import { EventChoices } from "./Inbox";
import { GAME_MODE, OBJECTIVE_STATE, inboxBody, inboxTitle, money, objectiveText, ordinal, raceName, t } from "./texts";
import "./styles/inbox.css";

const STATE_TONE = { done: "pos", "on-track": "pos", close: "warn", "off-track": "neg", failed: "neg" };

const Podium = React.lazy(() => import("../three/Podium"));

const Frame = ({ kicker, title, children, actions, tone = "team", stage, strap, narrow = false }) => {
  const [anchor, host] = useLayerHost(true);
  const layer = (
    <div className="mn-mo-layer" style={layerStyle} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`mn-mo is-${tone}${stage ? " has-stage" : ""}${narrow ? " is-narrow" : ""}`}>
        {stage && (
          <div className="mn-mo__stage">
            {stage}
            {strap && <div className="mn-mo__strap">{strap}</div>}
          </div>
        )}
        <div className="mn-mo__main">
          <header className="mn-mo__head">
            {kicker && <span className="mn-mo__kicker">{kicker}</span>}
            <h2>{title}</h2>
          </header>
          <div className="mn-mo__body">{children}</div>
          {actions && <footer className="mn-mo__actions">{actions}</footer>}
        </div>
      </div>
    </div>
  );
  return (
    <>
      <span ref={anchor} hidden />
      <Layer host={host}>{layer}</Layer>
    </>
  );
};

/** Figures in a row: label over value, the moment's numbers. */
const Figures = ({ items }) => (
  <dl className="mn-mo-figures">
    {items.filter(Boolean).map((item) => (
      <div key={item.label} className={item.accent ? "is-accent" : ""}>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
        {item.hint && <small>{item.hint}</small>}
      </div>
    ))}
  </dl>
);

const PodiumStage = ({ year, cars, label, fallback }) =>
  canRender3D() ? (
    <React.Suspense fallback={fallback}>
      <Podium year={year} height={320} label={label} cars={cars} />
    </React.Suspense>
  ) : (
    fallback
  );

const teamCars = (career, teamIds) =>
  teamIds
    .map((id) => career.world.teams[id])
    .filter(Boolean)
    .map((team) => ({ color: team.color, color2: team.color2, name: team.name, teamRef: team.custom ? null : team.id }));

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
  const teamCount = Object.keys(career.world.teams).length;

  if (moment.type === "welcome") {
    const status = objectiveStatus(career);
    const rank = carRankOf(career, team.id);
    return (
      <Frame
        kicker={[career.year, career.owner ? t("Equipo propio", "Your own team") : t("Jefe de equipo", "Team principal"), GAME_MODE[modeOf(career)].name()].join(" · ")}
        title={team.name}
        stage={<Livery color={team.color} color2={team.color2} width={560} height={320} year={career.year} name={team.name} teamRef={team.custom ? null : team.id} />}
        strap={
          <>
            <TeamStripe color={team.color} height={20} />
            <span>{team.name}</span>
            <span className="mn-mo__strap-meta">{(team.chassis || []).join(" / ") || career.year}</span>
          </>
        }
        actions={
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={dismiss}>
            {t("A trabajar", "Let's get to work")}
          </button>
        }
      >
        <p className="mn-mo-lead">
          {career.owner
            ? t(`${team.name} se estrena en la parrilla de ${career.year}.`, `${team.name} makes its debut on the ${career.year} grid.`)
            : t(`La directiva te da las llaves de ${team.name} para ${career.year}.`, `The board hands you the keys of ${team.name} for ${career.year}.`)}
        </p>
        <Figures
          items={[
            { label: t("Coche", "Car"), value: t(`${rank}.º de ${teamCount}`, `${rank} of ${teamCount}`), hint: t("en ritmo", "on pace"), accent: true },
            { label: t("Caja", "Balance"), value: money(career.finances.balance) },
            { label: career.owner ? t("Inversores", "Investors") : t("Directiva", "Board"), value: `${Math.round(career.board.confidence)}%`, hint: t("de confianza", "confidence") },
          ]}
        />
        <section className="mn-mo-section">
          <h3>{career.owner ? t("Lo que esperan los inversores", "What the investors expect") : t("Objetivos de la directiva", "The board's objectives")}</h3>
          <ol className="mn-mo-list">
            {status.map((objective) => (
              <li key={objective.id}>
                <span>{objectiveText(career, objective)}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="mn-mo-hint">
          {t(
            "Antes de cada Gran Premio: encarga piezas en Coche e I+D, revisa a tus pilotos y pulsa Continuar.",
            "Before every Grand Prix: commission parts in Car & R&D, check your drivers and press Continue.",
          )}
        </p>
      </Frame>
    );
  }

  if (moment.type === "race") {
    const summary = career.season.results[moment.index];
    const race = career.world.races[moment.index] || {};
    const podium = summary.rows.slice(0, 3);
    const own = summary.rows.filter((row) => row.teamId === career.teamId);
    const points = own.reduce((sum, row) => sum + (row.points || 0), 0);
    const standing = constructorStandings(career).find((row) => row.teamId === career.teamId);
    const winnerTeam = career.world.teams[podium[0]?.teamId];
    const fallback = (
      <ol className="mn-mo-steps" aria-hidden="true">
        {[1, 0, 2].map(
          (place) =>
            podium[place] && (
              <li key={place} className={`is-p${place + 1}`} style={{ "--stripe": career.world.teams[podium[place].teamId]?.color }}>
                <b>{place + 1}</b>
                <span>{podium[place].name}</span>
              </li>
            ),
        )}
      </ol>
    );
    return (
      <Frame
        kicker={t(`Ronda ${moment.index + 1} de ${career.world.races.length} · Resultado`, `Round ${moment.index + 1} of ${career.world.races.length} · Result`)}
        title={raceName(race.name || "")}
        stage={
          <PodiumStage
            year={career.year}
            cars={teamCars(
              career,
              podium.map((row) => row.teamId),
            )}
            label={t("Podio", "Podium")}
            fallback={fallback}
          />
        }
        strap={
          podium[0] && (
            <>
              <TeamStripe color={winnerTeam?.color} height={20} />
              <span>{podium[0].name}</span>
              <span className="mn-mo__strap-meta">
                {t("Ganador", "Winner")} · {winnerTeam?.name}
              </span>
            </>
          )
        }
        actions={
          <>
            <button
              type="button"
              className="mn-btn mn-btn--ghost"
              onClick={() => {
                dismiss();
                go("standings");
              }}
            >
              {t("Ver el Mundial", "See the standings")}
            </button>
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={dismiss}>
              {t("Continuar", "Continue")}
            </button>
          </>
        }
      >
        <ol className="mn-mo-table" aria-label={t("Podio", "Podium")}>
          {podium.map((row, index) => (
            <li key={row.driverId}>
              <b>{index + 1}</b>
              <TeamStripe color={career.world.teams[row.teamId]?.color} />
              <span>{row.name}</span>
              <em>{career.world.teams[row.teamId]?.name}</em>
            </li>
          ))}
        </ol>
        <section className="mn-mo-section">
          <h3>{team.name}</h3>
          <ul className="mn-mo-table is-own">
            {own.map((row) => (
              <li key={row.driverId} className={row.points > 0 ? "is-points" : ""}>
                <b>{row.status === "finished" ? row.position : t("Ab.", "DNF")}</b>
                <TeamStripe color={team.color} />
                <span>{row.name}</span>
                <em>
                  {t("Salía", "Started")} {row.grid} · {row.points} {t("pts", "pts")}
                </em>
              </li>
            ))}
          </ul>
        </section>
        <Figures
          items={[
            { label: t("Puntos del día", "Points today"), value: points, accent: points > 0 },
            standing && { label: t("Constructores", "Constructors"), value: ordinal(standing.position), hint: `${standing.total} ${t("pts", "pts")}` },
          ]}
        />
      </Frame>
    );
  }

  if (moment.type === "event" || moment.type === "notice") {
    const item = career.inbox.find((entry) => entry.id === moment.inboxId);
    const resolved = item.kind !== "event" || item.event.resolved;
    const bad = item.kind.includes("warning") || item.kind === "sacked";
    return (
      <Frame
        narrow
        tone={bad ? "neg" : item.kind === "event" ? "warn" : "team"}
        kicker={item.kind === "event" ? t("Decisión en tu mesa", "A decision on your desk") : bad ? t("Aviso", "Warning") : t("Mensaje", "Message")}
        title={inboxTitle(career, item)}
        actions={
          resolved && (
            <button type="button" className="mn-btn mn-btn--primary" onClick={dismiss}>
              {t("Entendido", "Got it")}
            </button>
          )
        }
      >
        <p className="mn-mo-lead">{inboxBody(career, item)}</p>
        {item.kind === "event" && <EventChoices item={item} />}
      </Frame>
    );
  }

  if (moment.type === "review") {
    const review = career.review;
    const constructors = constructorStandings(career);
    const drivers = driverStandings(career);
    const own = constructors.find((row) => row.teamId === career.teamId);
    const champions = review.titles > 0;
    return (
      <Frame
        tone={champions ? "accent" : "team"}
        kicker={t(`Final de ${career.year}`, `End of ${career.year}`)}
        title={champions ? t("Campeones del mundo", "World champions") : t("Resumen de la temporada", "Season review")}
        stage={
          <PodiumStage
            year={career.year}
            cars={teamCars(
              career,
              constructors.slice(0, 3).map((row) => row.teamId),
            )}
            label={t("Podio de constructores", "Constructors' podium")}
            fallback={null}
          />
        }
        strap={
          <>
            <TeamStripe color={career.world.teams[constructors[0]?.teamId]?.color} height={20} />
            <span>{career.world.teams[constructors[0]?.teamId]?.name}</span>
            <span className="mn-mo__strap-meta">{t(`Campeón de constructores ${career.year}`, `${career.year} constructors' champion`)}</span>
          </>
        }
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
        <Figures
          items={[
            { label: t("Constructores", "Constructors"), value: ordinal(own?.position), accent: true },
            { label: t("Puntos", "Points"), value: own?.total ?? 0 },
            {
              label: t("Nota", "Grade"),
              value: Math.round(review.grade * 100),
              hint: t(`Confianza ${review.confidenceDelta >= 0 ? "+" : ""}${review.confidenceDelta}`, `Confidence ${review.confidenceDelta >= 0 ? "+" : ""}${review.confidenceDelta}`),
            },
          ]}
        />
        <p className="mn-mo-lead">
          {t(`Campeón: ${drivers[0]?.name} (${career.world.teams[drivers[0]?.teamId]?.name}).`, `Champion: ${drivers[0]?.name} (${career.world.teams[drivers[0]?.teamId]?.name}).`)}
        </p>
        <section className="mn-mo-section">
          <h3>{t("Objetivos", "Objectives")}</h3>
          <ul className="mn-mo-list is-states">
            {review.status.map((objective) => (
              <li key={objective.id}>
                <span>{objectiveText(career, objective)}</span>
                <Badge tone={STATE_TONE[objective.state] || "neutral"} dot>
                  {OBJECTIVE_STATE[objective.state] ? OBJECTIVE_STATE[objective.state]() : objective.state}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
        <p className="mn-mo-hint">
          {t(
            `Caja: ${money(career.finances.balance)} · Reputación ${review.reputationDelta >= 0 ? "+" : ""}${review.reputationDelta}`,
            `Balance: ${money(career.finances.balance)} · Reputation ${review.reputationDelta >= 0 ? "+" : ""}${review.reputationDelta}`,
          )}
        </p>
      </Frame>
    );
  }

  if (moment.type === "new-season") {
    const drivers = driversOf(career.world, career.teamId);
    const rank = carRankOf(career, team.id);
    return (
      <Frame
        kicker={t("Nueva temporada", "New season")}
        title={`${team.name} ${career.year}`}
        stage={<Livery color={team.color} color2={team.color2} width={560} height={320} year={career.year} name={team.name} teamRef={team.custom ? null : team.id} />}
        strap={
          <>
            <TeamStripe color={team.color} height={20} />
            <span>{team.name}</span>
            <span className="mn-mo__strap-meta">{(team.chassis || []).join(" / ") || career.year}</span>
          </>
        }
        actions={
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={dismiss}>
            {t("Empezar", "Start")}
          </button>
        }
      >
        <Figures
          items={[
            { label: t("Coche", "Car"), value: t(`${rank}.º de ${teamCount}`, `${rank} of ${teamCount}`), hint: t("en ritmo", "on pace"), accent: true },
            { label: t("Caja", "Balance"), value: money(career.finances.balance) },
          ]}
        />
        <section className="mn-mo-section">
          <h3>{t("Pilotos", "Drivers")}</h3>
          <ul className="mn-mo-table">
            {drivers.map((driver) => (
              <li key={driver.id}>
                <Rating value={driver.rating} size="sm" />
                <Flag code={driver.nat} width={16} />
                <span>{driver.name}</span>
                <em>
                  {driver.age} {t("años", "yrs")}
                </em>
              </li>
            ))}
          </ul>
        </section>
        {isRegulationReset(career.year) && <p className="mn-mo-hint">{t("Reglamento nuevo: el orden de la parrilla se ha barajado.", "New regulations: the grid order has been reshuffled.")}</p>}
        {career.world.generated && (
          <p className="mn-mo-hint">{t("Más allá de la historia: a partir de aquí el mundo evoluciona por su cuenta.", "Beyond history: from here the world evolves on its own.")}</p>
        )}
      </Frame>
    );
  }

  if (moment.type === "ended") {
    const reason = career.ended?.reason;
    const offers = career.jobOffers.filter((offer) => career.world.teams[offer.teamId]);
    return (
      <Frame
        narrow
        tone="neg"
        kicker={t(`Fin del camino · ${career.year}`, `End of the road · ${career.year}`)}
        title={reason === "sacked" ? t("Destituido", "Sacked") : reason === "bankrupt" ? t("Quiebra", "Bankrupt") : t("Los inversores se retiran", "The investors pull out")}
        actions={
          <button
            type="button"
            className="mn-btn mn-btn--ghost"
            onClick={() => {
              setMoments([]);
              leave();
            }}
          >
            {t("Volver al menú", "Back to the menu")}
          </button>
        }
      >
        <p className="mn-mo-lead">{t(`Tu etapa en ${team.name} termina en ${career.year}.`, `Your time at ${team.name} ends in ${career.year}.`)}</p>
        <Figures
          items={[
            { label: t("Temporadas completas", "Full seasons"), value: career.history.length },
            { label: t("Títulos", "Titles"), value: career.trophies.length },
          ]}
        />
        {offers.length > 0 ? (
          <section className="mn-mo-section">
            <h3>{t("Ofertas de trabajo", "Job offers")}</h3>
            <ul className="mn-mo-offers">
              {offers.map((offer) => {
                const next = career.world.teams[offer.teamId];
                return (
                  <li key={offer.id} style={{ "--stripe": next.color }}>
                    <TeamBadge team={next} size={32} />
                    <span>
                      <strong>{next.name}</strong>
                      <small>{t(`Coche ${carRankOf(career, next.id)}.º de ${teamCount}`, `Car ${carRankOf(career, next.id)} of ${teamCount}`)}</small>
                    </span>
                    <button type="button" className="mn-btn mn-btn--sm" onClick={() => takeJob(offer.teamId)}>
                      {t(`Aceptar para ${career.year + 1}`, `Accept for ${career.year + 1}`)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <p className="mn-mo-hint">{t("Nadie llama. Puedes empezar otra partida desde el menú.", "Nobody calls. You can start another career from the menu.")}</p>
        )}
      </Frame>
    );
  }

  return null;
}

const renderable = (moment, career) => {
  if (moment.type === "event" || moment.type === "notice") return career.inbox.some((entry) => entry.id === moment.inboxId);
  if (moment.type === "review") return Boolean(career.review);
  if (moment.type === "race") return Boolean(career.season?.results?.[moment.index]?.rows?.length);
  return ["welcome", "new-season", "ended"].includes(moment.type);
};
