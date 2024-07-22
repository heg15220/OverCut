import React, { useState } from 'react';
import { sourceImages } from "../../../helpers/sourceImages";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const EventCalendarDetails = ({ details }) => {
    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);

    // Función para manejar clics en la imagen y evitar la propagación del evento
    const handleClickOnImage = (event) => {
        event.stopPropagation(); // Evita que el evento se propague
    };

    return (
        <div style={{ padding: '1px', backgroundColor: 'lightgrey', width: '100%' }}>
            <Typography
                variant="h5"
                component="div"
                sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: 'text.primary',
                    marginTop: '0.5rem',
                    marginBottom: '1rem',
                    textAlign: 'left',
                }}
            >
                {details.title}
            </Typography>

            <Box
                sx={{
                    width: '100%',
                    height: '30vh',
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
                    src={sourceImages(`./${details.url}`)}
                    alt="Post Image"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onClick={handleClickOnImage} // Agrega el manejador de eventos de clic aquí
                    sx={{
                        transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                    }}
                />
            </Box>
            {/* Puedes agregar más detalles según sea necesario */}
        </div>
    );
};

export default EventCalendarDetails;
