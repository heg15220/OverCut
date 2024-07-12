import React, {useState} from 'react';
import {sourceImages} from "../../../helpers/sourceImages";
import {useNavigate} from "react-router-dom";
import {Box, Typography} from "@mui/material";

const EventCalendarDetails = ({ details }) => {

    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);
    return (
        <div style={{ padding: '1px', backgroundColor: 'lightgrey', width: '100%'}}>
            <Typography
                variant="h5"
                component="div"
                sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: 'text.primary',
                    marginTop: '0.5rem', // Ajusta el margen superior para separar el nombre de la categoría del título
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    textAlign: 'left', // Centra el texto horizontalmente si deseas
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
