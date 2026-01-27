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

  const [scope, setScope] = useState("ES"); // ES / INT

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
    return [...(rooms || [])].sort(
      (a, b) => (a.secondsRemainingToJoin ?? 0) - (b.secondsRemainingToJoin ?? 0)
    );
  }, [rooms]);

  return (
    <div className="debate-page">
      <div className="debate-card">
        <div className="debate-header">
          <h2>Debate</h2>

          <div className="debate-scope">
            <label>Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="ES">ES</option>
              <option value="INT">INT</option>
            </select>

            <button
              className="debate-btn"
              onClick={() => dispatch(actions.listRoomsToday(scope))}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        <DebateOpinionBox
          scope={scope}
          myOpinion={myOpinion}
          onSubmit={(text) => dispatch(actions.submitOpinion(scope, text))}
        />

        <div className="debate-section">
          <h3>Today rooms</h3>

          {roomsSorted.length === 0 && (
            <div className="debate-empty">
              No rooms yet (or seeded not executed for today).
            </div>
          )}

          <div className="debate-room-list">
            {roomsSorted.map((r) => (
              <button
                key={r.id}
                className="debate-room-item"
                onClick={() => navigate(`/debate/rooms/${r.id}`)}
              >
                <div className="debate-room-top">
                  <span
                    className={`debate-badge status-${(r.status || "").toLowerCase()}`}
                  >
                    {r.status}
                  </span>
                  <span className="debate-muted">
                    Participants: {r.participantsCount}
                  </span>
                </div>

                <div className="debate-topic">{r.topic}</div>

                <div className="debate-room-bottom">
                  <span className="debate-muted">
                    Join remaining: {r.secondsRemainingToJoin}s
                  </span>
                  <span className="debate-muted">
                    Poll remaining: {r.secondsRemainingToPollEnd}s
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
