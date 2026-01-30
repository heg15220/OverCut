import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import LoadingScreen from "../../common/components/LoadingScreen";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";


import { sourceImages } from "../../../helpers/sourceMiniGamesImages";

import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import "./DriverStatsGame.css";

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const RACE_BINS = [
  { id: "0-49", labelEs: "0 - 49", labelEn: "0 - 49" },
  { id: "50-99", labelEs: "50 - 99", labelEn: "50 - 99" },
  { id: "100-149", labelEs: "100 - 149", labelEn: "100 - 149" },
  { id: "150-199", labelEs: "150 - 199", labelEn: "150 - 199" },
  { id: "200-249", labelEs: "200 - 249", labelEn: "200 - 249" },
  { id: "250-299", labelEs: "250 - 299", labelEn: "250 - 299" },
  { id: "300-349", labelEs: "300 - 349", labelEn: "300 - 349" },
  { id: "350-399", labelEs: "350 - 399", labelEn: "350 - 399" },
  { id: "400+", labelEs: "400 o más", labelEn: "400+" }
];

const POINTS_BINS = [
  { id: "0-99", labelEs: "0 - 99", labelEn: "0 - 99" },
  { id: "100-299", labelEs: "100 - 299", labelEn: "100 - 299" },
  { id: "300-499", labelEs: "300 - 499", labelEn: "300 - 499" },
  { id: "500-999", labelEs: "500 - 999", labelEn: "500 - 999" },
  { id: "1000-1499", labelEs: "1000 - 1499", labelEn: "1000 - 1499" },
  { id: "1500-1999", labelEs: "1500 - 1999", labelEn: "1500 - 1999" },
  { id: "2000-2999", labelEs: "2000 - 2999", labelEn: "2000 - 2999" },
  { id: "3000+", labelEs: "3000 o más", labelEn: "3000+" }
];

