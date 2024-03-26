import {combineReducers} from 'redux';

import app from '../modules/app';
import users from '../modules/users';
import posts from '../modules/posts';



const rootReducer = combineReducers({
    app: app.reducer,
    users: users.reducer,
    posts: posts.reducer
});

export default rootReducer;