import React from "react";
import { useSelector } from "react-redux";
import { getTop10Board, getTop10Validated, getTop10Revealed } from "../selectors";
import Top10Slot from "./Top10Slot";
import SearchPilotInput from "./SearchPilotInput";
import { top10Translations } from "../../../i18n/top10game/translations";
import { Link } from "react-router-dom";
import "./Top10Game.css";
import LoadingScreen from '../../common/components/LoadingScreen';

import AdPlaceholder from '../../common/components/AdPlaceholder';
import AdFloatingBottom from '../../common/components/AdFloatingBottom';

const Top10GameBoard = () => {
  const board = useSelector(getTop10Board);
  const validated = useSelector(getTop10Validated);
  const revealed = useSelector(getTop10Revealed);
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = top10Translations[lang];

  if (!board) return <LoadingScreen lang={lang} text={t.loading} />;

  return (
    <div className="grid-ranking-container">
            <AdPlaceholder position="left" />
              <AdPlaceholder position="right" />
              <AdFloatingBottom />
      <h2 className="grid-ranking-title">
        <span className="grid-title-main">{t.title}</span>{" "}
        {board?.seasonYear && board?.raceName && (
          <span className="grid-title-season">
            {board.raceName} – {board.seasonYear}
          </span>
        )}
      </h2>

      <div className="top10-single-column">
        {board.grid.map((slot) => {
          const slotValidated = validated[slot.position] ?? revealed[slot.position];
          return (
            <Top10Slot
              key={slot.position}
              position={slot.position}
              nationalityCode={slotValidated?.nationalityCode ?? slot.nationalityCode}
              filledPilot={slotValidated?.pilotName ?? slot.filledByPilotId}
            />
          );
        })}
      </div>

      {Object.keys(revealed).length === 0 ? (
        <SearchPilotInput />
      ) : (
        <Link to="/minigames">
          <button className="back-button">{t.back}</button>
        </Link>
      )}
    </div>
  );
};

export default Top10GameBoard;
