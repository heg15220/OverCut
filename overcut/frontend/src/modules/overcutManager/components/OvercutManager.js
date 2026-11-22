/**
 * OverCut Mánager - run a Formula 1 team, from the pit wall to the factory.
 *
 * The counterpart of the GameLock football manager, rebuilt around what a team
 * principal actually does: develop a car, sign drivers, call the strategy on
 * Sunday and answer to a board. Pick any real season from 1950, take over one of
 * its teams, or build your own from nothing and add it to that year's grid.
 *
 * This component is only the shell: it loads the f1db bootstrap (the same one
 * Trayectoria uses, with its offline fallback) and the reference tables, holds
 * the career in a ref, saves it, and decides which screen is on. Every rule is
 * in `../engine`, plain JavaScript a test can drive without React.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { config } from "../../../config/constants";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { prepareBootstrap } from "../../overcutTrayectoria/engine/world";
import { closeWeekend, createCareer, createContext, nextAction, openOffseason, simulateWeekend, startWeekend } from "../engine/career";
import { acceptJob, startNextSeason } from "../engine/offseason";
import { loadSeasonPack, seasonPackYears } from "../engine/packs/seasonPacks";
import { unreadCount } from "../engine/inbox";
import { deleteLocal, loadLocal, loadLocalSummary, saveLocal } from "../engine/save";
import { ManagerContext } from "./context";
import Setup from "./Setup";
import Hub from "./Hub";
import { t } from "./texts";
import "./OvercutManager.css";

const loadBootstrap = async () => {
  try {
    const response = await fetch(`${config.BASE_PATH}/overcutTrayectoria/bootstrap`);
    if (!response.ok) throw new Error(`bootstrap ${response.status}`);
    return prepareBootstrap(await response.json(), { fallbackMode: false });
  } catch {
    // Playable offline: one real season per decade ships in the bundle.
    return prepareBootstrap(fallbackBootstrap, { fallbackMode: true });
  }
};

const loadReference = () => import("../data/reference").then((module) => module.reference || module.default);

/**
 * Every validated season pack, by year (RF-CAR-02). A pack that fails its
 * schema or its era rules is left out, so that season falls back to the
 * bootstrap world instead of starting from bad data.
 */
const loadPacks = () =>
  Promise.all(
    seasonPackYears().map((year) =>
      loadSeasonPack(year).then(
        ({ pack }) => [year, pack],
        (failure) => {
          // eslint-disable-next-line no-console
          console.warn(String(failure?.message || failure));
          return null;
        },
      ),
    ),
  ).then((rows) => Object.fromEntries(rows.filter(Boolean)));

/** Stops from the engine -> the moments the player sees, in order. */
export const momentsFromStops = (career, stops = []) => {
  const list = [];
  stops.forEach((stop) => {
    if (stop.kind === "season-review") {
      list.push({ type: "review" });
      return;
    }
    const item = career.inbox.find((entry) => entry.id === stop.id);
    if (!item) return;
    if (item.kind === "event") list.push({ type: "event", inboxId: item.id });
    else list.push({ type: "notice", inboxId: item.id });
  });
  if (career.ended) list.push({ type: "ended" });
  return list;
};

/**
 * The site's bottom advert sits fixed over the page. Measure it and publish its
 * height as --mn-ad-space, so the full-screen weekend and the sticky controls
 * end above it instead of underneath.
 */
const useAdSpace = () => {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const measure = () => {
      const bar = document.querySelector(".overcut-ad-layout__mobile-bottom");
      let space = 0;
      if (bar) {
        const style = window.getComputedStyle(bar);
        const rect = bar.getBoundingClientRect();
        if (style.display !== "none" && style.position === "fixed" && rect.height > 0) space = Math.ceil(window.innerHeight - rect.top + 6);
      }
      root.style.setProperty("--mn-ad-space", `${Math.max(0, space)}px`);
    };
    measure();
    const bar = document.querySelector(".overcut-ad-layout__mobile-bottom");
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (bar && observer) observer.observe(bar);
    window.addEventListener("resize", measure);
    const late = setTimeout(measure, 1500);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(late);
      root.style.removeProperty("--mn-ad-space");
    };
  }, []);
};

