import React from "react";

import { HashRouter as Router } from "react-router-dom";
import { Helmet } from 'react-helmet';

import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";

const App = () => {
    return (
        <Router>
            <Helmet>
                <meta charset="UTF-8" />
            </Helmet>
            <div className="App">
                <Header />
                <Body />
                <Footer />
            </div>
        </Router>
    );
};

export default App;
