// src/games/rondo/components/RondoGame.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./RondoGame.css";

const RondoGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getRondoGame);
  const letters = useSelector(selectors.getRondoLetters);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    dispatch(actions.startRondoGame());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentLetter = letters[currentIndex];
    if (!currentLetter) return;
    if (answer.trim() === "") {
      dispatch(actions.skipRondoLetter(game.id, currentLetter.letter));
    } else {
      dispatch(actions.answerRondoLetter(game.id, currentLetter.letter, answer));
    }
    setAnswer("");
    setCurrentIndex((currentIndex + 1) % letters.length);
  };

  const handleFinish = () => {
    dispatch(actions.completeRondoGame(game.id));
  };

  if (!game || letters.length === 0) return <div className="rondo-container">Cargando juego...</div>;

  const currentLetter = letters[currentIndex];

  return (
    <div className="rondo-container">
      <div className="rondo-circle">
        {letters.map((l, idx) => (
          <div
            key={l.letter}
            className={`rondo-letter ${l.status.toLowerCase()} ${idx === currentIndex ? "current" : ""}`}
            style={{ transform: `rotate(${(360 / letters.length) * idx}deg) translate(0, -11rem)` }}
          >
            {l.letter}
          </div>
        ))}
      </div>

      <div className="rondo-center">
        <h3>{currentLetter.question}</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="rondo-input"
            placeholder="Tu respuesta o pasapalabra"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button type="submit" className="rondo-button">Responder</button>
        </form>
        <button className="rondo-finish-button" onClick={handleFinish}>Finalizar juego</button>
      </div>
    </div>
  );
};

export default RondoGame;