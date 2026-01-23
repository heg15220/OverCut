// src/modules/lightsout/components/LightsOutGame.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LightsOutGame.css";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ✅ 5 luces. Estados:
// - "off"  -> apagada
// - "on"   -> encendida (roja)
const LIGHTS_COUNT = 5;

// Tiempos (ms)
const STEP_MS = 520; // ritmo de encendido de cada luz
const RANDOM_WAIT_MIN = 800; // espera aleatoria mínima antes del GO
const RANDOM_WAIT_MAX = 2600; // espera aleatoria máxima antes del GO

const LS_BEST_KEY = "overcut_lightsout_best_ms_v1";

export default function LightsOutGame() {
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  // ✅ Tutorial (igual patrón que Tower)
  const [showTutorial, setShowTutorial] = useState(true);

  const t = useMemo(() => {
    return {
      title: "Lights Out",
      subtitle:
        lang === "es"
          ? "Pulsa lo más rápido posible cuando se apague el último semáforo."
          : "Tap as fast as possible when the last light goes out.",
      start: lang === "es" ? "Empezar" : "Start",
      reset: lang === "es" ? "Reiniciar" : "Reset",
      tap: lang === "es" ? "Pulsar" : "Tap",
      wait: lang === "es" ? "Espera..." : "Wait...",
      tooSoon: lang === "es" ? "❌ Salida falsa" : "❌ False start",
      yourTime: lang === "es" ? "Tu tiempo" : "Your time",
      best: lang === "es" ? "Mejor" : "Best",
      ms: "ms",
      retry: lang === "es" ? "Reintentar" : "Retry",
      ready: lang === "es" ? "Preparado..." : "Get ready...",
      go: lang === "es" ? "¡YA!" : "GO!",
      back: lang === "es" ? "Volver" : "Back",
    };
  }, [lang]);

  const [phase, setPhase] = useState("idle");
  // phases: idle | counting | armed | go | finished | false

  const [lights, setLights] = useState(Array(LIGHTS_COUNT).fill("off"));
  const [resultMs, setResultMs] = useState(null);

  const bestMs = useMemo(() => {
    const v = localStorage.getItem(LS_BEST_KEY);
    const n = v ? Number(v) : null;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [resultMs]); // refresca tras guardar

  const timeoutsRef = useRef([]);
  const goAtRef = useRef(null);
  const perfNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const clearTimers = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const reset = () => {
    clearTimers();
    goAtRef.current = null;
    setLights(Array(LIGHTS_COUNT).fill("off"));
    setResultMs(null);
    setPhase("idle");
  };

  const start = () => {
    reset();
    setPhase("counting");

    // 1) encendemos 1..5 en secuencia
    for (let i = 0; i < LIGHTS_COUNT; i++) {
      const id = setTimeout(() => {
        setLights((prev) => {
          const next = [...prev];
          next[i] = "on";
          return next;
        });

        // cuando se enciende la última, pasamos a "armed"
        if (i === LIGHTS_COUNT - 1) {
          setPhase("armed");

          // 2) espera aleatoria antes de apagar TODO (GO)
          const wait = randInt(RANDOM_WAIT_MIN, RANDOM_WAIT_MAX);
          const id2 = setTimeout(() => {
            setLights(Array(LIGHTS_COUNT).fill("off"));
            goAtRef.current = perfNow();
            setPhase("go");
          }, wait);

          timeoutsRef.current.push(id2);
        }
      }, (i + 1) * STEP_MS);

      timeoutsRef.current.push(id);
    }
  };

  const onTap = () => {
    // si no ha empezado
    if (phase === "idle") return;

    // si aún no es GO -> false start
    if (phase === "counting" || phase === "armed") {
      clearTimers();
      goAtRef.current = null;
      setPhase("false");
      return;
    }

    // si ya hubo resultado
    if (phase === "finished" || phase === "false") return;

    // GO: medimos
    if (phase === "go") {
      const goAt = goAtRef.current;
      if (!goAt) return;

      const ms = Math.max(0, Math.round(perfNow() - goAt));
      setResultMs(ms);
      setPhase("finished");

      // guardar best local
      const currentBest = localStorage.getItem(LS_BEST_KEY);
      const best = currentBest ? Number(currentBest) : null;
      if (!best || ms < best) {
        localStorage.setItem(LS_BEST_KEY, String(ms));
      }
    }
  };

  const statusText = useMemo(() => {
    if (phase === "idle") return t.subtitle;
    if (phase === "counting") return t.ready;
    if (phase === "armed") return t.wait;
    if (phase === "go") return t.go;
    if (phase === "false") return t.tooSoon;
    if (phase === "finished") return `${t.yourTime}: ${resultMs} ${t.ms}`;
    return "";
  }, [phase, resultMs, t]);

  // ========= Tutorial =========
  if (showTutorial) {
    const tutorial =
      tutorialTexts["/minigames/lightsout"]?.[lang] || {
        title: "Lights Out",
        description:
          lang === "es"
            ? "Observa el semáforo de 5 luces. Se encenderán una a una y, tras una espera aleatoria, se apagarán todas. Pulsa lo más rápido posible cuando se apaguen. Si pulsas antes, es salida falsa."
            : "Watch the 5-light traffic system. Lights will turn on one by one and, after a random delay, they will all go out. Tap as fast as you can when they go out. If you tap early, it’s a false start.",
      };

    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages(`./LightsOut.png`)}
        onStart={() => {
          setShowTutorial(false);
          reset(); // dejamos el juego listo en idle
        }}
        lang={lang}
        // ✅ si tu componente MinigameTutorial soporta "onBack", úsalo
        // si NO lo soporta, simplemente ignora esta prop
        onBack={() => navigate("/minigames")}
        backLabel={t.back}
      />
    );
  }

  return (
    <div className="lo-page">
      <div className="lo-container">
        <header className="lo-header">
          <div>
            <h1 className="lo-title">{t.title}</h1>
            <p className="lo-subtitle">{statusText}</p>
          </div>

          <div className="lo-actions">
            {/* ✅ volver */}
            <button
              className="lo-btn lo-btn--back"
              type="button"
              onClick={() => navigate("/minigames")}
            >
              {t.back}
            </button>

            {phase === "idle" ? (
              <button className="lo-btn lo-btn--start" onClick={start} type="button">
                {t.start}
              </button>
            ) : (
              <button className="lo-btn lo-btn--reset" onClick={reset} type="button">
                {t.reset}
              </button>
            )}
          </div>
        </header>

        <div className="lo-card">
          <div className="lo-lights" aria-label="traffic-lights">
            {lights.map((s, idx) => (
              <div key={idx} className={["lo-light", s === "on" ? "is-on" : ""].join(" ")} />
            ))}
          </div>

          <div className="lo-metrics">
            <div className="lo-metric">
              <span className="lo-metricLabel">{t.best}</span>
              <span className="lo-metricValue">{bestMs ? `${bestMs} ${t.ms}` : "—"}</span>
            </div>

            <div className="lo-metric">
              <span className="lo-metricLabel">{t.yourTime}</span>
              <span className="lo-metricValue">
                {resultMs != null ? `${resultMs} ${t.ms}` : "—"}
              </span>
            </div>
          </div>

          <button
            className="lo-tap"
            type="button"
            onClick={onTap}
            disabled={phase === "idle" || phase === "finished" || phase === "false"}
          >
            {t.tap}
          </button>

          {(phase === "false" || phase === "finished") && (
            <button className="lo-btn lo-btn--retry" onClick={start} type="button">
              {t.retry}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
