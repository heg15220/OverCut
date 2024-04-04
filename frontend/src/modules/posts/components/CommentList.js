import { useEffect, useState } from "react";
import CommentListItem from "./CommentListItem";
import { getComments } from "../selectors";
import { useDispatch, useSelector } from "react-redux";
import * as actions from '../actions';
import { getUser } from "../../users/selectors";
import {TextField, Button, Alert} from '@mui/material';

const CommentList = ({ postId, postUserId }) => {
    let comments = useSelector(getComments)
    let user = useSelector(getUser)
    let dispatch = useDispatch();
    let [newComment, setNewComment] = useState("")
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);


    useEffect(() => {
        dispatch(actions.getComments({ postId: postId, page: 0 }))
    }, [postId, dispatch])

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newComment) {
            dispatch(actions.createComment(
                postId,
                { content: newComment },
                () => {
                    setSubmitSuccess("Comentario enviado con éxito.");
                    setNewComment("");
                    dispatch(actions.getComments({ postId: postId, page: 0 }));
                },
                (error) => {
                    setSubmitError("Hubo un error al enviar el comentario.");
                }
            ));
        } else {
            setSubmitError("Por favor, escribe un comentario.");
        }
    };

    return (
        <div style={{ marginLeft: '16px' }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
            {user && user.id !== postUserId && ( // Verifica si el usuario actual es diferente al usuario que creó el post
                <>
                    <form onSubmit={handleSubmit} noValidate>
                        <TextField
                            id="commentInput"
                            label="New comment"
                            variant="outlined"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                        />
                        <Button variant="contained" color="primary" type="submit">
                            Comment
                        </Button>
                    </form>

                    <div style={{ maxHeight: 490, overflowY: 'scroll' }}>
                        {comments &&
                            comments.result.items
                                .filter(comment => comment.parentCommentId === undefined)
                                .map(comment =>
                                    <CommentListItem key={comment.id} comment={comment} level={1} />
                                )}
                    </div>
                </>
            )}
        </div>
    )

}

export default CommentList;
