import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const PostDetailsLink = ({ id, name }) => {
    return (
        <Link to={`/post/post-details/${id}`} style={{ color: '#00000F'}}>
            {name}
        </Link>
    );
}

PostDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
};


export default PostDetailsLink;