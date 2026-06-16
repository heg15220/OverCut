import React from "react";
import "./Overcut.css";
import { getAboutOvercutImage } from "../../../helpers/sourceAboutOvercutImages";
import { translations } from "./translations";
import logoImage from './Resources/LogoOverCut.png';
import overCutRacingImage from '../../../assets/images/miniGames/OverCutRacing.svg';
import overCutDraftImage from '../../../assets/images/miniGames/OverCutDraft.png';


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

  const careerModeText = lang === "es"
    ? {
        title: "Modo Trayectoria",
        desc: "Crea tu propio piloto, personaliza su casco y empieza una carrera completa en la Formula 1. Elige epoca de debut, firma contratos con objetivos realistas y disputa temporada tras temporada con calendario, clasificaciones de pilotos y constructores, duelo contra tu companero y progresion de atributos.",
        end: "Cada carrera se simula con narrativa en directo, condiciones de pista, incidentes, resultados, experiencia ganada y evolucion de tu carta de piloto. Puedes guardar la partida con un codigo de exportacion para continuar tu trayectoria mas adelante."
      }
    : {
        title: "Career Mode",
        desc: "Create your own driver, customize the helmet and start a full Formula 1 career. Pick a debut era, sign contracts with realistic objectives and play season after season with calendar, driver and constructor standings, team-mate battles and attribute progression.",
        end: "Every race is simulated with live narration, track conditions, incidents, results, earned experience and driver-card growth. You can save the game with an export code and continue your career later."
      };

  const racingText = lang === "es"
    ? {
        title: "OverCutRacing / OverCutDraft",
        desc: "OverCutRacing, tambien conocido como OverCutDraft, es un modo de draft historico en el que construyes una parrilla imposible de Formula 1. Tiras por equipos y pilotos de distintas decadas, asignas cada piloto a un asiento y formas una parrilla de 11 equipos y 22 pilotos.",
        end: "Cuando la parrilla esta lista, el juego genera una temporada realista con calendario, sistema de puntuacion, clima, estrategias, ganadores, podios, abandonos, sorpresas y clasificaciones actualizadas tras cada ronda hasta coronar al campeon de pilotos y al campeon de constructores."
      }
    : {
        title: "OverCutRacing / OverCutDraft",
        desc: "OverCutRacing, also known as OverCutDraft, is a historic draft mode where you build an impossible Formula 1 grid. Roll for teams and drivers from different decades, assign each driver to a seat and create an 11-team, 22-driver grid.",
        end: "Once the grid is ready, the game generates a realistic season with calendar, scoring system, weather, strategies, winners, podiums, DNFs, surprises and standings updated after every round until the drivers' and constructors' champions are crowned."
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
          src={getAboutOvercutImage("CareerMode.png")}
          alt={careerModeText.title}
        />
        <div className="overcut__content">
          <h2 className="overcut__subtitle">{careerModeText.title}</h2>
          <p>{careerModeText.desc}</p>
          <p>{careerModeText.end}</p>
        </div>
      </section>

      <section className="overcut__section overcut__section--with-image">
        <img
          className="overcut__image"
          src={overCutRacingImage}
          alt={racingText.title}
        />
        <div className="overcut__content">
          <h2 className="overcut__subtitle">{racingText.title}</h2>
          <p>{racingText.desc}</p>
          <p>{racingText.end}</p>
          <img
            className="overcut__subimage"
            src={overCutDraftImage}
            alt="OverCutDraft"
          />
        </div>
      </section>

        {/* OVERCUT PREDICTIONS */}
      <section className="overcut__section overcut__section--with-image">
        <img
          className="overcut__image"
          src={getAboutOvercutImage("OverCutPredictions.png")}
          alt="OverCut Predictions"
        />

        <div className="overcut__content">
          <h2 className="overcut__subtitle">🔮 OverCut Predictions</h2>
          <p>{t.predictions.intro}</p>

          <ul className="overcut__list">
            <li>{t.predictions.feature1}</li>
            <li>{t.predictions.feature2}</li>
            <li>{t.predictions.feature3}</li>
            <li>{t.predictions.feature4}</li>
          </ul>

          <p>{t.predictions.end}</p>
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
