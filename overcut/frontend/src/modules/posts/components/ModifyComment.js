import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import * as actions from "../actions";
import { TextField, Button, Collapse, Stack, IconButton, Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const ModifyComment = ({ comment }) => {
  const dispatch = useDispatch();
  const [newContent, setNewContent] = useState(comment.content);
  const [editing, setEditing] = useState(false);
  const formRef = useRef(null);

  const toggleEdit = () => {
    setEditing(!editing);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formRef.current?.checkValidity() && newContent.trim().length > 0) {
      dispatch(actions.modifyComment(comment.id, { content: newContent }, () => {
        dispatch(actions.getComments({ postId: comment.postId, page: 0 }));
        setEditing(false);
      }));
    } else {
      formRef.current?.classList.add("was-validated");
    }
  };

  return (
    <>
      {!editing ? (
        <Tooltip title="Editar comentario" arrow>
          <IconButton onClick={toggleEdit} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Collapse in={editing}>
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Editar comentario"
                required
                multiline
                fullWidth
                minRows={3}
                sx={{ backgroundColor: '#f9f9f9', borderRadius: 2 }}
              />
              <Stack direction="column" spacing={1}>
                <Tooltip title="Guardar cambios" arrow>
                  <IconButton type="submit" color="success">
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancelar" arrow>
                  <IconButton onClick={toggleEdit} color="error">
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </form>
        </Collapse>
      )}
    </>
  );
};

export default ModifyComment;
