import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./MinigamesHome.css";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";

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
    title: "Drivers Connection",
    description: "Agrupa 4 pilotos que compartan una categoría secreta",
    img: sourceImages(`./DriversConnection.png`)
  },
  {
    path: "/minigames/orderDrivers",
    title: "Sort Drivers",
    description: "Ordena a los pilotos según el criterio F1",
    img: sourceImages(`./OrderDriversGame.png`)
  },
  {
    path: "/minigames/categoryGame",
    title: "F1 Categories",
    description: "Responde categorías que empiezan con la misma letra",
    img: sourceImages(`./gameCategory.png`)
  },
  {
    path: "/minigames/wordSearch",
    title: "Word Search F1",
    description: "Encuentra apellidos de pilotos con podios",
    img: sourceImages(`./searchGame.png`)
  },
  {
    path: "/minigames/top10quali",
    title: "Top 10 Quali",
    description: "Adivina el top 10 de una clasificación (banderas + tiempos)",
    img: sourceImages(`./top10quali.png`)
  },

  {
    path: "/minigames/driverSeason",
    title: "Driver Season",
    description: "Adivina la posición final del piloto en cada carrera de una temporada",
    img: sourceImages(`./DriverSeason.png`)
  },

  {
    path: "/minigames/tower",
    title: "Tower",
    description: "Prueba si un piloto entra en una temática secreta",
    img: sourceImages(`./Tower2.png`),
    isNew: true
  },
  {
    path: "/minigames/lightsout",
    title: "Lights Out",
    description: "Reacciona al semáforo: pulsa justo al apagarse la última luz",
    img: sourceImages(`./LightsOut.png`),
    isNew: true
  },

    {
      path: "/minigames/anagrams",
      title: "Anagrams",
      description: "Reordena letras para adivinar el apellido del piloto",
      img: sourceImages(`./Anagrams.png`),
      isNew: true
    },

    {
      path: "/minigames/bingo",
      title: "Bingo",
      description: "Completa un bingo de 9 casillas con pilotos aleatorios",
      img: sourceImages(`./Bingo.png`),
      isNew: true
    },
    {
      path: "/games/race",
      title: { es: "OverCut Racing", en: "OverCut Racing" },
      description: {
        es: "Carrera 2D en circuito inventado contra IA (3/5 vueltas)",
        en: "2D racing on a fictional track vs AI (3/5 laps)"
      },
      img: sourceImages(`./raceGame.png`),
      isNew: true
    }

];

const translations = {
  subtitle: {
    es: "¡Demuestra tu conocimiento sobre Fórmula 1 jugando!",
    en: "Prove your Formula 1 knowledge by playing!"
  },
  play: {
    es: "Jugar",
    en: "Play"
  }
};

const PAGE_SIZE = 16;

const MinigamesHome = () => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get("page") || "1");
  const totalPages = Math.max(1, Math.ceil(minigames.length / PAGE_SIZE));

  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), totalPages) : 1;

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return minigames.slice(start, start + PAGE_SIZE);
  }, [page]);

  const goToPage = (p) => {
    const safe = Math.min(Math.max(p, 1), totalPages);
    setSearchParams({ page: String(safe) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="minigames-page">
      <div className="minigames-header animate__animated animate__fadeIn">
        <h1 className="minigames-title">
          OverCut<span className="highlight">Games</span>
        </h1>
        <p className="minigames-subtitle">{translations.subtitle[lang]}</p>
      </div>

      <div className="games">
        {pageItems.map((game, index) => (
          <Link
            to={game.path}
            key={`${game.path}-${index}`}
            className="gameThumbnailLink animate__animated animate__fadeIn"
          >
            {game.isNew && <div className="tag">NEW</div>}
            <div className="cardDiv">
              <img
                src={game.img}
                alt={typeof game.title === "string" ? game.title : game.title?.[lang] || ""}
                className="gameImage"
              />
              <div className="text">
                <p className="playLabel">{translations.play[lang]}</p>
                <p className="gameTitle">
                  {typeof game.title === "string" ? game.title : game.title?.[lang]}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ✅ paginación */}
      {totalPages > 1 && (
        <div className="minigames-pagination">
          <button
            className="page-nav"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {pages.map((p) => (
            <button
              key={p}
              className={`page-number ${p === page ? "active" : ""}`}
              onClick={() => goToPage(p)}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          ))}

          <button
            className="page-nav"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default MinigamesHome;
