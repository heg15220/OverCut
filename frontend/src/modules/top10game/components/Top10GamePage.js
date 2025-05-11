import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { createTop10Game, getTop10Board } from "../actions";
import Top10GameBoard from "./Top10GameBoard";

const Top10GamePage = () => {
    const dispatch = useDispatch();
    const lang = navigator.language.startsWith("es") ? "es" : "en";

    useEffect(() => {
        dispatch(createTop10Game(lang, gameId => {
            dispatch(getTop10Board(gameId, () => {}, () => {}));
        }, () => {}));
    }, [dispatch, lang]); // ⬅️ Añadir lang como dependencia por seguridad

    return (
        <div className="top10-game-body">
            <Top10GameBoard />
        </div>
    );
};

export default Top10GamePage;
