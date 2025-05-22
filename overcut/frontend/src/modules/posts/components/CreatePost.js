import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Errors, Success } from '../../common';
import * as actions from '../actions';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const defaultTheme = createTheme();

const CreatePost = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const categories = useSelector(state => state.posts.categories);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [article, setArticle] = useState('');
    const [categoryId, setCategory] = useState(1);
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = event => {
        event.preventDefault();
        dispatch(actions.createPost(
            {
                article: article.trim(),
                categoryId: categoryId,
                subtitle: subtitle.trim(),
                title: title.trim()
            },
            post => {
                setSuccess('Se ha creado el post correctamente');
                navigate(`/posts/${post}/add-image`);
            },
            errors => setBackendErrors(errors),
        ));
    }

    const handleCategoryChange = event => {
        setCategory(event.target.value);
    }

    useEffect(() => {
        dispatch(actions.getAllCategories(() => { }))
    }, [dispatch]);

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="false">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        <FormattedMessage id="project.posts.CreatePost.title" />
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="title"
                            label={<FormattedMessage id="project.global.fields.title" />}
                            name="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="subtitle"
                            label={<FormattedMessage id="project.global.fields.subtitle" />}
                            name="subtitle"
                            value={subtitle}
                            onChange={e => setSubtitle(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="article"
                            label={<FormattedMessage id="project.global.fields.article" />}
                            name="article"
                            value={article}
                            onChange={e => setArticle(e.target.value)}
                            multiline
                            rows={15} // Aumenta el número de filas aquí
                            variant="outlined"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="category-label">
                                <FormattedMessage id="project.global.fields.category" />
                            </InputLabel>
                            <Select
                                labelId="category-label"
                                id="category"
                                value={categoryId}
                                onChange={handleCategoryChange}
                            >
                                {categories.map(category => (
                                    <MenuItem key={category.categoryId} value={category.categoryId}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            <FormattedMessage id="project.global.buttons.save" />
                        </Button>
                    </Box>
                </Box>
            </Container>

        </ThemeProvider>
    );
}

export default CreatePost;
