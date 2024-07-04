import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const AwardDetailsLink = ({ id, name }) => {
    return (
        <Link to={`/award/award-details/${id}`} style={{ color: '#00000F'}}>
            {name}
        </Link>
    );
}

AwardDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.number.isRequired,
};


export default AwardDetailsLink;