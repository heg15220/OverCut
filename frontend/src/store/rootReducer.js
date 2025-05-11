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
});

export default rootReducer;