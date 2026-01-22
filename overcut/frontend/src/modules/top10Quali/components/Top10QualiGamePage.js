import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { createTop10QualiGame, getTop10QualiBoard } from "../actions";
import Top10QualiGameBoard from "./Top10QualiGameBoard";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import LoadingScreen from "../../common/components/LoadingScreen";

const Top10QualiGamePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/top10quali"][lang];

  const { canPlay, secondsRemaining, loading } = useSelector(state =>
    getCooldownForGame(state, "Top10QualiGame")
  );

  useEffect(() => {
    dispatch(fetchCooldown("Top10QualiGame"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) {
      dispatch(createTop10QualiGame(lang, (gameId) => {
        dispatch(getTop10QualiBoard(gameId, () => {}, () => {}));
      }, () => {}));
    }
  }, [canPlay, dispatch, lang]);

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
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages(`./top10quali.png`)}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  return (
    <div className="top10-game-body">
      <Top10QualiGameBoard />
    </div>
  );
};

export default Top10QualiGamePage;
