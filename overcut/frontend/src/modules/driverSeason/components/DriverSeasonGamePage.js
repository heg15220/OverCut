// src/modules/driverSeason/components/DriverSeasonGamePage.js
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import { getDriverSeasonGame } from "../selectors";

import LoadingScreen from "../../common/components/LoadingScreen";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";

import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";

import DriverSeasonGameBoard from "./DriverSeasonGameBoard";
import "./DriverSeasonGame.css";

const getLang = () => (navigator.language?.startsWith("es") ? "es" : "en");

const DriverSeasonGamePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = getLang();
  const [showTutorial, setShowTutorial] = useState(true);

  const game = useSelector(getDriverSeasonGame);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "DriverSeasonGame")
  );

  const tutorial = tutorialTexts["/minigames/driverSeason"]?.[lang] || {
    title: lang === "es" ? "Driver Season" : "Driver Season",
    description:
      lang === "es"
        ? "Adivina la posición final del piloto en cada Gran Premio de esa temporada."
        : "Guess the driver’s finishing position for each race of that season."
  };

  // 1) Traer cooldown
  useEffect(() => {
    dispatch(fetchCooldown("DriverSeasonGame"));
  }, [dispatch]);

  // 2) Crear partida al poder jugar
  useEffect(() => {
    if (!canPlay) return;
    if (game?.gameId) return; // evita doble start si ya está cargado

    dispatch(
      actions.startDriverSeasonGame(
        lang,
        () => {},
        () => {}
      )
    );
  }, [canPlay, dispatch, lang, game?.gameId]);

  // ✅ Acción para “Nueva partida”
  // - limpia store
  // - refresca cooldown (por si acabas de jugar y te bloquea)
  // - si canPlay sigue true, dispara start en el useEffect
  const handleNewGame = () => {
    dispatch(actions.clearDriverSeason());

    // importante: refresca cooldown primero (por si acabas de consumirlo)
    dispatch(fetchCooldown("DriverSeasonGame", () => {
      // si tras refrescar sigue pudiendo jugar, arrancas ya
      dispatch(actions.startDriverSeasonGame(lang, () => {}, () => {}));
    }));
  };


  if (loading) {
    return (
      <LoadingScreen
        lang={lang}
        text={lang === "es" ? "Cargando..." : "Loading..."}
      />
    );
  }

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
        image={sourceImages(`./DriverSeason.png`)}
        onStart={() => {
          setShowTutorial(false);

          // si quieres SIEMPRE nueva partida al entrar:
          dispatch(actions.clearDriverSeason());
          dispatch(actions.startDriverSeasonGame(lang, () => {}, () => {}));
        }}
        lang={lang}
      />
    );
  }


  // Si aún no hay game, loading
  if (!game) {
    return (
      <LoadingScreen
        lang={lang}
        text={lang === "es" ? "Cargando juego..." : "Loading game..."}
      />
    );
  }

  return (
    <div className="driver-season-page">
      <DriverSeasonGameBoard onNewGame={handleNewGame} />
    </div>
  );
};

export default DriverSeasonGamePage;
