// debate frontend/src/modules/app/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import * as userSelectors from "../../users/selectors";
import LoadingScreen from "../../common/components/LoadingScreen"; // o el que uses

export default function ProtectedRoute() {
  const loading = useSelector(userSelectors.isAuthLoading);
  const loggedIn = useSelector(userSelectors.isLoggedIn);

  if (loading) return <LoadingScreen />;  // ✅ evita redirect prematuro
  if (!loggedIn) return <Navigate to="/auth/require-login" replace />;
  return <Outlet />;
}
