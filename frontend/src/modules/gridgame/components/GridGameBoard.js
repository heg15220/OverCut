import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import * as actions from "../actions";
import { getGridBoard, getValidatedSlots } from "../selectors";
import GridSlot from "./GridSlot";
import { sourceImages } from '../../../helpers/sourceImages';
import "./GridGame.css";
import SearchPilotInput from "./SearchPilotInput";

const GridGameBoard = () => {
    const board = useSelector(getGridBoard);
    const validated = useSelector(getValidatedSlots);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [gameCompleted, setGameCompleted] = useState(false);


    useEffect(() => {
        if (!board) return;
        const filledCount = board.grid.filter(slot =>
            validated[slot.position] || slot.filledByPilotId
        ).length;
        if (filledCount === board.grid.length) {
            setGameCompleted(true);
        }
    }, [board, validated]);

    if (!board) return <div className="grid-loading">Cargando parrilla...</div>;

   const columnSize = Math.ceil(board.grid.length / 3);
   const column1 = board.grid.slice(0, columnSize);
   const column2 = board.grid.slice(columnSize, columnSize * 2);
   const column3 = board.grid.slice(columnSize * 2);


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
            <span className="grid-title-main">Parrilla F1</span>{" "}
            {board?.seasonYear && (
              <span className="grid-title-season">Temporada {board.seasonYear}</span>
            )}
          </h2>

          <div className="grid-columns">
            {[column1, column2, column3].map((col, i) => (
              <div key={i} className="grid-column">
                {col.map(slot => {
                  const slotValidated = validated[slot.position];

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


          <SearchPilotInput />

        </div>
      );
};

export default GridGameBoard;
