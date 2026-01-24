// src/modules/timeline/components/TimelineGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import LoadingScreen from "../../common/components/LoadingScreen";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import "./TimelineGame.css";

const fmtDate = (iso, lang) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
};

export default function TimelineGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = {
    es: {
      loading: "Cargando juego...",
      validate: "Validar orden",
      surrender: "Rendirse",
      back: "🏁 Volver al inicio",
      attempt: "Intento",
      correct: "✅ ¡Orden correcto!",
      notCorrect: "❌ Orden incorrecto",
      finished: "Partida terminada",
    },
    en: {
      loading: "Loading game...",
      validate: "Validate order",
      surrender: "Give up",
      back: "🏁 Back to home",
      attempt: "Attempt",
      correct: "✅ Correct order!",
      notCorrect: "❌ Wrong order",
      finished: "Game finished",
    },
  }[lang];

  const game = useSelector(selectors.getTimelineGame);
  const validation = useSelector(selectors.getTimelineValidation);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "Timeline")
  );

  const [showTutorial, setShowTutorial] = useState(true);
  const tutorial = tutorialTexts["/minigames/timeline"]?.[lang];

  // Orden local (lo que mueve el usuario)
  const [order, setOrder] = useState([]);

  // ✅ Persistimos qué eventos estuvieron correctos alguna vez
  // Guardamos por ID para que sobreviva a reordenaciones / rehidratar del backend
  const [lockedCorrectIds, setLockedCorrectIds] = useState(() => new Set());

  // --- Cooldown ---
  useEffect(() => {
    dispatch(fetchCooldown("Timeline"));
  }, [dispatch]);

  // --- Start game ---
  useEffect(() => {
    if (canPlay) dispatch(actions.startTimelineGame());
  }, [canPlay, dispatch]);

  // --- Inicializar orden SOLO al recibir nueva partida ---
  useEffect(() => {
    if (game?.events) {
      setOrder([...game.events]);
      // ✅ reset de locks al empezar partida nueva
      setLockedCorrectIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id]);

  // --- Si llega un update del backend (p.ej. rendirse), rehidratar items manteniendo orden ---
// --- Rehidratar items manteniendo orden ---
// Fuente de verdad:
// 1) validation.game.events (cuando finished=true tras validate, incluye date)
// 2) game.events (start normal, sin date)
useEffect(() => {
  const updatedEvents = validation?.game?.events || game?.events;
  if (!updatedEvents || order.length === 0) return;

  const byId = new Map(updatedEvents.map((e) => [e.id, e]));
  setOrder((prev) => prev.map((e) => byId.get(e.id) || e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [game?.events, validation?.game?.events]);


  const finished = Boolean(game?.finished || validation?.finished);

  // ✅ Cuando llega validación, “lockeamos” los que están bien en ese intento
  useEffect(() => {
    if (!validation?.correctPositions || !order?.length) return;

    setLockedCorrectIds((prev) => {
      const next = new Set(prev);
      validation.correctPositions.forEach((ok, idx) => {
        if (ok === true && order[idx]?.id != null) {
          next.add(order[idx].id);
        }
      });
      return next;
    });
  }, [validation?.correctPositions, order]);

  const move = (idx, dir) => {
    if (finished) return;
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;

    const copy = [...order];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    setOrder(copy);

    // ✅ Importante: NO borramos lockedCorrectIds
    // Solo quitamos el feedback de “última validación” para no confundir
    dispatch(actions.clearTimelineValidation?.() || { type: "noop" });
  };

  const onValidate = () => {
    if (!game) return;
    dispatch(
      actions.validateTimeline({
        gameId: game.id,
        orderedEventIds: order.map((e) => e.id),
      })
    );
  };

  const onSurrender = () => {
    if (!game) return;
    dispatch(actions.revealTimeline(game.id));
  };

  // --- UI states ---
  if (loading) return <LoadingScreen lang={lang} text={t.loading} />;

  if (!canPlay) {
    return (
      <CooldownScreen
        seconds={secondsRemaining}
        onBack={() => navigate("/minigames")}
      />
    );
  }

  if (showTutorial && tutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages(`./Timeline.png`)}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} text={t.loading} />;

  return (
    <div className="timeline-container">
      <h2 className="timeline-title">🕰️ Timeline</h2>

      <div className="timeline-meta">
        <span>
          {t.attempt}: <b>{validation?.attempts ?? game.attempts}</b> / 3
        </span>
      </div>

      <div className="timeline-list">
        {order.map((ev, idx) => {
          // feedback del último validate
          const posOk = validation?.correctPositions?.[idx];

          // ✅ persistente: estuvo correcto alguna vez
          const lockedOk = lockedCorrectIds.has(ev.id);

          // clase: si está lockeado, es ok aunque posOk no exista
          const klass =
            lockedOk ? "ok" : posOk === true ? "ok" : posOk === false ? "bad" : "";

          return (
            <div key={ev.id} className={`timeline-item ${klass}`}>
              <div className="timeline-item-main">
                <div className="timeline-text">
                  {ev.text}

                  {/* Fecha SOLO al finalizar */}
                  {finished && ev.date ? (
                    <span className="timeline-date">{fmtDate(ev.date, lang)}</span>
                  ) : null}
                </div>

                {!finished && (
                  <div className="timeline-move">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0}>
                      ↑
                    </button>
                    <button
                      onClick={() => move(idx, +1)}
                      disabled={idx === order.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="timeline-actions">
        {!finished ? (
          <>
            <button className="timeline-btn primary" onClick={onValidate}>
              {t.validate}
            </button>
            <button className="timeline-btn ghost" onClick={onSurrender}>
              {t.surrender}
            </button>
          </>
        ) : (
          <button className="timeline-btn primary" onClick={() => navigate("/minigames")}>
            {t.back}
          </button>
        )}
      </div>

      {validation?.allCorrect === true && <div className="timeline-msg ok">{t.correct}</div>}

      {validation?.allCorrect === false &&
        validation?.correctPositions &&
        !validation?.finished && <div className="timeline-msg bad">{t.notCorrect}</div>}

      {validation?.finished && validation?.allCorrect === false && (
        <div className="timeline-msg bad">{t.finished}</div>
      )}
    </div>
  );
}