export const OvercutManager = ({ backTo = "/careerMode" }) => {
  useAdSpace();
  const [ready, setReady] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const contextRef = useRef(null);
  const careerRef = useRef(null);
  const [version, setVersion] = useState(0);
  const [screen, setScreen] = useState("setup");
  const [summary, setSummary] = useState(() => loadLocalSummary());
  const [section, setSection] = useState({ id: "central", params: {} });
  const [sheet, setSheet] = useState(null);
  const [moments, setMoments] = useState([]);
  const [weekendOpen, setWeekendOpen] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [error, setError] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadBootstrap(), loadReference(), loadPacks()]).then(([bootstrap, reference, packs]) => {
      if (!active) return;
      contextRef.current = createContext(bootstrap, reference, packs);
      setFallbackMode(Boolean(bootstrap.fallbackMode));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const bump = useCallback(() => setVersion((value) => value + 1), []);

  const persist = useCallback(() => {
    clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => {
      if (!careerRef.current) return;
      setSaveState(saveLocal(careerRef.current) ? "saved" : "failed");
    }, 500);
  }, []);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden" && careerRef.current) saveLocal(careerRef.current);
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      clearTimeout(saveTimer.current);
    };
  }, []);

  /** Run a change on the career, then re-render and save. */
  const act = useCallback(
    (fn) => {
      const career = careerRef.current;
      if (!career) return undefined;
      const result = fn(career);
      career.version = (career.version || 0) + 1;
      bump();
      persist();
      return result;
    },
    [bump, persist],
  );

  const go = useCallback((id, params = {}) => {
    setSection({ id, params });
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const pushMoments = useCallback((list) => {
    if (list.length) setMoments((current) => [...current, ...list]);
  }, []);

  const enterCareer = useCallback(
    (career, welcome = true) => {
      careerRef.current = career;
      setScreen("hub");
      setSection({ id: "central", params: {} });
      setSheet(null);
      setWeekendOpen(false);
      setMoments(welcome ? [{ type: "welcome" }] : career.ended ? [{ type: "ended" }] : []);
      bump();
      persist();
    },
    [bump, persist],
  );

  const start = useCallback(
    (options) => {
      try {
        enterCareer(createCareer(contextRef.current, options));
      } catch (failure) {
        setError(String(failure?.message || failure));
      }
    },
    [enterCareer],
  );

  const resume = useCallback(() => {
    const career = loadLocal();
    if (!career) {
      setError("load");
      return;
    }
    enterCareer(career, false);
  }, [enterCareer]);

  const leave = useCallback(() => {
    if (careerRef.current) saveLocal(careerRef.current);
    careerRef.current = null;
    setScreen("setup");
    setMoments([]);
    setWeekendOpen(false);
    setSummary(loadLocalSummary());
  }, []);

  const removeSave = useCallback(() => {
    deleteLocal();
    setSummary(null);
  }, []);

  /** Close the weekend and show whatever it left on the desk. */
  const finishWeekend = useCallback(() => {
    const career = careerRef.current;
    if (!career) return;
    const { stops } = closeWeekend(career);
    setWeekendOpen(false);
    pushMoments(momentsFromStops(career, stops));
    bump();
    persist();
  }, [bump, persist, pushMoments]);

  /** Simulate the next weekend without opening it. */
  const quickWeekend = useCallback(() => {
    const career = careerRef.current;
    if (!career || career.ended) return;
    simulateWeekend(career);
    finishWeekend();
  }, [finishWeekend]);

  /** The Continue button: whatever comes next in the season. */
  const advance = useCallback(() => {
    const career = careerRef.current;
    if (!career) return;
    const action = nextAction(career);
    if (action.kind === "race") {
      act((c) => startWeekend(c));
      setWeekendOpen(true);
    } else if (action.kind === "review") {
      pushMoments([{ type: "review" }]);
    } else if (action.kind === "new-season") {
      act((c) => startNextSeason(contextRef.current, c));
      pushMoments([{ type: "new-season" }]);
      go("central");
    } else if (action.kind === "ended") {
      pushMoments([{ type: "ended" }]);
    }
  }, [act, go, pushMoments]);

  const toOffseason = useCallback(() => act((c) => openOffseason(c)), [act]);

  const takeJob = useCallback(
    (teamId) => {
      act((c) => (c.ended ? acceptJob(contextRef.current, c, teamId, { simulateWeekend, closeWeekend }) : startNextSeason(contextRef.current, c, { teamId })));
      setMoments([{ type: "new-season" }]);
      go("central");
    },
    [act, go],
  );

  const career = careerRef.current;
  const value = useMemo(
    () => ({
      career,
      version,
      engine: contextRef.current,
      act,
      bump,
      persist,
      go,
      section,
      sheet,
      setSheet,
      moments,
      setMoments,
      pushMoments,
      weekendOpen,
      setWeekendOpen,
      finishWeekend,
      quickWeekend,
      advance,
      toOffseason,
      takeJob,
      leave,
      saveState,
      unread: career ? unreadCount(career) : 0,
      enterCareer,
    }),
    [career, version, act, bump, persist, go, section, sheet, moments, pushMoments, weekendOpen, finishWeekend, quickWeekend, advance, toOffseason, takeJob, leave, saveState, enterCareer],
  );

  if (!ready) {
    return (
      <main className="mn-root mn-root--loading">
        <div className="mn-cut" aria-hidden="true" />
        <p className="mn-loading">{t("Cargando la historia de la Fórmula 1", "Loading Formula 1 history")}</p>
      </main>
    );
  }

  const team = career?.world.teams[career.teamId];
  return (
    <ManagerContext.Provider value={value}>
      <main className={`mn-root mn-root--${screen}`} style={team ? { "--team": team.color, "--team2": team.color2 } : undefined} data-testid="manager-root">
        <div className="mn-cut" aria-hidden="true" />
        {screen === "setup" || !career ? (
          <Setup
            backTo={backTo}
            engine={contextRef.current}
            summary={summary}
            fallbackMode={fallbackMode}
            onStart={start}
            onResume={resume}
            onDelete={removeSave}
            onImported={(imported) => enterCareer(imported, false)}
          />
        ) : (
          <Hub backTo={backTo} fallbackMode={fallbackMode} />
        )}
        {error && (
          <div className="mn-toast mn-toast--bad" role="alert">
            <span>{error === "load" ? t("No se pudo cargar la partida guardada.", "The saved career could not be loaded.") : t("Algo ha fallado al crear la partida.", "Something went wrong creating the career.")}</span>
            <button type="button" onClick={() => setError(null)}>
              OK
            </button>
          </div>
        )}
      </main>
    </ManagerContext.Provider>
  );
};

export default OvercutManager;
