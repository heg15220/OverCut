import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const EventListLink = () => {
    return (
        <Link to={`/events`} style={{ color: '#00000F'}}>
        </Link>
    );
}


export default EventListLink;