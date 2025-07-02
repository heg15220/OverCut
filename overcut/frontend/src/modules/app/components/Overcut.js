import React from "react";
import "./Overcut.css";
import { getAboutOvercutImage } from "../../../helpers/sourceAboutOvercutImages";
import { translations } from "./translations";
import logoImage from './Resources/LogoOverCut.png';


const Overcut = () => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang].about;

  const quizText = lang === "es"
    ? "Responde preguntas sobre historia, reglamento, estadísticas y más. Los quizzes se agrupan por categorías y subcategorías con decenas de temas para todos los niveles. ¡Regístrate y compite con la comunidad acumulando puntos para llegar a lo más alto del ranking!"
    : "Answer questions about F1 history, regulations, statistics and more. Quizzes are organized by category and subcategory with dozens of topics for all levels. Register and compete with the community by earning points to climb to the top of the ranking!";

  const gamesTexts = lang === "es"
    ? {
        intro: "Diviértete con minijuegos temáticos como:",
        list: ["Drivers Connections", "Grid Guess", "Career Path", "F1 Wordle"],
        more: "¡Y muchos más!",
        end: "Cada juego pone a prueba tu conocimiento de la F1 de formas originales e interactivas. ¡Regístrate y demuestra tu habilidad!"
      }
    : {
        intro: "Enjoy themed minigames such as:",
        list: ["Drivers Connections", "Grid Guess", "Career Path", "F1 Wordle"],
        more: "And many more!",
        end: "Each game tests your F1 knowledge in original and interactive ways. Register and prove your skill!"
      };

  return (
    <div className="overcut">
      <header className="overcut__header">
        <h1 className="overcut__title">
          {lang === "es" ? "¿Qué es " : "What is "}
          <img src={logoImage} alt="OverCut Logo" className="overcut__logo-title" />
          ?
        </h1>
        <p className="overcut__intro">{t.intro}</p>
      </header>

      <section className="overcut__section">
        <div className="overcut__content">
          <h2 className="overcut__subtitle">{t.posts.title}</h2>
          <p>{t.posts.desc}</p>
        </div>
      </section>

      <section className="overcut__section overcut__section--with-image">
        <img
          className="overcut__image"
          src={getAboutOvercutImage("QuizIntro.png")}
          alt="Quiz OverCut Intro"
        />
        <div className="overcut__content">
          <h2 className="overcut__subtitle">🧠 Quiz</h2>
          <p>{quizText}</p>
          <img
            className="overcut__subimage"
            src={getAboutOvercutImage("QuizQuestion.png")}
            alt="Quiz OverCut Question"
          />
        </div>
      </section>

      <section className="overcut__section overcut__section--with-image">
        <img
          className="overcut__image"
          src={getAboutOvercutImage("OverCutGames.png")}
          alt="OverCut Minigames"
        />
        <div className="overcut__content">
          <h2 className="overcut__subtitle">🎮 OverCut Games</h2>
          <p>{gamesTexts.intro}</p>
          <ul className="overcut__list">
            {gamesTexts.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p>{gamesTexts.more}</p>
          <p>{gamesTexts.end}</p>
        </div>
      </section>

      <section className="overcut__section overcut__section--with-image">
        <img
          className="overcut__image"
          src={getAboutOvercutImage("F1HubTables.png")}
          alt="F1Hub Tables"
        />
        <div className="overcut__content">
          <h2 className="overcut__subtitle">{t.f1hub.tablesTitle}</h2>
          <p>{t.f1hub.tablesDesc}</p>
          <ul className="overcut__list">
            <li>{t.f1hub.sessions}</li>
            <li>{t.f1hub.rankings}</li>
            <li>{t.f1hub.championship}</li>
          </ul>
        </div>
      </section>

      <section className="overcut__section overcut__section--with-image">
        <img
          className="overcut__image"
          src={getAboutOvercutImage("F1HubGraphics.png")}
          alt="F1Hub Charts"
        />
        <div className="overcut__content">
          <h2 className="overcut__subtitle">{t.f1hub.chartsTitle}</h2>
          <p>{t.f1hub.chartsDesc}</p>
          <ul className="overcut__list">
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
