import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import PostList from "./PostList";
import * as actions from '../actions';
import { Pager } from '../../common';
import { FormattedMessage } from 'react-intl';
import {useNavigate} from "react-router-dom";

const UserPostList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userPosts = useSelector(selectors.getUserPosts);

    useEffect(() => {
        dispatch(actions.getUserPosts({ page: 0 }));
    }, [dispatch]);

    // Check if userPosts is not null before rendering PostList
    if (!userPosts || !userPosts.result) {
        return <p>Loading...</p>; // Or any other placeholder content
    }

    return (
        <div className="container">
            <PostList posts={userPosts.result.posts} /> {/* Adjust based on actual structure */}
            {userPosts.result.existMoreItems ? (
                <Pager
                    back={{
                        enabled: userPosts.criteria.page >= 1,
                        onClick: () => dispatch(actions.previousGetUserPosts(userPosts.criteria))
                    }}
                    next={{
                        enabled: userPosts.result.existMoreItems,
                        onClick: () => dispatch(actions.nextGetUserPosts(userPosts.criteria))
                    }} />
            ) : navigate('/')}
        </div>
    );
}

export default UserPostList;
