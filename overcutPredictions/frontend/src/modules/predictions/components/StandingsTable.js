import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import predictions from "../index";
import "./styles/Standings.css";
import { t } from "../../../i18n/translations"; // <-- ajusta ruta

export default function StandingsTable() {
  const [tab, setTab] = useState("drivers");

  const season = useSelector(predictions.selectors.getSeason);

  const drivers = useSelector(predictions.selectors.getDriverStandingsWithNames);
  const constructors = useSelector(predictions.selectors.getConstructorStandingsWithNames);

  const rows = useMemo(() => (tab === "drivers" ? drivers : constructors), [tab, drivers, constructors]);

  if (!season) {
    return (
      <div className="standings">
        <div className="standings-head">
          <div className="standings-title">
            <h2>{t("stand.title")}</h2>
            <span className="standings-subtitle">{t("stand.subtitleLive")}</span>
          </div>
        </div>

        <div className="standings-empty">{t("stand.empty")}</div>
      </div>
    );
  }

  return (
    <div className="standings">
      <div className="standings-head">
        <div className="standings-title">
          <h2>{t("stand.title")}</h2>
          <span className="standings-subtitle">
            {tab === "drivers" ? t("stand.subtitleDrivers") : t("stand.subtitleConstructors")}
          </span>
        </div>

        <div className="standings-tabs">
          <button
            className={`tab ${tab === "drivers" ? "active" : ""}`}
            onClick={() => setTab("drivers")}
            type="button"
          >
            {t("stand.tabDrivers")}
          </button>

          <button
            className={`tab ${tab === "constructors" ? "active" : ""}`}
            onClick={() => setTab("constructors")}
            type="button"
          >
            {t("stand.tabConstructors")}
          </button>
        </div>
      </div>

      <div className="standings-tableWrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-name">
                {tab === "drivers" ? t("stand.thDriver") : t("stand.thConstructor")}
              </th>
              <th className="col-pts">{t("stand.thPts")}</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((d, i) => (
              <tr key={`${tab}-${d.entityId}`}>
                <td className="pos">{i + 1}</td>

                <td className="name">
                  <div className="nameLine">
                    <span className="nameText">{d.name}</span>
                    <span className="idTag">#{d.entityId}</span>
                  </div>
                </td>

                <td className="pts">
                  <span className="ptsBadge">{d.points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="standings-footnote">
        {tab === "drivers" ? t("stand.footDrivers") : t("stand.footConstructors")}
      </div>
    </div>
  );
}
