import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import CircuitDetailsLink from "./CircuitDetailsLink";
import { PodiumDetailsLink } from "../index";

import { sourceImages } from '../../../helpers/sourceImages';
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const PodiumListItem = ({ podium }) => {
    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);

    const handleImageOrTitleClick = () => {
        navigate(`/circuit/circuit-details/podium/podium-details/${podium.id}`);
    };

    return (
        <div className="card my-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '75%', height: '26vh', position: 'relative', paddingRight: '20px' }}>
            {/* Muestra la imagen del circuito si existe */}
            <Box
                sx={{
                    width: '100%',
                    height: '85vh', // Aumenta el espacio que ocupa la imagen
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                        '& img': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
                            transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                        }
                    }
                }}
            >
                <img
                    ref={setImageRef}
                    className="image-hover-target"
                    src={sourceImages(`./${podium.image}`)}
                    alt="Post Image"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onClick={handleImageOrTitleClick}
                    sx={{
                        transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                    }}
                />
                <Typography variant="body2" component="div" sx={{
                    fontSize: '1.2rem',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    color: '#333333',
                    padding: '5px',
                    borderRadius: '5px',
                    maxWidth: 'auto',
                    display: 'inline-block',
                    marginX: 'auto',
                }}
                            onClick={handleImageOrTitleClick}
                >
                    {podium.date}
                </Typography>
            </Box>
            {/* Muestra el título debajo de la imagen */}
            <Typography variant="body2" component="div" sx={{
                fontSize: '1.2rem',
                fontStyle: 'italic',
                fontWeight: 'bold',
                color: '#333333',
                padding: '5px',
                borderRadius: '5px',
                maxWidth: 'auto',
                display: 'inline-block',
                marginX: 'auto',
            }}
                        onClick={handleImageOrTitleClick}
            >
                {podium.date}
            </Typography>
        </div>
    );
};

export default PodiumListItem;
