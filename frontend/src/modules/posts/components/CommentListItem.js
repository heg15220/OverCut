import { useDispatch, useSelector } from "react-redux";
import { getComments } from "../selectors";
import AddAnswer from "./AddAnswer";
import ModifyComment from "./ModifyComment";
import { getUser } from "../../users/selectors";
import * as actions from "../actions"

const CommentListItem = ({ key, comment, level }) => {
    let user = useSelector(getUser)
    let comments = useSelector(getComments)
    let dispatch = useDispatch()

    const handleDelete = (e) => {
        dispatch(actions.deleteComment(
            comment.id,
            () => {
                dispatch(actions.getComments({
                    postId: comment.postId,
                    page: 0
                }));
            })
        )
    }

    const Spacer = ({ size }) => <div style={{ width: size, height: size }} />;

    // Aumenta el factor de multiplicación para el margen izquierdo de las respuestas
    const responseMarginLeft = `${40 * level}px`; // Ajusta este valor según tus necesidades

    return (
        <div>
            <div className="card my-2 overflow-visible text-start" style={{ maxWidth: '100%', marginLeft: responseMarginLeft, marginRight: '10px', position: 'relative' }}>
                <div className="d-flex">
                    &nbsp;&nbsp;&nbsp;
                    {comment.userImage && <img src={"data:image/jpg;base64," + comment.userImage} class="rounded-circle my-2" width="35px" height="35px" alt="Avatar" />}
                    <text className="card-body" style={{ marginBottom: 14, fontFamily: 'Poppins' }} style={{ color: '#00000F' }}>{comment.userName}</text>
                </div>

                <text className="card-body" style={{ marginBottom: 14, fontFamily: 'Poppins' }}>{comment.content}</text>
                {user &&
                    <div className="d-flex" style={{ position: 'absolute', right: '0', bottom: '0' }}>
                        <AddAnswer comment={comment} />
                        <Spacer size="10px" />
                        {user.id === comment.authorId && <ModifyComment comment={comment} />}
                        <Spacer size="10px" />
                        {user.id === comment.authorId && <button onClick={() => handleDelete()} className="btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" color="red" height="14" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                            </svg>
                        </button>}
                    </div>}

            </div>
            {comments &&
                comments.result.items
                    .filter(filteringComment =>
                        filteringComment.parentCommentId === comment.id)
                    .map(comment =>
                        <CommentListItem key={comment.id} comment={comment} level={level + 1} />
                    )}
        </div>
    )
}

export default CommentListItem;
