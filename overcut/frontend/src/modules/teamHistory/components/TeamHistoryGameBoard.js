// src/modules/teamHistory/components/TeamHistoryGameBoard.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getTeamHistoryGame,
  getTeamHistorySeasons,
  getTeamHistoryMaxPosition,
  getTeamHistoryCompleted,
  getTeamHistoryRevealed
} from "../selectors";

import * as actions from "../actions";
import TeamHistorySeasonSlot from "./TeamHistorySeasonSlot";
import LoadingScreen from "../../common/components/LoadingScreen";
import "./TeamHistoryGame.css";

export default function TeamHistoryGameBoard({ onNewGame }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = {
    title: lang === "es" ? "Historia de Equipo" : "Team History",
    reveal: lang === "es" ? "Rendirse" : "Give up",
    loading: lang === "es" ? "Cargando..." : "Loading...",
    back: lang === "es" ? "Volver a inicio" : "Back home",
    newGame: lang === "es" ? "Nueva partida" : "New game"
  };

  const game = useSelector(getTeamHistoryGame);
  const seasons = useSelector(getTeamHistorySeasons);
  const maxPos = useSelector(getTeamHistoryMaxPosition);
  const completed = useSelector(getTeamHistoryCompleted);
  const revealed = useSelector(getTeamHistoryRevealed);

  if (!game) return <LoadingScreen lang={lang} text={t.loading} />;

  const label = game?.constructorName ? ` — ${game.constructorName}` : "";

  const handleReveal = () => {
    dispatch(
      actions.revealTeamHistoryGame(
        game.gameId,
        () => {
          dispatch(actions.clearTeamHistory());
          navigate("/minigames");
        },
        () => {
          dispatch(actions.clearTeamHistory());
          navigate("/minigames");
        }
      )
    );
  };

  return (
    <div className="team-history-container">
      <h2 className="team-history-title">
        <span className="team-history-title-main">{t.title}{label}</span>
      </h2>

      {!completed && !revealed && (
        <div className="team-history-actions">
          <button className="team-history-reveal" onClick={handleReveal} type="button">
            {t.reveal}
          </button>
        </div>
      )}

      {(completed || revealed) && (
        <button
          className="team-history-back-minigames"
          type="button"
          onClick={() => {
            dispatch(actions.clearTeamHistory());
            navigate("/minigames");
          }}
        >
          {t.back}
        </button>
      )}

      <div className="team-history-grid">
        {seasons.map((s) => (
          <TeamHistorySeasonSlot
            key={s.seasonYear}
            gameId={game.gameId}
            season={s}
            lang={lang}
            maxPosition={maxPos}
            disabled={completed || revealed || s.isCorrect != null}
          />
        ))}
      </div>
    </div>
  );
}
