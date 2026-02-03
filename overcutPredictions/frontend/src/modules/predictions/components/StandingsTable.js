import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import predictions from "../index";
import "./styles/Standings.css";

export default function StandingsTable() {
  const [tab, setTab] = useState("drivers");

  const season = useSelector(predictions.selectors.getSeason);
  const drivers = useSelector(predictions.selectors.getDriverStandings);
  const constructors = useSelector(predictions.selectors.getConstructorStandings);

  const rows = useMemo(() => (tab === "drivers" ? drivers : constructors), [tab, drivers, constructors]);

  if (!season) {
    return (
      <div className="standings">
        <div className="standings-head">
          <h2>Standings</h2>
        </div>
        <div className="standings-empty">
          Haz bootstrap para ver la clasificación.
        </div>
      </div>
    );
  }

  return (
    <div className="standings">
      <div className="standings-head">
        <h2>Standings</h2>

        <div className="standings-tabs">
          <button
            className={`tab ${tab === "drivers" ? "active" : ""}`}
            onClick={() => setTab("drivers")}
          >
            Drivers
          </button>
          <button
            className={`tab ${tab === "constructors" ? "active" : ""}`}
            onClick={() => setTab("constructors")}
          >
            Constructors
          </button>
        </div>
      </div>

      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{tab === "drivers" ? "Driver" : "Constructor"}</th>
            <th className="pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={`${tab}-${d.entityId}`}>
              <td className="pos">{i + 1}</td>
              <td className="name">
                <span className="mono">ID {d.entityId}</span>
              </td>
              <td className="pts">{d.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="standings-footnote">
        * De momento mostramos IDs. Luego lo convertimos a nombres con un “lookup map”.
      </div>
    </div>
  );
}
