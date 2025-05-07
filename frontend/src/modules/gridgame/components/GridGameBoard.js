import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import * as actions from "../actions";
import { getGridBoard, getValidatedSlots } from "../selectors";
import GridSlot from "./GridSlot";
import { sourceImages } from '../../../helpers/sourceImages';
import "./GridGame.css";

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

    const groupSlotsInRows = (slots, perRow = 4) => {
      const rows = [];
      for (let i = 0; i < slots.length; i += perRow) {
        rows.push(slots.slice(i, i + perRow));
      }
      return rows;
    };


    return (
        <div className="grid-game-container">
            <img
                src={sourceImages(`./grid-background-ai.png`)}
                alt="Parrilla F1"
                className="grid-game-background-img"
            />

        <h2 className="grid-game-title">
            Minijuego: Parrilla F1 {board?.seasonYear && `- Temporada ${board.seasonYear}`}
        </h2>

            <div className="grid-game-grid">
              {groupSlotsInRows(board.grid, 4).map((row, rowIndex) => (
                <div className="grid-row" key={rowIndex}>
                  {row.map((slot, colIndex) => (
                    <div
                      key={slot.position}
                      className="grid-cell"
                      style={{ transform: `translateY(${colIndex * 6}px)` }} // escalonado por columna
                    >
                      <GridSlot
                        position={slot.position}
                        nationalityCode={slot.nationalityCode}
                        filledPilot={validated[slot.position] || slot.filledByPilotId}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>



            {gameCompleted && (
                <div className="game-completed-overlay">
                    <div className="game-completed-content">
                        <h2>🏁 ¡Parrilla completada con éxito!</h2>
                        <div className="completed-buttons">
                            <button
                                className="completed-btn"
                                onClick={() => {
                                    setGameCompleted(false); // ocultar overlay
                                    dispatch(actions.createGridGame(gameId => {
                                        dispatch(actions.getGridGameBoard(gameId, () => {}, () => {}));
                                    }, () => {}));
                                }}
                            >
                                🔁 Jugar otra vez
                            </button>
                            <button
                                className="completed-btn"
                                onClick={() => navigate("/minigames")}
                            >
                                🏠 Volver al inicio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GridGameBoard;
