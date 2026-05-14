// src/modules/debate/components/DebateHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowClockwise, ChatDots, People, Send } from "react-bootstrap-icons";

import * as actions from "../actions";
import * as selectors from "../selectors";
import { useNow } from "../hooks/useNow";

import DebateOpinionBox from "./DebateOpinionBox";
import RoomCard from "./RoomCard";
import ScopeSwitch from "./ScopeSwitch";
import "./Debate.css";

const scopeCopy = {
  ES: {
    eyebrow: "Debate nacional",
    title: "Espana",
    desc: "Opiniones centradas en la conversacion espanola del dia.",
  },
  INT: {
    eyebrow: "Debate global",
    title: "Internacional",
    desc: "Temas abiertos a politica, deporte y cultura mundial.",
  },
};

export default function DebateHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const now = useNow(1000);

  const [scope, setScope] = useState("ES");

  const loading = useSelector(selectors.getDebateLoading);
  const rooms = useSelector((s) => selectors.getRooms(s, scope));
  const myOpinion = useSelector((s) => selectors.getMyTodayOpinion(s, scope));
  const err = useSelector(selectors.getDebateError);
  const me = useSelector(selectors.getMe);
  const isAdmin = !!me?.admin;

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
      return (
        (a.status === "OPEN" ? a.secondsRemainingToJoin ?? 0 : 9999) -
        (b.status === "OPEN" ? b.secondsRemainingToJoin ?? 0 : 9999)
      );
    });
  }, [rooms]);

  const counts = useMemo(
    () =>
      roomsSorted.reduce(
        (acc, room) => {
          acc.total += 1;
          acc.participants += Number(room.participantsCount || 0);
          acc[room.status] = (acc[room.status] || 0) + 1;
          return acc;
        },
        { total: 0, participants: 0, OPEN: 0, POLL: 0, LIVE: 0, CLOSED: 0 }
      ),
    [roomsSorted]
  );

  const copy = scopeCopy[scope];

  return (
    <div className="debate-home">
      <div className="debate-home__content">
        <header className="debate-hero">
          <div className="debate-hero__main">
            <span className="debate-kicker">OverCutDebate</span>
            <h1 className="debate-hero__title">Elige una sala, toma posicion y debate en directo.</h1>
            <p className="debate-hero__subtitle">
              Cada usuario propone una unpopular opinion. Las opiniones del dia se convierten en
              salas con inscripcion, encuesta inicial de 30 segundos y chat en vivo.
            </p>

            <div className="debate-steps" aria-label="Flujo del debate">
              <div className="debate-step">
                <Send aria-hidden="true" />
                <span>Enviar opinion</span>
              </div>
              <div className="debate-step">
                <People aria-hidden="true" />
                <span>Unirse al lobby</span>
              </div>
              <div className="debate-step">
                <ChatDots aria-hidden="true" />
                <span>Votar y debatir</span>
              </div>
            </div>
          </div>

          <aside className="debate-hero__panel" aria-label="Seleccion de ambito">
            <ScopeSwitch value={scope} onChange={setScope} />
            <div className="scope-card">
              <span>{copy.eyebrow}</span>
              <strong>{copy.title}</strong>
              <p>{copy.desc}</p>
            </div>
          </aside>
        </header>

        {err?.message && <div className="debate-alert">{err.message}</div>}

        <section className="debate-overview" aria-label="Estado del dia">
          <div className="metric-card">
            <span>Salas disponibles</span>
            <strong>{counts.total}</strong>
          </div>
          <div className="metric-card">
            <span>Participantes</span>
            <strong>{counts.participants}</strong>
          </div>
          <div className="metric-card">
            <span>En inscripcion</span>
            <strong>{counts.OPEN}</strong>
          </div>
          <div className="metric-card">
            <span>En vivo</span>
            <strong>{counts.LIVE}</strong>
          </div>
        </section>

        <section className="debate-layout">
          <div className="debate-panel debate-panel--opinion">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">Paso 1</span>
                <h2>Tu opinion del dia</h2>
              </div>
              <span className="status-chip">{scope}</span>
            </div>

            <DebateOpinionBox
              scope={scope}
              myOpinion={myOpinion}
              isAdmin={isAdmin}
              onSubmit={(text) => dispatch(actions.submitOpinion(scope, text))}
            />
          </div>

          <div className="debate-panel debate-panel--lobby">
            <div className="panel-heading panel-heading--split">
              <div>
                <span className="panel-eyebrow">Paso 2</span>
                <h2>Lobby de tematicas</h2>
              </div>
              <button
                className="icon-action"
                onClick={() => dispatch(actions.listRoomsToday(scope))}
                disabled={loading}
                type="button"
                title="Refrescar salas"
              >
                <ArrowClockwise aria-hidden="true" />
              </button>
            </div>

            {roomsSorted.length === 0 ? (
              <div className="empty-state">
                <strong>No hay salas activas para este ambito.</strong>
                <p>
                  Cuando el seeding diario seleccione opiniones, apareceran aqui como salas de
                  inscripcion con contador y numero de participantes.
                </p>
              </div>
            ) : (
              <div className="room-lobby">
                {roomsSorted.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={index + 1}
                    now={now}
                    onOpen={() => navigate(`/debate/rooms/${room.id}`)}
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
