// src/modules/debate/components/DebateHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";

import DebateOpinionBox from "./DebateOpinionBox";
import "./Debate.css";

export default function DebateHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [scope, setScope] = useState("ES");

  const loading = useSelector(selectors.getDebateLoading);
  const rooms = useSelector((s) => selectors.getRooms(s, scope));
  const myOpinion = useSelector((s) => selectors.getMyTodayOpinion(s, scope));

  useEffect(() => {
    dispatch(actions.fetchMe());
  }, [dispatch]);

  useEffect(() => {
    dispatch(actions.fetchMyTodayOpinion(scope));
    dispatch(actions.listRoomsToday(scope));
  }, [dispatch, scope]);

  const roomsSorted = useMemo(() => {
    const order = { OPEN: 0, POLL: 1, LIVE: 2, CLOSED: 3 };
    return [...(rooms || [])].sort((a, b) => {
      const oa = order[a.status] ?? 99;
      const ob = order[b.status] ?? 99;
      if (oa !== ob) return oa - ob;
      return (a.secondsRemainingToJoin ?? 0) - (b.secondsRemainingToJoin ?? 0);
    });
  }, [rooms]);

  return (
    <div className="debate-home">
      <div className="debate-home__content">
        <header className="debate-home__header">
          <div>
            <div className="debate-home__title">OverCutDebate</div>
            <div className="debate-home__subtitle">
              Unpopular opinions → salas → poll → debate LIVE
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="room-pill">Scope</span>
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="ES">ES</option>
                <option value="INT">INT</option>
              </select>
            </div>

            <button
              className="btn btn--primary"
              onClick={() => dispatch(actions.listRoomsToday(scope))}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </header>

        <DebateOpinionBox
          scope={scope}
          myOpinion={myOpinion}
          onSubmit={(text) => dispatch(actions.submitOpinion(scope, text))}
        />

        <section className="rooms">
          <div className="rooms__topbar">
            <div className="rooms__h">Today rooms</div>
            <div className="rooms__hint">
              {roomsSorted.length === 0
                ? "No rooms yet (or seeding not executed for today)."
                : `${roomsSorted.length} salas`}
            </div>
          </div>

          {roomsSorted.length === 0 ? null : (
            <div className="rooms__grid">
              {roomsSorted.map((r) => {
                const statusLower = (r.status || "").toLowerCase(); // live/poll/closed/scheduled...
                return (
                  <button
                    key={r.id}
                    className="room-card"
                    onClick={() => navigate(`/debate/rooms/${r.id}`)}
                    type="button"
                  >
                    <div className="room-card__head">
                      <div className="room-card__meta">
                        <span className="room-pill">👥 {r.participantsCount}</span>
                      </div>

                      <span className={`room-badge ${statusLower}`}>{r.status}</span>
                    </div>

                    <h3 className="room-card__title">{r.topic}</h3>

                    <div className="room-card__footer">
                      <div className="room-timing">
                        {r.status === "OPEN" && (
                          <div className="room-time">Join remaining: {r.secondsRemainingToJoin}s</div>
                        )}
                        {r.status === "POLL" && (
                          <div className="room-time">Poll remaining: {r.secondsRemainingToPollEnd}s</div>
                        )}
                      </div>

                      <span className="room-pill">
                        {r.status === "LIVE" ? "Entrar →" : r.status === "CLOSED" ? "Cerrada" : "Abrir →"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
