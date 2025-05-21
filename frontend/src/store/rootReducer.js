import {combineReducers} from 'redux';

import app from '../modules/app';
import users from '../modules/users';
import posts from '../modules/posts';
import quiz from '../modules/quiz';
import circuits from '../modules/historic';
import events from '../modules/events';
import tictactoe from '../modules/tictactoe';
import crossword from '../modules/crossword';
import gridgame from '../modules/gridgame';
import guessDriver from '../modules/guessDriver';
import top10game from '../modules/top10game';
import driversLink from '../modules/driversLink';
import rondo from '../modules/rondo';
import careerPath from '../modules/careerPath';
import wordle from '../modules/wordle';
import twoTeams from '../modules/twoTeams';
import f1impostor from '../modules/f1impostor';
import teamGuess from '../modules/teamGuess';
import driversConnections from '../modules/driversConnections';
import orderDriver from '../modules/orderDriver';
import categoryGame from '../modules/categoryGame';

const rootReducer = combineReducers({
    app: app.reducer,
    users: users.reducer,
    posts: posts.reducer,
    quiz: quiz.reducer,
    circuits: circuits.reducer,
    events:events.reducer,
    tictactoe: tictactoe.reducer,
    crossword: crossword.reducer,
    gridgame: gridgame.reducer,
    guessDriver: guessDriver.reducer,
    top10game: top10game.reducer,
    driversLink: driversLink.reducer,
    rondo: rondo.reducer,
    careerPath: careerPath.reducer,
    wordle: wordle.reducer,
    twoTeams: twoTeams.reducer,
    f1impostor: f1impostor.reducer,
    teamGuess: teamGuess.reducer,
    driversConnections: driversConnections.reducer,
    orderDriver: orderDriver.reducer,
    categoryGame: categoryGame.reducer,
});

export default rootReducer;