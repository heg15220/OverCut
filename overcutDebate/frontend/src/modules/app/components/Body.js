// src/modules/app/components/Body.jsx
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

// Debate
import { DebateHome, DebateRoomPage } from "../../debate";

import "./Body.css";

const Body = () => {
  return (
    <div className="Body">
      <Routes>
        <Route path="/debate" element={<DebateHome />} />
        <Route path="/debate/rooms/:roomId" element={<DebateRoomPage />} />

        {/* Si alguien intenta entrar sin login (ajusta si tienes login real) */}
        <Route path="/debate/*" element={<Navigate to="/users/login" replace />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/debate" replace />} />
      </Routes>
    </div>
  );
};

export default Body;
