import {combineReducers} from 'redux';

import app from '../modules/app';
import users from '../modules/users';
import posts from '../modules/posts';
import quiz from '../modules/quiz';


const rootReducer = combineReducers({
    app: app.reducer,
    users: users.reducer,
    posts: posts.reducer,
    quiz: quiz.reducer
});

export default rootReducer;