import React from 'react';
import { FormattedMessage } from 'react-intl';
import EventDetailsLink from "./EventDetailsLink";

const EventListItem = ({ event }) => {
    // Asumiendo que post.image contiene la imagen del post en formato base64

    const srcImage = event.imageUrl?
        `data:image/jpeg;base64,"/resources/static/images/Bahrain_Circuit.jpg"` :
        null;
    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            {/* Muestra la imagen del post si existe */}
            {srcImage && (
                <img src={srcImage} alt="Circuit Image" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'cover', position: 'absolute', top: '10px', right: '10px'}} />
            )}
            <div className="card-body">
                <EventDetailsLink id={event.id} name={event.name} />
                <div>{new Date(event.date).toLocaleDateString('default', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}</div>
            </div>
        </div>
    )
}

export default EventListItem;