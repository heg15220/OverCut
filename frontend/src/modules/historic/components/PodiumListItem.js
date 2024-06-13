import React from 'react';
import { FormattedMessage } from 'react-intl';
import CircuitDetailsLink from "./CircuitDetailsLink";
import {PodiumDetailsLink} from "../index";

const PodiumListItem = ({ podium }) => {
    // Asumiendo que post.image contiene la imagen del post en formato base64

    const srcImage = podium.image?
        `data:image/jpeg;base64,${podium.image}` :
        null;
    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            {/* Muestra la imagen del post si existe */}
            {srcImage && (
                <img src={srcImage} alt="Circuit Image" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'cover', position: 'absolute', top: '10px', right: '10px'}} />
            )}
            <div className="card-body">
                <div className="d-flex justify-content-between">
                    <div>{podium.date}</div>
                </div>
                <PodiumDetailsLink id={podium.id} name={podium.date} />
            </div>
        </div>
    )
}

export default PodiumListItem;
