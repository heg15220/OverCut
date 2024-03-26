import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    post: null,
    posts: null,
    userPosts: null,
    categories: null
};

const post = (state = initialState.post, action) => {
    switch (action.type) {
        case actionTypes.CREATE_POST_COMPLETED:
            return action.post;
        case actionTypes.FIND_POST_BY_ID_COMPLETED:
            return action.post;
        case actionTypes.DELETE_POST_COMPLETED:
            return action.post;
        case actionTypes.CLEAR_POST:
            return initialState.post;
        case actionTypes.ADD_IMAGE_COMPLETED:
            return action.post;
        case actionTypes.MODIFY_POST_COMPLETED:
            return action.post;
        default:
            return state;
    }
}

const userPosts = (state = initialState.userPosts, action) => {
    if (action.type === actionTypes.GET_USER_POSTS_COMPLETED) {
        return action.userPosts;
    } else {
        return state;
    }
}

const posts = (state = initialState.posts, action) => {
    switch (action.type) {
        case actionTypes.GET_POSTS_COMPLETED:
            return action.posts;
        case actionTypes.FILTER_POST_COMPLETED:
            return action.posts;
        default:
            return state;
    }
}

const categories = (state = initialState.categories, action) => {
    if (action.type === actionTypes.FIND_CATEGORIES_COMPLETED) {
        return action.categories;
    } else {
        return state;
    }
}

const newPosts = (state = initialState.newPosts, action) => {
    switch (action.type) {
        case actionTypes.GET_POSTS_COMPLETED:
            return false;
        case actionTypes.GET_NEW_POSTS_COMPLETED:
            return action.result;
        default:
            return state;
    }
}

const lastGetPost = (state = initialState.lastGetPost, action) => {
    switch (action.type) {
        case actionTypes.GET_POSTS_COMPLETED:
            return Date.now();
        default:
            return state;
    }
}


const reducer = combineReducers({
    post,
    posts,
    userPosts,
    categories,
});
export default reducer;
