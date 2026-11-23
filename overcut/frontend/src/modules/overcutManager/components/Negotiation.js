/**
 * Talking a driver into your car (RF-STF-04): what he asks on one side, your
 * offer on the other - salary, years, status and, for a new signing, when he
 * starts and which seat he takes - and the agent's patience in between.
 */

import React, { useMemo, useState } from "react";
import { PHASES } from "../engine/career";
import { ROLES, askingTerms, buyoutFee, makeOffer, marketStatusOf, signDriver, userTeam } from "../engine/market";
import { roundMoney } from "../engine/economy";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Flag, Meter, Rating, Segmented, Sheet } from "./atoms";
import { ROLE, money, t } from "./texts";
import "./styles/people.css";

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
  const rounds = talks?.rounds || 0;
  const min = Math.round(ask.salary * 0.4);
  const max = Math.round(ask.salary * 1.6);
  const askAt = ((ask.salary - min) / (max - min)) * 100;
  const versus = Math.round(((salary - ask.salary) / ask.salary) * 100);

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
    accepted: t("Trato hecho. Solo falta firmar.", "Deal. It only needs signing."),
    counter: t("Contraoferta: hemos ajustado tu oferta a lo que pide. Revísala y vuelve a intentarlo.", "Counter-offer: your offer now shows what he wants. Review it and try again."),
    rejected: t("Muy lejos de lo que pide.", "Far from what he wants."),
    walked: t("Se ha cansado de negociar contigo.", "He has had enough of talking to you."),
    "not-interested": t("No le interesa tu equipo.", "He is not interested in your team."),
    protected: t("Es de los mejores de la parrilla: su equipo no lo vende y tu proyecto no le basta.", "One of the best on the grid: his team will not sell and your project is not enough for him."),
    precontract: t("Ya ha firmado con otro equipo para el año que viene.", "He has already signed elsewhere for next year."),
  };
  const tone = { accepted: "pos", counter: "warn", rejected: "neg", walked: "neg", "not-interested": "neg", protected: "neg", precontract: "neg" };
  const where = driver.teamId && !own ? career.world.teams[driver.teamId]?.name : status === "junior" ? t("Promesa", "Prospect") : own ? userTeam(career).name : t("Libre", "Free agent");

  return (
    <Sheet open onClose={onClose} title={own ? t("Renovación", "Renewal") : t("Negociación", "Negotiation")} wide>
      <div className="mn-nego">
        <section className="mn-nego__ask" aria-label={t("Lo que pide", "What he asks")}>
          <header className="mn-nego__driver">
            <Rating value={driver.rating} size="lg" />
            <div>
              <h3>
                <Flag code={driver.nat} width={20} /> {driver.name}
              </h3>
              <p>
                {driver.age} {t("años", "yrs")} · {where}
              </p>
            </div>
          </header>
          <div className="mn-nego__interest">
            <span>{t("Interés en tu equipo", "Interest in your team")}</span>
            <b>{Math.round(ask.interest * 100)}%</b>
            <Meter value={ask.interest * 100} label={t("Interés en tu equipo", "Interest in your team")} />
          </div>
          <dl className="mn-nego__terms">
            <div>
              <dt>{t("Pide", "Asks for")}</dt>
              <dd>
                {money(ask.salary)}
                <small>/{t("año", "yr")}</small>
              </dd>
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
                <dt>{t("Cláusula de salida", "Release fee")}</dt>
                <dd>{money(fee)}</dd>
              </div>
            )}
          </dl>
          <div className="mn-nego__patience">
            <span>{t("Paciencia del agente", "Agent's patience")}</span>
            <span className="mn-nego__pips" aria-label={t(`${rounds} de ${ask.patience} rondas`, `${rounds} of ${ask.patience} rounds`)}>
              {Array.from({ length: ask.patience }, (_, index) => (
                <i key={index} className={index < rounds ? "is-used" : ""} />
              ))}
            </span>
            <small>{t(`Rondas: ${rounds}/${ask.patience}`, `Rounds: ${rounds}/${ask.patience}`)}</small>
          </div>
          {answer && <p className={`mn-nego__answer is-${tone[answer.status] || "neutral"}`}>{answerText[answer.status] || ""}</p>}
        </section>

        <section className="mn-nego__offer" aria-label={t("Tu oferta", "Your offer")}>
          <h4>{t("Tu oferta", "Your offer")}</h4>
          <label className="mn-nego__salary">
            <span className="mn-nego__label">
              {t("Salario por temporada", "Salary per season")}
              <b>{money(salary)}</b>
              <small className={versus < 0 ? "is-neg" : versus > 0 ? "is-pos" : ""}>
                {versus === 0 ? t("lo que pide", "what he asks") : t(`${versus > 0 ? "+" : "−"}${Math.abs(versus)} % vs. lo que pide`, `${versus > 0 ? "+" : "−"}${Math.abs(versus)}% vs his ask`)}
              </small>
            </span>
            <span className="mn-nego__range" style={{ "--ask": askAt.toFixed(2) }}>
              <input type="range" min={min} max={max} step={Math.max(1000, Math.round(ask.salary / 100))} value={salary} onChange={(event) => setSalary(Number(event.target.value))} />
              <i aria-hidden="true" title={t("Lo que pide", "What he asks")} />
            </span>
          </label>
          <div className="mn-nego__field">
            <span className="mn-nego__label">{t("Años", "Years")}</span>
            <Segmented label={t("Años", "Years")} value={years} onChange={setYears} options={[1, 2, 3].map((value) => ({ value, label: String(value) }))} />
          </div>
          <div className="mn-nego__field">
            <span className="mn-nego__label">{t("Estatus", "Status")}</span>
            <Segmented label={t("Estatus", "Status")} value={role} onChange={setRole} options={ROLES.map((value) => ({ value, label: ROLE[value]() }))} />
          </div>
          {!own && (
            <div className="mn-nego__pair">
              <div className="mn-nego__field">
                <span className="mn-nego__label">{t("Empieza", "Starts")}</span>
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
              <div className="mn-nego__field">
                <span className="mn-nego__label">{t("Asiento", "Seat")}</span>
                <Segmented label={t("Asiento", "Seat")} value={seat} onChange={setSeat} options={[{ value: "race", label: t("Titular", "Race seat") }, { value: "reserve", label: t("Reserva", "Reserve") }]} />
              </div>
            </div>
          )}
          {!own && start === "now" && seat === "race" && current.length >= 2 && (
            <label className="mn-nego__field">
              <span className="mn-nego__label">{t("Sustituye a", "Replaces")}</span>
              <select className="mn-nego__select" value={replace || ""} onChange={(event) => setReplace(event.target.value)}>
                {current.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && <p className="mn-error">{error === "money" ? t("No tienes dinero para la cláusula.", "You cannot afford the release fee.") : error === "not-now" ? t("Solo puede venir la próxima temporada.", "He can only join next season.") : t("No se pudo cerrar el fichaje.", "The signing could not be completed.")}</p>}
        </section>

        <footer className="mn-nego__actions">
          {talks?.agreed ? (
            <button type="button" className="mn-btn mn-btn--primary" onClick={sign}>
              {t("Firmar", "Sign")}
            </button>
          ) : (
            <button type="button" className="mn-btn mn-btn--primary" disabled={talks?.walked} onClick={offer}>
              {t("Hacer oferta", "Make offer")}
            </button>
          )}
          <button type="button" className="mn-btn mn-btn--ghost" onClick={onClose}>
            {t("Cerrar", "Close")}
          </button>
          <small>{t(`Oferta de ${userTeam(career).name}`, `Offer from ${userTeam(career).name}`)}</small>
        </footer>
      </div>
    </Sheet>
  );
}
