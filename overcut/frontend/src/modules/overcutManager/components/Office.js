/** The principal's office: objectives, money, reputation and the record. */

import React from "react";
import { objectiveStatus } from "../engine/board";
import { costCapFor } from "../engine/economy";
import { useManager } from "./context";
import { Bar, Empty, Panel, Stat, TeamBadge } from "./atoms";
import { OBJECTIVE_STATE, money, objectiveText, ordinal, t } from "./texts";

const LEDGER = {
  "race-income": () => t("Ingresos del GP", "Race income"),
  "race-costs": () => t("Gastos del GP", "Race costs"),
  development: () => t("Desarrollo", "Development"),
  release: () => t("Indemnización", "Compensation"),
  buyout: () => t("Cláusula", "Release fee"),
  severance: () => t("Despido", "Severance"),
  "staff-fee": () => t("Traspaso de personal", "Staff fee"),
  appeal: () => t("Recurso", "Appeal"),
  supplier: () => t("Proveedor", "Supplier"),
  facility: () => t("Fábrica", "Factory"),
  test: () => t("Test", "Test"),
  fans: () => t("Aficionados", "Fans"),
  rebuild: () => t("Reconstrucción", "Rebuild"),
  "transfer-fee": () => t("Traspaso", "Transfer fee"),
  investment: () => t("Inversión", "Investment"),
};

export default function Office() {
  const { career } = useManager();
  const status = objectiveStatus(career);
  const cap = costCapFor(career.year);
  const team = career.world.teams[career.teamId];
  return (
    <div className="mn-grid mn-grid--office">
      <Panel title={career.owner ? t("Los inversores", "The investors") : t("La directiva", "The board")}>
        <Bar label={t("Confianza", "Confidence")} value={career.board.confidence} caption={`${Math.round(career.board.confidence)}%`} tone={career.board.confidence < 30 ? "red" : "gold"} />
        <ul className="mn-objectives">
          {status.map((objective) => (
            <li key={objective.id} className={`is-${objective.state}`}>
              <span>{objectiveText(career, objective)}</span>
              <em>{OBJECTIVE_STATE[objective.state] ? OBJECTIVE_STATE[objective.state]() : ""}</em>
            </li>
          ))}
        </ul>
        <div className="mn-stats-row">
          <Stat label={t("Reputación", "Reputation")} value={Math.round(career.reputation)} />
          <Stat label={t("Afición", "Fans")} value={Math.round(career.fans ?? 60)} />
          <Stat label={t("Prestigio del equipo", "Team prestige")} value={Math.round(team.prestige * 100)} />
        </div>
      </Panel>
      <Panel title={t("Finanzas", "Finances")}>
        <div className="mn-stats-row">
          <Stat label={t("Caja", "Balance")} value={money(career.finances.balance)} accent />
          <Stat label={t("Ingresado este año", "Earned this year")} value={money(career.finances.season.income)} />
          <Stat label={t("Gastado este año", "Spent this year")} value={money(career.finances.season.spend)} />
        </div>
        {cap !== null && <p className="mn-hint">{t(`Límite presupuestario de desarrollo ${career.year}: ${money(cap)}.`, `${career.year} development cost cap: ${money(cap)}.`)}</p>}
        {team.engine && <p className="mn-hint">{t(`Motor ${team.engine.name}: se paga carrera a carrera.`, `${team.engine.name} engine: paid race by race.`)}</p>}
        {career.finances.sponsors.filter((deal) => deal.until >= career.year).length > 0 && (
          <p className="mn-hint">
            {t("Patrocinios extra", "Extra sponsors")}: {career.finances.sponsors.filter((deal) => deal.until >= career.year).map((deal) => money(deal.perRace)).join(" · ")} / GP
          </p>
        )}
        {career.finances.ledger.length ? (
          <table className="mn-table mn-table--ledger">
            <tbody>
              {career.finances.ledger.slice(0, 18).map((entry, index) => (
                <tr key={`${entry.year}-${entry.round}-${entry.kind}-${index}`}>
                  <td>
                    {entry.year} · R{entry.round + 1}
                  </td>
                  <td>{LEDGER[entry.kind] ? LEDGER[entry.kind]() : entry.kind}</td>
                  <td className={entry.amount < 0 ? "is-bad" : "is-good"}>{money(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>{t("Sin movimientos todavía.", "No movements yet.")}</Empty>
        )}
      </Panel>
      <Panel title={t("Historial", "Record")}>
        {career.trophies.length > 0 && (
          <ul className="mn-trophies">
            {career.trophies.map((trophy) => (
              <li key={`${trophy.year}-${trophy.kind}`}>
                <b>{trophy.year}</b> {trophy.kind === "constructors" ? t(`Campeones de constructores con ${trophy.teamName}`, `Constructors' champions with ${trophy.teamName}`) : t(`${trophy.name}, campeón del mundo con ${trophy.teamName}`, `${trophy.name}, world champion with ${trophy.teamName}`)}
              </li>
            ))}
          </ul>
        )}
        {career.history.length ? (
          <table className="mn-table">
            <thead>
              <tr>
                <th>{t("Año", "Year")}</th>
                <th>{t("Equipo", "Team")}</th>
                <th>{t("Pos.", "Pos.")}</th>
                <th>{t("Pts", "Pts")}</th>
                <th>{t("Vict.", "Wins")}</th>
                <th>{t("Campeón", "Champion")}</th>
              </tr>
            </thead>
            <tbody>
              {[...career.history].reverse().map((entry) => (
                <tr key={entry.year}>
                  <td>{entry.year}</td>
                  <td className="mn-table__name">
                    <TeamBadge team={{ name: entry.teamName, short: entry.teamName.slice(0, 3).toUpperCase(), color: entry.color, custom: true }} size={16} /> {entry.teamName}
                  </td>
                  <td>{ordinal(entry.position)}</td>
                  <td>{entry.points}</td>
                  <td>{entry.wins}</td>
                  <td>{entry.champion?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>{t("Tu primera temporada está en marcha.", "Your first season is under way.")}</Empty>
        )}
      </Panel>
    </div>
  );
}
