import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';

const PostListItem = ({ post }) => {
    const navigate = useNavigate();
    const srcImage = post.image ? "data:image/jpg;base64," + post.image : null;
    const [imageRef, setImageRef] = useState(null);

    const handleImageOrTitleClick = () => {
        navigate(`/post/post-details/${post.id}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80%', height: '100vh' }}>
            <Box
                sx={{
                    width: '100%',
                    height: '70vh',
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                        '& .image-hover-target': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
                            transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                        }
                    }
                }}
            >
                <img
                    ref={setImageRef}
                    className="image-hover-target"
                    src={srcImage}
                    alt="Post Image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onClick={handleImageOrTitleClick}
                    sx={{
                        transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                    }}
                />
            </Box>
            <Typography variant="body1" component="div" sx={{
                fontSize: '1.1rem', // Ajusta el tamaño de la fuente según sea necesario
                fontWeight: 'bold', // Aplica negrita
                color: 'text.primary', // Color del texto
                marginBottom: '0.5rem', // Margen inferior para separar del título
                textAlign: 'left', // Alinea el texto a la izquierda
            }}
                        onClick={handleImageOrTitleClick}
            >
                {post.categoryName}
            </Typography>

            <Typography variant="h5" component="div" sx={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'text.primary',
                marginTop: '0.5rem', // Ajusta el margen superior para separar el nombre de la categoría del título
                marginBottom: '1rem',
                cursor: 'pointer',
                textDecoration: 'none',
            }}
                        onClick={handleImageOrTitleClick}
            >
                {post.title}
            </Typography>
            {/* Subtítulo con el nuevo estilo */}
            <Typography variant="body2" color="text.secondary" sx={{
                fontSize: '1.2rem',
                fontStyle: 'italic',
                fontWeight: 'bold',
                color: '#333333',
                padding: '5px',
                borderRadius: '5px',
                marginBottom: '10px',
                maxWidth: 'auto',
                display: 'inline-block',
                marginX: 'auto',
            }}
                        onClick={handleImageOrTitleClick}
            >
                {post.subtitle}
            </Typography>
        </div>
    );
};

export default PostListItem;
