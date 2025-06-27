import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createGridGame, getGridGameBoard } from "../actions";
import GridGameBoard from "./GridGameBoard";
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoadingScreen from '../../common/components/LoadingScreen';


const GridGamePage = () => {
    const dispatch = useDispatch();
    const [lang] = useState(navigator.language.startsWith("es") ? "es" : "en");
    const [showTutorial, setShowTutorial] = useState(true);
    const navigate = useNavigate();
    const tutorial = tutorialTexts["/minigames/gridgame"][lang];
    const { canPlay, secondsRemaining, loading } = useSelector(state =>
      getCooldownForGame(state, "GridGame")
    );

    const user = useSelector(getUser);


    useEffect(() => {
      dispatch(fetchCooldown("GridGame"));
    }, [dispatch]);

    useEffect(() => {
      if (canPlay) {
        dispatch(createGridGame(gameId => {
          dispatch(getGridGameBoard(gameId, () => {}, () => {}));
        }, () => {}));
      }
    }, [canPlay, dispatch]);


    if (loading) {
      return <LoadingScreen lang={lang} text={lang === 'es' ? 'Cargando...' : 'Loading...'} />;
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
          image={sourceImages("./F1Grid.png")}
          onStart={() => setShowTutorial(false)}
          lang={lang}
        />
      );
    }

    return (
        <div className="grid-game-body">
            <GridGameBoard />
        </div>
    );
};

export default GridGamePage;

