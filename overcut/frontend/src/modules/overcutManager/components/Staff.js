/** The four people who run the team, and who could replace them. */

import React, { useMemo, useState } from "react";
import { STAFF_ROLES, hireStaff, staffCandidates } from "../engine/market";
import { useManager } from "./context";
import { Flag, Panel, Pill, Rating, Segmented } from "./atoms";
import { STAFF, STAFF_HINT, money, t } from "./texts";

export default function Staff() {
  const { career, act, version } = useManager();
  const [role, setRole] = useState("technical");
  const [message, setMessage] = useState(null);
  // Candidates change after every hire; `version` re-reads them.
  const candidates = useMemo(() => staffCandidates(career, role), [career, role, version]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mn-grid mn-grid--staff">
      <Panel title={t("Tu equipo técnico", "Your senior staff")}>
        <ul className="mn-staff">
          {STAFF_ROLES.map((key) => {
            const person = career.staff[key];
            return (
              <li key={key} className={role === key ? "is-active" : ""}>
                <button type="button" onClick={() => setRole(key)}>
                  <Rating value={person?.rating ?? 50} />
                  <span>
                    <strong>{STAFF[key]()}</strong>
                    <small>
                      <Flag code={person?.nat} width={14} /> {person?.name} · {person?.age} · {money(person?.salary || 0)}/{t("año", "yr")}
                    </small>
                    <em>{STAFF_HINT[key]()}</em>
                  </span>
                  {person?.interim && <Pill tone="red">{t("Interino", "Interim")}</Pill>}
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title={t("Candidatos", "Candidates")} action={<Segmented label={t("Puesto", "Role")} value={role} onChange={setRole} options={STAFF_ROLES.map((key) => ({ value: key, label: STAFF[key]().split(" ")[0] }))} />}>
        <p className="mn-hint">{t("Despedir al actual cuesta medio año de su salario. Los mejores prefieren los equipos grandes.", "Firing the incumbent costs half a year's salary. The best prefer the big teams.")}</p>
        <ul className="mn-candidates">
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <Rating value={candidate.rating} size="sm" />
              <span>
                <strong>
                  <Flag code={candidate.nat} width={14} /> {candidate.name}
                </strong>
                <small>
                  {candidate.age} {t("años", "yrs")} · {money(candidate.salary)}/{t("año", "yr")}
                </small>
              </span>
              <button
                type="button"
                className="mn-btn mn-btn--sm"
                onClick={() => {
                  const result = act((c) => hireStaff(c, candidate));
                  setMessage(result?.ok ? t(`${candidate.name} se incorpora.`, `${candidate.name} joins.`) : t("No hay dinero para la indemnización.", "Not enough money for the severance."));
                }}
              >
                {t("Contratar", "Hire")}
              </button>
            </li>
          ))}
        </ul>
        {message && <p className="mn-muted">{message}</p>}
      </Panel>
    </div>
  );
}
