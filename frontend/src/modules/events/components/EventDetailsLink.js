import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const EventDetailsLink = ({ id, name }) => {
    return (
        <Link to={`/event/event-details/${id}`} style={{ color: '#00000F'}}>
            {name}
        </Link>
    );
}

EventDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.number.isRequired,
};


export default EventDetailsLink;