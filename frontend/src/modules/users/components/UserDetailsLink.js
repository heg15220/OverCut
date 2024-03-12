import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const UserDetailsLink = ({ id, name }) => {

    return (
        <Link to={`/user/user-details/${id}`} style={{ textDecoration: 'none' }} className='text-black dropdown-item'>
            {name}
        </Link>
    );

}

UserDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
};


export default UserDetailsLink;