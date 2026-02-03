import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import predictions from "../index";
import "./styles/Standings.css";

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
            <h2>Standings</h2>
            <span className="standings-subtitle">Clasificación en tiempo real</span>
          </div>
        </div>

        <div className="standings-empty">
          Haz <b>Bootstrap</b> para ver la clasificación.
        </div>
      </div>
    );
  }

  return (
    <div className="standings">
      <div className="standings-head">
        <div className="standings-title">
          <h2>Standings</h2>
          <span className="standings-subtitle">{tab === "drivers" ? "Pilotos" : "Constructores"}</span>
        </div>

        <div className="standings-tabs">
          <button className={`tab ${tab === "drivers" ? "active" : ""}`} onClick={() => setTab("drivers")} type="button">
            Drivers
          </button>
          <button
            className={`tab ${tab === "constructors" ? "active" : ""}`}
            onClick={() => setTab("constructors")}
            type="button"
          >
            Constructors
          </button>
        </div>
      </div>

      <div className="standings-tableWrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-name">{tab === "drivers" ? "Driver" : "Constructor"}</th>
              <th className="col-pts">Pts</th>
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
        {tab === "drivers" ? "Clasificación pilotos": "Clasificación de equipos"}
      </div>
    </div>
  );
}
