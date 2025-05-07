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
});

export default rootReducer;