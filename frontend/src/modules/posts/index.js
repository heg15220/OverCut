import * as actions from './actions';
import * as actionTypes from './actionTypes';
import reducer from './reducer';
import * as selectors from './selectors';

export { default as CreatePost } from './components/CreatePost';
export { default as PostList } from './components/PostList';
export { default as PostListItem } from './components/PostListItem';
export { default as AllPostList } from './components/AllPostList';
export { default as UserPostList } from './components/UserPostList';
export { default as PostDetails } from './components/PostDetails';
export { default as ModifyPost } from './components/ModifyPost';
export { default as AddImage } from './components/AddImage';

const exportedObj = { actions, actionTypes, reducer, selectors };

export default exportedObj;
