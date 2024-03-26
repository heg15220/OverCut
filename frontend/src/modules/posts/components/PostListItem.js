import PostDetailsLink from './PostDetailsLink';
import {FormattedMessage } from 'react-intl';

const PostListItem = ({ post }) => {
    return (
        <div className="card my-2">
            <div className="card-body">
                <PostDetailsLink id={post.id} name={post.title} />
                <p className="card-text">{post.subtitle.replace(/Ã±/g, 'ñ').replace(/Ã³/g, 'ó')}</p>
                <div className="d-flex justify-content-between">
                    <div><FormattedMessage id="project.global.fields.category" />: {post.categoryName}</div>
                </div>
            </div>
        </div>
    )

}

export default PostListItem;
