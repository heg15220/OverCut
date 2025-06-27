import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import * as actions from "../actions";
import { getGridBoard, getValidatedSlots, getRevealedSlots } from "../selectors";
import GridSlot from "./GridSlot";
import { sourceImages } from '../../../helpers/sourceImages';
import { gridGameTranslations } from "../../../i18n/gamegrid/translations";
import "./GridGame.css";
import SearchPilotInput from "./SearchPilotInput";
import LoadingScreen from '../../common/components/LoadingScreen';


const GridGameBoard = () => {
    const board = useSelector(getGridBoard);
    const validated = useSelector(getValidatedSlots);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [gameCompleted, setGameCompleted] = useState(false);
    const revealed = useSelector(getRevealedSlots);
    const lang = navigator.language.startsWith("es") ? "es" : "en";
    const t = gridGameTranslations[lang];

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


   const numColumns = board.grid.length > 29 ? 5 : board.grid.length > 21 ? 4 : 3;

   const columns = Array.from({ length: numColumns }, (_, i) =>
     board.grid.slice(
       Math.floor((i * board.grid.length) / numColumns),
       Math.floor(((i + 1) * board.grid.length) / numColumns)
     )
   );



    const groupSlotsInRows = (slots, perRow = 4) => {
      const rows = [];
      for (let i = 0; i < slots.length; i += perRow) {
        rows.push(slots.slice(i, i + perRow));
      }
      return rows;
    };



     return (
        <div className="grid-ranking-container">
          <h2 className="grid-ranking-title">
            <span className="grid-title-main">{t.title}</span>{" "}
            {board?.seasonYear && (
              <span className="grid-title-season">{t.season} {board.seasonYear}</span>
            )}
          </h2>

          <div className="grid-columns">
            {columns.map((col, i) => (
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
