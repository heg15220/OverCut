import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { autocompletePilots } from "../actions";
import { getGameId, getPilotSuggestions } from "../selectors";

const AutoSuggestInput = ({ onSelect }) => {
    const [input, setInput] = useState("");
    const dispatch = useDispatch();
    const gameId = useSelector(getGameId);
    const suggestions = useSelector(getPilotSuggestions);

    useEffect(() => {
        if (input.length >= 2) {
            dispatch(autocompletePilots(gameId, input, () => {}, () => {}));
        }
    }, [input, dispatch, gameId]);

    return (
        <div className="autosuggest-input">
            <input
                type="text"
                placeholder="Nombre del piloto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <ul className="suggestion-list">
                {suggestions.map((s, i) => (
                    <li key={i} onClick={() => onSelect(s)}>
                        {s}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AutoSuggestInput;
