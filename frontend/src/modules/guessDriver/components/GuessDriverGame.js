import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./Guessdriver.css";
import { sourceImages } from '../../../helpers/sourceImages';

const GuessDriverGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGuessDriverGame);
  const recommendations = useSelector(selectors.getGuessDriverRecommendations);


  const [category, setCategory] = useState("current");
  const [value, setValue] = useState("");
  const [guess, setGuess] = useState("");
  const [lang] = useState(navigator.language.startsWith("es") ? "es" : "en");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef([]);


  useEffect(() => {
    dispatch(actions.startGuessDriverGame());
  }, [dispatch]);

  useEffect(() => {
    if (category !== "current" && category !== "retired" && category !== "champion") {
      dispatch(actions.getRecommendations(category));
    }
  }, [category, dispatch]);

  const handleAskQuestion = () => {
    dispatch(actions.askQuestion({ gameId: game.id, category, value, lang }));
    setValue("");
  };

  const handleGuessPilot = () => {
    dispatch(actions.guessPilot({ gameId: game.id, guess }));
    setGuess("");
  };


useEffect(() => {
  if (
    highlightedIndex >= 0 &&
    listRef.current[highlightedIndex]
  ) {
    listRef.current[highlightedIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}, [highlightedIndex]);

  if (!game) return <div className="grid-game-body">Cargando juego...</div>;

const visibleRecommendations = recommendations.filter(r =>
r.toLowerCase().includes(value.toLowerCase())
);

  return (
    <div className="grid-game-container">
      <div className="grid-game-overlay">
        <div style={{ textAlign: "center" }}>
          <img
            src={sourceImages(`./helmet_silhouette.png`)}
            alt="Casco"
            className="guessPlayerImage card__face card__face--front"
          />
        </div>

        <div className="search-input-wrapper">
          <input
            className="searchPlayerInput"
            placeholder="Nombre del piloto"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <button className="reveal-all-button" onClick={handleGuessPilot}>¡Adivinar!</button>
        </div>

        <div className="input-wrapper">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-selector"
          >
            <option value="current">¿Actual?</option>
            <option value="retired">¿Retirado?</option>
            <option value="team">Equipo</option>
            <option value="circuit">Circuito</option>
            <option value="nationality">Nacionalidad</option>
            <option value="champion">¿Campeón?</option>
          </select>

          {(category !== "current" && category !== "retired" && category !== "champion") && (
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <input
                className="autosuggest-input"
                placeholder={`Introduce valor para ${category}`}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setShowRecommendations(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev + 1) % visibleRecommendations.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                      prev <= 0 ? visibleRecommendations.length - 1 : prev - 1
                    );
                  } else if (e.key === "Enter") {
                    if (highlightedIndex >= 0 && visibleRecommendations[highlightedIndex]) {
                      const selected = visibleRecommendations[highlightedIndex];
                      setValue(""); // ✅ limpia el input
                      dispatch(actions.askQuestion({ gameId: game.id, category, value: selected, lang }));
                      setShowRecommendations(false);
                      setHighlightedIndex(-1);
                    }

                  }
                }}

              />

              {recommendations.length > 0 && value && showRecommendations && (
                <div className="recommendation-list">
                  {recommendations
                    .filter(r => r.toLowerCase().includes(value.toLowerCase()))
                    .map((rec, index) => (
                      <div
                        key={index}
                        ref={(el) => (listRef.current[index] = el)}
                        className={`recommendation-item ${highlightedIndex === index ? "selected" : ""}`}
                        onClick={() => {
                          setValue(""); // ✅ limpia el input
                          dispatch(actions.askQuestion({ gameId: game.id, category, value: rec, lang }));
                          setShowRecommendations(false);
                          setHighlightedIndex(-1);
                        }}


                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {rec}
                      </div>
                  ))}

                </div>
              )}
            </div>
          )}

        </div>

        <button className="extraClassButton" onClick={handleAskQuestion}>Hacer pregunta</button>

        <div className="questionsLeft">Preguntas realizadas: {game.questionCount}</div>

        <div className="scrollable-questions-wrapper">
          <div className="question-list-view">
            {game.questions.map((q, index) => (
              <div key={index} className="individual-question-view">
                <span className="questionText">{q.question || `${q.category}: ${q.valueUser || "(sin valor)"}`}</span>
                <span className={q.correct ? "correctAnswer" : "wrongAnswer"}>{q.correct ? "Sí" : "No"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuessDriverGame;
