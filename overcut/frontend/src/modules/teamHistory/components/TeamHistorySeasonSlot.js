// src/modules/teamHistory/components/TeamHistorySeasonSlot.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import * as actions from "../actions";
import "./TeamHistoryGame.css";

export default function TeamHistorySeasonSlot({ gameId, season, lang, maxPosition, disabled }) {
  const dispatch = useDispatch();
  const [value, setValue] = useState(season.userGuess ?? "");
  const prevStatusRef = useRef(season.isCorrect);
  const [anim, setAnim] = useState("");

  useEffect(() => setValue(season.userGuess ?? ""), [season.userGuess]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const next = season.isCorrect;
    if (prev == null && next != null) {
      setAnim(next ? "pop-correct" : "pop-wrong");
      const t = setTimeout(() => setAnim(""), 450);
      return () => clearTimeout(t);
    }
    prevStatusRef.current = next;
  }, [season.isCorrect]);

  const positions = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= (maxPosition || 12); i++) arr.push(i);
    return arr;
  }, [maxPosition]);

  const statusClass = season.isCorrect == null ? "" : (season.isCorrect ? "correct" : "wrong");

  const onChange = (e) => {
    const guess = e.target.value === "" ? null : Number(e.target.value);
    setValue(e.target.value);
    if (guess == null) return;

    dispatch(actions.validateTeamHistoryGuess(gameId, season.seasonYear, guess, () => {}, () => {}));
  };

  return (
    <div className={`team-history-slot ${statusClass} ${anim}`}>
      <div className="team-history-slot-top">
        <div className="team-history-year">{season.seasonYear}</div>

        {season.isCorrect != null && (
          <span className={`team-history-result-pill ${season.isCorrect ? "ok" : "bad"}`}>
            {season.isCorrect ? "✓" : "✕"}
          </span>
        )}
      </div>

      <select
        className="team-history-select"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{lang === "es" ? "Elige posición…" : "Pick position…"}</option>
        {positions.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
