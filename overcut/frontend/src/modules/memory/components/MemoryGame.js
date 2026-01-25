// src/modules/memory/components/MemoryGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import LoadingScreen from "../../common/components/LoadingScreen";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";

import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";

import "./MemoryGame.css";

export default function MemoryGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const tutorial = tutorialTexts["/minigames/memory"]?.[lang];

  const game = useSelector(selectors.getMemoryGame);

  // ✅ MISMO PATRÓN que DriversConnectionsGame (selector con (state, gameType))
  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "Memory")
  );

  const [showTutorial, setShowTutorial] = useState(true);

  const [flipped, setFlipped] = useState([]); // ids (max 2)
  const [lock, setLock] = useState(false);

  const rows = game?.rows ?? 4;
  const cols = game?.cols ?? 4;

  const cardsByPos = useMemo(() => {
    if (!game) return [];
    return [...game.cards].sort((a, b) => a.positionIndex - b.positionIndex);
  }, [game]);

  useEffect(() => {
    dispatch(fetchCooldown("Memory"));
  }, [dispatch]);

  useEffect(() => {
    // ✅ Generar partida SOLO cuando el tutorial ya no se muestra
    if (!showTutorial && canPlay && !game) {
      dispatch(actions.startMemoryGame(4, 4, "classic"));
    }
  }, [showTutorial, canPlay, game, dispatch]);


  useEffect(() => {
    // Si termina, bloquea clicks (y evita seguir validando)
    if (game?.finished) setLock(true);
  }, [game?.finished]);

  const onCardClick = (card) => {
    if (!game || lock) return;
    if (card.matched) return;
    if (flipped.includes(card.id)) return;
    if (flipped.length >= 2) return;

    const next = [...flipped, card.id];
    setFlipped(next);

    if (next.length === 2) {
      setLock(true);
      dispatch(actions.validateMemoryPair(game.id, next[0], next[1]));

      // Oculta si no es match (si es match da igual, quedarán marcadas como matched)
      setTimeout(() => {
        setFlipped([]);
        if (!game?.finished) setLock(false);
      }, 850);
    }
  };

  // ✅ mismo flujo que DriversConnections
  if (loading) {
    return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando..." : "Loading..."} />;
  }

  if (!canPlay) {
    return (
      <CooldownScreen
        seconds={secondsRemaining}
        onBack={() => navigate("/minigames")}
      />
    );
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial?.title}
        description={tutorial?.description}
        image={sourceImages("./Memory.png")} // pon aquí el asset que tengas (o null)
        onStart={() => {
          setShowTutorial(false);
          setFlipped([]);
          setLock(false);
          dispatch(actions.resetMemory()); // por si había algo viejo
        }}
        lang={lang}
      />
    );
  }

  if (!game) {
    return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando juego..." : "Loading game..."} />;
  }

  return (
    <div className="memory-page">
      <div className="memory-topbar">
        <div className="memory-stat">
          <span className="memory-pill" />
          <span className="memory-label">{lang === "es" ? "Intentos" : "Attempts"}</span>
          <span className="memory-value">{game.attemptsLeft}</span>
        </div>

        {game.finished && (
          <button
            className="memory-btn secondary"
            onClick={() => navigate("/minigames")}
            type="button"
          >
            {lang === "es" ? "🏁 Volver al inicio" : "🏁 Back to home"}
          </button>
        )}
      </div>


      <div
        className="memory-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cardsByPos.map((c) => {
          const isFlipped = flipped.includes(c.id) || c.matched;
          return (
            <button
              key={c.id}
              className={`memory-card ${isFlipped ? "is-flipped" : ""} ${c.matched ? "is-matched" : ""}`}
              onClick={() => onCardClick(c)}
              type="button"
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">
                  <span className="memory-q">?</span>
                </div>
                <div className="memory-card-back">
                  <div className="memory-type">{c.cardType}</div>
                  <div className="memory-text">{c.label}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
