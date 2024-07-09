import React from 'react';
import { FormattedMessage } from 'react-intl';
import CircuitDetailsLink from "./CircuitDetailsLink";

const CircuitListItem = ({ circuit }) => {
    // Asumiendo que post.image contiene la imagen del post en formato base64

    const srcImage = circuit.image?
        `data:image/jpeg;base64,"/resources/static/images/Bahrain_Circuit.jpg"` :
        null;
    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            {/* Muestra la imagen del post si existe */}
            {srcImage && (
                <img src={srcImage} alt="Circuit Image" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'cover', position: 'absolute', top: '10px', right: '10px'}} />
            )}
            <div className="card-body">
                <CircuitDetailsLink id={circuit.id} name={circuit.name} />
            </div>
        </div>
    )
}

export default CircuitListItem;
