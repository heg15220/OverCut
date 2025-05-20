import React from "react";
import { Link } from "react-router-dom";
import './MinigamesHome.css';
import { sourceImages } from '../../../helpers/sourceMiniGamesImages';

const minigames = [
  {
    path: "/minigames/tictactoe",
    title: "Tic Tac Toe F1",
    description: "Consigue 3 en raya adivinando pilotos",
    img: sourceImages(`./tictactoe.png`)
  },
  {
    path: "/minigames/crossword",
    title: "Crossword F1",
    description: "Rellena el crucigrama de Fórmula 1",
    img: sourceImages(`./crossword.png`)
  },
  {
    path: "/minigames/gridgame",
    title: "F1 Grid",
    description: "Acierta pilotos por nacionalidad",
    img: sourceImages(`./F1Grid.png`)
  },
  {
    path: "/minigames/guessdriver",
    title: "Guess Driver",
    description: "Haz preguntas para descubrir al piloto",
    img: sourceImages(`./GuessDriver.png`)
  },
  {
    path: "/minigames/top10",
    title: "Top 10 F1",
    description: "Adivina el top 10 de una carrera",
    img: sourceImages(`./top10.png`)
  },
  {
    path: "/minigames/driverslink",
    title: "Drivers Link",
    description: "Adivina al piloto por sus compañeros",
    img: sourceImages(`./DriversLink.png`)
  },
  {
    path: "/minigames/rondo",
    title: "Rondo F1",
    description: "Acierta palabras del rosco F1",
    img: sourceImages(`./Rondo.png`)
  },
  {
    path: "/minigames/careerpath",
    title: "Career Path",
    description: "Adivina al piloto por sus equipos",
    img: sourceImages(`./CareerPath.png`)
  },

  {
    path: "/minigames/wordle",
    title: "F1 Wordle",
    description: "Adivina el apellido de un piloto F1",
    img: sourceImages(`./F1Wordle.png`)
  },

  {
    path: "/minigames/twoTeams",
    title: "2 Teams, 1 Driver",
    description: "Acierta un piloto que corrió para ambos equipos",
    img: sourceImages(`./TwoTeams.png`)
  },

  {
    path: "/minigames/f1Impostor",
    title: "F1 Impostors",
    description: "Evita a los impostores en un reto temático",
    img: sourceImages(`./F1Impostors.png`)
  },

  {
    path: "/minigames/teamGuess",
    title: "Guess the Team",
    description: "Adivina el equipo por sus pilotos",
    img: sourceImages(`./GuessTeam.png`)
  },

  {
    path: "/minigames/driversConnections",
    title: "Drivers Connections",
    description: "Agrupa 4 pilotos que compartan una categoría secreta",
    img: null,
    isNew: true
  }

];

const translations = {
  subtitle: {
    es: "¡Demuestra tu conocimiento sobre Fórmula 1 jugando!",
    en: "Prove your Formula 1 knowledge by playing!"
  }
};

const MinigamesHome = () => {
    const lang = navigator.language.startsWith('es') ? 'es' : 'en';
  return (
    <div className="minigames-page">
    <div className="minigames-header animate__animated animate__fadeIn">
      <h1 className="minigames-title">OverCut<span className="highlight">Games</span></h1>
      <p className="minigames-subtitle">{translations.subtitle[lang]}</p>
    </div>
      <div className="games">
        {minigames.map((game, index) => (
          <Link
            to={game.path}
            key={index}
            className="gameThumbnailLink animate__animated animate__fadeIn"
          >
            {game.isNew && <div className="tag">NEW</div>}
            <div className="cardDiv">
              <img src={game.img} alt={game.title} className="gameImage" />
              <div className="text">
                <p className="playLabel">Play</p>
                <p className="gameTitle">{game.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

};

export default MinigamesHome;
