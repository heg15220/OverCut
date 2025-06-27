import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createTop10Game, getTop10Board } from "../actions";
import Top10GameBoard from "./Top10GameBoard";
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { useSelector } from "react-redux";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getUser } from "../../users/selectors";
import { useNavigate } from "react-router-dom";

const Top10GamePage = () => {
    const dispatch = useDispatch();
    const lang = navigator.language.startsWith("es") ? "es" : "en";

    const [showTutorial, setShowTutorial] = useState(true);

    const tutorial = tutorialTexts["/minigames/top10"][lang];

    const { canPlay, secondsRemaining } = useSelector(state =>
      getCooldownForGame(state, "Top10Game")
    );
    const user = useSelector(getUser);
    const navigate = useNavigate();

    useEffect(() => {
      dispatch(fetchCooldown("Top10Game"));
    }, [dispatch]);

    useEffect(() => {
      if (canPlay) {
        dispatch(createTop10Game(lang, gameId => {
          dispatch(getTop10Board(gameId, () => {}, () => {}));
        }, () => {}));
      }
    }, [canPlay, dispatch, lang]);

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
        <div className="top10-game-body">
            <Top10GameBoard />
        </div>
    );
};

export default Top10GamePage;
