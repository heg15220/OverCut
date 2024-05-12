import {combineReducers} from 'redux';

import app from '../modules/app';
import users from '../modules/users';
import posts from '../modules/posts';
import circuits from '../modules/historic';



const rootReducer = combineReducers({
    app: app.reducer,
    users: users.reducer,
    posts: posts.reducer,
    circuits: circuits.reducer
});

export default rootReducer;