export default function DriverStatsGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const game = useSelector(selectors.getGame);

  const [showTutorial, setShowTutorial] = useState(true);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "DriverStats")
  );

  useEffect(() => {
    dispatch(fetchCooldown("DriverStats"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) dispatch(actions.startDriverStatsGame());
  }, [dispatch, canPlay]);

  const tutorial = tutorialTexts["/minigames/driverStats"]?.[lang] || {
    title: lang === "es" ? "Driver Stats" : "Driver Stats",
    description:
      lang === "es"
        ? "Adivina las estadísticas del piloto (victorias, podios, equipos, carreras, mundiales, puntos y temporadas). Carreras y puntos se estiman por rangos."
        : "Guess the driver’s stats (wins, podiums, teams, races, championships, points and seasons). Races and points are estimated by ranges."
  };

  const options = useMemo(() => {
    return {
      wins: range(0, 105),
      podiums: range(0, 210),
      teams: range(1, 12),
      titles: range(0, 8),
      seasons: range(1, 25),
      races: RACE_BINS,
      points: POINTS_BINS
    };
  }, []);

  const [answers, setAnswers] = useState({
    wins: "",
    podiums: "",
    teams: "",
    racesBin: "",
    titles: "",
    pointsBin: "",
    seasons: ""
  });

  useEffect(() => {
    // cada partida nueva resetea inputs
    if (game?.id) {
      setAnswers({
        wins: "",
        podiums: "",
        teams: "",
        racesBin: "",
        titles: "",
        pointsBin: "",
        seasons: ""
      });
    }
  }, [game?.id]);

  const allSelected =
    answers.wins !== "" &&
    answers.podiums !== "" &&
    answers.teams !== "" &&
    answers.racesBin !== "" &&
    answers.titles !== "" &&
    answers.pointsBin !== "" &&
    answers.seasons !== "";

  const submit = () => {
    if (!game || game.finished) return;
    if (!allSelected) return;

    dispatch(
      actions.submitDriverStats({
        gameId: game.id,
        answers: {
          wins: Number(answers.wins),
          podiums: Number(answers.podiums),
          teams: Number(answers.teams),
          racesBin: answers.racesBin,     // string (bin)
          titles: Number(answers.titles),
          pointsBin: answers.pointsBin,   // string (bin)
          seasons: Number(answers.seasons)
        }
      })
    );
  };

  if (loading) return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando..." : "Loading..."} />;

  if (!canPlay) return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages("./DriverStats.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} />;

  return (
    <div className="driver-stats">
      <div className="ds-header">
        <h2 className="ds-title">DRIVER STATS</h2>
      </div>

      <div className="ds-driver">
        {lang === "es" ? "Piloto:" : "Driver:"} <b>{game.driverName}</b>
      </div>

      {!game.finished ? (
        <>
          <div className="ds-grid">
            <label className="ds-field">
              <span>{lang === "es" ? "Victorias" : "Wins"}</span>
              <select value={answers.wins} onChange={(e) => setAnswers({ ...answers, wins: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona" : "Select"}</option>
                {options.wins.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="ds-field">
              <span>{lang === "es" ? "Podios" : "Podiums"}</span>
              <select value={answers.podiums} onChange={(e) => setAnswers({ ...answers, podiums: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona" : "Select"}</option>
                {options.podiums.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="ds-field">
              <span>{lang === "es" ? "Número de equipos" : "Teams"}</span>
              <select value={answers.teams} onChange={(e) => setAnswers({ ...answers, teams: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona" : "Select"}</option>
                {options.teams.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="ds-field">
              <span>{lang === "es" ? "Carreras (aprox.)" : "Races (approx.)"}</span>
              <select value={answers.racesBin} onChange={(e) => setAnswers({ ...answers, racesBin: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona rango" : "Select range"}</option>
                {options.races.map((b) => (
                  <option key={b.id} value={b.id}>{lang === "es" ? b.labelEs : b.labelEn}</option>
                ))}
              </select>
            </label>

            <label className="ds-field">
              <span>{lang === "es" ? "Campeonatos del mundo" : "World titles"}</span>
              <select value={answers.titles} onChange={(e) => setAnswers({ ...answers, titles: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona" : "Select"}</option>
                {options.titles.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="ds-field">
              <span>{lang === "es" ? "Puntos (aprox.)" : "Points (approx.)"}</span>
              <select value={answers.pointsBin} onChange={(e) => setAnswers({ ...answers, pointsBin: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona rango" : "Select range"}</option>
                {options.points.map((b) => (
                  <option key={b.id} value={b.id}>{lang === "es" ? b.labelEs : b.labelEn}</option>
                ))}
              </select>
            </label>

            <label className="ds-field">
              <span>{lang === "es" ? "Temporadas" : "Seasons"}</span>
              <select value={answers.seasons} onChange={(e) => setAnswers({ ...answers, seasons: e.target.value })}>
                <option value="">{lang === "es" ? "Selecciona" : "Select"}</option>
                {options.seasons.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>

          <button className="ds-submit" disabled={!allSelected} onClick={submit}>
            {lang === "es" ? "Validar" : "Validate"}
          </button>

          <button className="ds-back" onClick={() => navigate("/minigames")}>
            ⬅️ {lang === "es" ? "Volver" : "Back"}
          </button>
        </>
      ) : (
        <div className="ds-result">
          <h3>{lang === "es" ? "Resultado" : "Result"}</h3>
          <p>
            {lang === "es"
              ? `Aciertos: ${game.correctCount} / 7`
              : `Correct: ${game.correctCount} / 7`}
          </p>

          {/* opcional: mostrar detalle */}
          <div className="ds-detail">
            {game.details?.map((row, idx) => (
              <div key={idx} className={`ds-row ${row.correct ? "ok" : "bad"}`}>
                <span className="ds-rowLabel">{row.label}</span>
                <span className="ds-rowAns">{row.user}</span>
                <span className="ds-rowTrue">{row.actual}</span>
                <span>{row.correct ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>

          <button className="ds-back" onClick={() => navigate("/minigames")}>
            ⬅️ {lang === "es" ? "Volver al inicio" : "Back home"}
          </button>
        </div>
      )}
    </div>
  );
}
