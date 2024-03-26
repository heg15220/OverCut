const getModuleState = state => state.posts;

export const findAllCategories = state =>
    getModuleState(state).categories;

export const getPosts = state =>
    getModuleState(state).posts;

export const getUserPosts = state =>
    getModuleState(state).userPosts;

export const getPost = state =>
    getModuleState(state).post;

export const getPostFiltered = state =>
    getModuleState(state).posts;
export const getNewPosts= state =>
    getModuleState(state).newPosts;

export const getLastGetPost = state =>
    getModuleState(state).lastGetPost;

