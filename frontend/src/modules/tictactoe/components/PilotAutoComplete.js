import React, { useEffect, useState } from 'react';
import './PilotAutocomplete.css';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';

const PilotAutocomplete = ({ onSelect }) => {
  const [input, setInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dispatch = useDispatch();
  const suggestions = useSelector(selectors.selectSuggestions);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (input.length > 1) {
        dispatch(actions.fetchPilotSuggestions(input, () => {}, () => {}));
      } else {
        dispatch(actions.setPilotSuggestionsCompleted([]));
        setHighlightedIndex(-1); // Reset índice si se borra el input
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [input, dispatch]);

  const handleKeyDown = (e) => {
    if (!suggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 || prev === -1 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        onSelect(suggestions[highlightedIndex]);
      }
    }
  };

  return (
    <div className="autocomplete-container active">
      <input
        className="autocomplete-input"
        placeholder="Escribe el nombre del piloto"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setHighlightedIndex(-1); // Reset al cambiar texto
        }}
        onKeyDown={handleKeyDown}
      />
      {suggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((name, idx) => (
            <li
              key={idx}
              className={idx === highlightedIndex ? 'selected' : ''}
              onClick={() => onSelect(name)}
              onMouseEnter={() => setHighlightedIndex(idx)} // 👈 al pasar el ratón, se selecciona
              ref={el => {
                if (idx === highlightedIndex && el) {
                  el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                  });
                }
              }}
            >
              {name}
            </li>
          ))}
        </ul>

      )}
    </div>
  );
};

export default PilotAutocomplete;
