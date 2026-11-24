/**
 * A session's gate (session-options-transition, docs/manager/F1M24-GAMEPLAY.md §2.12.2;
 * RF-WKD-01, RF-WKD-02, RF-WKD-07): before each session of the weekend, what it is (name, the
 * local start where the pack or the era's clock knows it, its format) and how to take it -
 * manage it from the pit wall, simulate it now, or simulate everything up to the race - with
 * a confirmation (weekend-ui.json gate). Presentational: the weekend screen does the work.
 */

import React, { useState } from "react";
import balance from "../data/balance/weekend-ui.json";
import { Panel } from "./atoms";
import { IconCheck, IconFastForward, IconFlag, IconNextEvent } from "./icons";
import { t } from "./texts";
import "./styles/session-flow.css";

/** The choices a gate offers: "up to the race" only when it skips more than this session. */
export const gateChoices = ({ toRace = false } = {}) => ["manage", "simulate", ...(toRace ? ["toRace"] : [])];

const CHOICE_TEXT = {
  manage: () => [t("Gestionar la sesión", "Manage the session"), t("Desde el muro: tandas, órdenes y decisiones.", "From the pit wall: runs, orders and calls.")],
  simulate: () => [t("Simular la sesión", "Simulate the session"), t("Los ingenieros la corren por ti, con riesgo normal.", "The engineers run it for you, at normal risk.")],
  toRace: () => [t("Simular hasta la carrera", "Simulate up to the race"), t("Todas las sesiones que quedan, hasta la estrategia del domingo.", "Every session left, up to Sunday's strategy.")],
};

const ICON = { manage: IconFlag, simulate: IconFastForward, toRace: IconNextEvent };

/** "14:30" from seconds after midnight. */
export const clockText = (seconds) => {
  if (!Number.isFinite(seconds)) return null;
  const minutes = Math.floor(seconds / 60) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export default function SessionGate({ title, subtitle, details = [], toRace = false, onChoose, config = balance.gate }) {
  const choices = gateChoices({ toRace });
  const [choice, setChoice] = useState(choices.includes(config.defaultChoice) ? config.defaultChoice : choices[0]);
  const pick = (value) => {
    if (config.confirm) setChoice(value);
    else onChoose(value);
  };
  return (
    <div className="wk-page">
      <div className="wk-c12">
        <Panel title={title} meta={subtitle} className="wk-gate">
          {details.length > 0 && (
            <dl className="wk-gate__facts">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="wk-gate__choices" role="radiogroup" aria-label={t("Cómo jugar la sesión", "How to play the session")}>
            {choices.map((value) => {
              const [label, hint] = CHOICE_TEXT[value]();
              const Icon = ICON[value];
              return (
                <button key={value} type="button" role="radio" aria-checked={choice === value} className={`wk-gate__choice${choice === value ? " is-active" : ""}`} onClick={() => pick(value)}>
                  <Icon size={20} />
                  <span>
                    <b>{label}</b>
                    <small>{hint}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {config.confirm && (
            <div className="wk-actions">
              <p className="mn-hint">{CHOICE_TEXT[choice]()[0]}</p>
              <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={() => onChoose(choice)}>
                <IconCheck size={16} />
                {t("Confirmar", "Confirm")}
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
