import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { createGridGame, getGridGameBoard } from "../actions";
import GridGameBoard from "./GridGameBoard";

const GridGamePage = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(createGridGame(gameId => {
            dispatch(getGridGameBoard(gameId, () => {}, () => {}));
        }, () => {}));
    }, [dispatch]);

    return (
        <div className="grid-game-body">
            <GridGameBoard />
        </div>
    );
};

export default GridGamePage;

