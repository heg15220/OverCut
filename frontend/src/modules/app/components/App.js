import React from "react";

import { HashRouter as Router } from "react-router-dom";

import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";

const App = () => {
    return (
        <Router>

            <div className="App">
                <Header />
                <Body />
                <Footer />
            </div>
        </Router>
    );
};

export default App;
