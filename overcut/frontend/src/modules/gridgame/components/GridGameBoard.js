import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import { getGridBoard, getValidatedSlots, getRevealedSlots } from "../selectors";
import GridSlot from "./GridSlot";
import { gridGameTranslations } from "../../../i18n/gamegrid/translations";
import "./GridGame.css";
import SearchPilotInput from "./SearchPilotInput";
import LoadingScreen from '../../common/components/LoadingScreen';

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const GridGameBoard = () => {
  const board = useSelector(getGridBoard);
  const validated = useSelector(getValidatedSlots);
  const revealed = useSelector(getRevealedSlots);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [gameCompleted, setGameCompleted] = useState(false);
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = gridGameTranslations[lang];
  const windowWidth = useWindowWidth();

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  useEffect(() => {
    if (!board) return;
    const filledCount = board.grid.filter(slot =>
      validated[slot.position] || slot.filledByPilotId
    ).length;
    if (filledCount === board.grid.length) {
      setGameCompleted(true);
    }
  }, [board, validated]);

  if (!board) return <LoadingScreen lang={lang} text={t.loading} />;

  const getColumns = (grid, numCols) =>
    Array.from({ length: numCols }, (_, i) =>
      grid.slice(
        Math.floor((i * grid.length) / numCols),
        Math.floor(((i + 1) * grid.length) / numCols)
      )
    );

  // ✅ En desktop, máx 4 columnas
  const numColumnsDesktop = board.grid.length > 21 ? 4 : 3;
  const columnsDesktop = getColumns(board.grid, numColumnsDesktop);


  // ✅ Para tablet, forzamos a máx. 2 columnas
  const columnsTablet = getColumns(board.grid, 2);

  return (
    <div className="grid-ranking-container">
      <h2 className="grid-ranking-title">
        <span className="grid-title-main">{t.title}</span>{" "}
        {board?.seasonYear && (
          <span className="grid-title-season">{t.season} {board.seasonYear}</span>
        )}
      </h2>

      {isMobile ? (
        <div className="grid-game-grid-mobile">
          {board.grid.map(slot => {
            const slotValidated = validated[slot.position] ?? revealed[slot.position];
            return (
              <GridSlot
                key={slot.position}
                position={slot.position}
                nationalityCode={slotValidated?.nationalityCode ?? slot.nationalityCode}
                filledPilot={slotValidated?.pilotName ?? slot.filledByPilotId}
              />
            );
          })}
        </div>
      ) : isTablet ? (
        <div className="grid-columns tablet">
          {columnsTablet.map((col, i) => (
            <div key={i} className="grid-column">
              {col.map(slot => {
                const slotValidated = validated[slot.position] ?? revealed[slot.position];
                return (
                  <GridSlot
                    key={slot.position}
                    position={slot.position}
                    nationalityCode={slotValidated?.nationalityCode ?? slot.nationalityCode}
                    filledPilot={slotValidated?.pilotName ?? slot.filledByPilotId}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-columns">
          {columnsDesktop.map((col, i) => (
            <div key={i} className="grid-column">
              {col.map(slot => {
                const slotValidated = validated[slot.position] ?? revealed[slot.position];
                return (
                  <GridSlot
                    key={slot.position}
                    position={slot.position}
                    nationalityCode={slotValidated?.nationalityCode ?? slot.nationalityCode}
                    filledPilot={slotValidated?.pilotName ?? slot.filledByPilotId}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {gameCompleted || Object.keys(revealed).length > 0 ? (
        <button className="back-button" onClick={() => navigate("/minigames")}>
          {t.back}
        </button>
      ) : (
        <SearchPilotInput />
      )}
    </div>
  );
};

export default GridGameBoard;
