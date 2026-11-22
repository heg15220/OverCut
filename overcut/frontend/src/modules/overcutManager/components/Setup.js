/**
 * The way in: resume, import, or a new career in four or five steps.
 *
 * Season -> real team or your own -> (the team, or the team builder and its
 * drivers) -> you. A team built from scratch is added to that season's real
 * grid, next to the teams that really raced it.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuCheck, LuFlag, LuPlay, LuShuffle, LuSparkles, LuTrash2, LuUpload, LuWrench } from "react-icons/lu";
import { NATIONALITIES } from "../../overcutTrayectoria/components/atoms";
import { eraFeaturesFor, pointsTableFor } from "../../overcutTrayectoria/engine/eras";
import { driversOf, teamsByPace } from "../engine/world";
import { AREAS, carRatingOf, fieldBestOf } from "../engine/car";
import { driverSalary, moneyScale } from "../engine/economy";
import { BACKERS, CUSTOM_COLORS, HEADQUARTERS, enginesFor, inkOn, shortCode } from "../engine/identity";
import { seasonWorld, startableYears } from "../engine/career";
import { ensureSeasonPack, hasSeasonPack, seasonPackYears } from "../engine/packs/seasonPacks";
import { importCareer, importFile } from "../engine/save";
import { Flag, Livery, ManagerBackLink, Pill, Rating, Sheet, TeamBadge } from "./atoms";
import { AREA, BACKER, TIER, locale, money, t } from "./texts";

const newSeed = () => `M-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

const Steps = ({ steps, current }) => (
  <ol className="mn-steps">
    {steps.map((label, index) => (
      <li key={label} className={index === current ? "is-active" : index < current ? "is-done" : ""}>
        <b>{index < current ? <LuCheck /> : index + 1}</b>
        <span>{label}</span>
      </li>
    ))}
  </ol>
);

const stars = (rank, total) => Math.max(1, Math.min(5, Math.round(5 - ((rank - 1) / Math.max(1, total - 1)) * 4)));

export default function Setup({ backTo, engine, summary, fallbackMode, onStart, onResume, onDelete, onImported }) {
  // Pack years are listed without loading them (SRS 6.3): the chosen season's pack is fetched below.
  const years = useMemo(() => [...new Set([...startableYears(engine), ...seasonPackYears()])].sort((a, b) => a - b), [engine]);
  const [mode, setMode] = useState("home");
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(() => years[years.length - 1]);
  const [kind, setKind] = useState("real");
  const [teamId, setTeamId] = useState(null);
  const [seed, setSeed] = useState(newSeed);
  const [name, setName] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(null);
  const fileRef = useRef(null);
  const [custom, setCustom] = useState({ name: "", short: "", color: CUSTOM_COLORS[0], color2: CUSTOM_COLORS[1], country: locale === "es" ? "es" : "gb", hq: "oxon", engineId: null, backer: "corporate", driverIds: [] });

  // RF-CAR-02: a season with a pack is built from it, so the wizard waits for the pack (spinner) instead
  // of showing the bootstrap world first. A pack that fails to load falls back to the bootstrap world
  // when the bootstrap has that season.
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
    ? [t("Temporada", "Season"), t("Modo", "Mode"), t("Equipo", "Team"), t("Tú", "You")]
    : [t("Temporada", "Season"), t("Modo", "Mode"), t("Tu equipo", "Your team"), t("Pilotos", "Drivers"), t("Tú", "You")];
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
    if (kind === "real") onStart({ year, teamId, managerName: name.trim(), seed });
    else onStart({ year, managerName: name.trim(), seed, custom: { ...custom, name: customName, short: custom.short || shortCode(customName), engineId } });
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

  if (mode === "home") {
    return (
      <div className="mn-setup mn-setup--home">
        <ManagerBackLink to={backTo}>{t("Volver al Modo Carrera", "Back to Career Mode")}</ManagerBackLink>
        <div className="mn-hero">
          <span className="mn-kicker">OverCut · {t("Modo mánager", "Manager mode")}</span>
          <h1>{t("El muro de boxes es tuyo", "The pit wall is yours")}</h1>
          <p>
            {t(
              "Elige cualquier temporada desde 1950 y toma el mando de un equipo real, o crea el tuyo desde cero y súmalo a la parrilla de aquel año. Desarrolla el coche, ficha pilotos, decide la estrategia en directo y responde ante la directiva.",
              "Pick any season since 1950 and take charge of a real team, or build your own from scratch and add it to that year's grid. Develop the car, sign drivers, call the strategy live and answer to the board.",
            )}
          </p>
          <ul className="mn-hero__loop" aria-label={t("Así es cada temporada", "Every season")}>
            {[t("Fábrica e I+D", "Factory & R&D"), t("Libres y clasificación", "Practice & qualifying"), t("Estrategia en directo", "Live strategy"), t("Mercado de pilotos", "Driver market"), t("Coche del año siguiente", "Next year's car")].map((label, index) => (
              <li key={label} style={{ "--i": index }}>
                <b>{index + 1}</b>
                {label}
              </li>
            ))}
          </ul>
          <span className={`mn-source${fallbackMode ? " is-offline" : ""}`}>{fallbackMode ? t("Sin conexión: una temporada por década", "Offline: one season per decade") : t("Datos f1db · todas las temporadas", "f1db data · every season")}</span>
        </div>
        <EraGarage summary={summary} />
        <div className="mn-home-actions">
          {summary && (
            <button type="button" className="mn-save-card" onClick={onResume}>
              <TeamBadge team={{ name: summary.teamName, short: summary.short, color: summary.color, color2: summary.color2, custom: summary.custom }} size={52} />
              <span>
                <small>{t("Continuar partida", "Continue career")}</small>
                <strong>{summary.teamName}</strong>
                <em>
                  {summary.manager} · {summary.year} · {t("Ronda", "Round")} {Math.min(summary.round + 1, summary.races)}/{summary.races}
                </em>
              </span>
              <LuPlay aria-hidden="true" />
            </button>
          )}
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => { setMode("wizard"); setStep(0); setSeed(newSeed()); }}>
            <LuSparkles aria-hidden="true" />
            {t("Nueva partida", "New career")}
          </button>
          <div className="mn-home-actions__minor">
            <button type="button" className="mn-btn mn-btn--ghost" onClick={() => setImportOpen(true)}>
              <LuUpload aria-hidden="true" />
              {t("Importar partida", "Import career")}
            </button>
            {summary && (
              <button type="button" className="mn-btn mn-btn--ghost" onClick={onDelete}>
                <LuTrash2 aria-hidden="true" />
                {t("Borrar guardado", "Delete save")}
              </button>
            )}
          </div>
          <p className="mn-free">{t("Se juega sin cuenta. La partida se guarda en este navegador.", "No account needed. The career is saved in this browser.")}</p>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) runImport(file); event.target.value = ""; }} />
        <Sheet open={importOpen} onClose={() => setImportOpen(false)} title={t("Importar partida", "Import career")}>
          <form className="mn-import" onSubmit={(event) => { event.preventDefault(); if (importText.trim()) runImport(importText); }}>
            <p>{t("Escribe tu código (XXXX-XXXX-XXXX), pega un código largo (OCM…) o abre el archivo de la partida.", "Type your code (XXXX-XXXX-XXXX), paste a long code (OCM…) or open the save file.")}</p>
            <label htmlFor="mn-import-code">{t("Código de partida", "Career code")}</label>
            <textarea id="mn-import-code" rows={3} value={importText} onChange={(event) => setImportText(event.target.value)} spellCheck={false} placeholder="ABCD-EFGH-JKMN" />
            {importError && (
              <p className="mn-error" role="alert">
                {importError === "missing" ? t("Ese código no existe.", "That code does not exist.") : importError === "offline" ? t("No hay conexión con el servidor. Prueba con el código largo o el archivo.", "The server cannot be reached. Try the long code or the file.") : t("No es una partida válida del modo mánager.", "That is not a valid manager career.")}
              </p>
            )}
            <div className="mn-import__actions">
              <button type="submit" className="mn-btn mn-btn--primary" disabled={!importText.trim()}>
                {t("Cargar", "Load")}
              </button>
              <button type="button" className="mn-btn" onClick={() => fileRef.current?.click()}>
                <LuUpload aria-hidden="true" />
                {t("Abrir archivo", "Open file")}
              </button>
            </div>
          </form>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="mn-setup mn-setup--wizard">
      <header className="mn-wizard__head">
        <button type="button" className="mn-icon-btn" onClick={() => (step === 0 ? setMode("home") : setStep(step - 1))} aria-label={t("Atrás", "Back")}>
          <LuArrowLeft />
        </button>
        <Steps steps={steps} current={step} />
      </header>

      <div className="mn-wizard__body">
        {step === 0 && <SeasonStep years={years} year={year} onYear={selectYear} world={world} engine={engine} />}
        {step === 1 && (
          <section className="mn-step">
            <h2>{t("¿Cómo quieres entrar en la Fórmula 1?", "How do you want to enter Formula 1?")}</h2>
            <div className="mn-mode-cards">
              <button type="button" className={`mn-mode-card${kind === "real" ? " is-active" : ""}`} onClick={() => setKind("real")} aria-pressed={kind === "real"}>
                <LuFlag aria-hidden="true" />
                <strong>{t("Dirigir un equipo real", "Run a real team")}</strong>
                <span>{t(`Cualquiera de los ${ranked.length} equipos de ${year}, con sus pilotos, su coche y su dinero.`, `Any of the ${ranked.length} teams of ${year}, with their drivers, their car and their money.`)}</span>
              </button>
              <button type="button" className={`mn-mode-card${kind === "custom" ? " is-active" : ""}`} onClick={() => setKind("custom")} aria-pressed={kind === "custom"}>
                <LuWrench aria-hidden="true" />
                <strong>{t("Crear mi propio equipo", "Create my own team")}</strong>
                <span>{t(`Nombre, colores, motor, financiación y pilotos. Tu equipo se suma a la parrilla real de ${year}.`, `Name, colours, engine, funding and drivers. Your team joins the real ${year} grid.`)}</span>
              </button>
            </div>
          </section>
        )}
        {step === 2 && kind === "real" && world && <TeamStep world={world} ranked={ranked} teamId={teamId} onTeam={setTeamId} year={year} />}
        {step === 2 && kind === "custom" && world && <BuilderStep custom={custom} setCustom={setCustom} engines={engines} engineId={engineId} year={year} ranked={ranked} />}
        {step === 3 && kind === "custom" && world && <DriversStep world={world} custom={custom} setCustom={setCustom} year={year} />}
        {step === last && world && (
          <section className="mn-step mn-step--you">
            <h2>{t("¿Cómo te llamas, jefe?", "What is your name, boss?")}</h2>
            <input className="mn-input mn-input--big" value={name} maxLength={32} onChange={(event) => setName(event.target.value)} placeholder={t("Tu nombre", "Your name")} autoFocus />
            <ContractCard world={world} kind={kind} teamId={teamId} custom={custom} customName={customName} year={year} name={name} engines={engines} engineId={engineId} />
          </section>
        )}
      </div>

      <footer className="mn-wizard__foot">
        {step < last ? (
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" disabled={!canNext} onClick={() => setStep(step + 1)}>
            {t("Siguiente", "Next")}
            <LuArrowRight aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" disabled={!canNext} onClick={begin}>
            <LuFlag aria-hidden="true" />
            {kind === "custom" ? t("Inscribir el equipo", "Enter the team") : t("Firmar contrato", "Sign the contract")}
          </button>
        )}
      </footer>
    </div>
  );
}

function SeasonStep({ years, year, onYear, world, engine }) {
  const decades = [...new Set(years.map((value) => Math.floor(value / 10) * 10))];
  const features = eraFeaturesFor(year);
  const champion = engine.bootstrap.championsByYear?.[String(year)];
  const constructor = engine.bootstrap.constructorChampionsByYear?.[String(year)];
  const championName = Array.isArray(champion) ? champion[0] : champion?.name || champion;
  const constructorName = Array.isArray(constructor) ? constructor[0] : constructor?.name || constructor;
  const notes = [
    features.refuelling && t("Repostajes", "Refuelling"),
    features.safetyCar && t("Coche de seguridad", "Safety car"),
    features.drs && "DRS",
    features.activeAero && t("Aerodinámica activa y modo adelantamiento", "Active aero and overtake mode"),
    features.hybrid && t("Motores híbridos", "Hybrid engines"),
    features.turbo && !features.hybrid && "Turbo",
    year >= 2021 && t("Límite presupuestario", "Cost cap"),
    year < 1958 && t("Sin título de constructores", "No constructors' title"),
    year < 1991 && t("Cuentan los mejores resultados", "Best results count"),
  ].filter(Boolean);
  return (
    <section className="mn-step mn-step--season">
      <h2>{t("¿En qué temporada empiezas?", "Which season do you start in?")}</h2>
      <p>{t("La parrilla, el calendario, los pilotos y la velocidad de cada coche son los de aquel año, sacados de f1db.", "The grid, the calendar, the drivers and every car's pace are those of that year, from f1db.")}</p>
      <div className="mn-year" aria-live="polite">
        <b>{year}</b>
        {!world && <span className="mn-spin" aria-hidden="true" />}
      </div>
      <input className="mn-range" type="range" min={0} max={years.length - 1} value={years.indexOf(year)} onChange={(event) => onYear(years[Number(event.target.value)])} aria-label={t("Temporada", "Season")} aria-valuetext={String(year)} />
      <div className="mn-chips" role="group" aria-label={t("Décadas", "Decades")}>
        {decades.map((decade) => {
          const inDecade = years.filter((value) => value >= decade && value < decade + 10);
          return (
            <button type="button" key={decade} className={year >= decade && year < decade + 10 ? "is-active" : ""} onClick={() => onYear(inDecade.includes(year) ? year : inDecade[0])}>
              {decade}s
            </button>
          );
        })}
      </div>
      <label className="mn-select">
        <span>{t("Todas las temporadas", "Every season")}</span>
        <select value={year} onChange={(event) => onYear(Number(event.target.value))}>
          {[...years].reverse().map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      {world && (
        <dl className="mn-facts">
          <div>
            <dt>{t("Equipos", "Teams")}</dt>
            <dd>{Object.keys(world.teams).length}</dd>
          </div>
          <div>
            <dt>{t("Grandes Premios", "Grands Prix")}</dt>
            <dd>{world.races.length}</dd>
          </div>
          <div>
            <dt>{t("Puntos", "Points")}</dt>
            <dd>{pointsTableFor(year).join("-")}</dd>
          </div>
          {championName && (
            <div>
              <dt>{t("Campeón real", "Real champion")}</dt>
              <dd>{championName}</dd>
            </div>
          )}
          {constructorName && (
            <div>
              <dt>{t("Constructores", "Constructors")}</dt>
              <dd>{constructorName}</dd>
            </div>
          )}
        </dl>
      )}
      {notes.length > 0 && (
        <div className="mn-era-notes">
          {notes.map((note) => (
            <Pill key={note}>{note}</Pill>
          ))}
        </div>
      )}
    </section>
  );
}

/** The cars of every era, one after another, each with the rule that shaped it. */
const ERAS = [
  [1955, () => t("Motor delantero, ruedas de radios: el piloto va sentado detrás de un capó larguísimo.", "Front engine, wire wheels: the driver sits behind an endless bonnet.")],
  [1962, () => t("El motor pasa detrás del piloto: nacen los «puros», bajos y estrechos.", "The engine moves behind the driver: the low, slim 'cigars'.")],
  [1968, () => t("Primeros alerones, altísimos sobre puntales encima de las ruedas.", "The first wings, perched on struts high above the wheels.")],
  [1975, () => t("Morro en cuña, alerón delantero a todo lo ancho y el airbox sobre la cabeza.", "Wedge nose, full-width front wing and the airbox over the driver's head.")],
  [1979, () => t("Efecto suelo: pontones como alas invertidas y faldones contra el asfalto.", "Ground effect: sidepods shaped as inverted wings, skirts sealing to the road.")],
  [1988, () => t("Turbos de más de 1.000 CV, fondo plano obligatorio desde 1983.", "Turbos over 1,000 hp, flat bottoms mandatory since 1983.")],
  [1992, () => t("Motores atmosféricos y el morro alto que cambió la aerodinámica.", "Atmospheric engines and the raised nose that changed aerodynamics.")],
  [2004, () => t("Vía estrecha de 1,8 m y neumáticos con surcos para frenar los coches.", "A 1.8 m narrow track and grooved tyres to slow the cars.")],
  [2012, () => t("Alerón delantero de 1,8 m, trasero estrecho y alto, y el morro escalonado.", "A 1.8 m front wing, a tall narrow rear wing and the stepped nose.")],
  [2015, () => t("La era híbrida: morros largos y bajos, ERS y 1,6 litros turbo.", "The hybrid era: long low noses, ERS and 1.6-litre turbos.")],
  [2019, () => t("Coches de 2 m de ancho, neumáticos anchos y el halo desde 2018.", "Cars 2 m wide, wide tyres and the halo since 2018.")],
  [2024, () => t("Vuelve el efecto suelo: llantas de 18\" con tapacubos y alerones sencillos.", "Ground effect returns: 18-inch wheels with covers and simple wings.")],
];

