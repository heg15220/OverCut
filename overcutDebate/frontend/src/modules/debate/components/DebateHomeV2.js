// src/modules/debate/components/DebateHomeV2.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import { useNow } from "../hooks/useNow";
import ScopeSwitch from "./ScopeSwitch";
import RoomCard from "./RoomCard";
import DebateOpinionBox from "./DebateOpinionBox";
import "./debateV2.css";

export default function DebateHomeV2({ onOpenRoom }) {
  const dispatch = useDispatch();
  const now = useNow(1000);

  const [scope, setScope] = useState("ES");

  const loading = useSelector(selectors.getDebateLoading);
  const rooms = useSelector((s) => selectors.getRooms(s, scope));
  const myOpinion = useSelector((s) => selectors.getMyTodayOpinion(s, scope));
  const err = useSelector(selectors.getDebateError);

  useEffect(() => { dispatch(actions.fetchMe()); }, [dispatch]);

  useEffect(() => {
    dispatch(actions.fetchMyTodayOpinion(scope));
    dispatch(actions.listRoomsToday(scope));
  }, [dispatch, scope]);

  const sorted = useMemo(() => {
    const order = { OPEN: 0, POLL: 1, LIVE: 2, CLOSED: 3 };
    return [...(rooms || [])].sort((a, b) => {
      const oa = order[a.status] ?? 99;
      const ob = order[b.status] ?? 99;
      if (oa !== ob) return oa - ob;
      return (a.secondsRemainingToJoin ?? 0) - (b.secondsRemainingToJoin ?? 0);
    });
  }, [rooms]);

  return (
    <div className="ocD-page">
      <div className="ocD-shell">
        <header className="ocD-hero">
          <div className="ocD-heroLeft">
            <h1 className="ocD-title">OverCutDebate</h1>
            <p className="ocD-subtitle">Unpopular opinions → salas → poll → debate LIVE</p>
          </div>

          <div className="ocD-heroRight">
            <ScopeSwitch value={scope} onChange={setScope} />
            <button
              className="ocD-btn"
              onClick={() => dispatch(actions.listRoomsToday(scope))}
              disabled={loading}
            >
              Refrescar
            </button>
          </div>
        </header>

        {err?.message && <div className="ocD-alert">⚠️ {err.message}</div>}

        <section className="ocD-grid2">
          <div className="ocD-card">
            <div className="ocD-cardHeader">
              <h2>Tu opinión de hoy</h2>
              <span className="ocD-chip">{scope}</span>
            </div>

            <DebateOpinionBox
              scope={scope}
              myOpinion={myOpinion}
              onSubmit={(text) => dispatch(actions.submitOpinion(scope, text))}
            />
          </div>

          <div className="ocD-card">
            <div className="ocD-cardHeader">
              <h2>Lobby</h2>
              <span className="ocD-muted">{sorted.length} salas hoy</span>
            </div>

            {sorted.length === 0 ? (
              <div className="ocD-empty">
                <div className="ocD-emptyTitle">Todavía no hay salas</div>
                <div className="ocD-muted">
                  Si ya hay opiniones, falta ejecutar el seeding (scheduler o admin seed).
                </div>
              </div>
            ) : (
              <div className="ocD-roomGrid">
                {sorted.map((r) => (
                  <RoomCard
                    key={r.id}
                    room={r}
                    now={now}
                    onOpen={() => onOpenRoom?.(r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
