/**
 * Home: the reference screen of the design system (DESIGN.md, "Dashboard").
 * The next Grand Prix with its circuit, the car - the team's real model when
 * the asset manifest has it -, the four numbers that say how the season is
 * going, the championship, the board, the inbox and the paddock. In the winter
 * the next-race card turns into the off-season desk.
 */

import React, { useMemo, useState } from "react";
import { PHASES, constructorStandings, currentRace, driverStandings, nextAction, unresolvedEvents } from "../engine/career";
import { objectiveStatus } from "../engine/board";
import { carRankOf, seatsFor } from "../engine/market";
import { carRatingOf } from "../engine/car";
import { driversOf } from "../engine/world";
import { circuitFor } from "../engine/venue";
import { pathOf, poseAt } from "../engine/trackGeometry";
import { useManager } from "./context";
import { Badge, Bar, DataTable, EmptyState, Flag, Livery, Meter, PageHeader, Panel, Rating, StatTile, Tabs, TeamBadge, TeamStripe } from "./atoms";
import { IconAlert, IconChevronRight, IconFastForward, IconRain } from "./icons";
import ContinueButton from "./ContinueButton";
import { AREA, OBJECTIVE_STATE, gapText, inboxTitle, money, newsText, objectiveText, ordinal, raceName, shortDate, t } from "./texts";

