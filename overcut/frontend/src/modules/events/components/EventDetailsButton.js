import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './EventDetailsButton.css'; // Importa el archivo CSS aquí

const EventDetailsButton = ({ id, name }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/event/event-details/${id}`);
    };

    return (
        <button className="button-style" onClick={handleClick}>
            {name}
        </button>
    );
}

EventDetailsButton.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
};

export default EventDetailsButton;
