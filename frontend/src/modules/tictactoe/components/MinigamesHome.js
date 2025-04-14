import React from "react";
import { Link } from "react-router-dom";
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import './MinigamesHome.css';

const MinigamesHome = () => {
    return (
        <Container maxWidth="md" className="minigames-home-container">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Typography variant="h3" gutterBottom color="primary">
                    Minijuegos OverCut
                </Typography>
                <Typography variant="h6" color="textSecondary">
                    ¡Pon a prueba tus conocimientos de Fórmula 1 jugando!
                </Typography>

                <Grid container spacing={4} justifyContent="center" marginTop={4}>
                    <Grid item>
                        <Link to="/minigames/tictactoe" style={{ textDecoration: 'none' }}>
                            <motion.div whileHover={{ scale: 1.1 }}>
                                <Card className="minigame-card">
                                    <CardContent>
                                        <SportsEsportsIcon style={{ fontSize: 50, color: '#FF1E1E' }} />
                                        <Typography variant="h5">Tic Tac Toe F1</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Consigue 3 en raya adivinando pilotos
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                    </Grid>
                </Grid>
            </motion.div>
        </Container>
    );
};

export default MinigamesHome;
