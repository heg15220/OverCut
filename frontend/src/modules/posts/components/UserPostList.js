import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import PostList from "./PostList";
import * as actions from '../actions';
import { Pager } from '../../common';
import { FormattedMessage } from 'react-intl';



const UserPostList = () => {
    const dispatch = useDispatch();
    const userPosts = useSelector(selectors.getUserPosts);


    useEffect(() => {
            dispatch(actions.getUserPosts({ page: 0 }));
        }, [dispatch]
    );

    return (
        <div className="container">
            <PostList posts={userPosts} />
            {userPosts ?
                (
                    <Pager
                        back={{
                            enabled: userPosts.criteria.page >= 1,
                            onClick: () => dispatch(actions.previousGetUserPosts(userPosts.criteria))
                        }}
                        next={{
                            enabled: userPosts.result.existMoreItems,
                            onClick: () => dispatch(actions.nextGetUserPosts(userPosts.criteria))
                        }} />
                )
                : <p><FormattedMessage id="project.no_users_post" /></p>}
        </div>
    );

}

export default UserPostList;