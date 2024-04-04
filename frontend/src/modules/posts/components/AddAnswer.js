import { useDispatch } from "react-redux";
import * as actions from "../actions"
import { useState } from "react";

const AddAnswer = ({ comment }) => {
    let dispatch = useDispatch()
    let [answer, setAnswer] = useState("")
    let [show, setShow] = useState(false)
    let form;

    const handleClick = (e) => {
        e.preventDefault();

        if (form.checkValidity()) {
            dispatch(actions.createAnswer(
                comment.id,
                { content: answer },
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

    const rendershow = () =>{
        if(show){
            setShow(false);
        }else{
            setShow(true);
        }
    }

    return (
        <form ref={node => form = node} className="needs-validation" onSubmit={e => handleClick(e)} noValidate>
            {show && <div className="d-flex card">
                <div className="card-body" width="160" height="160">
                    <input id="answerInput" className="form-control" type="text" value={answer}
                           placeholder="New answer" onChange={e => setAnswer(e.target.value)} required />
                    <div className="invalid-feedback">
                        Answer cant be empty
                    </div>
                </div>
                <button type="submit" className="btn btn-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                    </svg>
                </button>
            </div>}
            <button type="button" className="btn" onClick={e => rendershow()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-right-text" viewBox="0 0 16 16">
                    <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z" />
                    <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                </svg>

            </button>
        </form>
    )
}

export default AddAnswer;