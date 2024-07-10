import React, {useState} from 'react';
import { FormattedMessage } from 'react-intl';
import CircuitDetailsLink from "./CircuitDetailsLink";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {navigate} from "react-big-calendar/lib/utils/constants";
import {useNavigate} from "react-router-dom";
import {sourceImages} from '../../../helpers/sourceImages';
const CircuitListItem = ({ circuit }) => {
    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);

    const handleImageOrTitleClick = () => {
        navigate(`/circuit/circuit-details/${circuit.id}`);
    };


    return (
        <div className="card my-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '60vh', position: 'relative', paddingRight: '20px' }}>
            {/* Muestra la imagen del circuito si existe */}
                <Box
                    sx={{
                        width: '100%',
                        height: '80vh',
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
                        src={sourceImages(`./${circuit.image}`)}
                        alt="Post Image"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}

                        onClick={handleImageOrTitleClick}
                        sx={{
                            transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                        }}
                    />
                </Box>
            <Typography variant="h5" component="div" sx={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'text.primary',
                marginTop: '0.5rem', // Ajusta el margen superior para separar el nombre de la categoría del título
                marginBottom: '1rem',
                cursor: 'pointer',
                textDecoration: 'none',
            }}
                        onClick={handleImageOrTitleClick}
            >
                {circuit.name}
            </Typography>
        </div>
    )
}

export default CircuitListItem;
