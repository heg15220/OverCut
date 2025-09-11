// src/modules/posts/components/UserPostList.jsx
import React, {useEffect, useRef, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import * as userSelector from '../../users/selectors';
import * as actions from '../actions';
import { FormattedMessage } from 'react-intl';
import {Box, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Button} from "@mui/material";
import Grid from "@mui/material/Grid";
import UserPosts from "./UserPosts";
import {Typography} from '@mui/material';

const UserPostList = () => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector.getUser);
  const userPosts = useSelector(selectors.getUserPosts);
  const categories = useSelector(state => state.posts.categories);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [order, setOrder] = useState(null); // null = default, true = ASC, false = DES

  // Cargar categorías una vez
  useEffect(() => {
    dispatch(actions.getAllCategories(() => {}));
  }, [dispatch]);

  // Primera carga de posts del usuario (sin filtros)
  useEffect(() => {
    if (!user?.id) return;
    dispatch(actions.getUserPosts({ userId: user.id, page: 0 }));
  }, [dispatch, user?.id]);

  // Enviar filtros (vuelve a página 0)
  const applyFilters = (e) => {
    e?.preventDefault?.();
    if (!user?.id) return;
    dispatch(actions.getUserPosts({
      userId: user.id,
      title: title.trim() || undefined,
      categoryId: categoryId || undefined,
      order, // true/false/null
      page: 0
    }));
  };

  return (
    <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 2500 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{
          fontSize: '1.5rem',
          fontStyle: 'italic',
          fontWeight: 'bold',
          color: '#333333',
          p: '5px',
          borderRadius: '5px',
          mb: '10px',
          display: 'inline-block',
          mx: 'auto',
        }}>
          <FormattedMessage id="project.entities.Posts.MyPosts" />
        </Typography>

        <form onSubmit={applyFilters} style={{ width: '100%' }}>
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
                    <MenuItem key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="order-label">Order</InputLabel>
                <Select
                  labelId="order-label"
                  value={order === null ? "orderDefault" : (order ? "orderASC" : "orderDES")}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === "orderDefault") setOrder(null);
                    if (v === "orderASC") setOrder(true);
                    if (v === "orderDES") setOrder(false);
                  }}
                  label="Order"
                >
                  <MenuItem value="orderDefault"><FormattedMessage id="project.global.dropdown.sortOrderDefault" /></MenuItem>
                  <MenuItem value="orderASC"><FormattedMessage id="project.global.dropdown.sortOrderASC" /></MenuItem>
                  <MenuItem value="orderDES"><FormattedMessage id="project.global.dropdown.sortOrderDES" /></MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Button type="submit" variant="contained">
                <FormattedMessage id="project.global.button.search" defaultMessage="Search" />
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ width: '100%', p: 5 }}>
          <UserPosts userPosts={userPosts} />
        </Box>
      </Box>
    </Paper>
  );
}

export default UserPostList;
