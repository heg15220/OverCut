/**
 * The way in: resume, import, or a new career in four or five steps.
 *
 * Season -> how you enter and how history behaves (RF-CAR-05) -> the team, or
 * the team builder and its drivers (RF-CAR-06) -> you. The seasons offered are
 * the playable ones, those with a season pack (RF-CAR-01, SRS 3.1); a team
 * built from scratch is added to that season's real grid, next to the teams
 * that really raced it. Layout and tokens: docs/manager/DESIGN.md; styles in
 * ./styles/setup.css.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { NATIONALITIES } from "../../overcutTrayectoria/components/atoms";
import { eraFeaturesFor, pointsTableFor } from "../../overcutTrayectoria/engine/eras";
import { driversOf, teamsByPace } from "../engine/world";
import { AREAS, carRatingOf, fieldBestOf } from "../engine/car";
import { driverSalary, moneyScale } from "../engine/economy";
import { BACKERS, CUSTOM_COLORS, HEADQUARTERS, enginesFor, shortCode } from "../engine/identity";
import { DEFAULT_MODE, MODES, seasonWorld, startableYears } from "../engine/career";
import { ensureSeasonPack, hasSeasonPack, seasonPackYears } from "../engine/packs/seasonPacks";
import { importCareer, importFile } from "../engine/save";
import { Bar, Flag, Livery, Rating, Sheet, Tabs, TeamBadge, readableOn } from "./atoms";
import { IconCheck, IconFlag, IconPlay } from "./icons";
import { IconArrowLeft, IconArrowRight, IconBranch, IconLock, IconPlus, IconShuffle, IconStar, IconTrash, IconUpload, IconWrench } from "./icons";
import { AREA, BACKER, GAME_MODE, TIER, locale, money, ordinal, t } from "./texts";
import "./styles/setup.css";

const newSeed = () => `M-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

const stars = (rank, total) => Math.max(1, Math.min(5, Math.round(5 - ((rank - 1) / Math.max(1, total - 1)) * 4)));

const Stars = ({ value }) => (
  <span className="mn-su-stars" role="img" aria-label={t(`${value} de 5`, `${value} of 5`)}>
    {[0, 1, 2, 3, 4].map((index) => (
      <IconStar key={index} size={12} className={index < value ? "is-on" : ""} />
    ))}
  </span>
);

const Steps = ({ steps, current }) => (
  <ol className="mn-su-steps">
    {steps.map((label, index) => (
      <li key={label} className={index === current ? "is-active" : index < current ? "is-done" : ""} aria-current={index === current ? "step" : undefined}>
        <b>{index < current ? <IconCheck size={12} /> : index + 1}</b>
        <span>{label}</span>
      </li>
    ))}
  </ol>
);

/** The cars of the playable eras, each with the rule that shaped it. */
const ERAS = [
  [1976, () => t("Morro en cuña, alerón delantero a todo lo ancho y el airbox sobre la cabeza.", "Wedge nose, full-width front wing and the airbox over the driver's head.")],
  [1988, () => t("Turbos de más de 1.000 CV y fondo plano obligatorio desde 1983.", "Turbos over 1,000 hp and flat bottoms mandatory since 1983.")],
  [1992, () => t("Motores atmosféricos, ayudas electrónicas y el morro alto que cambió la aerodinámica.", "Atmospheric engines, driver aids and the raised nose that changed aerodynamics.")],
  [2004, () => t("V10 a 19.000 rpm, vía estrecha y neumáticos con surcos para frenar los coches.", "V10s at 19,000 rpm, a narrow track and grooved tyres to slow the cars.")],
  [2012, () => t("Alerón delantero de 1,8 m, trasero estrecho y alto, y el morro escalonado.", "A 1.8 m front wing, a tall narrow rear wing and the stepped nose.")],
  [2015, () => t("La era híbrida: morros largos y bajos, ERS y 1,6 litros turbo.", "The hybrid era: long low noses, ERS and 1.6-litre turbos.")],
  [2019, () => t("Coches de 2 m de ancho, neumáticos anchos y el halo desde 2018.", "Cars 2 m wide, wide tyres and the halo since 2018.")],
  [2024, () => t("Vuelve el efecto suelo: llantas de 18 pulgadas y alerones sencillos.", "Ground effect returns: 18-inch wheels and simple wings.")],
];
const eraNote = (year) => [...ERAS].reverse().find(([from]) => from <= year)?.[1]() || ERAS[0][1]();

