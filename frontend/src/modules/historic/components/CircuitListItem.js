import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import CircuitDetailsLink from "./CircuitDetailsLink";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link, useNavigate } from "react-router-dom";
import { sourceImages } from '../../../helpers/sourceImages';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartPie } from "@fortawesome/free-solid-svg-icons";

const CircuitListItem = ({ circuit }) => {
    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);

    const handleImageOrTitleClick = () => {
        navigate(`/circuit/circuit-details/${circuit.id}`);
    };

    const handleButtonClick = () => {
        navigate(`/circuit/${circuit.id}/stats`);
    };

    const handleButtonPodiumClick = () => {
        navigate(`/circuit/${circuit.id}/podiums`);
    };

    return (
        <div className="card my-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '60vh', position: 'relative', paddingRight: '20px' }}>
            <button
                className="stat-btn"
                style={{
                    color: 'black',
                    background: '#f0f0f0',
                    borderRadius: '5px',
                    padding: '10px 15px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
                onClick={handleButtonClick}
            >
                <FontAwesomeIcon icon={faChartPie} /> {/* Ícono de estadísticas */}
                <span><FormattedMessage id="project.modules.historic.stats" /></span>
            </button>

            <button
                className="stat-btn"
                style={{
                    color: 'black',
                    background: '#f0f0f0',
                    borderRadius: '5px',
                    padding: '10px 15px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
                onClick={handleButtonPodiumClick}
            >
                <FontAwesomeIcon icon={faChartPie} /> {/* Ícono de estadísticas */}
                <span><FormattedMessage id="project.modules.historic.podiums" /></span>
            </button>

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
                />
            </Box>
            <Typography variant="h5" component="div" sx={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'text.primary',
                marginTop: '0.5rem',
                marginBottom: '1rem',
                cursor: 'pointer',
                textDecoration: 'none',
            }}
                        onClick={handleImageOrTitleClick}
            >
                {circuit.name}
            </Typography>
        </div>
    );
};

export default CircuitListItem;
