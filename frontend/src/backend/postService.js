import {
    fetchConfig,
    appFetch,
} from "./appFetch";

export const createPost = (post, onSuccess, onErrors) => {
    appFetch(
        "/posts/",
        fetchConfig("POST", post),
        onSuccess,
        onErrors
    );
};

export const deletePost = (post, onSuccess, onErrors) => {
    appFetch(
        `/posts/${post.id}`,
        fetchConfig("DELETE", post),
        onSuccess,
        onErrors
    );
};

export const getAllCategories = (onSuccess) => {
    appFetch(
        "/posts/categories",
        fetchConfig("GET"),
        onSuccess
    );
};

export const getUserPosts = ({ page }, onSuccess) => {
    appFetch(
        `/posts/user?page=${page}`,
        fetchConfig("GET"),
        onSuccess
    );
};

export const uploadPostImage = (post, file, onSuccess) =>
    appFetch(`/posts/addImage/${post}`, fetchConfig("PUT", file), onSuccess);

export const getPostByPostId = (id, onSuccess) =>
    appFetch(`/posts/${id}`, fetchConfig("GET"), onSuccess);


export const modifyPost = (id, post, onSuccess, onErrors) => {
    appFetch(
        `/posts/${id}`,
        fetchConfig("PUT", post),
        onSuccess,
        onErrors
    );
};

export const getPosts = ({ title, categoryId, page, size, criteria, order }, onSuccess, onErrors) => {
    let url = `/posts/?page=${page}&size=${size}`;

    if (title) {
        url += `&title=${title}`;
    }

    if (categoryId) {
        url += `&categoryId=${categoryId}`;
    }

    if (criteria) {
        url += `&criteria=${criteria}`;
    }

    if (order !== undefined) {
        url += `&order=${order}`;
    }

    appFetch(
        url,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const newPosts = (timestamp, onSuccess) => {
    appFetch(
        `/posts/new?date=${timestamp}`,
        fetchConfig("GET"),
        onSuccess
    );
};

export const getComments = ({ postId, page }, onSuccess, onErrors) => {
    appFetch(
        `/posts/${postId}/comments?page=${page}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const createComment = (postId, comment, onSuccess) => {
    appFetch(
        `/posts/${postId}/comment`,
        fetchConfig("POST", comment),
        onSuccess,
    );
};

export const createAnswer = (id, comment, onSuccess) => {
    appFetch(
        `/posts/comment/${id}/answer`,
        fetchConfig("POST", comment),
        onSuccess,
    );
};

export const deleteComment = (comment, onSuccess, onErrors) => {
    appFetch(
        `/posts/comment/${comment}`,
        fetchConfig("DELETE", comment),
        onSuccess,
        onErrors
    );
};

export const modifyComment = (id, comment, onSuccess) => {
    appFetch(
        `/posts/comment/${id}`,
        fetchConfig("PUT", comment),
        onSuccess,
    );
};