export default function Setup({ backTo, engine, summary, fallbackMode, onStart, onResume, onDelete, onImported }) {
  // RF-CAR-01: the playable seasons are those with a pack (SRS 3.1). The list costs nothing; the chosen
  // season's pack is fetched below. Without packs (never in a normal build) the bootstrap seasons stand in.
  const years = useMemo(() => {
    const packed = seasonPackYears();
    return packed.length ? packed : startableYears(engine);
  }, [engine]);
  const [mode, setMode] = useState("home");
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(() => years[years.length - 1]);
  const [kind, setKind] = useState("real");
  const [gameMode, setGameMode] = useState(DEFAULT_MODE);
  const [teamId, setTeamId] = useState(null);
  const [seed, setSeed] = useState(newSeed);
  const [name, setName] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(null);
  const fileRef = useRef(null);
  const [custom, setCustom] = useState({ name: "", short: "", color: CUSTOM_COLORS[0], color2: CUSTOM_COLORS[1], country: locale === "es" ? "es" : "gb", hq: "oxon", engineId: null, backer: "corporate", driverIds: [] });

  // RF-CAR-02: a season with a pack is built from it, so the wizard waits for the pack instead of showing
  // the bootstrap world first. A pack that fails to load falls back to the bootstrap world when it has that season.
  const [packState, setPackState] = useState({});
  const packPending = mode === "wizard" && hasSeasonPack(year) && !engine.packs?.[year] && packState[year] !== "failed";
  useEffect(() => {
    if (!packPending) return undefined;
    let active = true;
    ensureSeasonPack(engine, year).then((pack) => {
      if (active) setPackState((current) => ({ ...current, [year]: pack ? "ready" : "failed" }));
    });
    return () => {
      active = false;
    };
  }, [engine, year, packPending]);
  const fielded = Boolean(engine.packs?.[year]) || startableYears(engine).includes(year);
  const world = useMemo(
    () => (mode === "wizard" && !packPending && fielded ? seasonWorld(engine, year, seed) : null),
    // packState re-runs the memo once the pack has been added to engine.packs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, year, seed, mode, packPending, fielded, packState],
  );
  // Teams that did not enter every Grand Prix (Super Aguri 2008) cannot be taken over (SRS 6.1).
  const ranked = useMemo(() => (world ? teamsByPace(world).filter((team) => !team.partial) : []), [world]);
  const engines = useMemo(() => enginesFor(year), [year]);
  const engineId = custom.engineId && engines.some((entry) => entry.id === custom.engineId) ? custom.engineId : engines[Math.min(1, engines.length - 1)]?.id;

  const selectYear = (value) => {
    if (!years.includes(value)) return;
    setYear(value);
    setTeamId(null);
    setCustom((current) => ({ ...current, driverIds: [], engineId: null }));
  };

  const steps = kind === "real"
    ? [t("Temporada", "Season"), t("Partida", "Career"), t("Equipo", "Team"), t("Tú", "You")]
    : [t("Temporada", "Season"), t("Partida", "Career"), t("Tu equipo", "Your team"), t("Pilotos", "Drivers"), t("Tú", "You")];
  const last = steps.length - 1;
  const customName = custom.name.trim();
  const canNext = (() => {
    if (step === 0) return Boolean(world);
    if (step === 1) return true;
    if (step === 2) return kind === "real" ? Boolean(teamId && world?.teams[teamId]) : customName.length >= 3;
    if (step === 3 && kind === "custom") return custom.driverIds.length === 2;
    return name.trim().length >= 2;
  })();

  const begin = () => {
    const common = { year, managerName: name.trim(), seed, mode: gameMode };
    if (kind === "real") onStart({ ...common, teamId });
    else onStart({ ...common, custom: { ...custom, name: customName, short: custom.short || shortCode(customName), engineId } });
  };

  const runImport = async (source) => {
    setImportError(null);
    try {
      const career = typeof source === "string" ? await importCareer(source) : await importFile(source);
      setImportOpen(false);
      onImported(career);
    } catch (failure) {
      setImportError(failure?.status === 404 ? "missing" : failure instanceof TypeError ? "offline" : "invalid");
    }
  };

  const openWizard = () => {
    setMode("wizard");
    setStep(0);
    setSeed(newSeed());
  };

  if (mode === "home") {
    const first = years[0];
    const latest = years[years.length - 1];
    return (
      <div className="mn-su mn-su-home">
        <Link className="mn-su-back" to={backTo}>
          <IconArrowLeft size={16} />
          {t("Modo Carrera", "Career Mode")}
        </Link>
        <div className="mn-su-home__grid">
          <div className="mn-su-home__text">
            <span className="mn-su-kicker">OverCut Mánager</span>
            <h1>{t(`Dirige una escudería de Fórmula 1, de ${first} a ${latest}`, `Run a Formula 1 team, from ${first} to ${latest}`)}</h1>
            <p className="mn-su-lead">
              {t(
                `Toma un equipo real de cualquiera de las ${years.length} temporadas jugables, o inscribe el tuyo en aquella parrilla. Desarrollas el coche, fichas pilotos, decides la estrategia en directo y respondes ante la directiva.`,
                `Take over a real team in any of the ${years.length} playable seasons, or enter your own on that year's grid. You develop the car, sign drivers, call the strategy live and answer to the board.`,
              )}
            </p>

            {summary && (
              <div className="mn-su-resume" style={{ "--stripe": readableOn(summary.color) }}>
                <TeamBadge team={{ name: summary.teamName, short: summary.short, color: summary.color, color2: summary.color2, custom: summary.custom }} size={48} />
                <div className="mn-su-resume__text">
                  <small>{t("Partida guardada", "Saved career")}</small>
                  <strong>{summary.teamName}</strong>
                  <span>
                    {summary.manager} · {summary.year} · {t("Ronda", "Round")} {Math.min(summary.round + 1, summary.races)} {t("de", "of")} {summary.races}
                  </span>
                </div>
                <button type="button" className="mn-btn mn-btn--primary" onClick={onResume}>
                  <IconPlay size={16} />
                  {t("Continuar partida", "Continue career")}
                </button>
              </div>
            )}

            <div className="mn-su-home__actions">
              <button type="button" className={`mn-btn mn-btn--xl${summary ? "" : " mn-btn--primary"}`} onClick={openWizard}>
                <IconPlus size={16} />
                {t("Nueva partida", "New career")}
              </button>
              <button type="button" className="mn-btn mn-btn--ghost" onClick={() => setImportOpen(true)}>
                <IconUpload size={16} />
                {t("Importar partida", "Import career")}
              </button>
              {summary && (
                <button type="button" className="mn-btn mn-btn--ghost mn-su-danger" onClick={() => setDeleteOpen(true)}>
                  <IconTrash size={16} />
                  {t("Borrar guardado", "Delete save")}
                </button>
              )}
            </div>

            <ul className="mn-su-loop" aria-label={t("Así es cada temporada", "Every season")}>
              {[t("Fábrica e I+D", "Factory and R&D"), t("Libres y clasificación", "Practice and qualifying"), t("Estrategia en directo", "Live strategy"), t("Mercado de pilotos", "Driver market"), t("Coche del año siguiente", "Next year's car")].map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <p className="mn-su-note">
              {t("Se juega sin cuenta; la partida se guarda en este navegador.", "No account needed; the career is saved in this browser.")}{" "}
              <span className={fallbackMode ? "is-offline" : ""}>{fallbackMode ? t("Sin conexión con el servidor: datos incluidos en el juego.", "Server offline: using the data bundled with the game.") : t("Datos de f1db.", "Data from f1db.")}</span>
            </p>
          </div>
          <EraGarage summary={summary} />
        </div>

        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) runImport(file); event.target.value = ""; }} />
        <Sheet open={importOpen} onClose={() => setImportOpen(false)} title={t("Importar partida", "Import career")}>
          <form className="mn-su-form" onSubmit={(event) => { event.preventDefault(); if (importText.trim()) runImport(importText); }}>
            <p>{t("Escribe tu código corto (XXXX-XXXX-XXXX), pega un código largo (OCM…) o abre el archivo de la partida.", "Type your short code (XXXX-XXXX-XXXX), paste a long code (OCM…) or open the save file.")}</p>
            <label htmlFor="mn-import-code">{t("Código de partida", "Career code")}</label>
            <textarea id="mn-import-code" rows={3} value={importText} onChange={(event) => setImportText(event.target.value)} spellCheck={false} placeholder="ABCD-EFGH-JKMN" />
            {importError && (
              <p className="mn-error" role="alert">
                {importError === "missing" ? t("Ese código no existe.", "That code does not exist.") : importError === "offline" ? t("No hay conexión con el servidor. Prueba con el código largo o el archivo.", "The server cannot be reached. Try the long code or the file.") : t("No es una partida válida del modo mánager.", "That is not a valid manager career.")}
              </p>
            )}
            <div className="mn-su-form__actions">
              <button type="submit" className="mn-btn mn-btn--primary" disabled={!importText.trim()}>
                {t("Cargar", "Load")}
              </button>
              <button type="button" className="mn-btn" onClick={() => fileRef.current?.click()}>
                <IconUpload size={16} />
                {t("Abrir archivo", "Open file")}
              </button>
            </div>
          </form>
        </Sheet>
        <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("Borrar la partida guardada", "Delete the saved career")}>
          <div className="mn-su-form">
            <p>
              {t(
                `Se borra ${summary?.teamName || "la partida"} de este navegador. Si guardaste el código o el archivo podrás importarla otra vez.`,
                `${summary?.teamName || "The career"} is deleted from this browser. If you kept the code or the file you can import it again.`,
              )}
            </p>
            <div className="mn-su-form__actions">
              <button type="button" className="mn-btn mn-btn--danger" onClick={() => { setDeleteOpen(false); onDelete(); }}>
                <IconTrash size={16} />
                {t("Borrar", "Delete")}
              </button>
              <button type="button" className="mn-btn mn-btn--ghost" onClick={() => setDeleteOpen(false)}>
                {t("Cancelar", "Cancel")}
              </button>
            </div>
          </div>
        </Sheet>
      </div>
    );
  }

  const chosenTeam = kind === "real" ? (teamId && world?.teams[teamId]?.name) : customName;
  const trail = [year, GAME_MODE[gameMode].name(), chosenTeam].filter(Boolean).join(" · ");

  return (
    <div className="mn-su mn-su-wizard">
      <header className="mn-su-wizard__head">
        <button type="button" className="mn-icon-btn" onClick={() => (step === 0 ? setMode("home") : setStep(step - 1))} aria-label={t("Atrás", "Back")}>
          <IconArrowLeft size={18} />
        </button>
        <Steps steps={steps} current={step} />
      </header>

      <div className="mn-su-wizard__body">
        {step === 0 && <SeasonStep years={years} year={year} onYear={selectYear} world={world} engine={engine} />}
        {step === 1 && <CareerStep kind={kind} setKind={setKind} gameMode={gameMode} setGameMode={setGameMode} ranked={ranked} year={year} />}
        {step === 2 && kind === "real" && world && <TeamStep world={world} ranked={ranked} teamId={teamId} onTeam={setTeamId} year={year} />}
        {step === 2 && kind === "custom" && world && <BuilderStep custom={custom} setCustom={setCustom} engines={engines} engineId={engineId} year={year} ranked={ranked} />}
        {step === 3 && kind === "custom" && world && <DriversStep world={world} custom={custom} setCustom={setCustom} year={year} />}
        {step === last && world && (
          <section className="mn-su-step mn-su-you">
            <header className="mn-su-step__head">
              <h2>{t("Firma como jefe de equipo", "Sign as team principal")}</h2>
              <p>{t("Tu nombre aparece en el contrato, en la prensa y en el palmarés.", "Your name goes on the contract, in the press and in the record books.")}</p>
            </header>
            <label className="mn-su-field mn-su-field--name">
              <span>{t("Tu nombre", "Your name")}</span>
              <input className="mn-su-input mn-su-input--big" value={name} maxLength={32} onChange={(event) => setName(event.target.value)} placeholder={t("Tu nombre", "Your name")} autoFocus />
            </label>
            <ContractCard world={world} kind={kind} teamId={teamId} custom={custom} customName={customName} year={year} name={name} engines={engines} engineId={engineId} gameMode={gameMode} />
          </section>
        )}
      </div>

      <footer className="mn-su-wizard__foot">
        <span className="mn-su-trail">{trail}</span>
        {step < last ? (
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" disabled={!canNext} onClick={() => setStep(step + 1)}>
            {t("Siguiente", "Next")}
            <IconArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" disabled={!canNext} onClick={begin}>
            <IconFlag size={16} />
            {kind === "custom" ? t("Inscribir el equipo", "Enter the team") : t("Firmar contrato", "Sign the contract")}
          </button>
        )}
      </footer>
    </div>
  );
}

