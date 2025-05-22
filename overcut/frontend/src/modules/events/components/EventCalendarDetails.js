import React, { useState } from 'react';
import { sourceImages } from "../../../helpers/sourceImages";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const EventCalendarDetails = ({ details }) => {
    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);
    const [desiredHeight, setDesiredHeight] = useState('8vh');

    // Eliminamos la función handleClickOnImage ya que no es necesaria para este caso

    return (
        <div style={{ padding: '1px', backgroundColor: 'lightgrey', width: '100%' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:'space-between',
                    width: '100%',
                    marginBottom: '1rem',
                }}
            >
                <Typography
                    variant="h5"
                    component="div"
                    sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        color: 'text.primary',
                        marginRight: '1rem',
                    }}
                >
                    {details.title}
                </Typography>

                <Box
                    sx={{
                        width: '100%',
                        height: desiredHeight,
                        overflow: 'hidden',
                        position:'relative',
                        '&:hover': {
                            '& img': {
                                transform:'scale(1.05)',
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
            </Box>
        </div>
    );
};

export default EventCalendarDetails;
