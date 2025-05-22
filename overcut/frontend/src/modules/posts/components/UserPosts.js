import React from 'react';
import PostListItem from './PostListItem';

const UserPosts = ({userPosts}) => {
    // Verifica si posts es un array y si posts.items existe antes de intentar mapear
    if (!userPosts || !userPosts.result || !Array.isArray(userPosts.result.items)) {
        return <div>Loading...</div>; // Or any other placeholder content
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', justifyItems: 'start' }}>
            {userPosts.result.items.map((post, index) => (
                <PostListItem key={index} post={post} />
            ))}
        </div>
    );
};
export default UserPosts;