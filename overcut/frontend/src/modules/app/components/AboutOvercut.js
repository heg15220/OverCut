import React from "react";
import { useIntl } from "react-intl";
import "./AboutOvercut.css";

const translations = {
  es: {
    about: {
      title: "¿Qué es OverCut?",
      intro: "OverCut es una plataforma completa de Fórmula 1 donde los fans pueden explorar, jugar y aprender mediante herramientas interactivas y estadísticas avanzadas.",

      posts: {
        title: "🗞️ Publicaciones",
        desc: "La sección de los posts muestra análisis de tendencias actuales o pasadas en la Fórmula 1, además de noticias recientes sobre el deporte."
      },

      quiz: {
        title: "🧠 Quiz",
        desc: "Los quiz son cuestionarios de preguntas y respuestas sobre diferentes temáticas de la Fórmula 1. Al iniciar una partida, se escoge una categoría como temática. En el modo de juego, encontramos 6 tipos de categorías: Estadísticas, Reglamento, Imágenes, Estrategia, Física en la F1 y Radios.",

        statsTitle: "📊 Estadísticas",
        statsDesc: "En esta categoría, las preguntas se centran en datos y estadísticas de la F1. Se incluyen subcategorías como estadísticas genéricas (a nivel de campeonato), estadísticas de pilotos y estadísticas de equipos, cubriendo logros, récords y comparaciones históricas.",

        rulesTitle: "📘 Reglamento",
        rulesDesc: "Las preguntas de esta categoría abordan el reglamento deportivo de la Fórmula 1. Se incluyen subcategorías como neumáticos, safety car, bandera roja, sistema de puntos, sanciones y normas clave que rigen las carreras.",

        strategyTitle: "🎯 Estrategia",
        strategyDesc: "Esta categoría contiene preguntas sobre estrategias de carrera reales o simuladas, incluyendo decisiones sobre paradas, neumáticos, órdenes de equipo y análisis de momentos decisivos en Grandes Premios históricos.",

        physicsTitle: "🧪 Física",
        physicsDesc: "Preguntas que exploran la física detrás del rendimiento de los monoplazas de F1: aerodinámica, fuerzas G, transferencia de peso, adherencia, frenado, y otros conceptos aplicados a las carreras.",

        imagesTitle: "🖼️ Imágenes",
        imagesDesc: "En esta categoría visual, se presentan imágenes para identificar pilotos, escuderías, circuitos o momentos icónicos de la historia de la Fórmula 1. El objetivo es poner a prueba el conocimiento visual del usuario.",

        teamRadiosTitle: "🎙️ Radios",
        teamRadiosDesc: "Esta categoría incluye mensajes de radio reales que marcaron momentos inolvidables en la historia de la Fórmula 1. Desde polémicas órdenes de equipo hasta celebraciones icónicas, las preguntas pondrán a prueba tu memoria auditiva y tu conocimiento histórico.",

      },

      ranking: {
        title: "🏆 Ranking de usuarios",
        desc: "Cada vez que un usuario termina una partida, acumula puntos en su cuenta registrada. El ranking muestra a todos los jugadores, ordenados por sus puntos acumulados, y clasificados en rangos como F4, F3, F2 y F1 según el total obtenido. ¡Compite con los demás miembros de la comunidad para llegar a lo más alto!"
      },

      games: {
        title: "🎮 OverCutGames",
        desc: "OverCutGames es una sección especial con 16 minijuegos diferentes sobre la Fórmula 1. Cada juego ofrece experiencias interactivas basadas en datos reales y situaciones históricas. No se trata de preguntas al azar: las partidas utilizan información validada y lógica contextual para una experiencia divertida y rigurosa.",

        examplesTitle: "Ejemplos de minijuegos:",
        example1: "Career Path Game – Adivina los equipos por los que pasó un piloto.",
        example2: "Tic Tac Toe F1 – Tres en raya con criterios como campeones, nacionalidad, escuderías...",
        example3: "Grid Game – Completa parrillas de salida históricas.",
        example4: "Drivers Connections – Conecta pilotos por equipos compartidos o coincidencias en pista.",
        example5: "Sopa de Letras – Encuentra nombres ocultos de pilotos, circuitos o equipos.",
        example6: "F1 Impostor – Detecta al intruso que no pertenece al grupo.",
        example7: "Category Game – Clasifica pilotos o equipos por logros.",
        moreExamples: "Estos son solo algunos ejemplos… ¡Pero hay muchos más!"

      },

    f1hub: {
      title: "📊 F1Hub: Centro de Datos",
      desc: "F1Hub es el corazón estadístico de OverCut. Un centro de datos diseñado para los aficionados que quieren ir más allá de las noticias y explorar la Fórmula 1 desde la perspectiva de la historia, los números y el rendimiento. Aquí encontrarás dos secciones principales: Tablas y Gráficas.",

      tablesTitle: "📋 Sección de Tablas",
      tablesDesc: "Explora los datos crudos y estructurados de la F1 con una interfaz visual, clara y completamente interactiva. Puedes navegar por décadas completas o filtrar por cada carrera individual.",

      sessions: "🏁 1. Resultados por sesión: consulta los resultados completos de cualquier Gran Premio desde 1950, seleccionando el año, el GP (con país y circuito), y la sesión: Carrera, Clasificación, Sprint o Prácticas (FP1, FP2, FP3). Cada tipo muestra su propia tabla con información adaptada (tiempos, posiciones, puntos, abandonos…), usando colores representativos de equipos y nacionalidades.",

      rankings: "🧠 2. Rankings y Récords históricos: explora rankings organizados por métricas como pilotos con más títulos, victorias, poles o podios, equipos más exitosos o récords únicos como victorias sin liderar, podios en cumpleaños, primeras líneas repetidas, etc. Todo clasificado por subcategorías como Campeonatos 🏆, Victorias 🏁, Podios 🥉, Puntos 📈, Grandes Premios 🗓️ y Estadísticas especiales 🔍.",

      championship: "📅 3. Seguimiento del Campeonato: visualiza la evolución del campeonato por temporada. Selecciona un año y ve ronda a ronda los puntos de cada piloto. Identifica DNS y la progresión de cada contendiente en una vista tipo matriz (columnas = carreras, filas = pilotos, celdas = puntos).",

    chartsTitle: "📈 Sección de Gráficas",
    chartsDesc: "Esta sección transforma los datos en visualizaciones intuitivas, atractivas y completamente personalizables. ¿Qué puedes hacer? Comparar pilotos, equipos o temporadas, visualizar tendencias, rachas, distribuciones y trayectorias, y filtrar por categoría (Pilotos, Constructores, Carreras o Circuitos). Algunos ejemplos que se pueden encontrar entre las gráficas son:",

    chartExamples1: "Evolución de puntos por temporada.",
    chartExamples2: "Porcentaje de podios respecto a sus compañeros de equipo.",
    chartExamples3: "Posiciones medias de salida y llegada.",
    chartExamples4: "Delta entre clasificación y carrera.",
    chartExamples5: "Podios desde fuera del Top 10, dominancia de equipos por circuito, comparativas entre compañeros, rankings de fiabilidad, adelantamientos, velocidad en vuelta rápida, etc."

    }
    }
  },

  en: {
    about: {
      title: "What is OverCut?",
      intro: "OverCut is a complete Formula 1 platform where fans can explore, play and learn through interactive tools and advanced statistics.",

      posts: {
        title: "🗞️ Posts",
        desc: "The posts section presents analyses of current or historical F1 trends, along with the latest news from the world of Formula 1."
      },

      quiz: {
        title: "🧠 Quiz",
        desc: "Quizzes are question-based games across various F1-related themes. You can choose from six categories: Statistics, Regulations, Images, Strategy, Physics and TeamRadios.",

        statsTitle: "📊 Statistics",
        statsDesc: "Focuses on F1 data and records. Subcategories include general stats, driver-based and team-based achievements, comparisons and milestones from the history of the championship.",

        rulesTitle: "📘 Regulations",
        rulesDesc: "Questions related to the sporting regulations of F1. Includes topics such as tyres, safety car, red flags, point system, and various rule-related subcategories.",

        strategyTitle: "🎯 Strategy",
        strategyDesc: "Explore questions about real and hypothetical race strategies, including pit stops, tyre choices, team orders, and historic Grand Prix moments decided by tactics.",

        physicsTitle: "🧪 Physics",
        physicsDesc: "Covers physical concepts behind F1 car performance: aerodynamics, grip, braking, weight transfer, G-forces and more.",

        imagesTitle: "🖼️ Images",
        imagesDesc: "This visual category challenges users to identify drivers, teams, circuits or iconic F1 moments through images.",

        teamRadiosTitle: "🎙️ Team Radios",
        teamRadiosDesc: "This category features real team radio messages that defined unforgettable moments in Formula 1 history. From controversial team orders to iconic celebrations, these questions test your auditory memory and historical F1 knowledge.",

      },

      ranking: {
        title: "🏆 User Ranking",
        desc: "Every finished quiz earns you points. The leaderboard shows all players ranked by total points and grouped into tiers (F4, F3, F2, F1). Compete with others and climb to the top!"
      },

      games: {
        title: "🎮 OverCutGames",
        desc: "OverCutGames offers 16 different minigames about Formula 1. Each is based on real data and historical scenarios. Games use validated data, ensuring both fun and factual accuracy.",

        examplesTitle: "Examples of games:",
        example1: "Career Path Game – Guess which teams a driver raced for.",
        example2: "Tic Tac Toe F1 – 3-in-a-row using filters like champions, nationalities, teams...",
        example3: "Grid Game – Complete historical starting grids correctly.",
        example4: "Drivers Connections – Link drivers who shared a team or raced together.",
        example5: "Word Search – Find hidden names of drivers, circuits or teams.",
        example6: "F1 Impostor – Identify the item that doesn't belong.",
        example7: "Category Game – Sort drivers or teams based on their achievements.",
        moreExamples: "These are just a few examples… but there are many more!"
      },

    f1hub: {
      title: "📊 F1Hub: Data Center",
      desc: "F1Hub is the statistical core of OverCut. A data hub designed for fans who want to go beyond the headlines and explore Formula 1 through history, numbers and performance. It has two main sections: Tables and Charts.",

      tablesTitle: "📋 Table Section",
      tablesDesc: "Explore raw and structured F1 data through a clean and interactive interface. You can browse complete decades or focus on specific Grand Prix events.",

      sessions: "🏁 1. Session Results: View full results of any Grand Prix from 1950 to today by selecting year, GP (with country and circuit), and session: Race, Qualifying, Sprint or Practice (FP1, FP2, FP3). Each type has its own adapted table with times, positions, retirements, points, and team/nationality colors.",

      rankings: "🧠 2. Rankings & Records: Discover rankings ordered by metrics like most wins, titles, poles or podiums. Also includes unique records like wins without leading, birthday podiums, repeated front rows, etc. All organized in subcategories such as Championships 🏆, Wins 🏁, Podiums 🥉, Points 📈, Grand Prix 🗓️ and Special Stats 🔍.",

      championship: "📅 3. Championship Tracking: Follow the evolution of the championship per season. Select a year and see race-by-race points for each driver. Identify DNS and progression in a matrix view (columns = races, rows = drivers, cells = points).",

      chartsTitle: "📈 Charts Section",
      chartsDesc: "This section transforms data into intuitive, attractive, and fully customizable visualizations. What can you do? Compare drivers, teams, or seasons; visualize trends, streaks, distributions, and performance trajectories; and filter by category (Drivers, Constructors, Races, or Circuits). Some examples of the available charts include:",

      chartExamples1: "Points evolution per season.",
      chartExamples2: "Percentage of podiums compared to teammates.",
      chartExamples3: "Average starting and finishing positions.",
      chartExamples4: "Delta between qualifying and race.",
      chartExamples5: "Podiums from outside the Top 10, team dominance by circuit, teammate comparisons, reliability rankings, overtakes, fastest lap speeds, and more."


    }
    }
  }

};


