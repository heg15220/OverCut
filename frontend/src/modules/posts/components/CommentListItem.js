import { useDispatch, useSelector } from "react-redux";
import { getComments } from "../selectors";
import AddAnswer from "./AddAnswer";
import ModifyComment from "./ModifyComment";
import { getUser } from "../../users/selectors";
import * as actions from "../actions"
import { Card, CardContent, CardActions, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const CommentListItem = ({ key, comment, level }) => {
    let user = useSelector(getUser)
    let comments = useSelector(getComments)
    let dispatch = useDispatch()

    const handleDelete = (e) => {
        dispatch(actions.deleteComment(
            comment.id,
            () => {
                dispatch(actions.getComments({ postId: comment.postId, page: 0 }));
            })
        )
    }

    return (
        <div>
            <Card style={{ marginLeft: `${15 * level}px`, marginRight: '10px', marginBottom: '10px' }}>
                <CardContent>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {comment.userImage && <img src={"data:image/jpg;base64," + comment.userImage} alt="Avatar" style={{ width: 35, height: 35, borderRadius: '50%', marginRight: '10px' }} />}
                        <div style={{ color: '#9900FF' }}>{comment.userName}</div>
                    </div>
                    <div>{comment.content}</div>
                </CardContent>
                {user && user.id === comment.authorId && (
                    <CardActions disableSpacing>
                        <AddAnswer comment={comment} />
                        <ModifyComment comment={comment} />
                        <IconButton aria-label="delete" onClick={handleDelete}>
                            <DeleteIcon />
                        </IconButton>
                    </CardActions>
                )}
            </Card>
            {comments &&
                comments.result.items
                    .filter(filteringComment => filteringComment.parentCommentId === comment.id)
                    .map(comment =>
                        <CommentListItem key={comment.id} comment={comment} level={level + 1} />
                    )}
        </div>
    )
}

export default CommentListItem;
