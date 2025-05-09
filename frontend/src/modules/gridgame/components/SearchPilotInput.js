import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getGameId, getGridBoard, getValidatedSlots, getPilotSuggestions } from "../selectors";
import * as actions from "../actions";
import "./GridGame.css";


const SearchPilotInput = () => {
  const [input, setInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dispatch = useDispatch();
  const gameId = useSelector(getGameId);
  const board = useSelector(getGridBoard);
  const validated = useSelector(getValidatedSlots);
  const suggestions = useSelector(getPilotSuggestions);


  useEffect(() => {
    const delay = setTimeout(() => {
      if (input.length >= 2) {
        dispatch(actions.fetchGridPilotSuggestions(gameId, input, () => {}, () => {}));
      } else if (input.length === 0) {
        dispatch(actions.setGridPilotSuggestionsCompleted([]));
        setHighlightedIndex(-1);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [input, dispatch, gameId]);

  const handleSelect = (name) => {
    dispatch(actions.validatePilotInGrid(gameId, name, (result) => {
      const { validPositions, pilotName } = result;

      const alreadyUsed = new Set(Object.keys(validated).map(Number));
      const availablePosition = validPositions.find(pos => !alreadyUsed.has(pos));

      if (availablePosition != null) {
        dispatch({ type: "VALIDATE_GRID_SLOT_COMPLETED", position: availablePosition, pilotName });
      }
    }, () => {}));

    setInput("");
    dispatch(actions.setGridPilotSuggestionsCompleted([]));
  };


  const handleKeyDown = (e) => {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 || prev === -1 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(suggestions[highlightedIndex]);
      }
    }
  };

  return (
    <div className="search-player-container">
      <input
        type="text"
        className="searchPlayerInput"
        placeholder="Escribe el nombre del piloto"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="on"
        spellCheck="false"
      />
      {input && suggestions.length > 0 && (
        <ul className="suggestion-list">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className={i === highlightedIndex ? "selected" : ""}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchPilotInput;
