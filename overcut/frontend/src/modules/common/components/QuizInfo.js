import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import users from "../../users";
import "./QuizInfo.css";
import { getAboutOvercutImage } from "../../../helpers/sourceAboutOvercutImages";


const QuizInfo = () => {
  const navigate = useNavigate();
  const isLogged = useSelector(users.selectors.isLoggedIn);
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  useEffect(() => {
    if (isLogged) navigate("/category/2", { replace: true });
  }, [isLogged, navigate]);

  const text = lang === "es"
    ? (
      <>
        <p>Responde preguntas de Fórmula 1 y consigue puntos para subir de rango.</p>
        <p>Hay categorías temáticas, niveles y recompensas.</p>
        <p className="quizinfo-highlight">Regístrate para jugar y guardar tu progreso.</p>
      </>
    )
    : (
      <>
        <p>Answer Formula 1 questions and earn points to climb the ranking tiers.</p>
        <p>Multiple categories, difficulty levels and rewards.</p>
        <p className="quizinfo-highlight">Sign up to play and save your progress.</p>
      </>
    );

  return (
    <div className="quizinfo-container">
      <h1 className="quizinfo-title">OverCut<span className="quizinfo-highlightTitle">Quiz</span></h1>

      <div className="quizinfo-content">
        <div className="quizinfo-imageWrap">
          <img
            src={getAboutOvercutImage("QuizIntro.png")}
            alt="OverCut Quiz intro"
            className="quizinfo-image"
          />

          <img
            src={getAboutOvercutImage("QuizQuestion.png")}
            alt="OverCut Quiz question"
            className="quizinfo-image quizinfo-image--secondary"
          />
        </div>


        <div className="quizinfo-textWrap">
          <div className="quizinfo-desc">{text}</div>

          <div className="quizinfo-buttons">
            {isLogged ? (
              <button className="quizinfo-btn" onClick={() => navigate("/category/2")}>
                {lang === "es" ? "Ir al Quiz" : "Go to Quiz"}
              </button>
            ) : (
              <>
                <button className="quizinfo-btn" onClick={() => navigate("/users/signUp")}>
                  {lang === "es" ? "Regístrate ahora" : "Sign up now"}
                </button>
                <button className="quizinfo-btn secondary" onClick={() => navigate("/users/login")}>
                  {lang === "es" ? "Iniciar sesión" : "Sign in"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInfo;
