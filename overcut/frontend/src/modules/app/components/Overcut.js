import React from "react";
import "./Overcut.css";
import { getAboutOvercutImage } from "../../../helpers/sourceAboutOvercutImages";
import { translations } from "./translations";

const Overcut = () => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang].about;

  // 🎯 Textos dinámicos por idioma
  const quizText = lang === "es"
    ? "Responde preguntas sobre historia, reglamento, estadísticas y más. Los quizzes se agrupan por categorías y subcategorías, con decenas de temas para todos los niveles. ¡Regístrate y compite con la comunidad acumulando puntos en los quiz! ¡Intenta llegar a lo más alto del ranking!"
    : "Answer questions about F1 history, regulations, statistics and more. Quizzes are organized by category and subcategory with dozens of topics for all levels. Register and compete with the community by earning points in the quizzes! Try to climb to the top of the ranking!";

  const gamesTexts = lang === "es"
    ? {
        intro: "Diviértete con minijuegos temáticos como:",
        list: ["Drivers Connections", "Grid Guess", "Career Path", "F1 Wordle"],
        more: "¡Y muchos más!",
        end: "Cada juego pone a prueba tu conocimiento de la F1 de formas originales e interactivas. ¡Regístrate y prueba tu valía!"
      }
    : {
        intro: "Enjoy themed minigames such as:",
        list: ["Drivers Connections", "Grid Guess", "Career Path", "F1 Wordle"],
        more: "And many more!",
        end: "Each game tests your F1 knowledge in original and interactive ways. Register and prove your worth!"
      };

  return (
    <div className="about-overcut">
      {/* INTRO */}
      <section className="about-header">
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </section>

      {/* POSTS */}
      <section className="about-section">
        <div className="about-content">
          <h2>{t.posts.title}</h2>
          <p>{t.posts.desc}</p>
        </div>
      </section>

      {/* QUIZ */}
      <section className="about-section">
        <img
          className="about-image"
          src={getAboutOvercutImage("QuizIntro.png")}
          alt="Quiz OverCut Intro"
        />
        <div className="about-content">
          <h2>🧠 Quiz</h2>
          <p>{quizText}</p>
          <img
            className="about-subimage"
            src={getAboutOvercutImage("QuizQuestion.png")}
            alt="Quiz OverCut Pregunta"
          />
        </div>
      </section>

      {/* OverCut Games */}
      <section className="about-section">
        <img
          className="about-image"
          src={getAboutOvercutImage("OverCutGames.png")}
          alt="Minijuegos OverCut"
        />
        <div className="about-content">
          <h2>🎮 OverCut Games</h2>
          <p>{gamesTexts.intro}</p>
          <ul>
            {gamesTexts.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p>{gamesTexts.more}</p>
          <p>{gamesTexts.end}</p>
        </div>
      </section>

      {/* F1Hub - Tablas */}
      <section className="about-section">
        <img
          className="about-image"
          src={getAboutOvercutImage("F1HubTables.png")}
          alt="F1Hub Tablas"
        />
        <div className="about-content">
          <h2>{t.f1hub.tablesTitle}</h2>
          <p>{t.f1hub.tablesDesc}</p>
          <ul>
            <li>{t.f1hub.sessions}</li>
            <li>{t.f1hub.rankings}</li>
            <li>{t.f1hub.championship}</li>
          </ul>
        </div>
      </section>

      {/* F1Hub - Gráficas */}
      <section className="about-section">
        <img
          className="about-image"
          src={getAboutOvercutImage("F1HubGraphics.png")}
          alt="F1Hub Gráficas"
        />
        <div className="about-content">
          <h2>{t.f1hub.chartsTitle}</h2>
          <p>{t.f1hub.chartsDesc}</p>
          <ul>
            <li>{t.f1hub.chartExamples1}</li>
            <li>{t.f1hub.chartExamples2}</li>
            <li>{t.f1hub.chartExamples3}</li>
            <li>{t.f1hub.chartExamples4}</li>
            <li>{t.f1hub.chartExamples5}</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Overcut;
