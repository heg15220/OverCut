import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./RankingPage.css";
import UserAvatar from "./UserAvatar";


const rankThresholds = {
  F4: 0,
  F3: 150,
  F2: 500,
  F1: 1000
};

const rankOrder = ["F1", "F2", "F3", "F4"];

// Traducciones embebidas por idioma
const translations = {
  es: {
    title: "🏁 Ranking Global",
    legend: "Leyenda",
    pro: "Profesional",
    semiPro: "Semi-Pro",
    rookie: "Principiante",
    empty: "🚧 Aún no hay usuarios en este rango.",
    goal: (points) => `🎯 Objetivo: alcanzar ${points} puntos para llegar a este rango.`
  },
  en: {
    title: "🏁 Global Ranking",
    legend: "Legend",
    pro: "Pro",
    semiPro: "Semi-Pro",
    rookie: "Rookie",
    empty: "🚧 No users in this rank yet.",
    goal: (points) => `🎯 Goal: reach ${points} points to enter this rank.`
  }
};

const RankingPage = () => {
  const dispatch = useDispatch();
  const ranking = useSelector(selectors.getUserRanking);
  const intl = useIntl();
  const locale = navigator.language.startsWith('es') ? 'es' : 'en';
  const t = translations[locale];

  const currentUser = useSelector(selectors.getUser);

  const rankLabels = {
    F1: `🏆 ${t.legend}`,
    F2: `🥈 ${t.pro}`,
    F3: `🥉 ${t.semiPro}`,
    F4: `🎓 ${t.rookie}`
  };

  useEffect(() => {
    dispatch(actions.getUserRanking());
  }, [dispatch]);

  return (
    <div className="ranking-wrapper">
    <div className="ranking-container">
      <h2 className="ranking-title">{t.title}</h2>
      {rankOrder.map((rank) => {
        const users = ranking[rank] || [];

        return (
          <div key={rank} className="ranking-section">
            <h3 className={`rank-title rank-${rank.toLowerCase()}`}>
              {rankLabels[rank]} ({rank})
            </h3>

            {users.length > 0 ? (
              <div className="user-list">
                {users
                  .sort((a, b) => b.points - a.points)
                  .map((user, idx) => (
                    <div key={idx} className="user-card">
                      <span className={`rank-position ${idx < 3 ? "top-" + (idx + 1) : ""}`}>
                        #{idx + 1}
                      </span>
                      <UserAvatar image={user.image} userName={user.userName} size={40} />
                      <div className="user-name-wrapper">
                        <span className="user-name">{user.userName}</span>
                      </div>
                      <span className={`user-points rank-${rank.toLowerCase()}-points`}>
                        {user.points} pts
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-rank-hint">
                <p>{t.empty}</p>
              </div>
            )}

            <p className="hint-points">{t.goal(rankThresholds[rank])}</p>
          </div>
        );
      })}
    </div>
    </div>
  );
};

export default RankingPage;
