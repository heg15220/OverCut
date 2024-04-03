import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import PostList from "./PostList";
import * as actions from '../actions';
import { Pager } from '../../common';
import { FormattedMessage } from 'react-intl';
import {TextField, Select, MenuItem, Button, Box, FormControl, InputLabel, Paper} from '@mui/material';
import Grid from "@mui/material/Grid";

const AllPostList = () => {
    const dispatch = useDispatch();
    const posts = useSelector(selectors.getPosts);
    const categories = useSelector(state => state.posts.categories);
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(null);
    const [criteria, setCriteria] = useState(null);
    const [order, setOrder] = useState(false);
    const formRef = useRef(null);

    const handleSubmit = event => {
        event.preventDefault();
        if (formRef.current.checkValidity()) {
            dispatch(actions.getPosts(
                {
                    title: title.trim(),
                    categoryId: categoryId,
                    page: 0,
                    criteria: criteria,
                    order: order,
                },
                () => { },
                () => { },
            ));
        } else {
            formRef.current.classList.add('was-validated');
        }
    }

    useEffect(() => {
        dispatch(actions.getPosts(
            {
                title: title.trim(),
                categoryId: categoryId,
                page: 0,
                criteria: criteria,
                order: order,
            },
            () => { },
            () => { },
        ));
        dispatch(actions.getAllCategories(() => { }))
    }, [dispatch, categoryId, title, criteria, order]);

    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                            <InputLabel id="criteria-label">Criteria</InputLabel>
                            <Select
                                labelId="criteria-label"
                                value={criteria}
                                onChange={e => {
                                    if (e.target.value === "all") {
                                        setCriteria(null)
                                    }
                                    if (e.target.value === "creationDate") {
                                        setCriteria(0)
                                    }
                                }}
                                label="Criteria"
                            >
                                <MenuItem value="all"><FormattedMessage id="project.global.dropdown.sortCriteriaAll" /></MenuItem>
                                <MenuItem value="creationDate"><FormattedMessage id="project.global.dropdown.sortCriteriaCreationDate" /></MenuItem>
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
                    <Grid item xs={12} sm={6} md={4}>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={handleSubmit}
                            sx={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}
                            fullWidth
                        >
                            <FormattedMessage id="project.global.buttons.filter" />
                        </Button>
                    </Grid>
                </Grid>
                <Box sx={{ width: '100%', p: 5 }}>
                    <PostList posts={posts} />
                    {posts && (
                        <Pager
                            back={{
                                enabled: posts.criteria.page >= 1,
                                onClick: () => dispatch(actions.previousGetPosts(posts.criteria))
                            }}
                            next={{
                                enabled: posts.result.existMoreItems,
                                onClick: () => dispatch(actions.nextGetPosts(posts.criteria))
                            }}
                        />
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

export default AllPostList;
