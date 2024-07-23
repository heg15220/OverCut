import backend from '../../backend';
import * as actionTypes from './actionTypes';

const createPostCompleted = (post) => ({
    type: actionTypes.CREATE_POST_COMPLETED,
    post
});


const deletePostCompleted = (post) => ({
    type: actionTypes.DELETE_POST_COMPLETED,
    post
});

export const createPost = (post, onSuccess, onErrors) => dispatch =>
    backend.postService.createPost(post, post => {
            dispatch(createPostCompleted(post));
            onSuccess(post);
        },
        onErrors);

export const deletePost = (post, onSuccess, onErrors) => dispatch =>
    backend.postService.deletePost(post, post => {
            dispatch(deletePostCompleted(post));
            onSuccess();
        },
        onErrors);

const getAllCategoriesCompleted = (categories) => ({
    type: actionTypes.FIND_CATEGORIES_COMPLETED,
    categories
});

export const getAllCategories = (onSuccess) => dispatch =>
    backend.postService.getAllCategories(categories => {
        dispatch(getAllCategoriesCompleted(categories));
        onSuccess();
    });



export const getPosts = criteria => dispatch =>
    backend.postService.getPosts(criteria,
        result => dispatch(getPostsCompleted({ criteria, result })));


const getPostsCompleted = (posts) => ({
    type: actionTypes.GET_POSTS_COMPLETED,
    posts
});

export const previousGetPosts = criteria =>
    getPosts({
        ...criteria,
        page: criteria.page - 1
    });

export const nextGetPosts = criteria =>
    getPosts({
        ...criteria,
        page: criteria.page + 1
    });


export const getUserPosts = criteria => dispatch =>
    backend.postService.getUserPosts(criteria,
        result => dispatch(getUserPostsCompleted({ criteria, result })));

const getUserPostsCompleted = (userPosts) => ({
    type: actionTypes.GET_USER_POSTS_COMPLETED,
    userPosts
});

export const previousGetUserPosts = criteria =>
    getUserPosts({ page: criteria.page - 1 });

export const nextGetUserPosts = criteria =>
    getUserPosts({ page: criteria.page + 1 });

const addImageCompleted = (post) => ({
    type: actionTypes.ADD_IMAGE_COMPLETED,
    post
});

export const addImage = (post, file, onSuccess, onErrors) =>
    dispatch => {
        backend.postService.uploadPostImage(post, file, (result) => {
                dispatch(addImageCompleted(result));
                onSuccess();
            },
            onErrors);
    }

const findPostByIdCompleted = post => ({
    type: actionTypes.FIND_POST_BY_ID_COMPLETED,
    post
});

export const findPostById = id => dispatch => {
    backend.postService.getPostByPostId(id, post => dispatch(findPostByIdCompleted(post)));
}

export const clearPost = () => ({
    type: actionTypes.CLEAR_POST
});

export const modifyPostCompleted = post => ({
    type: actionTypes.MODIFY_POST_COMPLETED,
    post
})

export const modifyPost = (id, post, onSuccess, onErrors) => dispatch =>
    backend.postService.modifyPost(id, post, post => {
            dispatch(modifyPostCompleted(post));
            onSuccess();
        },
        onErrors);


const addPostImageCompleted = (post) => ({
    type: actionTypes.ADD_IMAGE_COMPLETED,
    post
});

export const addPostImage = (post, file, onSuccess, onErrors) =>
    dispatch => {
        backend.postService.uploadPostImage(post, file, (result) => {
                dispatch(addPostImageCompleted(result));
                onSuccess();
            },
            onErrors);
    }

export const getNewPosts = last_refresh => dispatch =>
    backend.postService.newPosts(last_refresh, result => {
        console.log(result)
        dispatch(getNewPostsCompleted(result))
    });

const getNewPostsCompleted = (result) => ({
    type: actionTypes.GET_NEW_POSTS_COMPLETED,
    result
});

const getUserPostCompleted = (postUser) => ({
    type: actionTypes.GET_USER_POST_COMPLETED,
    postUser
});

export const updatePostArticle = (postId, post, onSuccess, onErrors) => dispatch =>
    backend.postService.modifyPost(postId, post, post => {
            dispatch(modifyPostCompleted(post));
            onSuccess();
        },
        onErrors);

export const getComments = criteria => dispatch =>
    backend.postService.getComments(criteria,
        result => dispatch(getCommentsCompleted({ criteria, result })));

const getCommentsCompleted = (comments) => ({
    type: actionTypes.GET_COMMENTS_COMPLETED,
    comments
});

export const createComment = (postId, comment, onSuccess) => dispatch =>
    backend.postService.createComment(postId, comment, comment => {
        onSuccess(comment);
    });

export const createAnswer = (id, comment, onSuccess) => dispatch =>
    backend.postService.createAnswer(id, comment, () => {
        onSuccess();
    });

export const deleteComment = (comment, onSuccess) => dispatch =>
    backend.postService.deleteComment(comment, () => {
        onSuccess();
    });

export const modifyComment = (id, comment, onSuccess) => dispatch =>
    backend.postService.modifyComment(id, comment, () => {
        onSuccess();
    });


export const getUserPost = (id, onSuccess) => dispatch =>
    backend.postService.getUserPost(id,postUser => {
            dispatch(getUserPostCompleted(postUser));
            onSuccess(postUser);
        });