export default function Central() {
  const { career } = useManager();
  const winter = career.phase === PHASES.REVIEW || career.phase === PHASES.OFFSEASON;
  const races = career.world.races.length;
  return (
    <div className="mn-home">
      <PageHeader
        title={t("Central", "Home")}
        meta={t(`Temporada ${career.year} · ${races} Grandes Premios`, `${career.year} season · ${races} Grands Prix`)}
      />
      <div className="mn-home__grid">
        {winter ? <WinterDesk /> : <NextRace />}
        <CarCard />
        <SeasonTiles />
        <MiniStandings />
        <LastRace />
        <Objectives />
        <InboxHighlights />
        <News />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ next race */

function TrackMap({ race, year }) {
  const circuit = useMemo(() => {
    try {
      return circuitFor(race, year);
    } catch {
      return null;
    }
  }, [race, year]);
  if (!circuit?.points?.length) return null;
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const pad = span * 0.08;
  const width = span / 60;
  const start = poseAt(circuit, 0);
  const n = circuit.points.length;
  return (
    <figure className="mn-home-track">
      <svg viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`} role="img" aria-label={t(`Trazado de ${raceName(race.name)}`, `${raceName(race.name)} layout`)}>
        <path d={pathOf(circuit.points)} className="mn-home-track__edge" strokeWidth={width * 2.6} />
        <path d={pathOf(circuit.points)} className="mn-home-track__road" strokeWidth={width} />
        {year >= 2011 &&
          circuit.drsZones.map((zone, index) => {
            const from = Math.floor(zone.from * n);
            const to = Math.ceil((zone.to < zone.from ? zone.to + 1 : zone.to) * n);
            const points = [];
            for (let k = from; k <= to; k += 1) points.push(circuit.points[((k % n) + n) % n]);
            return <path key={index} d={pathOf(points, false)} className="mn-home-track__drs" strokeWidth={width * 1.1} />;
          })}
        <line
          x1={start.x - Math.sin(start.heading) * width * 2.4}
          y1={start.y + Math.cos(start.heading) * width * 2.4}
          x2={start.x + Math.sin(start.heading) * width * 2.4}
          y2={start.y - Math.cos(start.heading) * width * 2.4}
          className="mn-home-track__start"
          strokeWidth={width * 0.9}
        />
      </svg>
      <figcaption>
        <span>{(circuit.length / 1000).toFixed(3)} km</span>
        <span>
          {circuit.corners.length} {t("curvas", "corners")}
        </span>
        {year >= 2011 && circuit.drsZones.length > 0 && <span className="is-drs">DRS × {circuit.drsZones.length}</span>}
      </figcaption>
    </figure>
  );
}

function NextRace() {
  const { career, quickWeekend } = useManager();
  const race = currentRace(career);
  const pending = unresolvedEvents(career);
  if (!race) return null;
  const profile = race.profile;
  const action = nextAction(career);
  const races = career.world.races.length;
  const pct = (value) => Math.round(value * 100);
  return (
    <section className="mn-panel mn-home-next" aria-labelledby="mn-next-title">
      <header className="mn-home-next__head">
        <span className="mn-home-next__eyebrow">
          {career.phase === PHASES.PRESEASON ? t("Primera carrera", "First race") : t("Próximo Gran Premio", "Next Grand Prix")} · {t(`Ronda ${race.round} de ${races}`, `Round ${race.round} of ${races}`)}
        </span>
        <h2 id="mn-next-title">
          <Flag code={race.country} width={32} />
          <span>{raceName(race.name)}</span>
        </h2>
        <p>
          {shortDate(race.date)}
          {race.location ? ` · ${race.location}` : ""} · {race.laps} {t("vueltas", "laps")}
        </p>
      </header>

      <div className="mn-home-next__body">
        <TrackMap race={race} year={career.year} />
        <div className="mn-home-next__profile">
          <h3 className="mn-home-label">{t("Perfil del circuito", "Circuit profile")}</h3>
          <Bar label={t("Motor", "Power")} value={pct(profile.power)} caption={pct(profile.power)} tone="steel" />
          <Bar label={t("Carga aerodinámica", "Downforce")} value={pct(profile.aero)} caption={pct(profile.aero)} tone="steel" />
          <Bar label={t("Facilidad para adelantar", "Overtaking")} value={pct(profile.overtaking)} caption={pct(profile.overtaking)} tone="steel" />
          <Bar label={t("Riesgo de lluvia", "Rain risk")} value={pct(profile.rain) * 2} caption={`${pct(profile.rain)}%`} tone="blue" />
        </div>
      </div>

      <footer className="mn-home-next__foot">
        <ContinueButton size="lg" />
        {action.kind === "race" && action.stage === "preview" && (
          <button type="button" className="mn-btn mn-btn--ghost" onClick={quickWeekend}>
            <IconFastForward size={16} />
            {t("Simular el fin de semana", "Simulate the weekend")}
          </button>
        )}
        {pending.length > 0 && (
          <p className="mn-warn">
            <IconAlert size={16} /> {t("Decisiones pendientes en la bandeja", "Decisions waiting in the inbox")}
          </p>
        )}
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ car */

function CarCard() {
  const { career, go } = useManager();
  const team = career.world.teams[career.teamId];
  const rank = carRankOf(career, team.id);
  const total = Object.keys(career.world.teams).length;
  const drivers = driversOf(career.world, team.id);
  return (
    <Panel
      className="mn-home-car"
      title={t(`Coche de ${career.year}`, `${career.year} car`)}
      meta={t(`${rank}.º de ${total} en ritmo`, `${rank} of ${total} on pace`)}
      action={
        <button type="button" className="mn-link" onClick={() => go("car")}>
          {t("Fábrica", "Factory")}
        </button>
      }
    >
      <div className="mn-home-car__stage">
        <Livery color={team.color} color2={team.color2} width={420} height={150} year={career.year} name={team.name} teamRef={team.custom ? null : team.id} />
      </div>
      <dl className="mn-home-car__rating">
        <dt>{t("Valoración del coche", "Car rating")}</dt>
        <dd>
          <Rating value={carRatingOf(team.car)} size="md" />
        </dd>
      </dl>
      <ul className="mn-home-drivers" aria-label={t("Pilotos", "Drivers")}>
        {drivers.map((driver) => (
          <li key={driver.id}>
            <button type="button" onClick={() => go("drivers")}>
              <Flag code={driver.nat} width={16} />
              <span>{driver.name}</span>
              <Rating value={driver.rating} size="sm" />
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* -------------------------------------------------------------- numbers */

function SeasonTiles() {
  const { career, go } = useManager();
  const constructors = constructorStandings(career);
  const own = constructors.find((row) => row.teamId === career.teamId);
  const leader = constructors[0];
  const drivers = driverStandings(career).filter((row) => row.teamId === career.teamId);
  const bestDriver = drivers[0];
  const last = career.season.results[career.season.results.length - 1];
  const lastBest = last ? last.rows.filter((row) => row.teamId === career.teamId).sort((a, b) => (a.status === "finished" ? a.position : 99) - (b.status === "finished" ? b.position : 99))[0] : null;
  const status = objectiveStatus(career);
  const onTrack = status.filter((objective) => ["on-track", "done"].includes(objective.state)).length;
  const raced = career.season.results.length > 0;
  const gap = own && leader && own.teamId !== leader.teamId ? leader.total - own.total : 0;

  return (
    <div className="mn-home-tiles">
      <StatTile
        label={t("Constructores", "Constructors")}
        value={raced ? ordinal(own?.position) : "—"}
        unit={raced ? `${own?.total ?? 0} pts` : undefined}
        hint={raced ? (gap > 0 ? t(`a ${gap} pts del líder`, `${gap} pts behind the leader`) : t("Líder", "Leading")) : t("Sin carreras todavía", "No races yet")}
        accent={raced && own?.position === 1}
        onClick={() => go("standings")}
      />
      <StatTile
        label={t("Mejor piloto", "Best driver")}
        value={raced && bestDriver ? ordinal(bestDriver.position) : "—"}
        unit={raced && bestDriver ? `${bestDriver.total} pts` : undefined}
        hint={bestDriver?.name || t("Sin puntos todavía", "No points yet")}
        onClick={() => go("standings")}
      />
      <StatTile
        label={t("Última carrera", "Last race")}
        value={lastBest ? (lastBest.status === "finished" ? ordinal(lastBest.position) : gapText(lastBest)) : "—"}
        hint={last ? raceName(last.name) : t("Aún no se ha corrido", "Not run yet")}
      />
      <StatTile
        label={career.owner ? t("Confianza de los inversores", "Investor confidence") : t("Confianza de la directiva", "Board confidence")}
        value={`${Math.round(career.board.confidence)}`}
        unit="%"
        hint={t(`${onTrack} de ${status.length} objetivos en camino`, `${onTrack} of ${status.length} objectives on track`)}
        onClick={() => go("office")}
      />
    </div>
  );
}

/* ---------------------------------------------------------- standings */

function MiniStandings() {
  const { career, go } = useManager();
  const [view, setView] = useState("constructors");
  const constructors = constructorStandings(career);
  const drivers = driverStandings(career);
  const pick = (rows, own) => {
    const ownIndex = rows.findIndex(own);
    const visible = rows.slice(0, 6);
    if (ownIndex >= 6) visible.push(rows[ownIndex]);
    return visible;
  };
  const teamOf = (id) => career.world.teams[id];
  const constructorColumns = [
    { key: "position", label: t("Pos", "Pos"), width: 44, render: (row) => <span className="mn-dt__pos">{row.position}</span> },
    {
      key: "team",
      label: t("Equipo", "Team"),
      render: (row) => (
        <span className="mn-dt__team">
          <TeamStripe color={teamOf(row.teamId)?.color} />
          {teamOf(row.teamId)?.name}
        </span>
      ),
    },
    { key: "wins", label: t("Vic.", "Wins"), align: "right", width: 56, render: (row) => row.wins || 0 },
    { key: "total", label: t("Pts", "Pts"), align: "right", width: 56, render: (row) => <b>{row.total}</b> },
  ];
  const driverColumns = [
    { key: "position", label: t("Pos", "Pos"), width: 44, render: (row) => <span className="mn-dt__pos">{row.position}</span> },
    {
      key: "name",
      label: t("Piloto", "Driver"),
      render: (row) => (
        <span className="mn-dt__team">
          <TeamStripe color={teamOf(row.teamId)?.color} />
          {row.name}
        </span>
      ),
    },
    { key: "wins", label: t("Vic.", "Wins"), align: "right", width: 56, render: (row) => row.wins || 0 },
    { key: "total", label: t("Pts", "Pts"), align: "right", width: 56, render: (row) => <b>{row.total}</b> },
  ];
  return (
    <Panel
      className="mn-home-standings"
      title={t("Mundial", "Championship")}
      action={
        <button type="button" className="mn-link" onClick={() => go("standings")}>
          {t("Clasificación completa", "Full standings")}
        </button>
      }
    >
      <Tabs
        label={t("Clasificación", "Standings")}
        value={view}
        onChange={setView}
        options={[
          { value: "constructors", label: t("Constructores", "Constructors") },
          { value: "drivers", label: t("Pilotos", "Drivers") },
        ]}
      />
      {view === "constructors" ? (
        <DataTable dense caption={t("Constructores", "Constructors")} columns={constructorColumns} rows={pick(constructors, (row) => row.teamId === career.teamId)} rowKey={(row) => row.teamId} highlight={(row) => row.teamId === career.teamId} />
      ) : (
        <DataTable dense caption={t("Pilotos", "Drivers")} columns={driverColumns} rows={pick(drivers, (row) => row.teamId === career.teamId)} rowKey={(row) => row.driverId} highlight={(row) => row.teamId === career.teamId} empty={t("Sin puntos todavía", "No points yet")} />
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------ last race */

function LastRace() {
  const { career } = useManager();
  const last = career.season.results[career.season.results.length - 1];
  if (!last) {
    const previous = career.history[career.history.length - 1];
    return (
      <Panel className="mn-home-last" title={t("Último resultado", "Last result")}>
        {previous ? (
          <p className="mn-hint">{t(`${previous.year}: ${previous.teamName} terminó ${ordinal(previous.position)} con ${previous.points} puntos`, `${previous.year}: ${previous.teamName} finished P${previous.position} with ${previous.points} points`)}</p>
        ) : (
          <EmptyState compact title={t("Todavía no se ha corrido ninguna carrera", "No race has been run yet")} body={t("El resultado de cada Gran Premio aparecerá aquí.", "Each Grand Prix result will show here.")} />
        )}
      </Panel>
    );
  }
  const podium = last.rows.slice(0, 3);
  const own = last.rows.filter((row) => row.teamId === career.teamId);
  const weather = last.weather === "dry" ? t("Seco", "Dry") : last.weather === "wet" ? t("Lluvia", "Wet") : t("Cambiante", "Mixed");
  return (
    <Panel
      className="mn-home-last"
      title={raceName(last.name)}
      meta={
        <span className="mn-home-weather">
          {last.weather !== "dry" && <IconRain size={14} />}
          {weather}
        </span>
      }
    >
      <ol className="mn-home-podium">
        {podium.map((row) => (
          <li key={row.driverId} className={row.teamId === career.teamId ? "is-own" : ""}>
            <b>{row.position}</b>
            <TeamStripe color={career.world.teams[row.teamId]?.color} />
            <span>{row.name}</span>
            <em>{gapText(row)}</em>
          </li>
        ))}
      </ol>
      <div className="mn-home-own">
        {own.map((row) => (
          <div key={row.driverId} className={row.points > 0 ? "is-points" : ""}>
            <strong>{row.status === "finished" ? ordinal(row.position) : gapText(row)}</strong>
            <span>{row.name}</span>
            <small>
              {t("Salió", "Grid")} {row.grid} · {row.points} pts
            </small>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- board */

const OBJECTIVE_TONE = { done: "pos", "on-track": "pos", close: "warn", "off-track": "neg", failed: "neg", pending: "neutral" };

function Objectives() {
  const { career, go } = useManager();
  const status = objectiveStatus(career);
  const confidence = Math.round(career.board.confidence);
  return (
    <Panel
      className="mn-home-board"
      title={career.owner ? t("Inversores", "Investors") : t("Directiva", "Board")}
      action={
        <button type="button" className="mn-link" onClick={() => go("office")}>
          {t("Oficina", "Office")}
        </button>
      }
    >
      <div className="mn-home-board__confidence">
        <span>{t("Confianza", "Confidence")}</span>
        <Meter value={confidence} width="100%" label={t("Confianza", "Confidence")} />
        <b>{confidence}%</b>
      </div>
      <ul className="mn-home-objectives">
        {status.map((objective) => (
          <li key={objective.id}>
            <span>{objectiveText(career, objective)}</span>
            <Badge tone={OBJECTIVE_TONE[objective.state] || "neutral"} dot>
              {OBJECTIVE_STATE[objective.state] ? OBJECTIVE_STATE[objective.state]() : ""}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="mn-home-board__money">
        <span>{t("Caja", "Balance")}</span>
        <b className={career.finances.balance < 0 ? "is-bad" : ""}>{money(career.finances.balance)}</b>
      </p>
    </Panel>
  );
}

/* ---------------------------------------------------------------- inbox */

function InboxHighlights() {
  const { career, go, unread } = useManager();
  const items = career.inbox.slice(0, 5);
  return (
    <Panel
      className="mn-home-inbox"
      title={t("Bandeja", "Inbox")}
      meta={unread > 0 ? t(`${unread} sin leer`, `${unread} unread`) : undefined}
      action={
        <button type="button" className="mn-link" onClick={() => go("inbox")}>
          {t("Abrir", "Open")}
        </button>
      }
    >
      {items.length ? (
        <ul className="mn-home-list">
          {items.map((item) => {
            const decide = item.kind === "event" && !item.event?.resolved;
            return (
              <li key={item.id}>
                <button type="button" className={item.read ? "" : "is-unread"} onClick={() => go("inbox")}>
                  <i className="mn-home-list__dot" aria-hidden="true" />
                  <span>{inboxTitle(career, item)}</span>
                  {decide ? <Badge tone="accent">{t("Decidir", "Decide")}</Badge> : <IconChevronRight size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact title={t("Bandeja vacía", "Inbox empty")} />
      )}
    </Panel>
  );
}

function News() {
  const { career } = useManager();
  const news = career.news.slice(0, 6);
  return (
    <Panel className="mn-home-news" title={t("Paddock", "Paddock")}>
      {news.length ? (
        <ul className="mn-home-feed">
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
        <EmptyState compact title={t("Sin noticias", "No news")} />
      )}
    </Panel>
  );
}

/* --------------------------------------------------------------- winter */

function WinterDesk() {
  const { career, toOffseason, go, takeJob } = useManager();
  const seats = seatsFor(career, "next");
  const review = career.review;
  const nextGains = Object.entries(career.rd.nextGains || {}).filter(([, value]) => value);
  return (
    <section className="mn-panel mn-home-next mn-home-winter" aria-labelledby="mn-winter-title">
      <header className="mn-home-next__head">
        <span className="mn-home-next__eyebrow">{t("Invierno", "Winter")}</span>
        <h2 id="mn-winter-title">
          <span>{t(`Preparando ${career.year + 1}`, `Preparing ${career.year + 1}`)}</span>
        </h2>
      </header>
      {review && (
        <div className="mn-home-winter__review">
          <StatTile label={t("Constructores", "Constructors")} value={ordinal(review.position)} accent />
          <StatTile label={t("Nota", "Grade")} value={`${Math.round(review.grade * 100)}`} />
          <StatTile label={t("Reputación", "Reputation")} value={`${Math.round(career.reputation)}`} delta={`${review.reputationDelta >= 0 ? "+" : ""}${review.reputationDelta}`} trend={review.reputationDelta >= 0 ? "up" : "down"} hint={t("vs. año pasado", "vs last year")} />
        </div>
      )}
      <ul className="mn-home-checklist">
        <li className={seats.race >= 2 ? "is-ok" : "is-warn"}>
          <span>{t(`Pilotos con contrato para ${career.year + 1}: ${seats.race}/2`, `Drivers under contract for ${career.year + 1}: ${seats.race}/2`)}</span>
          {seats.race < 2 && (
            <button type="button" className="mn-link" onClick={() => go("market")}>
              {t("Ir al mercado", "Go to the market")}
            </button>
          )}
        </li>
        <li className={nextGains.length ? "is-ok" : ""}>
          <span>
            {nextGains.length
              ? `${t("Trabajo en el coche nuevo", "Work on the new car")}: ${nextGains.map(([area, value]) => `${AREA[area]()} +${value.toFixed(1)}`).join(" · ")}`
              : t("Aún no has invertido en el coche del año que viene", "You have not invested in next year's car yet")}
          </span>
          <button type="button" className="mn-link" onClick={() => go("car")}>
            {t("Ir a la fábrica", "Go to the factory")}
          </button>
        </li>
      </ul>
      {career.jobOffers.length > 0 && (
        <div className="mn-home-offers">
          <h3 className="mn-home-label">{t("Te quieren otros equipos", "Other teams want you")}</h3>
          {career.jobOffers.map((offer) => {
            const team = career.world.teams[offer.teamId];
            if (!team) return null;
            return (
              <div key={offer.id} className="mn-home-offer">
                <TeamBadge team={team} size={28} />
                <span>{team.name}</span>
                <button type="button" className="mn-btn mn-btn--sm" onClick={() => takeJob(team.id)}>
                  {t(`Fichar para ${career.year + 1}`, `Join for ${career.year + 1}`)}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <footer className="mn-home-next__foot">
        {career.phase === PHASES.REVIEW ? (
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={toOffseason}>
            {t("Abrir el invierno", "Into the winter")}
          </button>
        ) : (
          <ContinueButton size="lg" />
        )}
      </footer>
    </section>
  );
}
