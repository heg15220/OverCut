import React from 'react';
import { useSelector } from 'react-redux';
import PostListItem from './PostListItem'; // Asume que PostListItem es el componente que acabas de modificar

const PostsList = ({posts}) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {posts.result.items.map((post, index) => (
                <PostListItem key={index} post={post} />
            ))}
        </div>
    );
};

export default PostsList;
