import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import * as actions from "../actions";
import { IconButton, TextField, Collapse, Stack, Tooltip } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

const AddAnswer = ({ comment }) => {
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [answer, setAnswer] = useState("");
  const formRef = useRef(null);

  const toggleForm = () => setShowForm(!showForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formRef.current?.checkValidity() && answer.trim().length > 0) {
      dispatch(actions.createAnswer(comment.id, { content: answer }, () => {
        dispatch(actions.getComments({ postId: comment.postId, page: 0 }));
        setAnswer("");
        setShowForm(false);
      }));
    } else {
      formRef.current?.classList.add("was-validated");
    }
  };

  return (
    <>
      {!showForm ? (
        <Tooltip title="Responder" arrow>
          <IconButton onClick={toggleForm}>
            <ChatBubbleOutlineIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Collapse in={showForm}>
          <form ref={formRef} onSubmit={handleSubmit} noValidate style={{ marginTop: 8, width: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escribe una respuesta..."
                required
                multiline
                fullWidth
                minRows={2}
                sx={{ backgroundColor: '#f9f9f9', borderRadius: 2 }}
              />
              <Stack direction="column" spacing={1}>
                <Tooltip title="Enviar respuesta" arrow>
                  <IconButton type="submit" color="primary">
                    <SendIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancelar" arrow>
                  <IconButton onClick={toggleForm} color="error">
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

export default AddAnswer;
