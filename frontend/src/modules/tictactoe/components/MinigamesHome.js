import React from "react";
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Link } from "react-router-dom";
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CrosswordIcon from '@mui/icons-material/GridOn'; // O cualquier otro icono de crucigrama
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
                            <motion.div whileHover={{ scale: 1.08 }}>
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
                    <Grid item>
                        <Link to="/minigames/crossword" style={{ textDecoration: 'none' }}>
                            <motion.div whileHover={{ scale: 1.08 }}>
                                <Card className="minigame-card">
                                    <CardContent>
                                        <CrosswordIcon style={{ fontSize: 50, color: '#1976d2' }} />
                                        <Typography variant="h5">Crucigrama F1</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Rellena el crucigrama de Fórmula 1
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link to="/minigames/gridgame" style={{ textDecoration: 'none' }}>
                            <motion.div whileHover={{ scale: 1.08 }}>
                                <Card className="minigame-card">
                                    <CardContent>
                                        <DirectionsCarIcon style={{ fontSize: 50, color: '#fbc02d' }} />
                                        <Typography variant="h5">Parrilla F1</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Acierta los pilotos por nacionalidad en la parrilla
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                    </Grid>

                <Grid item>
                    <Link to="/minigames/guessdriver" style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ scale: 1.08 }}>
                            <Card className="minigame-card">
                                <CardContent>
                                    <DirectionsCarIcon style={{ fontSize: 50, color: '#00c853' }} />
                                    <Typography variant="h5">Adivina el Piloto</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Haz preguntas y adivina al piloto misterioso
                                    </Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Link>
                </Grid>
                <Grid item>
                  <Link to="/minigames/top10" style={{ textDecoration: 'none' }}>
                    <motion.div whileHover={{ scale: 1.08 }}>
                      <Card className="minigame-card">
                        <CardContent>
                          <DirectionsCarIcon style={{ fontSize: 50, color: '#29b6f6' }} />
                          <Typography variant="h5">Top 10 F1</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Adivina los 10 primeros de una carrera real
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