const AboutOvercut = () => {
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang].about;

  return (
  <div className="about-overcut-wrapper">
    <div className="about-overcut-container">
      <h2 className="about-title">{t.title}</h2>
      <p className="about-paragraph">{t.intro}</p>

      {/* POSTS */}
      <h3>{t.posts.title}</h3>
      <p>{t.posts.desc}</p>

      {/* QUIZ */}
      <h3>{t.quiz.title}</h3>
      <p>{t.quiz.desc}</p>

      <h4>{t.quiz.statsTitle}</h4>
      <p>{t.quiz.statsDesc}</p>

      <h4>{t.quiz.rulesTitle}</h4>
      <p>{t.quiz.rulesDesc}</p>

      <h4>{t.quiz.strategyTitle}</h4>
      <p>{t.quiz.strategyDesc}</p>

      <h4>{t.quiz.physicsTitle}</h4>
      <p>{t.quiz.physicsDesc}</p>

      <h4>{t.quiz.imagesTitle}</h4>
      <p>{t.quiz.imagesDesc}</p>

      <h4>{t.quiz.teamRadiosTitle}</h4>
      <p>{t.quiz.teamRadiosDesc}</p>

      {/* RANKING */}
      <h3>{t.ranking.title}</h3>
      <p>{t.ranking.desc}</p>

      {/* MINIGAMES */}
      <h3>{t.games.title}</h3>
      <p>{t.games.desc}</p>

      <h4>{t.games.examplesTitle}</h4>
      <ul>
        <li>{t.games.example1}</li>
        <li>{t.games.example2}</li>
        <li>{t.games.example3}</li>
        <li>{t.games.example4}</li>
        <li>{t.games.example5}</li>
        <li>{t.games.example6}</li>
        <li>{t.games.example7}</li>
      </ul>
      <p>{t.games.moreExamples}</p>

      {/* F1HUB */}
      <h3>{t.f1hub.title}</h3>
      <p>{t.f1hub.desc}</p>

      <h4>{t.f1hub.tablesTitle}</h4>
      <ul>
        <li>{t.f1hub.sessions}</li>
        <li>{t.f1hub.rankings}</li>
        <li>{t.f1hub.championship}</li>
      </ul>

      <h4>{t.f1hub.chartsTitle}</h4>
      <p>{t.f1hub.chartsDesc}</p>

      <ul>
        <li>{t.f1hub.chartExamples1}</li>
        <li>{t.f1hub.chartExamples2}</li>
        <li>{t.f1hub.chartExamples3}</li>
        <li>{t.f1hub.chartExamples4}</li>
        <li>{t.f1hub.chartExamples5}</li>
      </ul>
    </div>
    </div>
  );
};

export default AboutOvercut;