import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getTop10QualiGameId,
  getTop10QualiValidated,
  getTop10QualiSuggestions
} from "../selectors";

import * as actions from "../actions";
import * as actionTypes from "../actionTypes";

import "./Top10QualiGame.css";
import { top10QualiTranslations } from "../../../i18n/top10quali/translations";

const SearchPilotInput = () => {
  const [input, setInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef(null);
  const suggestionsRef = useRef([]);

  const dispatch = useDispatch();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = top10QualiTranslations[lang];

  const gameId = useSelector(getTop10QualiGameId);
  const validated = useSelector(getTop10QualiValidated);
  const suggestions = useSelector(getTop10QualiSuggestions);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (input.length >= 2) {
        dispatch(actions.fetchPilotSuggestions(gameId, input, () => {}, () => {}));
      } else {
        dispatch({ type: actionTypes.SET_TOP10QUALI_SUGGESTIONS, suggestions: [] });
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
    dispatch(actions.validatePilot(gameId, name, (result) => {
      const { validPositions, pilotName, nationalityCode } = result;

      const alreadyUsed = new Set(Object.keys(validated).map(Number));
      const availablePosition = validPositions.find(pos => !alreadyUsed.has(pos));

      if (availablePosition != null) {
        dispatch({
          type: actionTypes.VALIDATE_TOP10QUALI_SLOT_COMPLETED,
          position: availablePosition,
          pilotName,
          nationalityCode
        });
      }
    }, () => {}));

    setInput("");
    dispatch({ type: actionTypes.SET_TOP10QUALI_SUGGESTIONS, suggestions: [] });
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
      if (highlightedIndex >= 0) handleSelect(suggestions[highlightedIndex]);
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
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
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
          title={t.revealTooltip}
        >
          🏳️
        </button>
      </div>
    </div>
  );
};

export default SearchPilotInput;
