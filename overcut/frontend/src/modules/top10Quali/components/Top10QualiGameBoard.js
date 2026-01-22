import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  getTop10QualiBoard,
  getTop10QualiValidated,
  getTop10QualiRevealed
} from "../selectors";

import Top10QualiSlot from "./Top10QualiSlot";
import SearchPilotInput from "./SearchPilotInput";

import { top10QualiTranslations } from "../../../i18n/top10quali/translations";
import { Link } from "react-router-dom";

import "./Top10QualiGame.css";
import LoadingScreen from "../../common/components/LoadingScreen";

const Top10QualiGameBoard = () => {
  const board = useSelector(getTop10QualiBoard);
  const validated = useSelector(getTop10QualiValidated);
  const revealed = useSelector(getTop10QualiRevealed);

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = top10QualiTranslations[lang];

  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    if (!board) return;

    const filledCount = board.grid.filter(slot =>
      validated[slot.position] || slot.filledByPilotId
    ).length;

    if (filledCount === board.grid.length) setGameCompleted(true);
  }, [board, validated]);

  if (!board) return <LoadingScreen lang={lang} text={t.loading} />;

  return (
    <div className="grid-ranking-container">
      <h2 className="grid-ranking-title">
        <span className="grid-title-main">{t.title}</span>{" "}
        {board?.seasonYear && board?.raceName && (
          <span className="grid-title-season">
            {board.raceName} – {board.seasonYear} ({board.sessionUsed})
          </span>
        )}
      </h2>

      <div className="top10-single-column">
        {board.grid.map((slot) => {
          const slotValidated = validated[slot.position] ?? revealed[slot.position];

          return (
            <Top10QualiSlot
              key={slot.position}
              position={slot.position}
              nationalityCode={slotValidated?.nationalityCode ?? slot.nationalityCode}
              filledPilot={slotValidated?.pilotName ?? slot.filledByPilotId}
              qualiTime={slot.qualiTime}
            />
          );
        })}
      </div>

      {gameCompleted || Object.keys(revealed).length > 0 ? (
        <Link to="/minigames">
          <button className="back-button">{t.back}</button>
        </Link>
      ) : (
        <SearchPilotInput />
      )}
    </div>
  );
};

export default Top10QualiGameBoard;
