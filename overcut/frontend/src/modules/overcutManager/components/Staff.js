/**
 * The four people who run the team, and who could replace them (RF-STF-01).
 * Data screen (DESIGN.md §6.3): your staff and the candidates as tables, the
 * selected role's card at the side.
 */

import React, { useMemo, useState } from "react";
import { STAFF_ROLES, hireStaff, staffCandidates } from "../engine/market";
import { roundMoney } from "../engine/economy";
import { useManager } from "./context";
import { Badge, DataTable, Flag, PageHeader, Panel, Rating, Tabs } from "./atoms";
import { Delta, Facts } from "./dataScreen";
import { STAFF, STAFF_HINT, money, t } from "./texts";
import "./styles/market.css";

const perYear = (value) => `${money(value || 0)}/${t("año", "yr")}`;

export default function Staff() {
  const { career, act, version } = useManager();
  const [role, setRole] = useState("technical");
  const [message, setMessage] = useState(null);
  // Candidates change after every hire; `version` re-reads them.
  const candidates = useMemo(() => staffCandidates(career, role), [career, role, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = career.staff[role];
  const severance = current ? roundMoney(current.salary * 0.5) : 0;
  const payroll = STAFF_ROLES.reduce((sum, key) => sum + (career.staff[key]?.salary || 0), 0);
  const team = STAFF_ROLES.map((key) => ({ role: key, ...(career.staff[key] || {}) }));

  const hire = (candidate) => {
    const result = act((c) => hireStaff(c, candidate));
    setMessage(result?.ok ? { text: t(`${candidate.name} se incorpora como ${STAFF[candidate.role]().toLowerCase()}`, `${candidate.name} joins as ${STAFF[candidate.role]().toLowerCase()}`) } : { text: t("No hay dinero para la indemnización", "Not enough money for the severance"), bad: true });
  };

  return (
    <div className="mn-ds mn-staff2">
      <PageHeader title={t("Personal", "Staff")} meta={t(`${STAFF_ROLES.length} puestos · nómina ${perYear(payroll)}`, `${STAFF_ROLES.length} roles · payroll ${perYear(payroll)}`)} />
      <div className="mn-ds__grid">
        <div className="mn-ds__main">
          <Panel flush title={t("Tu equipo técnico", "Your senior staff")} meta={t("Elige un puesto para ver candidatos", "Pick a role to see candidates")}>
            <DataTable
              className="mn-ds-selectable"
              caption={t("Tu equipo técnico", "Your senior staff")}
              rowKey={(row) => row.role}
              highlight={(row) => row.role === role}
              onRowClick={(row) => setRole(row.role)}
              columns={[
                { key: "rating", label: t("Val.", "Rtg"), width: 56, render: (row) => <Rating value={row.rating ?? 50} size="sm" /> },
                {
                  key: "role",
                  label: t("Puesto", "Role"),
                  render: (row) => (
                    <span className="mn-ds-who">
                      <span>
                        <strong>{STAFF[row.role]()}</strong>
                        <small>
                          {row.name}
                          {row.interim ? ` · ${t("interino", "interim")}` : ""}
                        </small>
                      </span>
                    </span>
                  ),
                },
                { key: "nat", label: "", width: 32, className: "mn-ds-hide-sm", render: (row) => <Flag code={row.nat} width={16} /> },
                { key: "age", label: t("Edad", "Age"), align: "right", width: 56, className: "mn-ds-hide-sm" },
                { key: "salary", label: t("Salario", "Salary"), align: "right", width: 112, render: (row) => <span className="mn-ds-mono">{perYear(row.salary)}</span> },
              ]}
              rows={team}
            />
          </Panel>

          <Panel flush title={t("Candidatos", "Candidates")} meta={t("Los mejores prefieren los equipos grandes", "The best prefer the big teams")}>
            <div className="mn-ds__filters">
              <Tabs label={t("Puesto", "Role")} value={role} onChange={setRole} options={STAFF_ROLES.map((key) => ({ value: key, label: STAFF[key]() }))} />
            </div>
            <DataTable
              caption={t("Candidatos", "Candidates")}
              rowKey={(row) => row.id}
              columns={[
                { key: "rating", label: t("Val.", "Rtg"), width: 56, render: (row) => <Rating value={row.rating} size="sm" /> },
                {
                  key: "name",
                  label: t("Nombre", "Name"),
                  render: (row) => (
                    <span className="mn-ds-who">
                      <Flag code={row.nat} width={16} />
                      <span>
                        <strong>{row.name}</strong>
                      </span>
                    </span>
                  ),
                },
                { key: "age", label: t("Edad", "Age"), align: "right", width: 56, className: "mn-ds-hide-sm" },
                { key: "diff", label: t("Vs. actual", "Vs current"), align: "right", width: 88, className: "mn-ds-hide-sm", render: (row) => <Delta value={row.rating - (current?.rating ?? 50)} /> },
                { key: "salary", label: t("Salario", "Salary"), align: "right", width: 112, render: (row) => <span className="mn-ds-mono">{perYear(row.salary)}</span> },
                {
                  key: "hire",
                  label: "",
                  align: "right",
                  width: 104,
                  render: (row) => (
                    <button type="button" className="mn-btn mn-btn--sm" onClick={() => hire(row)}>
                      {t("Contratar", "Hire")}
                    </button>
                  ),
                },
              ]}
              rows={candidates}
              empty={t("Nadie disponible para este puesto", "Nobody available for this role")}
            />
          </Panel>
        </div>

        <div className="mn-ds__side">
          <Panel title={STAFF[role]()}>
            {current ? (
              <div className="mn-mk-card">
                <div className="mn-mk-card__id">
                  <Rating value={current.rating ?? 50} size="lg" />
                  <span>
                    <strong>{current.name}</strong>
                    <small>
                      <Flag code={current.nat} width={16} /> {t(`${current.age} años`, `${current.age} years old`)}
                    </small>
                  </span>
                </div>
                {current.interim && (
                  <Badge tone="warn" dot>
                    {t("Interino", "Interim")}
                  </Badge>
                )}
                <p className="mn-ds-note">{STAFF_HINT[role]()}</p>
                <Facts
                  label={STAFF[role]()}
                  items={[
                    [t("Salario", "Salary"), perYear(current.salary)],
                    [t("Despido", "Severance"), severance ? money(severance) : "—"],
                    [t("Mejor candidato", "Best candidate"), candidates[0] ? <Delta value={candidates[0].rating - (current.rating ?? 50)} /> : "—"],
                  ]}
                />
                <p className="mn-ds-note">{t("Despedir al actual cuesta medio año de su salario.", "Firing the incumbent costs half a year's salary.")}</p>
              </div>
            ) : (
              <p className="mn-ds-note">{t("Puesto vacante.", "Vacant role.")}</p>
            )}
            {message && (
              <p className={`mn-ds-flash${message.bad ? " is-bad" : ""}`} role="status">
                {message.text}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