function EraGarage({ summary }) {
  const [index, setIndex] = useState(ERAS.length - 1);
  const [paused, setPaused] = useState(false);
  React.useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setIndex((value) => (value + 1) % ERAS.length), 5200);
    return () => clearInterval(id);
  }, [paused]);
  const [year, note] = ERAS[index];
  const color = summary?.color || "#10294f";
  const color2 = summary?.color2 || "#f2b705";
  return (
    <section className="mn-era-garage" aria-label={t("Los coches de cada época", "The cars of every era")} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mn-era-garage__stage">
        {/* One turntable for every era: only the car on it changes; a sweep of light covers the swap. */}
        <Livery color={color} color2={color2} width={560} height={300} year={year} name={summary?.teamName || "OverCut"} />
        <span className="mn-era-garage__wipe" key={year} aria-hidden="true" />
      </div>
      <div className="mn-era-garage__caption" key={`caption-${year}`}>
        <strong>{year}</strong>
        <p>{note()}</p>
      </div>
      <div className="mn-era-garage__years" role="tablist" aria-label={t("Época", "Era")}>
        {ERAS.map(([value], position) => (
          <button type="button" role="tab" key={value} aria-selected={position === index} className={position === index ? "is-active" : ""} onClick={() => { setIndex(position); setPaused(true); }}>
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}

function TeamStep({ world, ranked, teamId, onTeam, year }) {
  const team = teamId ? world.teams[teamId] : null;
  return (
    <section className="mn-step mn-step--team">
      <h2>{t(`Elige tu equipo de ${year}`, `Choose your ${year} team`)}</h2>
      <div className="mn-team-pick">
        <div className="mn-team-grid">
          {ranked.map((entry, index) => (
            <button type="button" key={entry.id} className={`mn-team-tile${teamId === entry.id ? " is-active" : ""}`} style={{ "--team": entry.color, "--i": index }} onClick={() => onTeam(entry.id)} aria-pressed={teamId === entry.id}>
              <span className="mn-team-tile__shine" aria-hidden="true" />
              <TeamBadge team={entry} size={40} />
              <strong>{entry.name}</strong>
              <span className="mn-stars" aria-label={`${stars(index + 1, ranked.length)}/5`}>
                {"★".repeat(stars(index + 1, ranked.length))}
                <i>{"★".repeat(5 - stars(index + 1, ranked.length))}</i>
              </span>
            </button>
          ))}
        </div>
        {team && <TeamPreview key={team.id} world={world} team={team} rank={ranked.findIndex((entry) => entry.id === team.id) + 1} total={ranked.length} year={year} />}
      </div>
    </section>
  );
}

function TeamPreview({ world, team, rank, total, year }) {
  const drivers = driversOf(world, team.id);
  const income = team.prestige;
  return (
    <aside className="mn-team-preview" style={{ "--team": team.color }}>
      <div className="mn-team-preview__head">
        <TeamBadge team={team} size={60} />
        <div>
          <h3>{team.name}</h3>
          <span>
            <Flag code={team.country} /> {t(`Coche ${rank}.º de ${total}`, `Car ${rank} of ${total}`)}
            {team.realPosition ? ` · ${t(`Acabó ${team.realPosition}.º`, `Really finished P${team.realPosition}`)}` : ""}
          </span>
        </div>
      </div>
      <div className="mn-team-preview__stage">
        <Livery color={team.color} color2={team.color2} width={380} height={220} year={year} name={team.name} teamRef={team.custom ? null : team.id} />
      </div>
      <div className="mn-car-bars">
        {AREAS.map((area, index) => {
          const best = fieldBestOf(Object.values(world.teams))[area] || 100;
          const value = team.car[area] ?? 60;
          return (
            <div key={area} className="mn-car-bar" style={{ "--i": index }}>
              <span>{AREA[area]()}</span>
              <i>
                <b style={{ width: `${Math.round((value / Math.max(1, best)) * 100)}%` }} />
              </i>
              <em>{Math.round(value)}</em>
            </div>
          );
        })}
      </div>
      <dl className="mn-facts mn-facts--tight">
        <div>
          <dt>{t("Coche", "Car")}</dt>
          <dd>
            <Rating value={carRatingOf(team.car)} />
          </dd>
        </div>
        <div>
          <dt>{t("Prestigio", "Prestige")}</dt>
          <dd>{Math.round(income * 100)}</dd>
        </div>
        <div>
          <dt>{t("Fábrica", "Factory")}</dt>
          <dd>{team.facility}/5</dd>
        </div>
      </dl>
      <h4>{t("Pilotos", "Drivers")}</h4>
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
    </aside>
  );
}

function BuilderStep({ custom, setCustom, engines, engineId, year, ranked }) {
  const set = (patch) => setCustom((current) => ({ ...current, ...patch }));
  const preview = { name: custom.name || "OverCut Racing", short: custom.short || shortCode(custom.name || "OverCut Racing"), color: custom.color, color2: custom.color2, custom: true };
  const randomise = () => {
    const pick = () => CUSTOM_COLORS[Math.floor(Math.random() * CUSTOM_COLORS.length)];
    let a = pick();
    let b = pick();
    while (b === a) b = pick();
    set({ color: a, color2: b });
  };
  const slowest = ranked.length ? carRatingOf(ranked[ranked.length - 1].car) : 60;
  return (
    <section className="mn-step mn-step--builder">
      <h2>{t("Crea tu equipo", "Build your team")}</h2>
      <div className="mn-builder">
        <div className="mn-builder__form">
          <label className="mn-field">
            <span>{t("Nombre del equipo", "Team name")}</span>
            <input className="mn-input" value={custom.name} maxLength={28} onChange={(event) => set({ name: event.target.value })} placeholder="OverCut Racing" />
          </label>
          <label className="mn-field mn-field--short">
            <span>{t("Abreviatura", "Short code")}</span>
            <input className="mn-input" value={custom.short} maxLength={3} onChange={(event) => set({ short: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder={shortCode(custom.name || "OverCut Racing")} />
          </label>
          <fieldset className="mn-field">
            <legend>{t("Colores", "Colours")}</legend>
            <div className="mn-swatches" role="radiogroup" aria-label={t("Color principal", "Main colour")}>
              {CUSTOM_COLORS.map((color) => (
                <button type="button" key={`a-${color}`} role="radio" aria-checked={custom.color === color} className={custom.color === color ? "is-active" : ""} style={{ background: color }} onClick={() => set({ color })} aria-label={color} />
              ))}
              <input type="color" value={custom.color} onChange={(event) => set({ color: event.target.value })} aria-label={t("Otro color principal", "Other main colour")} />
            </div>
            <div className="mn-swatches mn-swatches--small" role="radiogroup" aria-label={t("Color secundario", "Second colour")}>
              {CUSTOM_COLORS.map((color) => (
                <button type="button" key={`b-${color}`} role="radio" aria-checked={custom.color2 === color} className={custom.color2 === color ? "is-active" : ""} style={{ background: color }} onClick={() => set({ color2: color })} aria-label={color} />
              ))}
              <input type="color" value={custom.color2} onChange={(event) => set({ color2: event.target.value })} aria-label={t("Otro color secundario", "Other second colour")} />
              <button type="button" className="mn-btn mn-btn--ghost mn-btn--sm" onClick={randomise}>
                <LuShuffle aria-hidden="true" />
                {t("Al azar", "Random")}
              </button>
            </div>
          </fieldset>
          <div className="mn-field-row">
            <label className="mn-field">
              <span>{t("Nacionalidad", "Nationality")}</span>
              <select className="mn-input" value={custom.country} onChange={(event) => set({ country: event.target.value })}>
                {NATIONALITIES.map((nation) => (
                  <option key={nation.code} value={nation.code}>
                    {nation[locale] || nation.en}
                  </option>
                ))}
              </select>
            </label>
            <label className="mn-field">
              <span>{t("Sede", "Headquarters")}</span>
              <select className="mn-input" value={custom.hq} onChange={(event) => set({ hq: event.target.value })}>
                {HEADQUARTERS.map((hq) => (
                  <option key={hq.id} value={hq.id}>
                    {hq[locale] || hq.en}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mn-field">
            <legend>{t("Financiación", "Funding")}</legend>
            <div className="mn-backers">
              {Object.values(BACKERS).map((backer) => (
                <button type="button" key={backer.id} className={`mn-backer${custom.backer === backer.id ? " is-active" : ""}`} onClick={() => set({ backer: backer.id })} aria-pressed={custom.backer === backer.id}>
                  <strong>{BACKER[backer.id].name()}</strong>
                  <span>{BACKER[backer.id].copy()}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mn-field">
            <legend>{t(`Motor (${year})`, `Engine (${year})`)}</legend>
            <div className="mn-engines">
              {engines.map((engine) => (
                <button type="button" key={engine.id} className={`mn-engine${engineId === engine.id ? " is-active" : ""}`} onClick={() => set({ engineId: engine.id })} aria-pressed={engineId === engine.id}>
                  <Flag code={engine.country} width={16} />
                  <strong>{engine.name}</strong>
                  <span className={`mn-tier mn-tier--${engine.tier}`}>{TIER[engine.tier]()}</span>
                  <em>{money(engine.price * moneyScale(year))}/{t("año", "yr")}</em>
                </button>
              ))}
            </div>
            <p className="mn-hint">{t("El nivel de cada motor por época es una aproximación al historial, no una medición.", "Each engine's level by era is an approximation from the record books, not a measurement.")}</p>
          </fieldset>
        </div>
        <aside className="mn-builder__preview" style={{ "--team": custom.color }}>
          <TeamBadge team={preview} size={72} />
          <strong className="mn-builder__name" style={{ color: custom.color === "#111111" ? "#f3f1e9" : custom.color }}>
            {preview.name}
          </strong>
          <Livery color={custom.color} color2={custom.color2} width={360} height={220} year={year} name={custom.name} />
          <span className="mn-builder__tag" style={{ background: custom.color, color: inkOn(custom.color) }}>
            {preview.short}
          </span>
          <p className="mn-hint">
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
  return (
    <section className="mn-step mn-step--drivers">
      <h2>{t("Elige a tus dos pilotos", "Choose your two drivers")}</h2>
      <p>{t("Los libres y las promesas firman sin coste. Un piloto de otro equipo cuesta su cláusula y su equipo buscará sustituto.", "Free agents and prospects sign at no cost. A driver from another team costs his release fee and his team will find a replacement.")}</p>
      <div className="mn-chips">
        <button type="button" className={filter === "market" ? "is-active" : ""} onClick={() => setFilter("market")}>
          {t("Libres y promesas", "Free agents & prospects")}
        </button>
        <button type="button" className={filter === "grid" ? "is-active" : ""} onClick={() => setFilter("grid")}>
          {t(`Parrilla de ${year}`, `${year} grid`)}
        </button>
      </div>
      <p className="mn-picked">
        {t("Elegidos", "Picked")}: <b>{custom.driverIds.map((id) => world.drivers[id]?.name).join(" · ") || "—"}</b>
      </p>
      <div className="mn-driver-table" role="list">
        {pool.map((driver) => {
          const picked = custom.driverIds.includes(driver.id);
          const team = driver.teamId ? world.teams[driver.teamId] : null;
          return (
            <button type="button" role="listitem" key={driver.id} className={`mn-driver-row${picked ? " is-active" : ""}`} onClick={() => toggle(driver.id)} aria-pressed={picked}>
              <Rating value={driver.rating} size="sm" />
              <Flag code={driver.nat} width={16} />
              <span className="mn-driver-row__name">
                <strong>{driver.name}</strong>
                <small>
                  {driver.status === "junior" ? t("Promesa", "Prospect") : driver.status === "reserve" ? t("Reserva", "Reserve") : team ? team.name : t("Libre", "Free agent")} · {driver.age} {t("años", "yrs")}
                </small>
              </span>
              <em>{money(driverSalary(driver.rating, prestige, year))}</em>
              {team && <em className="mn-fee">+{money(driver.contract.salary * 0.8)}</em>}
              {picked && <LuCheck className="mn-tick" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ContractCard({ world, kind, teamId, custom, customName, year, name, engines, engineId }) {
  const team = kind === "real" ? world.teams[teamId] : { name: customName, short: custom.short || shortCode(customName), color: custom.color, color2: custom.color2, custom: true };
  if (!team) return null;
  const engine = engines.find((entry) => entry.id === engineId);
  return (
    <div className="mn-contract-sheet" style={{ "--team": team.color }}>
      <div className="mn-contract">
        <TeamBadge team={team} size={58} />
        <div>
          <small>{kind === "custom" ? t("Inscripción en el campeonato", "Championship entry") : t("Contrato de jefe de equipo", "Team principal contract")}</small>
          <strong>{team.name}</strong>
          <span>
            {name.trim() || "—"} · {year}
            {kind === "custom" && engine ? ` · ${t("Motor", "Engine")} ${engine.name} · ${BACKER[custom.backer].name()}` : ""}
          </span>
          {kind === "custom" && <span>{custom.driverIds.map((id) => world.drivers[id]?.name).join(" · ")}</span>}
        </div>
      </div>
      <div className="mn-contract__car">
        <Livery color={team.color} color2={team.color2} width={520} height={250} year={year} name={team.name} teamRef={team.custom ? null : team.id} />
      </div>
      <div className="mn-contract__sign">
        <span>{t("Firma", "Signature")}</span>
        {/* The name is written out as a signature as the player types it. */}
        <em key={name.trim()}>{name.trim() || " "}</em>
      </div>
    </div>
  );
}
