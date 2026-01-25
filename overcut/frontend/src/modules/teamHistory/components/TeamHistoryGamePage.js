// src/modules/teamHistory/components/TeamHistoryGamePage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import { getTeamHistoryGame } from "../selectors";

import LoadingScreen from "../../common/components/LoadingScreen";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";

import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";

import TeamHistoryGameBoard from "./TeamHistoryGameBoard";
import "./TeamHistoryGame.css";

const getLang = () => (navigator.language?.startsWith("es") ? "es" : "en");

export default function TeamHistoryGamePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = getLang();

  const [showTutorial, setShowTutorial] = useState(true);
  const game = useSelector(getTeamHistoryGame);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "TeamHistoryGame")
  );

  const tutorial = tutorialTexts["/minigames/teamHistory"]?.[lang] || {
    title: lang === "es" ? "Historia de Equipo" : "Team History",
    description:
      lang === "es"
        ? "Adivina la posición final del equipo en el campeonato de constructores para cada temporada."
        : "Guess the team’s final Constructors’ Championship position for each season."
  };

  useEffect(() => {
    dispatch(fetchCooldown("TeamHistoryGame"));
  }, [dispatch]);

  useEffect(() => {
    if (!canPlay) return;
    if (game?.gameId) return;
    dispatch(actions.startTeamHistoryGame(lang, () => {}, () => {}));
  }, [canPlay, dispatch, lang, game?.gameId]);

  const handleNewGame = () => {
    dispatch(actions.clearTeamHistory());
    dispatch(fetchCooldown("TeamHistoryGame", () => {
      dispatch(actions.startTeamHistoryGame(lang, () => {}, () => {}));
    }));
  };

  if (loading) return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando..." : "Loading..."} />;

  if (!canPlay) {
    return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages(`./TeamHistory.png`)}
        onStart={() => {
          setShowTutorial(false);
          dispatch(actions.clearTeamHistory());
          dispatch(actions.startTeamHistoryGame(lang, () => {}, () => {}));
        }}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando juego..." : "Loading game..."} />;

  return (
    <div className="team-history-page">
      <TeamHistoryGameBoard onNewGame={handleNewGame} />
    </div>
  );
}
