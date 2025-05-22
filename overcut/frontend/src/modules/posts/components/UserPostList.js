import React, {useEffect, useRef, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import * as userSelector from '../../users/selectors';
import * as actions from '../actions';
import { FormattedMessage } from 'react-intl';
import {Box, FormControl, InputLabel, MenuItem, Paper, Select, TextField} from "@mui/material";
import Grid from "@mui/material/Grid";
import UserPosts from "./UserPosts";

import {Typography} from '@mui/material';
const UserPostList = () => {
    const dispatch = useDispatch();
    const user = useSelector(userSelector.getUser);
    const userPosts = useSelector(selectors.getUserPosts);
    const categories = useSelector(state => state.posts.categories);
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(null);
    const [order, setOrder] = useState(false);

    useEffect(() => {
        dispatch(actions.getUserPosts({
            userId: user.id,
            page:0
        },() =>{}));
    }, [dispatch,user]);



    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 2500 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: '1.5rem', // Ajusta el tamaño de la fuente
                    fontStyle: 'italic', // Aplica estilo cursiva
                    fontWeight: 'bold', // Aplica negrita
                    color: '#333333', // Color de texto blanco
                    padding: '5px', // Espaciado interno
                    borderRadius: '5px', // Bordes redondeados
                    marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                    maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                    display: 'inline-block', // Hace que el componente se ajuste al contenido
                    marginX: 'auto', // Centra horizontalmente el componente
                }}>
                    <FormattedMessage id="project.entities.Posts.MyPosts"></FormattedMessage>
                </Typography>
                <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="Title"
                            variant="outlined"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl variant="outlined" fullWidth>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select
                                labelId="category-label"
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                label="Category"
                            >
                                <MenuItem value=""><FormattedMessage id="project.global.dropdown.allCategories" /></MenuItem>
                                {categories && categories.map(category =>
                                    <MenuItem key={category.categoryId} value={category.categoryId}>{category.name}</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl variant="outlined" fullWidth>
                            <InputLabel id="order-label">Order</InputLabel>
                            <Select
                                labelId="order-label"
                                value={order ? "orderASC" : "orderDES"}
                                onChange={e => {
                                    if (e.target.value === "orderDefault") {
                                        setOrder(null)
                                    }
                                    if (e.target.value === "orderASC") {
                                        setOrder(true)
                                    }
                                    if (e.target.value === "orderDES") {
                                        setOrder(false)
                                    }
                                }}
                                label="Order"
                            >
                                <MenuItem value="orderDefault"><FormattedMessage id="project.global.dropdown.sortOrderDefault" /></MenuItem>
                                <MenuItem value="orderASC"><FormattedMessage id="project.global.dropdown.sortOrderASC" /></MenuItem>
                                <MenuItem value="orderDES"><FormattedMessage id="project.global.dropdown.sortOrderDES" /></MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Box sx={{ width: '100%', p: 5 }}>
                    <UserPosts userPosts={userPosts} />
                </Box>
            </Box>
        </Paper>
    );
}


export default UserPostList;
