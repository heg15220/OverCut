// ============================
// Top10GamePage.jsx (UPDATED)
// ============================
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { createTop10Game, getTop10Board } from "../actions";
import Top10GameBoard from "./Top10GameBoard";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import LoadingScreen from "../../common/components/LoadingScreen";

import { getUser } from "../../users/selectors";

// ✅ ADS
import AdWindows, { AdInline } from "../../../ads/AdWindows";

const Top10GamePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/top10"][lang];

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "Top10Game")
  );

  // (Consistencia / futuro tracking)
  const user = useSelector(getUser);

  useEffect(() => {
    dispatch(fetchCooldown("Top10Game"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) {
      dispatch(
        createTop10Game(
          lang,
          (gameId) => {
            dispatch(getTop10Board(gameId, () => {}, () => {}));
          },
          () => {}
        )
      );
    }
  }, [canPlay, dispatch, lang]);

  if (loading) {
    return (
      <LoadingScreen
        lang={lang}
        text={lang === "es" ? "Cargando..." : "Loading..."}
      />
    );
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
        image={sourceImages("./top10.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  return (
    <AdWindows placeholders={true} enableTabletSide={false} showBottomOnDesktop={false}>
      <div className="top10-game-body">
        <Top10GameBoard />
      </div>
    </AdWindows>
  );
};

export default Top10GamePage;
