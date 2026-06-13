// App.jsx
import React from "react";
import { HashRouter as Router, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";
import MobileHeader from "./MobileHeader";

import { ConsentProvider } from "../../../cookies/ConsentContext"; // <-- importa tu provider
import CookiePanel from "../../../cookies/CookiePanel";           // <-- panel 2ª capa

const FULLSCREEN_GAME_PATHS = new Set(["/minigames/overcutRacing", "/minigames/careerMode"]);

const AppShell = () => {
  const [width, setWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = width <= 768;
  const location = useLocation();
  const isFullscreenGame = FULLSCREEN_GAME_PATHS.has(location.pathname);

  return (
    <div className={`App${isFullscreenGame ? " App--fullscreen" : ""}`}>
      {!isFullscreenGame && (isMobile ? <MobileHeader /> : <Header />)}
      <Body />
      {!isFullscreenGame && <Footer />}
    </div>
  );
};

const App = () => (
  <Router>
    <Helmet><meta charSet="UTF-8" /></Helmet>
    <ConsentProvider>
      <AppShell />
      <CookiePanel />
    </ConsentProvider>
  </Router>
);

export default App;
