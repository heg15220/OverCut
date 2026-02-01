// frontend/src/modules/app/components/App.js
import React, { useEffect } from "react";
import { HashRouter as Router } from "react-router-dom";
import { useDispatch } from "react-redux";

import useBootstrapTokenFromQuery from "../../debate/hooks/useBootstrapTokenFromQuery";
import users from "../../users";

import Body from "./Body";
import Header from "./Header";
import MobileHeader from "./MobileHeader";

import "./App.css";

export default function App() {
  const dispatch = useDispatch();

  // 1) si viene ?st=..., guardarlo
  useBootstrapTokenFromQuery();

  // 2) hidratar /debate/me para que ProtectedRoute funcione
  useEffect(() => {
    dispatch(users.actions.fetchMe());
  }, [dispatch]);

  const [width, setWidth] = React.useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = width <= 768;

  return (
    <Router>
      <div className="AppRoot">
        {isMobile ? <MobileHeader /> : <Header />}
        <main className="AppMain">
          <Body />
        </main>
      </div>
    </Router>
  );
}
