import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import * as actions from "../actions";
import { Button, TextField, Card, CardContent } from '@mui/material';

const ModifyComment = ({ comment }) => {
    const dispatch = useDispatch();
    const [newContent, setNewContent] = useState("");
    const [show, setShow] = useState(false);
    const formRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formRef.current.checkValidity()) {
            dispatch(actions.modifyComment(
                comment.id,
                { content: newContent },
                () => {
                    dispatch(actions.getComments({
                        postId: comment.postId,
                        page: 0
                    }));
                })
            );
            setShow(false);
        } else {
            formRef.current.classList.add('was-validated');
        }
    };

    const toggleShow = () => {
        setShow(!show);
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {show && (
                <Card sx={{ p: 1 }}>
                    <CardContent>
                        <TextField
                            id="modifyInput"
                            value={newContent}
                            placeholder="Modify comment"
                            onChange={(e) => setNewContent(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                        />
                        <Button type="submit" variant="contained" color="success" sx={{ mt: 2 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                            </svg>
                        </Button>
                    </CardContent>
                </Card>
            )}
            <Button variant="outlined" color="primary" onClick={toggleShow} sx={{ mt: 2 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                </svg>
            </Button>
        </form>
    );
};

export default ModifyComment;
