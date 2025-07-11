import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import PostList from "./PostList";
import * as actions from '../actions';
import { FormattedMessage } from 'react-intl';
import { TextField, Select, MenuItem, Button, Box, FormControl, InputLabel, Paper } from '@mui/material';
import Grid from "@mui/material/Grid";
import "./AllPostList.css";

const getDefaultLanguage = () => navigator.language.startsWith('es') ? 'es' : 'en';

const AllPostList = () => {
  const dispatch = useDispatch();
  const posts = useSelector(selectors.getPosts);
  const categories = useSelector(state => state.posts.categories);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [criteria, setCriteria] = useState(null);
  const [order, setOrder] = useState(false);
  const [language, setLanguage] = useState(getDefaultLanguage());
  const formRef = useRef(null);

  const handleSubmit = event => {
    event.preventDefault();
    if (formRef.current?.checkValidity()) {
      dispatch(actions.getPosts({
        title: title.trim(),
        categoryId,
        page: 0,
        criteria,
        order,
        language
      }));
    } else {
      formRef.current?.classList.add('was-validated');
    }
  };

  useEffect(() => {
    dispatch(actions.getPosts({ title: title.trim(), categoryId, page: 0, criteria, order, language }));
    dispatch(actions.getAllCategories(() => {}));
  }, [dispatch, categoryId, title, criteria, order, language]);

  return (
    <Paper className="all-post-container">
      <Box className="all-post-box">
        <form ref={formRef} onSubmit={handleSubmit} className="all-post-form">
          <Grid container spacing={2} justifyContent="center" alignItems="center" className="all-post-grid">
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
                  value={categoryId || ""}
                  onChange={e => setCategoryId(e.target.value)}
                  label="Category"
                >
                  <MenuItem value=""><FormattedMessage id="project.global.dropdown.allCategories" /></MenuItem>
                  {categories?.filter(cat => cat.name === 'News' || cat.name === 'Analysis')
                    .map(cat =>
                      <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
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
                    const val = e.target.value;
                    setOrder(val === "orderASC");
                    if (val === "orderDefault") setOrder(null);
                  }}
                  label="Order"
                >
                  <MenuItem value="orderDefault"><FormattedMessage id="project.global.dropdown.sortOrderDefault" /></MenuItem>
                  <MenuItem value="orderASC"><FormattedMessage id="project.global.dropdown.sortOrderASC" /></MenuItem>
                  <MenuItem value="orderDES"><FormattedMessage id="project.global.dropdown.sortOrderDES" /></MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="language-label">Language</InputLabel>
                <Select
                  labelId="language-label"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  label="Language"
                >
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box textAlign="center" marginTop={2}>
            <Button variant="contained" color="primary" type="submit">
              <FormattedMessage id="project.global.button.search" defaultMessage="Search" />
            </Button>
          </Box>
        </form>
        <Box sx={{ width: '100%', p: { xs: 2, sm: 3, md: 5 } }}>
          <PostList posts={posts} />
        </Box>
      </Box>
    </Paper>
  );
};

export default AllPostList;
