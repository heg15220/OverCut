import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import * as actions from "../actions";
import "./DriverSeasonGame.css";

/**
 * Normaliza strings: trim, lower, sin acentos, espacios colapsados.
 */
const normalizeKey = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

/**
 * Mapa robusto: claves normalizadas -> iso2
 * (añade aquí todos los sinónimos que te salgan del backend)
 */
const COUNTRY_TO_FLAG = {
  // Spain
  "spain": "es",
  "espana": "es",
  "españa": "es",

  // UK
  "united kingdom": "gb",
  "uk": "gb",
  "great britain": "gb",
  "britain": "gb",

  // USA
  "united states": "us",
  "united states of america": "us",
  "usa": "us",

  // UAE (Abu Dhabi)
  "united arab emirates": "ae",
  "uae": "ae",
  "abu dhabi": "ae",

  // Common F1
  "italy": "it",
  "france": "fr",
  "germany": "de",
  "japan": "jp",
  "saudi arabia": "sa",
  "qatar": "qa",
  "mexico": "mx",
  "canada": "ca",
  "australia": "au",
  "netherlands": "nl",
  "austria": "at",
  "belgium": "be",
  "monaco": "mc",
  "hungary": "hu",
  "singapore": "sg",
  "azerbaijan": "az",
  "bahrain": "bh",
  "brazil": "br",
  "china": "cn",

  // Por si te llegan así:
  "czech republic": "cz",
  "czechia": "cz",
  "south korea": "kr",
  "korea": "kr",
  "turkey": "tr",
  "russia": "ru",
  "malaysia": "my",
  "south africa": "za",
  "argentina": "ar",
  "portugal": "pt",
  "sweden": "se",
  "switzerland": "ch",
  "india": "in",
};

const flagCodeFromCountry = (country) => {
  const k = normalizeKey(country);
  return COUNTRY_TO_FLAG[k] || null;
};

const DriverSeasonRoundSlot = ({ gameId, round, lang, maxPosition, disabled }) => {
  const dispatch = useDispatch();
  const [value, setValue] = useState(round.userGuess ?? "");
  const [flagOk, setFlagOk] = useState(true);

  // ✅ para animar solo cuando cambia null -> correct/wrong
  const prevStatusRef = useRef(round.isCorrect);
  const [anim, setAnim] = useState(""); // "pop-correct" | "pop-wrong"

  useEffect(() => {
    const prev = prevStatusRef.current;
    const next = round.isCorrect;

    // dispara animación solo al “resolver” el slot
    if (prev == null && next != null) {
      setAnim(next ? "pop-correct" : "pop-wrong");
      const t = setTimeout(() => setAnim(""), 450);
      return () => clearTimeout(t);
    }

    prevStatusRef.current = next;
  }, [round.isCorrect]);

  useEffect(() => {
    // si te llega un nuevo round con guess distinto, sincroniza el select
    setValue(round.userGuess ?? "");
  }, [round.userGuess]);

  const gpName =
    lang === "es"
      ? (round.raceNameEs || round.raceNameEn)
      : (round.raceNameEn || round.raceNameEs);

  const flagCode = useMemo(() => flagCodeFromCountry(round.country), [round.country]);

  const statusClass =
    round.isCorrect == null ? "" : (round.isCorrect ? "correct" : "wrong");

  const positions = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= (maxPosition || 20); i++) arr.push(i);
    return arr;
  }, [maxPosition]);

  const onChange = (e) => {
    const guess = e.target.value === "" ? null : Number(e.target.value);
    setValue(e.target.value);

    if (guess == null) return;

    dispatch(
      actions.validateDriverSeasonGuess(
        gameId,
        round.raceId,
        guess,
        () => {},
        () => {}
      )
    );
  };

  return (
    <div className={`driver-season-slot ${statusClass} ${anim}`}>
      <div className="driver-season-slot-top">
        <div className="driver-season-round-badge">
          {lang === "es" ? "Ronda" : "Round"} {round.roundNumber}
        </div>

        {flagCode && flagOk ? (
          <img
            className="driver-season-flag"
            src={`https://flagcdn.com/w40/${flagCode}.png`}
            alt={round.country}
            title={round.country}
            loading="lazy"
            onError={() => setFlagOk(false)} // ✅ fallback si 404 o bloqueo
          />
        ) : (
          <div className="driver-season-flag-fallback" title={round.country}>
            {round.country?.slice(0, 2)?.toUpperCase() || "??"}
          </div>
        )}
      </div>

      <div className="driver-season-race-name">{gpName}</div>

      <div className="driver-season-select-row">
        <div className="driver-season-select-wrap">
          <select
            className="driver-season-select"
            value={value}
            onChange={onChange}
            disabled={disabled}
          >
            <option value="">
              {lang === "es" ? "Elige posición…" : "Pick position…"}
            </option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Indicador visual al resolver */}
          {round.isCorrect != null && (
            <span className={`driver-season-result-pill ${round.isCorrect ? "ok" : "bad"}`}>
              {round.isCorrect ? "✓" : "✕"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverSeasonRoundSlot;
