/**
 * Talking a driver into your car: salary, years, status - and, for a new
 * signing, when he starts and which seat he takes.
 */

import React, { useMemo, useState } from "react";
import { PHASES } from "../engine/career";
import { ROLES, askingTerms, buyoutFee, makeOffer, marketStatusOf, signDriver, userTeam } from "../engine/market";
import { roundMoney } from "../engine/economy";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Bar, Flag, Rating, Segmented, Sheet } from "./atoms";
import { ROLE, money, t } from "./texts";

export default function Negotiation({ driverId, onClose }) {
  const { career, act } = useManager();
  const driver = career.world.drivers[driverId];
  const status = driver ? marketStatusOf(career, driver) : null;
  const ask = useMemo(() => (driver ? career.market.talks[driverId]?.ask || askingTerms(career, driver) : null), [career, driver, driverId]);
  const [salary, setSalary] = useState(() => (ask ? roundMoney(ask.salary * 0.9) : 0));
  const [years, setYears] = useState(ask?.years || 2);
  const [role, setRole] = useState(ask?.role || "equal");
  const winter = career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;
  const canStartNow = !winter && ["free", "junior", "reserve"].includes(status);
  const [start, setStart] = useState(canStartNow ? "now" : "next");
  const [seat, setSeat] = useState("race");
  const current = driversOf(career.world, career.teamId);
  const [replace, setReplace] = useState(current[current.length - 1]?.id || null);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  if (!driver || !ask) return null;

  const fee = status === "contracted" ? buyoutFee(career, driver) : 0;
  const talks = career.market.talks[driverId];
  const own = status === "own";

  const offer = () => {
    const result = act((c) => makeOffer(c, driverId, { salary, years, role, start }));
    setAnswer(result);
    if (result?.status === "counter") {
      setSalary(result.counter.salary);
      setRole(result.counter.role);
      setYears(result.counter.years);
    }
  };

  const sign = () => {
    const result = act((c) => signDriver(c, driverId, { start: own ? "next" : start, seat, replace }));
    if (result?.ok) onClose();
    else setError(result?.error || "error");
  };

  const answerText = {
    accepted: t("¡Trato hecho! Solo falta firmar.", "Deal! It only needs signing."),
    counter: t("Contraoferta: ajusta y vuelve a intentarlo.", "Counter-offer: adjust and try again."),
    rejected: t("Muy lejos de lo que pide.", "Far from what he wants."),
    walked: t("Se ha cansado de negociar contigo.", "He has had enough of talking to you."),
    "not-interested": t("No le interesa tu equipo.", "He is not interested in your team."),
  };

  return (
    <Sheet open onClose={onClose} title={own ? t("Renovación", "Renewal") : t("Negociación", "Negotiation")} wide>
      <div className="mn-negotiation">
        <header className="mn-negotiation__driver">
          <Rating value={driver.rating} size="lg" />
          <div>
            <h3>
              <Flag code={driver.nat} /> {driver.name}
            </h3>
            <span>
              {driver.age} {t("años", "yrs")} · {driver.teamId && !own ? career.world.teams[driver.teamId]?.name : status === "junior" ? t("Promesa", "Prospect") : t("Libre", "Free agent")}
            </span>
          </div>
        </header>
        <Bar label={t("Interés en tu equipo", "Interest in your team")} value={ask.interest * 100} caption={`${Math.round(ask.interest * 100)}%`} tone={ask.interest < 0.35 ? "red" : "green"} />
        <dl className="mn-facts mn-facts--tight">
          <div>
            <dt>{t("Pide", "Asks for")}</dt>
            <dd>{money(ask.salary)}</dd>
          </div>
          <div>
            <dt>{t("Años", "Years")}</dt>
            <dd>{ask.years}</dd>
          </div>
          <div>
            <dt>{t("Estatus", "Status")}</dt>
            <dd>{ROLE[ask.role]()}</dd>
          </div>
          {fee > 0 && (
            <div>
              <dt>{t("Cláusula", "Release fee")}</dt>
              <dd>{money(fee)}</dd>
            </div>
          )}
        </dl>

        <label className="mn-field">
          <span>
            {t("Salario por temporada", "Salary per season")}: <b>{money(salary)}</b>
          </span>
          <input type="range" className="mn-range" min={Math.round(ask.salary * 0.4)} max={Math.round(ask.salary * 1.6)} step={Math.max(1000, Math.round(ask.salary / 100))} value={salary} onChange={(event) => setSalary(Number(event.target.value))} />
        </label>
        <div className="mn-field-row">
          <div className="mn-field">
            <span>{t("Años", "Years")}</span>
            <Segmented label={t("Años", "Years")} value={years} onChange={setYears} options={[1, 2, 3].map((value) => ({ value, label: String(value) }))} />
          </div>
          <div className="mn-field">
            <span>{t("Estatus", "Status")}</span>
            <Segmented label={t("Estatus", "Status")} value={role} onChange={setRole} options={ROLES.map((value) => ({ value, label: ROLE[value]() }))} />
          </div>
        </div>
        {!own && (
          <div className="mn-field-row">
            <div className="mn-field">
              <span>{t("Empieza", "Starts")}</span>
              <Segmented
                label={t("Empieza", "Starts")}
                value={start}
                onChange={setStart}
                options={[
                  { value: "now", label: t("Ahora", "Now"), disabled: !canStartNow },
                  { value: "next", label: String(career.year + 1) },
                ]}
              />
            </div>
            <div className="mn-field">
              <span>{t("Asiento", "Seat")}</span>
              <Segmented label={t("Asiento", "Seat")} value={seat} onChange={setSeat} options={[{ value: "race", label: t("Titular", "Race seat") }, { value: "reserve", label: t("Reserva", "Reserve") }]} />
            </div>
          </div>
        )}
        {!own && start === "now" && seat === "race" && current.length >= 2 && (
          <label className="mn-field">
            <span>{t("Sustituye a", "Replaces")}</span>
            <select className="mn-input" value={replace || ""} onChange={(event) => setReplace(event.target.value)}>
              {current.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {answer && <p className={`mn-answer is-${answer.status}`}>{answerText[answer.status] || ""}</p>}
        {error && <p className="mn-error">{error === "money" ? t("No tienes dinero para la cláusula.", "You cannot afford the release fee.") : error === "not-now" ? t("Solo puede venir la próxima temporada.", "He can only join next season.") : t("No se pudo cerrar el fichaje.", "The signing could not be completed.")}</p>}
        <div className="mn-negotiation__actions">
          {talks?.agreed ? (
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={sign}>
              {t("Firmar", "Sign")}
            </button>
          ) : (
            <button type="button" className="mn-btn mn-btn--primary" disabled={talks?.walked} onClick={offer}>
              {t("Hacer oferta", "Make offer")}
            </button>
          )}
          <span className="mn-muted">
            {t(`Rondas: ${talks?.rounds || 0}/${ask.patience}`, `Rounds: ${talks?.rounds || 0}/${ask.patience}`)} · {userTeam(career).name}
          </span>
        </div>
      </div>
    </Sheet>
  );
}
