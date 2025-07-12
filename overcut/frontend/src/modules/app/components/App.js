// App.jsx
import React, { useEffect, useState } from "react";
import { HashRouter as Router } from "react-router-dom";
import { Helmet } from 'react-helmet';

import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";
import MobileHeader from "./MobileHeader"; // tu nuevo header móvil

// Hook para ancho de ventana
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const App = () => {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 768;

  return (
    <Router>
      <Helmet>
        <meta charSet="UTF-8" />
      </Helmet>
      <div className="App">
        {isMobile ? <MobileHeader /> : <Header />}
        <Body />
        <Footer />
      </div>
    </Router>
  );
};

export default App;
