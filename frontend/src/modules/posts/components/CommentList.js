import React, { useEffect, useState, useRef } from "react";
import CommentListItem from "./CommentListItem";
import { useSelector, useDispatch } from "react-redux";
import { TextField, Button } from '@mui/material';
import * as actions from '../actions';
import { getUser } from "../../users/selectors";
import { getComments } from "../selectors";

const CommentList = ({ postId }) => {
    const comments = useSelector(getComments);
    const user = useSelector(getUser);
    const dispatch = useDispatch();
    const [newComment, setNewComment] = useState("");
    const formRef = useRef(null);

    useEffect(() => {
        dispatch(actions.getComments({
            postId: postId,
            page: 0
        }));
    }, [postId, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formRef.current.checkValidity()) {
            dispatch(actions.createComment(
                postId,
                { content: newComment },
                () => {
                    dispatch(actions.getComments({
                        postId: postId,
                        page: 0
                    }));
                })
            );
        } else {
            formRef.current.classList.add('was-validated');
        }
    };

    return (
        <div style={{ marginLeft: '20px', width: '98%' }}>
            {user && (
                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <TextField
                            id="commentInput"
                            value={newComment}
                            placeholder="New comment"
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            multiline // Habilita el modo multilinea
                            rowsMax={4} // Establece el número máximo de filas antes de que aparezca la barra de desplazamiento
                            InputProps={{
                                style: { width: '100%' }, // Asegura que el campo ocupe el ancho disponible
                            }}
                        />

                        <Button type="submit" variant="contained" color="primary" sx={{ marginLeft: 2 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z" />
                            </svg>
                        </Button>
                    </div>
                </form>
            )}
            <div style={{ overflowY: 'scroll', height: 490 }}>
                {comments &&
                    comments.result.items
                        .filter(comment =>
                            comment.parentCommentId === undefined)
                        .map(comment =>
                            <CommentListItem key={comment.id} comment={comment} level={1} />
                        )}
            </div>
        </div>
    );
};

export default CommentList;
