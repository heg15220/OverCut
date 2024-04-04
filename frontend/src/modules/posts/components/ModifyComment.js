
import { useDispatch } from "react-redux";
import * as actions from "../actions"
import { useState } from "react";

const ModifyComment = ({ comment }) => {
    let dispatch = useDispatch()
    let [newContent, setNewContent] = useState("")
    let [show, setShow] = useState(false)
    let form;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (form.checkValidity()) {
            dispatch(actions.modifyComment(
                comment.id,
                { content: newContent },
                () => {
                    dispatch(actions.getComments({
                        postId: comment.postId,
                        page: 0
                    }));
                })
            )
            setShow(false);
        } else {
            form.classList.add('was-validated')
        }
    }

    const rendershow = () => {
        if (show) {
            setShow(false);
        } else {
            setShow(true);
        }
    }

    return (
        <form ref={node => form = node} className="needs-validation" onSubmit={e => handleSubmit(e)} noValidate>
            {show && <div className="card d-flex p-1" ><div className="card-body" width="160" height="160"><input id="modifyInput" className="form-control" type="text" value={newContent}
                                                                                                                  placeholder="Modify comment" onChange={e => setNewContent(e.target.value)} required />
                <div className="invalid-feedback">
                    Modification text cant be empty
                </div>
            </div>
                <button type="submit" className="btn btn-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                    </svg>
                </button>
            </div>}
            <button type="button" className="btn" onClick={e => rendershow()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" color="blue" height="14" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                </svg>

            </button>
        </form>
    )
}

export default ModifyComment;