/** The season's rules that change how a weekend is run, from its pack when it has one (SRS 6.2). */
const seasonRules = (year, regulations) => {
  const features = eraFeaturesFor(year);
  const reg = regulations || {};
  const has = (key, fallback) => (reg[key] !== undefined ? Boolean(reg[key]) : fallback);
  const yes = t("Sí", "Yes");
  const no = t("No", "No");
  const energy = {
    none: no,
    kers: "KERS",
    ers: "ERS",
    ers2026: t("ERS 2026 y modo adelantamiento", "2026 ERS and overtake mode"),
  };
  const suppliers = (reg.tyreSuppliers || []).map((id) => id.charAt(0).toUpperCase() + id.slice(1)).join(" · ");
  const QUALI = {
    TWO_SESSION: t("Dos sesiones", "Two sessions"),
    ONE_SESSION: t("Una sesión de una hora", "One one-hour session"),
    ONE_LAP: t("Vuelta única", "Single lap"),
    AGGREGATE: t("Tiempos agregados", "Aggregate times"),
    KNOCKOUT: t("Eliminatoria Q1–Q3", "Knockout Q1–Q3"),
    ELIMINATION: t("Eliminación vuelta a vuelta", "Lap-by-lap elimination"),
  };
  const formats = (reg.qualifyingFormats || []).filter((format) => QUALI[format]);
  const sprint = (reg.qualifyingFormats || []).includes("SPRINT_RACE") || reg.sprintWeekends > 0;
  const quali = formats.length
    ? `${formats.map((format) => QUALI[format]).join(" · ")}${sprint ? t(" · sprints", " · sprints") : ""}`
    : features.knockoutQualifying ? QUALI.KNOCKOUT : QUALI.TWO_SESSION;
  return [
    [t("Motor", "Engine"), reg.engineFormula || (features.hybrid ? t("V6 turbo híbrido", "Hybrid V6 turbo") : "—")],
    [t("Energía", "Energy"), energy[reg.energySystem] || (features.hybrid ? "ERS" : no)],
    [t("Repostaje", "Refuelling"), has("refuelling", features.refuelling) ? yes : no],
    [t("Neumáticos", "Tyres"), suppliers || "—"],
    [t("Clasificación", "Qualifying"), quali],
    [t("Coche de seguridad", "Safety car"), has("safetyCar", features.safetyCar) ? (has("vsc", features.virtualSafetyCar) ? t("Sí, y virtual", "Yes, and virtual") : yes) : no],
    [has("activeAero", features.activeAero) ? t("Aero activa", "Active aero") : "DRS", has("activeAero", features.activeAero) ? yes : has("drs", features.drs) ? yes : no],
    [t("Techo de gasto", "Cost cap"), reg.budgetCap ? money(reg.budgetCap * 1e6) : year >= 2021 ? yes : no],
  ];
};

