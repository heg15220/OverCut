import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createGridGame, getGridGameBoard } from "../actions";
import GridGameBoard from "./GridGameBoard";
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego

const GridGamePage = () => {
    const dispatch = useDispatch();
    const [lang] = useState(navigator.language.startsWith("es") ? "es" : "en");
    const [showTutorial, setShowTutorial] = useState(true);

    const tutorial = tutorialTexts["/minigames/gridgame"][lang];

    useEffect(() => {
        dispatch(createGridGame(gameId => {
            dispatch(getGridGameBoard(gameId, () => {}, () => {}));
        }, () => {}));
    }, [dispatch]);

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

