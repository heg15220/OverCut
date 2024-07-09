import {combineReducers} from 'redux';

import app from '../modules/app';
import users from '../modules/users';
import posts from '../modules/posts';
import quiz from '../modules/quiz';
import circuits from '../modules/historic';
import events from '../modules/events';



const rootReducer = combineReducers({
    app: app.reducer,
    users: users.reducer,
    posts: posts.reducer,
    quiz: quiz.reducer,
    circuits: circuits.reducer,
    events:events.reducer,
});

export default rootReducer;