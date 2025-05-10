import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getGameId,
  getValidatedSlots,
  getPilotSuggestions
} from "../selectors";
import * as actions from "../actions";
import { gridGameTranslations } from "../../../i18n/gamegrid/translations";
import "./GridGame.css";

const SearchPilotInput = () => {
  const [input, setInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef([]);
  const dispatch = useDispatch();

  const gameId = useSelector(getGameId);
  const validated = useSelector(getValidatedSlots);
  const suggestions = useSelector(getPilotSuggestions);
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = gridGameTranslations[lang];

  useEffect(() => {
    const delay = setTimeout(() => {
      if (input.length >= 2) {
        dispatch(actions.fetchGridPilotSuggestions(gameId, input, () => {}, () => {}));
      } else {
        dispatch(actions.setGridPilotSuggestionsCompleted([]));
        setHighlightedIndex(-1);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [input, dispatch, gameId]);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current[highlightedIndex]) {
      suggestionsRef.current[highlightedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [highlightedIndex]);

  const handleSelect = (name) => {
    dispatch(actions.validatePilotInGrid(gameId, name, (result) => {
      const { validPositions, pilotName, nationalityCode } = result;
      const alreadyUsed = new Set(Object.keys(validated).map(Number));
      const availablePosition = validPositions.find(pos => !alreadyUsed.has(pos));

      if (availablePosition != null) {
        dispatch({
          type: "VALIDATE_GRID_SLOT_COMPLETED",
          position: availablePosition,
          pilotName,
          nationalityCode
        });
      }
    }, () => {}));

    setInput("");
    dispatch(actions.setGridPilotSuggestionsCompleted([]));
    setHighlightedIndex(-1);
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
      <div className="search-input-wrapper">
        <div className="input-suggestion-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="searchPlayerInput"
            placeholder={t.inputPlaceholder}
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
                  ref={(el) => (suggestionsRef.current[i] = el)}
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

        <button
          className="reveal-all-button"
          onClick={() => dispatch(actions.revealAllAnswers(gameId))}
          title={t.revealAllTooltip}
        >
          🏳️
        </button>
      </div>
    </div>

  );

};

export default SearchPilotInput;
