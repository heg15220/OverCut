/**
 * The factory: where the car is against the field, and what you build next -
 * for this season's car or for next year's.
 */

import React, { useState } from "react";
import { AREAS, PROJECT_SIZES, carRatingOf, fieldBestOf, fieldMeanOf, isRegulationReset, reliabilityOf, slotsFor, biasesOf } from "../engine/car";
import { PHASES, developmentCapLeft, eraOf, projectQuote, startProject } from "../engine/career";
import { costCapFor } from "../engine/economy";
import { teamsByPace } from "../engine/world";
import { useManager } from "./context";
import { Bar, Empty, Livery, Panel, Pill, Rating, Segmented, TeamBadge } from "./atoms";
import { AREA, AREA_HINT, SIZE, money, t } from "./texts";

export default function Car() {
  const { career } = useManager();
  const team = career.world.teams[career.teamId];
  const teams = Object.values(career.world.teams);
  const best = fieldBestOf(teams);
  const mean = fieldMeanOf(teams);
  const ranked = teamsByPace(career.world);
  const { powerBias } = biasesOf(team.car);
  const character = powerBias > 0.62 ? t("Un coche de rectas: brilla en Monza, Spa o Bakú.", "A straight-line car: it shines at Monza, Spa and Baku.") : powerBias < 0.48 ? t("Un coche de curvas: brilla en Mónaco, Hungría o Singapur.", "A cornering car: it shines at Monaco, Hungary and Singapore.") : t("Un coche equilibrado.", "A balanced car.");
  const areaRank = (area) => [...teams].sort((a, b) => b.car[area] - a.car[area]).findIndex((entry) => entry.id === team.id) + 1;

  return (
    <div className="mn-grid mn-grid--car">
      <Panel title={t(`El coche de ${career.year}`, `The ${career.year} car`)}>
        <div className="mn-car-hero">
          <Livery color={team.color} color2={team.color2} width={560} height={300} year={career.year} name={team.name} />
        </div>
        <div className="mn-car-head">
          <Rating value={carRatingOf(team.car)} size="lg" />
          <div>
            <strong>{t(`${ranked.findIndex((entry) => entry.id === team.id) + 1}.º de ${teams.length} en ritmo`, `${ranked.findIndex((entry) => entry.id === team.id) + 1} of ${teams.length} on pace`)}</strong>
            <span>{character}</span>
          </div>
        </div>
        {AREAS.map((area) => (
          <div key={area} className="mn-area">
            <Bar
              label={`${AREA[area]()} · ${t(`${areaRank(area)}.º`, `P${areaRank(area)}`)}`}
              value={team.car[area]}
              marker={best[area]}
              min={Math.min(...teams.map((entry) => entry.car[area])) - 5}
              max={best[area] + 3}
              caption={area === "reliability" ? `${Math.round(reliabilityOf(team.car, eraOf(career)) * 100)}%` : team.car[area].toFixed(1)}
              tone={area === "reliability" ? "green" : "gold"}
            />
            <small>
              {AREA_HINT[area]()} {t("Media", "Average")} {mean[area].toFixed(1)} · {t("mejor", "best")} {best[area].toFixed(1)}
            </small>
          </div>
        ))}
      </Panel>
      <Projects />
      <Panel title={t("La parrilla, por ritmo", "The grid, on pace")}>
        <ol className="mn-pace-list">
          {ranked.map((entry) => (
            <li key={entry.id} className={entry.id === team.id ? "is-own" : ""}>
              <TeamBadge team={entry} size={20} />
              <span>{entry.name}</span>
              <Bar value={carRatingOf(entry.car)} min={carRatingOf(ranked[ranked.length - 1].car) - 3} max={carRatingOf(ranked[0].car) + 1} tone={entry.id === team.id ? "gold" : "steel"} />
              <b>{carRatingOf(entry.car).toFixed(1)}</b>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function Projects() {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const winter = career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;
  const [area, setArea] = useState("aero");
  const [size, setSize] = useState("medium");
  const [target, setTarget] = useState(winter ? "next" : "now");
  const [error, setError] = useState(null);
  const effectiveTarget = winter ? "next" : target;
  const quote = projectQuote(career, { area, size, target: effectiveTarget });
  const slots = slotsFor(team.facility);
  const capLeft = developmentCapLeft(career);
  const cap = costCapFor(winter ? career.year + 1 : career.year);
  const reset = isRegulationReset(career.year + 1);

  const launch = () => {
    const result = act((c) => startProject(c, { area, size, target: effectiveTarget }));
    setError(result?.ok ? null : result?.error);
  };
  const errors = {
    slots: t("La fábrica no admite más proyectos a la vez.", "The factory cannot run more projects at once."),
    money: t("No hay dinero en caja.", "Not enough money."),
    cap: t("Superarías el límite presupuestario.", "You would break the cost cap."),
    late: t("No da tiempo a terminarlo esta temporada.", "There is no time to finish it this season."),
    ended: t("La partida ha terminado.", "The career is over."),
  };

  return (
    <Panel title={t("Desarrollo", "Development")} action={<Pill tone="muted">{t(`Fábrica ${team.facility}/5 · ${career.rd.projects.length}/${slots} proyectos`, `Factory ${team.facility}/5 · ${career.rd.projects.length}/${slots} projects`)}</Pill>}>
      {cap !== null && (
        <Bar label={t("Límite presupuestario de I+D", "Development cost cap")} value={cap - (capLeft ?? 0)} max={cap} caption={`${money(capLeft)} ${t("libres", "left")}`} tone={capLeft < cap * 0.15 ? "red" : "steel"} />
      )}
      <div className="mn-project-form">
        <div className="mn-area-pick" role="radiogroup" aria-label={t("Área", "Area")}>
          {AREAS.map((entry) => (
            <button type="button" key={entry} role="radio" aria-checked={area === entry} className={area === entry ? "is-active" : ""} onClick={() => setArea(entry)}>
              {AREA[entry]()}
            </button>
          ))}
        </div>
        <Segmented label={t("Tamaño", "Size")} value={size} onChange={setSize} options={Object.keys(PROJECT_SIZES).map((value) => ({ value, label: SIZE[value]() }))} />
        <Segmented
          label={t("Para", "For")}
          value={effectiveTarget}
          onChange={setTarget}
          options={[
            { value: "now", label: t(`Coche ${career.year}`, `${career.year} car`), disabled: winter },
            { value: "next", label: t(`Coche ${career.year + 1}`, `${career.year + 1} car`) },
          ]}
        />
        <dl className="mn-facts mn-facts--tight">
          <div>
            <dt>{t("Coste", "Cost")}</dt>
            <dd>{money(quote.cost)}</dd>
          </div>
          <div>
            <dt>{t("Ganancia esperada", "Expected gain")}</dt>
            <dd>+{quote.expected.toFixed(1)}</dd>
          </div>
          <div>
            <dt>{t("Riesgo de fallo", "Failure risk")}</dt>
            <dd>{Math.round(quote.failure * 100)}%</dd>
          </div>
          <div>
            <dt>{t("Plazo", "Lead time")}</dt>
            <dd>{winter ? t("Antes de la 1.ª carrera", "Before round 1") : `${quote.rounds} ${quote.rounds === 1 ? t("carrera", "race") : t("carreras", "races")}`}</dd>
          </div>
        </dl>
        {effectiveTarget === "next" && (
          <p className="mn-hint">
            {reset
              ? t("Cambio de reglamento: el trabajo en el coche nuevo rinde un 50% más, pero casi nada del coche actual sobrevive.", "Regulation change: work on the new car pays 50% more, but almost nothing of the current car survives.")
              : t("El trabajo en el coche del año que viene rinde un 25% más, pero no ayuda hoy.", "Work on next year's car pays 25% more, but does not help today.")}
          </p>
        )}
        <button type="button" className="mn-btn mn-btn--primary" onClick={launch} disabled={quote.late}>
          {t("Encargar", "Commission")}
        </button>
        {error && <p className="mn-error">{errors[error] || error}</p>}
      </div>
      <h4>{t("En la fábrica", "In the factory")}</h4>
      {career.rd.projects.length ? (
        <ul className="mn-projects">
          {career.rd.projects.map((project) => (
            <li key={project.id}>
              <strong>{AREA[project.area]()}</strong>
              <span>
                {SIZE[project.size]()} · {project.target === "next" ? career.year + 1 : career.year}
              </span>
              <em>+{project.expected.toFixed(1)}</em>
              <Pill tone="steel">{winter ? t("Invierno", "Winter") : `${project.roundsLeft} ${t("carr.", "races")}`}</Pill>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("No hay proyectos en marcha. Tus rivales sí desarrollan.", "No projects running. Your rivals are developing.")}</Empty>
      )}
      {career.rd.done.length > 0 && (
        <>
          <h4>{t("Últimos resultados", "Latest results")}</h4>
          <ul className="mn-projects mn-projects--done">
            {career.rd.done.slice(0, 6).map((project) => (
              <li key={project.id} className={project.failed ? "is-failed" : ""}>
                <strong>{AREA[project.area]()}</strong>
                <span>
                  {project.year} · R{project.round}
                </span>
                <em>
                  {project.gain >= 0 ? "+" : ""}
                  {project.gain.toFixed(1)}
                </em>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
