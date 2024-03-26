import PostListItem from "./PostListItem";
import { FormattedMessage } from 'react-intl';



const PostList = ({ posts }) => {

    return (
        <div>
            {posts ?
                (<div>
                    <div>{
                        posts.result.items.map(post =>
                            <PostListItem key={post.postId} post={post} />)
                    }
                    </div>
                </div>) : <FormattedMessage id="project.no_posts" />}
        </div>
    );

}

export default PostList;
