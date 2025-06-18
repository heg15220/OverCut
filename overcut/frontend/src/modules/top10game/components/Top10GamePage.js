import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createTop10Game, getTop10Board } from "../actions";
import Top10GameBoard from "./Top10GameBoard";
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego

const Top10GamePage = () => {
    const dispatch = useDispatch();
    const lang = navigator.language.startsWith("es") ? "es" : "en";

    const [showTutorial, setShowTutorial] = useState(true);

    const tutorial = tutorialTexts["/minigames/top10"][lang];

    useEffect(() => {
        dispatch(createTop10Game(lang, gameId => {
            dispatch(getTop10Board(gameId, () => {}, () => {}));
        }, () => {}));
    }, [dispatch, lang]); // ⬅️ Añadir lang como dependencia por seguridad

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
