import React, { useMemo } from "react";
import "./TowerGame.css";

const TowerHistory = ({ lang, guesses }) => {
  const t = useMemo(() => ({
    title: lang === "es" ? "Historial" : "History",
    empty: lang === "es" ? "Aún no has probado ningún piloto." : "You haven't tried any driver yet.",
    ok: lang === "es" ? "Correcto" : "Correct",
    no: lang === "es" ? "Incorrecto" : "Wrong"
  }), [lang]);

  const items = Array.isArray(guesses) ? guesses.slice().reverse() : [];

  return (
    <div className="tower-history">
      <h2 className="tower-historyTitle">{t.title}</h2>

      {items.length === 0 ? (
        <div className="tower-empty">{t.empty}</div>
      ) : (
        <div className="tower-historyList">
          {items.map((g, idx) => {
            const valid = !!g.valid;
            return (
              <div
                key={`${g.driverName || "unknown"}-${idx}`}
                className={`tower-row ${valid ? "ok" : "no"}`}
              >
                <div className="tower-rowLeft">
                  <span className="tower-driver">{g.driverName}</span>
                </div>

                <div className="tower-rowRight">
                  <span className={`tower-pill ${valid ? "ok" : "no"}`}>
                    {valid ? "✅ " + t.ok : "❌ " + t.no}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TowerHistory;
