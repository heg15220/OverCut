import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import { fetchPilotSuggestions, clearPilotSuggestions } from "../actions";
import * as selectors from "../selectors";
import "./Guessdriver.css";
import { useNavigate } from "react-router-dom";

import LoadingScreen from '../../common/components/LoadingScreen';

import helmetSilhouette from '../../../assets/images/helmet_silhouette.png';


import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego

import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";



const GuessDriverGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGuessDriverGame);
  const recommendations = useSelector(selectors.getGuessDriverRecommendations);
  const navigate = useNavigate();

  const [category, setCategory] = useState("current");
  const [value, setValue] = useState("");
  const [pilotInput, setPilotInput] = useState("");
  const [lang] = useState(navigator.language.startsWith("es") ? "es" : "en");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [pilotHighlightedIndex, setPilotHighlightedIndex] = useState(-1);
  const [valueHighlightedIndex, setValueHighlightedIndex] = useState(-1);
  const pilotListRef = useRef([]);
  const valueListRef = useRef([]);
  const inputRef = useRef();

  const pilotSuggestions = useSelector(selectors.getGuessDriverPilotSuggestions);

  const { canPlay, secondsRemaining } = useSelector(state =>
    getCooldownForGame(state, "GuessDriver")
  );
  const user = useSelector(getUser);

  const decadeOptions = [
    "1950s", "1960s", "1970s", "1980s", "1990s",
    "2000s", "2010s", "2020s"
  ];

  const translations = {
    guess: { es: "¡Adivinar!", en: "Guess!" },
    askQuestion: { es: "Hacer pregunta", en: "Ask question" },
    askedQuestions: { es: "Preguntas realizadas", en: "Questions asked" },
    backToHome: { es: "Volver al inicio", en: "Back to Home" },
    selectDecade: { es: "Selecciona una década", en: "Select a decade" },
    inputValueFor: { es: "Introduce valor para", en: "Enter value for" },
    loading: { es: "Cargando juego...", en: "Loading game..." }
  };

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/guessdriver"][lang];

  useEffect(() => {
    dispatch(fetchCooldown("GuessDriver"));
  }, [dispatch]);


  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startGuessDriverGame());
    }
  }, [canPlay, dispatch]);


  useEffect(() => {
    if (category !== "current" && category !== "retired" && category !== "champion") {
      dispatch(actions.getRecommendations(category, lang)); // 👈 pasa lang
    }
  }, [category, dispatch, lang]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (pilotInput.trim().length >= 2) {
        dispatch(fetchPilotSuggestions(pilotInput.trim()));
      } else {
        dispatch(clearPilotSuggestions());
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [pilotInput, dispatch]);

  useEffect(() => {
    if (pilotHighlightedIndex >= 0 && pilotListRef.current[pilotHighlightedIndex]) {
      pilotListRef.current[pilotHighlightedIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [pilotHighlightedIndex]);

  useEffect(() => {
    if (valueHighlightedIndex >= 0 && valueListRef.current[valueHighlightedIndex]) {
      valueListRef.current[valueHighlightedIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [valueHighlightedIndex]);

  const visibleRecommendations = recommendations.filter(r =>
    r.toLowerCase().includes(value.toLowerCase())
  );

   if (!canPlay) {
     return (
       <CooldownScreen
         seconds={secondsRemaining}
         onBack={() => navigate("/minigames")}
       />
     );
   }

   if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages("./GuessDriver.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  const handleAskQuestion = () => {
    dispatch(actions.askQuestion({ gameId: game.id, category, value, lang }));
    setValue("");
  };

  const handleGuessPilot = () => {
    dispatch(actions.guessPilot({ gameId: game.id, guess: pilotInput }));
    setPilotInput("");
    dispatch(clearPilotSuggestions());
  };

  if (!game) return <LoadingScreen lang={lang} text={translations.loading[lang]} />;



  return (
    <div className="grid-game-container">
      <div className="grid-game-overlay">
        <div className="card-container">
          <div className={`card-inner ${game.finished ? "flipped" : ""}`}>
            <div className="helmet-reveal-container">
              <div className={`helmet-flip ${game.finished ? "reveal" : ""}`}>
                <img
                  src={helmetSilhouette}
                  alt="Casco"
                  className="guessPlayerImage"
                />
                <div
                  className={`revealed-name-under ${
                    game.successful ? "user-success" : "system-reveal"
                  }`}
                >
                  {game.driverName}
                </div>

              </div>
            </div>



          </div>
        </div>


      {!game.finished && (
        <>
          <div className="search-input-wrapper" style={{ position: "relative", width: "100%" }}>
            <input
              className="searchPlayerInput"
              ref={inputRef}
              placeholder={lang === "es" ? "Nombre del piloto" : "Driver name"}
              value={pilotInput}
              onChange={(e) => {
                setPilotInput(e.target.value);
                setPilotHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                if (game.successful) return;
                if (pilotSuggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setPilotHighlightedIndex((prev) => (prev + 1) % pilotSuggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setPilotHighlightedIndex((prev) =>
                    prev <= 0 ? pilotSuggestions.length - 1 : prev - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (pilotHighlightedIndex >= 0) {
                    const selected = pilotSuggestions[pilotHighlightedIndex];
                    setPilotInput("");
                    dispatch(clearPilotSuggestions());
                    dispatch(actions.guessPilot({ gameId: game.id, guess: selected }));
                  } else if (pilotInput.trim() !== "") {
                    handleGuessPilot();
                  }
                }
              }}
            />
            <button
              className="reveal-all-button"
              onClick={handleGuessPilot}
              disabled={game.successful}
            >
              {translations.guess[lang]}
            </button>

            {pilotSuggestions.length > 0 && (
              <div className="pilot-suggestion-list">
                {pilotSuggestions.map((name, index) => (
                  <div
                    key={index}
                    ref={(el) => (pilotListRef.current[index] = el)}
                    className={`recommendation-item ${pilotHighlightedIndex === index ? "selected" : ""}`}
                    onClick={() => {
                      setPilotInput("");
                      dispatch(clearPilotSuggestions());
                      dispatch(actions.guessPilot({ gameId: game.id, guess: name }));
                    }}
                    onMouseEnter={() => setPilotHighlightedIndex(index)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-wrapper">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-selector"
            >
              <option value="current">{lang === "es" ? "¿Actual?" : "Current?"}</option>
              <option value="retired">{lang === "es" ? "¿Retirado?" : "Retired?"}</option>
              <option value="team">{lang === "es" ? "Equipo" : "Team"}</option>
              <option value="circuit">{lang === "es" ? "Circuito" : "Circuit"}</option>
              <option value="nationality">{lang === "es" ? "Nacionalidad" : "Nationality"}</option>
              <option value="champion">{lang === "es" ? "¿Campeón?" : "Champion?"}</option>
              <option value="gpwinner">{lang === "es" ? "¿Ganó un GP?" : "GP Winner?"}</option>
              <option value="over50gps">{lang === "es" ? "¿Más de 50 GP?" : "Over 50 GPs?"}</option>
              <option value="over150gps">{lang === "es" ? "¿Más de 150 GP?" : "Over 150 GPs?"}</option>
              <option value="decade">{lang === "es" ? "¿Década?" : "Decade?"}</option>
            </select>
          </div>

          {/* INPUT O SELECT SEGÚN CATEGORÍA */}
          {!["current", "retired", "champion", "gpwinner", "over50gps", "over150gps"].includes(category) && (
            <div className="input-wrapper" style={{ position: "relative" }}>
              {category === "decade" ? (
                <select
                  className="autosuggest-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                >
                  <option value="">{lang === "es" ? "Selecciona una década" : "Select a decade"}</option>
                  {decadeOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <>
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
                        setValueHighlightedIndex((prev) => (prev + 1) % visibleRecommendations.length);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setValueHighlightedIndex((prev) =>
                          prev <= 0 ? visibleRecommendations.length - 1 : prev - 1
                        );
                      } else if (e.key === "Enter") {
                        if (valueHighlightedIndex >= 0 && visibleRecommendations[valueHighlightedIndex]) {
                          const selected = visibleRecommendations[valueHighlightedIndex];
                          setValue("");
                          dispatch(actions.askQuestion({ gameId: game.id, category, value: selected, lang }));
                          setShowRecommendations(false);
                          setValueHighlightedIndex(-1);
                        }
                      }
                    }}
                  />

                  {recommendations.length > 0 && value && showRecommendations && (
                    <div className="recommendation-list">
                      {visibleRecommendations.map((rec, index) => (
                        <div
                          key={index}
                          ref={(el) => (valueListRef.current[index] = el)}
                          className={`recommendation-item ${valueHighlightedIndex === index ? "selected" : ""}`}
                          onClick={() => {
                            setValue("");
                            dispatch(actions.askQuestion({ gameId: game.id, category, value: rec, lang }));
                            setShowRecommendations(false);
                            setValueHighlightedIndex(-1);
                          }}
                          onMouseEnter={() => setValueHighlightedIndex(index)}
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <button className="extraClassButton" onClick={handleAskQuestion}>
            {translations.askQuestion[lang]}
          </button>

          <div className="questionsLeft">
            {translations.askedQuestions[lang]}: {game.questionCount}
          </div>

          <div className="scrollable-questions-wrapper">
            <div className="question-list-view">
              {game.questions.map((q, index) => (
                <div key={index} className="individual-question-view">
                  <span className="questionText">
                    {q.question || `${q.category}: ${q.valueUser || "(sin valor)"}`}
                  </span>
                  <span className={q.correct ? "correctAnswer" : "wrongAnswer"}>
                    {q.correct ? (lang === "es" ? "Sí" : "Yes") : (lang === "es" ? "No" : "No")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}


          {game.finished && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button
                className="completed-btn"
                onClick={() => navigate("/minigames")}
              >
                {translations.backToHome[lang]}
              </button>
            </div>
          )}
        </div>
      </div>
  );
};

export default GuessDriverGame;
