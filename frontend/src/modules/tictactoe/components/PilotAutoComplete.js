import React, { useEffect, useState } from 'react';
import './PilotAutocomplete.css';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';

const PilotAutocomplete = ({ onSelect }) => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch();
  const suggestions = useSelector(selectors.selectSuggestions);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (input.length > 1) {
        dispatch(actions.fetchPilotSuggestions(input, () => {}, () => {}));
      } else {
        // Limpiar suggestions si no hay input suficiente
        dispatch(actions.setPilotSuggestionsCompleted([]));
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [input, dispatch]);

  return (
    <div className="autocomplete-container">
      <input
        className="autocomplete-input"
        placeholder="Escribe el nombre del piloto"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {suggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((name, idx) => (
            <li key={idx} onClick={() => onSelect(name)}>
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PilotAutocomplete;
