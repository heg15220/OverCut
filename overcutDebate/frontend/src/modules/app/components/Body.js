// src/modules/app/components/Body.jsx
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import { DebateHome, DebateRoomPage } from "../../debate";
import { RequireLoginPage } from "../../auth";

const Body = () => (
  <div className="Body">
    <Routes>
      <Route path="/auth/require-login" element={<RequireLoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/debate" element={<DebateHome />} />
        <Route path="/debate/rooms/:roomId" element={<DebateRoomPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/debate" replace />} />
    </Routes>
  </div>
);

export default Body;
