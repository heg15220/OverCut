import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, Box, Container, Alert, AlertTitle } from '@mui/material';
import image from './Resources/default_image.jpg';
import { FormattedMessage } from 'react-intl';
import WebFont from 'webfontloader';
import CommentList from './CommentList';
import TextField from "@mui/material/TextField";



const PostDetails = () => {
    const { id } = useParams();
    const post = useSelector(selectors.getPost);
    const user = useSelector(userSelectors.getUser);
    const postUser = useSelector(selectors.getUserPost);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        const postId = Number(id);
        if (!Number.isNaN(postId)) {
            dispatch(actions.findPostById(postId));
            dispatch(actions.getUserPost(postId, () => {}));
        }
    }, [id, user, dispatch]);

    useEffect(() => {
        WebFont.load({
            google: {
                families: ['Poppins:300,400,500,600,700']
            }
        });
    }, []);

    const handleSubmitDelete = event => {
        event.preventDefault();
        dispatch(actions.deletePost(
            post, () => navigate("/"),
            errors => setBackendErrors(errors),
        ));
    }

    if (!post) {
        return null;
    }

    const srcImage = post.image ? "data:image/jpg;base64," + post.image : image;

    let userImageSrc = image; // Imagen predeterminada
    if (postUser && postUser.id === post.userId) {
        userImageSrc = postUser.image ? "data:image/jpg;base64," + postUser.image : image;
    }

    let userName = 'Usuario desconocido'; // Nombre predeterminado
    if (postUser && postUser.id === post.userId) {
        userName = postUser.userName ? postUser.userName : 'Usuario desconocido';
    }

    return (
        <Container sx={{ marginTop: 0 }}> {/* Reduce el margen superior del Container */}
            <Box my={0}> {/* Reduce el margen superior del Box */}
                {backendErrors && (
                    <Alert severity="error" onClose={() => setBackendErrors(null)}>
                        <AlertTitle>Error</AlertTitle>
                        {backendErrors}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)}>
                        <AlertTitle>Success</AlertTitle>
                        {success}
                    </Alert>
                )}
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" color="text.secondary" sx={{
                            backgroundColor: '#000000', // Tono gris de fondo
                            color: 'white', // Letras blancas
                            padding: '5px', // Espaciado interno
                            borderRadius: '5px', // Bordes redondeados
                            fontSize: '1.4rem', // Tamaño de letra más grande
                            marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                            maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                            display: 'inline-block', // Hace que el componente se ajuste al contenido
                            marginX: 'auto', // Centra horizontalmente el componente
                        }}>
                            {post.categoryName}
                        </Typography>

                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem', // Ajusta el tamaño de la fuente
                            fontWeight: 'bold', // Hace el texto en negrita
                            textTransform: 'uppercase', // Convierte el texto a mayúsculas
                            color: 'text.primary', // Asume que quieres el color primario del tema, ajusta según sea necesario
                            marginTop: '1rem', // Añade un margen superior
                            marginBottom: '1rem', // Añade un margen inferior
                        }}>
                            {post.title}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{
                            fontSize: '1.2rem', // Ajusta el tamaño de la fuente
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
                            {post.subtitle}
                        </Typography>


                        <CardMedia
                            component="img"
                            image={srcImage}
                            alt="Post Image"
                            sx={{
                                maxHeight: '500px', // Ajusta el tamaño máximo de la imagen
                                maxWidth: '80%', // Asegura que la imagen no exceda el ancho del contenedor
                                objectFit: 'cover', // Ajusta cómo se redimensiona la imagen
                                marginTop: 2, // Añade un margen en la parte superior para separar la imagen del subtítulo
                            }}
                        />


                        {/* Información del usuario */}
                        <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                            <img src={userImageSrc} alt="User Avatar" style={{ maxHeight: '50px', maxWidth: '50px', borderRadius: '50%' }} />
                            <Box sx={{ marginLeft: 2 }}>
                                <Typography variant="subtitle1">{userName}</Typography>
                                <Typography variant="body2" color="text.secondary">{new Date(post.creationDate).toLocaleDateString()}</Typography>
                            </Box>
                        </Box>

                        <Typography variant="body1" sx={{
                            whiteSpace: 'pre-wrap',
                            marginBottom: 2,
                            fontFamily: 'Poppins', // Aplica la fuente Poppins
                        }}>
                            {post.article}
                        </Typography>

                        {post.url && (
                            <Typography variant="body2" color="text.secondary">
                                <a href={post.url} style={{ color: '#9900FF', textDecoration: 'underline' }}> {post.url} </a>
                            </Typography>
                        )}
                        {user && user.id === post.userId && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Button variant="contained" color="primary" component={Link} to={`/posts/${post.id}`}>
                                    Modify Post
                                </Button>
                                <form ref={formRef} onSubmit={handleSubmitDelete}>
                                    <Button variant="contained" color="secondary" type="submit">
                                        Delete Post
                                    </Button>
                                </form>
                            </Box>
                        )}
                    </CardContent>
                </Card>
                <div className="d-flex flex-column align-items-start ms-auto">
                    <CommentList postId={post.id} />
                </div>



            </Box>
        </Container>
    );
};

export default PostDetails;
