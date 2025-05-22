import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const PodiumDetailsLink = ({ id, name }) => {
    return (
        <Link to={`/circuit/circuit-details/podium/podium-details/${id}`} style={{ color: '#00000F'}}>
            {name}
        </Link>
    );
}

PodiumDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.number.isRequired,
};


export default PodiumDetailsLink;