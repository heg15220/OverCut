import React from 'react';
import PostDetailsLink from './PostDetailsLink';
import { FormattedMessage } from 'react-intl';

const PostListItem = ({ post }) => {
    // Asumiendo que post.image contiene la imagen del post en formato base64
    const srcImage = post.image ? "data:image/jpg;base64," + post.image : null;

    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            {/* Muestra la imagen del post si existe */}
            {srcImage && (
                <img src={srcImage} alt="Post Image" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'cover', position: 'absolute', top: '10px', right: '10px'}} />
            )}
            <div className="card-body">
                <div className="d-flex justify-content-between">
                    <div>{post.categoryName}</div>
                </div>
                <PostDetailsLink id={post.id} name={post.title} />
                <p className="card-text">{post.subtitle.replace(/Ã±/g, 'ñ').replace(/Ã³/g, 'ó')}</p>
            </div>
        </div>
    )
}

export default PostListItem;
