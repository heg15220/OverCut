import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const CircuitDetailsLink = ({ id, name }) => {
    return (
        <Link to={`/circuit/circuit-details/${id}`} style={{ color: '#00000F'}}>
            {name}
        </Link>
    );
}

CircuitDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.number.isRequired,
};


export default CircuitDetailsLink;