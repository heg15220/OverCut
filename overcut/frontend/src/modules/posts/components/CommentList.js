// Componente profesionalizado de lista de comentarios
// Aplica diseño visual moderno, tarjetas elevadas, espaciado uniforme y tipografía clara

import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, Card, CardContent, Avatar, Typography, TextField, Button, IconButton, Divider } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import AddCommentIcon from '@mui/icons-material/AddComment';
import * as actions from '../actions';
import { getUser } from "../../users/selectors";
import { getComments } from "../selectors";
import CommentListItem from "./CommentListItem";

const CommentList = ({ postId }) => {
  const comments = useSelector(getComments);
  const user = useSelector(getUser);
  const dispatch = useDispatch();
  const [newComment, setNewComment] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    dispatch(actions.getComments({ postId, page: 0 }));
  }, [postId, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim().length === 0) return;

    if (formRef.current.checkValidity()) {
      dispatch(actions.createComment(postId, { content: newComment }, () => {
        dispatch(actions.getComments({ postId, page: 0 }));
        setNewComment("");
      }));
    } else {
      formRef.current.classList.add("was-validated");
    }
  };

  return (
    <Box sx={{ mt: 4, mb: 5 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">Comentarios</Typography>
      {user && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          ref={formRef}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mb: 4,
            backgroundColor: '#fafafa',
            borderRadius: 2,
            p: 3,
            maxWidth: '1000px',
            mx: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={`data:image/jpg;base64,${user.image}`} alt={user.name} />
            <Typography variant="subtitle1" fontWeight="medium">{user.name}</Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={5}
            maxRows={15}
            placeholder="Escribe un comentario extenso..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            sx={{ backgroundColor: '#ffffff', borderRadius: 2 }}
          />
          <Box sx={{ textAlign: 'right' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              sx={{ px: 3 }}
            >
              Publicar
            </Button>
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ maxHeight: 500, overflowY: "auto", pr: 1, maxWidth: '1000px', mx: 'auto' }}>
        {comments?.result?.items?.filter(c => c.parentCommentId === undefined).map(comment => (
          <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
            <CommentListItem key={comment.id} comment={comment} level={1} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default CommentList;
