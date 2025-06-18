import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import { useNavigate } from "react-router-dom";
import "./RondoGame.css";
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego


const translations = {
  es: {
    loading: "Cargando juego...",
    summaryTitle: "Resumen del juego",
    correct: "Correctas",
    wrong: "Incorrectas",
    skipped: "Sin responder",
    backToHome: "Volver al inicio",
    inputPlaceholder: "Tu respuesta o pasapalabra",
    submit: "Responder",
    finish: "Finalizar juego"
  },
  en: {
    loading: "Loading game...",
    summaryTitle: "Game Summary",
    correct: "Correct",
    wrong: "Wrong",
    skipped: "Skipped",
    backToHome: "Back to home",
    inputPlaceholder: "Your answer or pass",
    submit: "Submit",
    finish: "Finish game"
  }
};

const getLang = () => {
  const lang = navigator.language.slice(0, 2);
  return translations[lang] ? lang : "es";
};

const RondoGame = () => {
  const lang = getLang();
  const t = translations[lang];

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector(selectors.getRondoGame);
  const letters = useSelector(selectors.getRondoLetters);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/rondo"][lang];

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

      if (showTutorial) {
              return (
                <MinigameTutorial
                  title={tutorial.title}
                  description={tutorial.description}
                  image={sourceImages("./Rondo.png")}
                  onStart={() => setShowTutorial(false)}
                  lang={lang}
                />
              );
            }

  const handleFinish = () => {
    dispatch(actions.completeRondoGame(game.id));
    setIsFinished(true);
  };

  const countStatus = (status) =>
    letters.filter((l) => l.status.toLowerCase() === status).length;

  if (!game || letters.length === 0)
    return <LoadingScreen lang={lang} text={t.loading} />;

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
        {isFinished ? (
          <>
            <h3>{t.summaryTitle}</h3>
            <p>✅ {t.correct}: {countStatus("correct")}</p>
            <p>❌ {t.wrong}: {countStatus("wrong")}</p>
            <p>⏭️ {t.skipped}: {countStatus("skipped")}</p>
            <button className="rondo-home-button" onClick={() => navigate("/minigames")}>
              {t.backToHome}
            </button>
          </>
        ) : (
          <>
            <h3>{currentLetter.question}</h3>
            <form onSubmit={handleSubmit}>
              <input
                className="rondo-input"
                placeholder={t.inputPlaceholder}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <button type="submit" className="rondo-button">{t.submit}</button>
            </form>
            <button className="rondo-finish-button" onClick={handleFinish}>{t.finish}</button>
          </>
        )}
      </div>
    </div>
  );
};

export default RondoGame;
