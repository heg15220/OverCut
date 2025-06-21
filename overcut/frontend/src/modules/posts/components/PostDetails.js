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
import './PostDetails.css'; // o como se llame tu archivo de estilos
import UserAvatar from '../../users/components/UserAvatar';



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

    useEffect(() => {
      // Timeout evita conflictos con render reactivo y remoción anticipada
      const timeout = setTimeout(() => {
        if (window.twttr && window.twttr.widgets) {
          try {
            window.twttr.widgets.load();
          } catch (e) {
            console.warn("Error al cargar widgets de Twitter:", e);
          }
        }
      }, 100); // Espera breve para evitar conflictos con el DOM

      return () => clearTimeout(timeout); // Evita efectos secundarios si se desmonta
    }, [post?.sections]);


    const handleSubmitDelete = event => {
        event.preventDefault();
        dispatch(actions.deletePost(
            post, () => navigate("/"),
            errors => setBackendErrors(errors),
        ));
    }

    if (!post) {
      return <div>Cargando...</div>;
    }


    const srcImage = post?.image ? `data:image/jpg;base64,${post.image}` : image;
    const userImageSrc = postUser?.image ? `data:image/jpg;base64,${postUser.image}` : image;
    const userName = postUser?.userName ?? 'Usuario desconocido';


    return (
        <Container sx={{ marginTop: 0 }}>
            <Box my={0}>
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
                        <Typography variant="subtitle1" sx={{
                            backgroundColor: '#000', color: 'white', padding: '5px',
                            borderRadius: '5px', fontSize: '1.4rem', marginBottom: '10px',
                            display: 'inline-block', marginX: 'auto'
                        }}>
                            {post.categoryName}
                        </Typography>

                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem', fontWeight: 'bold', textTransform: 'uppercase',
                            color: 'text.primary', marginY: '1rem'
                        }}>
                            {post.title}
                        </Typography>

                        <Typography variant="body2" sx={{
                            fontSize: '1.2rem', fontStyle: 'italic', fontWeight: 'bold',
                            color: '#333', padding: '5px', borderRadius: '5px',
                            marginBottom: '10px', display: 'inline-block', marginX: 'auto'
                        }}>
                            {post.subtitle}
                        </Typography>

                        <CardMedia
                            component="img"
                            image={srcImage}
                            alt="Post Image"
                            sx={{
                                maxHeight: '500px',
                                maxWidth: '60%',
                                objectFit: 'cover',
                                marginTop: 2,
                            }}
                        />
                        {post.imageCaption && (
                          <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
                            <FormattedMessage id="post.caption.mainImage" defaultMessage="Caption:" /> {post.imageCaption}
                          </Typography>
                        )}


                        <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                            <UserAvatar image={postUser?.image} userName={userName} size={50} />
                            <Box sx={{ marginLeft: 2 }}>
                                <Typography variant="subtitle1">{userName}</Typography>
                                <Typography variant="body2" color="text.secondary">{new Date(post.creationDate).toLocaleDateString()}</Typography>
                            </Box>
                        </Box>

                        <Typography variant="body1" sx={{
                            whiteSpace: 'pre-wrap',
                            marginBottom: 2,
                            fontFamily: 'Poppins',
                        }}>
                            {post.article}
                        </Typography>

                        {/* SECCIONES DINÁMICAS */}
                        {post.sections && post.sections.length > 0 && (
                          <div className="post-sections-container">
                            {post.sections
                              .sort((a, b) => a.sectionOrder - b.sectionOrder)
                              .map((section, index) => (
                                <div key={index} className="post-section" style={{ marginBottom: '2rem' }}>
                                  {section.title && <h3 className="post-section-title">{section.title}</h3>}

                                  {section.blocks
                                    .sort((a, b) => a.blockOrder - b.blockOrder)
                                    .map((block, idx) => {
                                      if (block.type === "text") {
                                        return (
                                          <p key={idx} className="post-section-text">
                                            {block.content}
                                          </p>
                                        );
                                      }

                                      if (block.type === "image" && block.image) {
                                        return (
                                          <React.Fragment key={idx}>
                                            <img
                                              src={`data:image/jpeg;base64,${block.image}`}
                                              alt="Imagen del artículo"
                                              className="post-section-image"
                                            />
                                            {block.caption && (
                                              <p className="image-caption">
                                                <FormattedMessage id="post.caption.image" defaultMessage="Caption:" /> {block.caption}
                                              </p>
                                            )}
                                          </React.Fragment>
                                        );
                                      }

                                      if (block.type === "tweet") {
                                        return (
                                          <React.Fragment key={idx}>
                                            <div className="tweet-container">
                                              <blockquote className="twitter-tweet">
                                                <a
                                                  href={block.content.replace("x.com", "twitter.com")}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {block.content}
                                                </a>
                                              </blockquote>
                                            </div>
                                            {block.caption && (
                                              <p className="tweet-caption">
                                                <FormattedMessage id="post.caption.tweet" defaultMessage="Tweet note:" /> {block.caption}
                                              </p>
                                            )}
                                          </React.Fragment>
                                        );
                                      }

                                      return null;
                                    })}

                                </div>
                              ))}
                          </div>
                        )}


                        {user && user.id === post.userId && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Button variant="contained" color="primary" component={Link} to={`/posts/${post.id}`}>
                                    <FormattedMessage id="project.entities.Post.Modify" />
                                </Button>
                                <form ref={formRef} onSubmit={handleSubmitDelete}>
                                    <Button variant="contained" color="secondary" type="submit">
                                        <FormattedMessage id="project.entities.Post.Delete" />
                                    </Button>
                                </form>
                            </Box>
                        )}
                    </CardContent>
                </Card>
                <CommentList postId={post.id} />
            </Box>
        </Container>
    );
};

export default PostDetails;
