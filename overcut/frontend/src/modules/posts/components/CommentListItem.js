// Componente profesionalizado para renderizar un comentario individual con diseño moderno y animación

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, Card, CardContent, Typography, Avatar, IconButton, Stack, Tooltip, Fade } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { getComments } from "../selectors";
import { getUser } from "../../users/selectors";
import * as actions from "../actions";
import AddAnswer from "./AddAnswer";
import ModifyComment from "./ModifyComment";

const CommentListItem = ({ comment, level }) => {
  const user = useSelector(getUser);
  const comments = useSelector(getComments);
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(actions.deleteComment(comment.id, () => {
      dispatch(actions.getComments({ postId: comment.postId, page: 0 }));
    }));
  };

  const marginLeft = `${level * 32}px`;

  let timestamp = "";
  let shortDate = "";
  try {
    const parsed = new Date(comment.createdAt);
    if (!isNaN(parsed.getTime())) {
      timestamp = parsed.toLocaleString();
      shortDate = parsed.toLocaleDateString();
    }
  } catch (_) {
    timestamp = "";
    shortDate = "";
  }

  return (
    <Fade in timeout={400}>
      <Box sx={{ ml: level > 1 ? 3 : 0, mb: 2 }}>
        <Card elevation={2} sx={{ backgroundColor: '#fff', borderRadius: 2, ml: marginLeft }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={`data:image/jpg;base64,${comment.userImage}`} alt={comment.userName} />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">{comment.userName}</Typography>
                {shortDate && (
                  <Tooltip title={timestamp} arrow placement="right">
                    <Typography variant="caption" color="text.secondary">
                      {shortDate}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
            </Stack>

            <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-line' }}>{comment.content}</Typography>

            {user && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <AddAnswer comment={comment} />
                {user.id === comment.authorId && <ModifyComment comment={comment} />}
                {user.id === comment.authorId && (
                  <Tooltip title="Eliminar comentario" arrow>
                    <IconButton onClick={handleDelete} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Renderiza respuestas */}
        {comments?.result?.items
          .filter(child => child.parentCommentId === comment.id)
          .map(child => (
            <CommentListItem key={child.id} comment={child} level={level + 1} />
          ))}
      </Box>
    </Fade>
  );
};

export default CommentListItem;
