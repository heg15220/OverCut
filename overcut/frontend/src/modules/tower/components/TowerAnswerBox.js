// src/modules/tower/components/TowerAnswerBox.jsx
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import * as actions from "../actions";

const MIN_ATTEMPTS_TO_ANSWER = 5;

const TowerAnswerBox = ({ lang, gameId, themesCatalog, attempts }) => {
  const dispatch = useDispatch();
  const [themeType, setThemeType] = useState("");
  const [themeKey, setThemeKey] = useState("");

  const t = useMemo(() => {
    return {
      title: lang === "es" ? "🎯 Responder" : "🎯 Answer",
      theme: lang === "es" ? "Temática" : "Theme",
      option: lang === "es" ? "Respuesta" : "Answer",
      send: lang === "es" ? "Enviar" : "Submit",
      pickTheme: lang === "es" ? "— Selecciona temática —" : "— Select theme —",
      pickOption: lang === "es" ? "— Selecciona opción —" : "— Select option —",
      locked: lang === "es"
        ? `Disponible tras ${MIN_ATTEMPTS_TO_ANSWER} intentos`
        : `Available after ${MIN_ATTEMPTS_TO_ANSWER} attempts`,
    };
  }, [lang]);

  const themes = themesCatalog?.themes || [];
  const selected = themes.find((x) => x.type === themeType);
  const requiresKey = !!selected?.requiresKey;
  const options = selected?.options || [];
  const keyKind = selected?.keyKind || null;

  const canAnswer = attempts >= MIN_ATTEMPTS_TO_ANSWER;
  const canSubmit =
    canAnswer &&
    !!themeType &&
    (!requiresKey || (requiresKey && themeKey?.trim())) &&
    keyKind !== "driver"; // si luego quieres, metemos autocomplete driver aquí

  return (
    <div className="tower-answerCard">
      <div className="tower-answerTitle">{t.title}</div>

      <label className="tower-label">{t.theme}</label>
      <select
        className="tower-select"
        value={themeType}
        disabled={!canAnswer}
        onChange={(e) => {
          setThemeType(e.target.value);
          setThemeKey("");
        }}
      >
        <option value="">{t.pickTheme}</option>
        {themes.map((th) => (
          <option key={th.type} value={th.type}>
            {th.type}
          </option>
        ))}
      </select>

      {themeType && requiresKey && keyKind !== "driver" && (
        <>
          <label className="tower-label" style={{ marginTop: 10 }}>
            {t.option}
          </label>
          <select
            className="tower-select"
            value={themeKey}
            disabled={!canAnswer}
            onChange={(e) => setThemeKey(e.target.value)}
          >
            <option value="">{t.pickOption}</option>
            {options.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </>
      )}

      {themeType && requiresKey && keyKind === "driver" && (
        <div className="tower-muted" style={{ marginTop: 10 }}>
          {lang === "es"
            ? "Este modo requiere elegir un piloto. Si quieres, lo conectamos con autocomplete."
            : "This mode requires choosing a driver. If you want, we can wire it to autocomplete."}
        </div>
      )}

      {!canAnswer && <div className="tower-muted" style={{ marginTop: 10 }}>{t.locked}</div>}

      <div className="tower-setupActions" style={{ marginTop: 12 }}>
        <button
          className="tower-tryBtn"
          type="button"
          disabled={!canSubmit}
          onClick={() => dispatch(actions.answerTower(gameId, themeType, themeKey))}
        >
          {t.send}
        </button>
      </div>
    </div>
  );
};

export default TowerAnswerBox;