function SeasonStep({ years, year, onYear, world, engine }) {
  const decades = [...new Set(years.map((value) => Math.floor(value / 10) * 10))];
  const champion = engine.bootstrap.championsByYear?.[String(year)];
  const constructor = engine.bootstrap.constructorChampionsByYear?.[String(year)];
  const championName = Array.isArray(champion) ? champion[0] : champion?.name || champion;
  const constructorName = Array.isArray(constructor) ? constructor[0] : constructor?.name || constructor;
  const points = world?.regulations?.pointsScheme?.race || pointsTableFor(year);
  const pick = (event, value) => {
    // Arrow keys move through the seasons like a radio group.
    const index = years.indexOf(value);
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? years[index + 1] : event.key === "ArrowLeft" || event.key === "ArrowUp" ? years[index - 1] : null;
    if (next) {
      event.preventDefault();
      onYear(next);
      event.currentTarget.parentElement?.parentElement?.parentElement?.querySelector(`[data-year="${next}"]`)?.focus();
    }
  };
  return (
    <section className="mn-su-step mn-su-season">
      <div className="mn-su-season__pick">
        <header className="mn-su-step__head">
          <h2>{t("¿En qué temporada empiezas?", "Which season do you start in?")}</h2>
          <p>{t(`${years.length} temporadas con su parrilla real por Gran Premio, calendario, reglamento y puntos, sacados de f1db.`, `${years.length} seasons with their real entry list for every Grand Prix, calendar, regulations and points, from f1db.`)}</p>
        </header>
        <div className="mn-su-years" role="radiogroup" aria-label={t("Temporada", "Season")}>
          {decades.map((decade) => (
            <div key={decade} className="mn-su-years__row">
              <span className="mn-su-years__decade">{decade}</span>
              <div className="mn-su-years__list">
                {years
                  .filter((value) => value >= decade && value < decade + 10)
                  .map((value) => (
                    <button
                      type="button"
                      key={value}
                      role="radio"
                      data-year={value}
                      aria-checked={value === year}
                      tabIndex={value === year ? 0 : -1}
                      className={value === year ? "is-active" : ""}
                      onClick={() => onYear(value)}
                      onKeyDown={(event) => pick(event, value)}
                    >
                      {value}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="mn-su-era" aria-live="polite">
        <div className="mn-su-era__head">
          <strong className="mn-su-era__year">{year}</strong>
          {!world && <span className="mn-su-era__loading">{t("Cargando la temporada", "Loading the season")}</span>}
        </div>
        <p className="mn-su-era__note">{eraNote(year)}</p>
        <dl className="mn-su-era__facts">
          <div>
            <dt>{t("Equipos", "Teams")}</dt>
            <dd>{world ? Object.keys(world.teams).length : "—"}</dd>
          </div>
          <div>
            <dt>{t("Grandes Premios", "Grands Prix")}</dt>
            <dd>{world ? world.races.length : "—"}</dd>
          </div>
          <div className="is-wide">
            <dt>{t("Puntos", "Points")}</dt>
            <dd className="is-mono">{points.join("-")}</dd>
          </div>
          {championName && (
            <div className={constructorName ? "" : "is-wide"}>
              <dt>{t("Campeón real", "Real champion")}</dt>
              <dd>{championName}</dd>
            </div>
          )}
          {constructorName && (
            <div className={championName ? "" : "is-wide"}>
              <dt>{t("Constructores", "Constructors")}</dt>
              <dd>{constructorName}</dd>
            </div>
          )}
        </dl>
        <h3>{t("Reglamento", "Regulations")}</h3>
        <dl className="mn-su-era__rules">
          {seasonRules(year, world?.regulations).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

const Choice = ({ active, onClick, icon: Icon, title, children }) => (
  <button type="button" className={`mn-su-choice${active ? " is-active" : ""}`} onClick={onClick} aria-pressed={active}>
    <span className="mn-su-choice__icon">
      <Icon size={18} />
    </span>
    <strong>{title}</strong>
    <span>{children}</span>
    <i className="mn-su-choice__mark" aria-hidden="true">
      {active && <IconCheck size={12} />}
    </i>
  </button>
);

/** RF-CAR-05 and RF-CAR-06: a real team or your own, and how history behaves around you. */
function CareerStep({ kind, setKind, gameMode, setGameMode, ranked, year }) {
  return (
    <section className="mn-su-step mn-su-career">
      <div className="mn-su-group">
        <header className="mn-su-step__head">
          <h2>{t("¿Cómo entras en la Fórmula 1?", "How do you enter Formula 1?")}</h2>
        </header>
        <div className="mn-su-choices">
          <Choice active={kind === "real"} onClick={() => setKind("real")} icon={IconFlag} title={t("Dirigir un equipo real", "Run a real team")}>
            {t(`Cualquiera de los ${ranked.length} equipos de ${year}, con sus pilotos, su coche y su dinero.`, `Any of the ${ranked.length} teams of ${year}, with their drivers, their car and their money.`)}
          </Choice>
          <Choice active={kind === "custom"} onClick={() => setKind("custom")} icon={IconWrench} title={t("Crear mi propio equipo", "Create my own team")}>
            {t(`Nombre, colores, motor, financiación y pilotos. Entra en la parrilla real de ${year} con presupuesto y coche de equipo nuevo.`, `Name, colours, engine, funding and drivers. It joins the real ${year} grid with a new team's budget and car.`)}
          </Choice>
        </div>
      </div>
      <div className="mn-su-group">
        <header className="mn-su-step__head">
          <h2>{t("¿Cuánto pesa la historia?", "How much does history weigh?")}</h2>
        </header>
        <div className="mn-su-choices" role="group" aria-label={t("Modo de juego", "Game mode")}>
          <Choice active={gameMode === MODES.STRICT} onClick={() => setGameMode(MODES.STRICT)} icon={IconLock} title={GAME_MODE.strict.name()}>
            {GAME_MODE.strict.copy()}
          </Choice>
          <Choice active={gameMode === MODES.FREE} onClick={() => setGameMode(MODES.FREE)} icon={IconBranch} title={GAME_MODE.free.name()}>
            {GAME_MODE.free.copy()}
          </Choice>
        </div>
        <p className="mn-su-hint">{GAME_MODE.fixed()}</p>
      </div>
    </section>
  );
}

function TeamStep({ world, ranked, teamId, onTeam, year }) {
  const team = teamId ? world.teams[teamId] : null;
  return (
    <section className="mn-su-step mn-su-team">
      <header className="mn-su-step__head">
        <h2>{t(`Elige tu equipo de ${year}`, `Choose your ${year} team`)}</h2>
        <p>{t("Ordenados por el ritmo de su coche al empezar el año.", "Ordered by the pace of their car at the start of the year.")}</p>
      </header>
      <div className="mn-su-team__layout">
        <div className="mn-su-tiles">
          {ranked.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              className={`mn-su-tile${teamId === entry.id ? " is-active" : ""}`}
              style={{ "--stripe": readableOn(entry.color) }}
              onClick={() => onTeam(entry.id)}
              aria-pressed={teamId === entry.id}
            >
              <span className="mn-su-tile__name">{entry.name}</span>
              <TeamBadge team={entry} size={32} />
              <span className="mn-su-tile__meta">
                <Stars value={stars(index + 1, ranked.length)} />
                <span>{ordinal(index + 1)}</span>
              </span>
            </button>
          ))}
        </div>
        {team ? (
          <TeamPreview key={team.id} world={world} team={team} rank={ranked.findIndex((entry) => entry.id === team.id) + 1} total={ranked.length} year={year} />
        ) : (
          <aside className="mn-su-preview mn-su-preview--empty">
            <p>{t("Elige un equipo para ver su coche, sus pilotos y lo que hizo de verdad aquel año.", "Pick a team to see its car, its drivers and what it really did that year.")}</p>
          </aside>
        )}
      </div>
    </section>
  );
}

function TeamPreview({ world, team, rank, total, year }) {
  const drivers = driversOf(world, team.id);
  const best = fieldBestOf(Object.values(world.teams));
  const chassis = (team.chassis || []).join(" / ");
  const engine = (team.engines || [])[0];
  return (
    <aside className="mn-su-preview" style={{ "--stripe": readableOn(team.color) }}>
      <header className="mn-su-preview__head">
        <TeamBadge team={team} size={48} />
        <div>
          <h3>{team.name}</h3>
          <span>
            <Flag code={team.country} width={16} />
            {[chassis, engine].filter(Boolean).join(" · ") || t(`Coche ${rank}.º de ${total}`, `Car ${rank} of ${total}`)}
          </span>
        </div>
      </header>
      <div className="mn-su-stage">
        <Livery color={team.color} color2={team.color2} width={420} height={210} year={year} name={team.name} teamRef={team.custom ? null : team.id} />
      </div>
      <dl className="mn-su-preview__facts">
        <div>
          <dt>{t("Coche", "Car")}</dt>
          <dd>
            <Rating value={carRatingOf(team.car)} />
          </dd>
        </div>
        <div>
          <dt>{t("Ritmo", "Pace")}</dt>
          <dd>{t(`${rank}.º de ${total}`, `${rank} of ${total}`)}</dd>
        </div>
        <div>
          <dt>{t("Fábrica", "Factory")}</dt>
          <dd>{team.facility}/5</dd>
        </div>
        <div>
          <dt>{t("Real", "Real")}</dt>
          <dd>{team.realPosition ? ordinal(team.realPosition) : "—"}</dd>
        </div>
      </dl>
      <div className="mn-su-preview__bars">
        {AREAS.map((area) => (
          <Bar key={area} label={AREA[area]()} caption={Math.round(team.car[area] ?? 60)} value={team.car[area] ?? 60} marker={best[area]} min={40} tone="steel" />
        ))}
      </div>
      <ul className="mn-su-drivers">
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
    </aside>
  );
}

const Swatches = ({ value, field, label, other, set }) => (
  <div className="mn-su-swatches" role="radiogroup" aria-label={label}>
    {CUSTOM_COLORS.map((color) => (
      <button type="button" key={`${field}-${color}`} role="radio" aria-checked={value === color} className={value === color ? "is-active" : ""} style={{ "--swatch": color }} onClick={() => set({ [field]: color })} aria-label={color} />
    ))}
    <input type="color" value={value} onChange={(event) => set({ [field]: event.target.value })} aria-label={other} />
  </div>
);

function BuilderStep({ custom, setCustom, engines, engineId, year, ranked }) {
  const set = (patch) => setCustom((current) => ({ ...current, ...patch }));
  const preview = { name: custom.name || "OverCut Racing", short: custom.short || shortCode(custom.name || "OverCut Racing"), color: custom.color, color2: custom.color2, custom: true };
  const randomise = () => {
    const pickColour = () => CUSTOM_COLORS[Math.floor(Math.random() * CUSTOM_COLORS.length)];
    const a = pickColour();
    let b = pickColour();
    while (b === a) b = pickColour();
    set({ color: a, color2: b });
  };
  const slowest = ranked.length ? carRatingOf(ranked[ranked.length - 1].car) : 60;
  return (
    <section className="mn-su-step mn-su-builder">
      <header className="mn-su-step__head">
        <h2>{t("Crea tu equipo", "Build your team")}</h2>
        <p>{t(`Se inscribe en ${year} junto a los equipos que corrieron aquel año.`, `It enters ${year} next to the teams that raced that year.`)}</p>
      </header>
      <div className="mn-su-builder__layout">
        <div className="mn-su-builder__form">
          <div className="mn-su-row">
            <label className="mn-su-field">
              <span>{t("Nombre del equipo", "Team name")}</span>
              <input className="mn-su-input" value={custom.name} maxLength={28} onChange={(event) => set({ name: event.target.value })} placeholder="OverCut Racing" />
            </label>
            <label className="mn-su-field mn-su-field--short">
              <span>{t("Siglas", "Short code")}</span>
              <input className="mn-su-input" value={custom.short} maxLength={3} onChange={(event) => set({ short: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder={shortCode(custom.name || "OverCut Racing")} />
            </label>
          </div>
          <fieldset className="mn-su-field">
            <legend>{t("Colores", "Colours")}</legend>
            <Swatches value={custom.color} field="color" label={t("Color principal", "Main colour")} other={t("Otro color principal", "Other main colour")} set={set} />
            <div className="mn-su-swatches-row">
              <Swatches value={custom.color2} field="color2" label={t("Color secundario", "Second colour")} other={t("Otro color secundario", "Other second colour")} set={set} />
              <button type="button" className="mn-btn mn-btn--ghost mn-btn--sm" onClick={randomise}>
                <IconShuffle size={16} />
                {t("Al azar", "Random")}
              </button>
            </div>
          </fieldset>
          <div className="mn-su-row">
            <label className="mn-su-field">
              <span>{t("Nacionalidad", "Nationality")}</span>
              <select className="mn-su-input" value={custom.country} onChange={(event) => set({ country: event.target.value })}>
                {NATIONALITIES.map((nation) => (
                  <option key={nation.code} value={nation.code}>
                    {nation[locale] || nation.en}
                  </option>
                ))}
              </select>
            </label>
            <label className="mn-su-field">
              <span>{t("Sede", "Headquarters")}</span>
              <select className="mn-su-input" value={custom.hq} onChange={(event) => set({ hq: event.target.value })}>
                {HEADQUARTERS.map((hq) => (
                  <option key={hq.id} value={hq.id}>
                    {hq[locale] || hq.en}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mn-su-field">
            <legend>{t("Financiación", "Funding")}</legend>
            <div className="mn-su-options mn-su-options--3">
              {Object.values(BACKERS).map((backer) => (
                <button type="button" key={backer.id} className={`mn-su-option${custom.backer === backer.id ? " is-active" : ""}`} onClick={() => set({ backer: backer.id })} aria-pressed={custom.backer === backer.id}>
                  <strong>{BACKER[backer.id].name()}</strong>
                  <span>{BACKER[backer.id].copy()}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mn-su-field">
            <legend>{t(`Motor (${year})`, `Engine (${year})`)}</legend>
            <div className="mn-su-options mn-su-options--2">
              {engines.map((entry) => (
                <button type="button" key={entry.id} className={`mn-su-option mn-su-engine${engineId === entry.id ? " is-active" : ""}`} onClick={() => set({ engineId: entry.id })} aria-pressed={engineId === entry.id}>
                  <Flag code={entry.country} width={16} />
                  <strong>{entry.name}</strong>
                  <span className={`mn-su-tier is-${entry.tier}`}>{TIER[entry.tier]()}</span>
                  <em>
                    {money(entry.price * moneyScale(year))}/{t("año", "yr")}
                  </em>
                </button>
              ))}
            </div>
            <p className="mn-su-hint">{t("El nivel de cada motor por época es una aproximación al historial, no una medición.", "Each engine's level by era is an approximation from the record books, not a measurement.")}</p>
          </fieldset>
        </div>
        <aside className="mn-su-preview mn-su-builder__preview" style={{ "--stripe": readableOn(custom.color) }}>
          <header className="mn-su-preview__head">
            <TeamBadge team={preview} size={48} />
            <div>
              <h3>{preview.name}</h3>
              <span>
                <Flag code={custom.country} width={16} />
                {preview.short} · {t("Equipo nuevo", "New team")}
              </span>
            </div>
          </header>
          <div className="mn-su-stage">
            <Livery color={custom.color} color2={custom.color2} width={420} height={210} year={year} name={custom.name} />
          </div>
          <p className="mn-su-hint">
            {custom.backer === "garagiste"
              ? t(`Tu primer coche será el más lento de la parrilla (el último real va a ${slowest.toFixed(0)}).`, `Your first car will be the slowest on the grid (the real last is at ${slowest.toFixed(0)}).`)
              : t("Un equipo nuevo empieza por detrás de los grandes. El resto depende de ti.", "A new team starts behind the big names. The rest is up to you.")}
          </p>
        </aside>
      </div>
    </section>
  );
}

function DriversStep({ world, custom, setCustom, year }) {
  const [filter, setFilter] = useState("market");
  const pool = Object.values(world.drivers)
    .filter((driver) => (filter === "market" ? driver.status === "free" || driver.status === "junior" || driver.status === "reserve" : driver.status === "grid"))
    .filter((driver) => driver.age >= 17)
    .sort((a, b) => b.rating - a.rating);
  const prestige = BACKERS[custom.backer]?.prestige ?? 0.4;
  const toggle = (id) =>
    setCustom((current) => {
      const has = current.driverIds.includes(id);
      const next = has ? current.driverIds.filter((value) => value !== id) : [...current.driverIds, id].slice(-2);
      return { ...current, driverIds: next };
    });
  const picked = custom.driverIds.map((id) => world.drivers[id]).filter(Boolean);
  return (
    <section className="mn-su-step mn-su-pick">
      <header className="mn-su-step__head">
        <h2>{t("Elige a tus dos pilotos", "Choose your two drivers")}</h2>
        <p>{t("Los libres y las promesas firman sin coste. Un piloto de otro equipo cuesta su cláusula y su equipo buscará sustituto.", "Free agents and prospects sign at no cost. A driver from another team costs his release fee and his team will find a replacement.")}</p>
      </header>
      <div className="mn-su-pick__bar">
        <Tabs
          label={t("Pilotos", "Drivers")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "market", label: t("Libres y promesas", "Free agents and prospects") },
            { value: "grid", label: t(`Parrilla de ${year}`, `${year} grid`) },
          ]}
        />
        <span className="mn-su-picked">
          <b>{picked.length}/2</b> {picked.map((driver) => driver.name).join(" · ") || t("Ninguno elegido", "None picked")}
        </span>
      </div>
      <ul className="mn-su-list">
        {pool.map((driver) => {
          const isPicked = custom.driverIds.includes(driver.id);
          const team = driver.teamId ? world.teams[driver.teamId] : null;
          return (
            <li key={driver.id}>
              <button type="button" className={`mn-su-driver${isPicked ? " is-active" : ""}`} onClick={() => toggle(driver.id)} aria-pressed={isPicked}>
                <Rating value={driver.rating} size="sm" />
                <Flag code={driver.nat} width={16} />
                <span className="mn-su-driver__name">
                  <strong>{driver.name}</strong>
                  <small>
                    {driver.status === "junior" ? t("Promesa", "Prospect") : driver.status === "reserve" ? t("Reserva", "Reserve") : team ? team.name : t("Libre", "Free agent")} · {driver.age} {t("años", "yrs")}
                  </small>
                </span>
                <span className="mn-su-driver__money">
                  {money(driverSalary(driver.rating, prestige, year))}
                  {team && <small>+{money(driver.contract.salary * 0.8)}</small>}
                </span>
                <i className="mn-su-choice__mark" aria-hidden="true">
                  {isPicked && <IconCheck size={12} />}
                </i>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ContractCard({ world, kind, teamId, custom, customName, year, name, engines, engineId, gameMode }) {
  const team = kind === "real" ? world.teams[teamId] : { name: customName, short: custom.short || shortCode(customName), color: custom.color, color2: custom.color2, custom: true };
  if (!team) return null;
  const engine = engines.find((entry) => entry.id === engineId);
  const rows = [
    [t("Temporada", "Season"), year],
    [t("Modo", "Mode"), GAME_MODE[gameMode].name()],
    kind === "custom" && engine && [t("Motor", "Engine"), engine.name],
    kind === "custom" && [t("Financiación", "Funding"), BACKER[custom.backer].name()],
    [t("Pilotos", "Drivers"), (kind === "custom" ? custom.driverIds.map((id) => world.drivers[id]) : driversOf(world, team.id)).filter(Boolean).map((driver) => driver.name).join(" · ")],
  ].filter(Boolean);
  return (
    <div className="mn-su-contract" style={{ "--stripe": readableOn(team.color) }}>
      <div className="mn-su-contract__text">
        <header>
          <TeamBadge team={team} size={48} />
          <div>
            <small>{kind === "custom" ? t("Inscripción en el campeonato", "Championship entry") : t("Contrato de jefe de equipo", "Team principal contract")}</small>
            <strong>{team.name}</strong>
          </div>
        </header>
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mn-su-contract__sign">
          <span>{t("Firma", "Signature")}</span>
          <strong>{name.trim() || " "}</strong>
        </div>
      </div>
      <div className="mn-su-stage mn-su-contract__car">
        <Livery color={team.color} color2={team.color2} width={480} height={240} year={year} name={team.name} teamRef={team.custom ? null : team.id} />
      </div>
    </div>
  );
}

/** The cars of every playable era on one turntable; the player turns the pages. */
function EraGarage({ summary }) {
  const [index, setIndex] = useState(ERAS.length - 1);
  const [year, note] = ERAS[index];
  const color = summary?.color || "#10294f";
  const color2 = summary?.color2 || "#f2b705";
  return (
    <section className="mn-su-garage" aria-label={t("Los coches de cada época", "The cars of every era")}>
      <div className="mn-su-stage mn-su-garage__stage">
        <Livery color={color} color2={color2} width={600} height={300} year={year} name={summary?.teamName || "OverCut"} />
      </div>
      <div className="mn-su-garage__caption">
        <strong>{year}</strong>
        <p>{note()}</p>
      </div>
      <div className="mn-su-garage__years" role="tablist" aria-label={t("Época", "Era")}>
        {ERAS.map(([value], position) => (
          <button type="button" role="tab" key={value} aria-selected={position === index} className={position === index ? "is-active" : ""} onClick={() => setIndex(position)}>
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}
