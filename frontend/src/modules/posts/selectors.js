const getModuleState = state => state.posts;

export const findAllCategories = state =>
    getModuleState(state).categories;

export const getPosts = state =>
    getModuleState(state).posts;

export const getUserPosts = state =>
    getModuleState(state).userPosts;

export const getPost = state =>
    getModuleState(state).post;

export const getComments = state =>
    getModuleState(state).comments;

export const getPostFiltered = state =>
    getModuleState(state).posts; // Corregido

export const getNewPosts= state =>
    getModuleState(state).newPosts;

export const getLastGetPost = state =>
    getModuleState(state).lastGetPost;

export const getUserPost = state =>
    getModuleState(state).postUser;



