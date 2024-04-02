import { FormattedMessage} from 'react-intl';
import { Errors, Success } from '../../common';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import image from './Resources/default_image.jpg';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { useNavigate, useParams, Link } from 'react-router-dom';


const PostDetails = () => {

    const { id } = useParams();
    const post = useSelector(selectors.getPost);
    const user = useSelector(userSelectors.getUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    let form;
    let srcImage;


    const renderButtons = () => {
        if (user) {
            return user.id === post.userId
        }

        return false;
    }

    useEffect(() => {

        const postId = Number(id);

        if (!Number.isNaN(postId)) {
            dispatch(actions.findPostById(postId));
        }


    }, [id, user, dispatch]);

    const handleSubmitDelete = event => {

        event.preventDefault();

        dispatch(actions.deletePost(
            post, () => navigate("/"),
            errors => setBackendErrors(errors),
        ));
    }


    if (!post) {
        return null;
    }
    if (post.image === null) {
        srcImage = image;
    } else {
        srcImage = "data:image/jpg;base64," + post.image;
    }

    return (
        <div className="container">
            <div>
                <div>
                    <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                    <Success message={success} onClose={() => { setSuccess(null) }} />
                    <div className="container" >
                        <div className="card" >
                            <div className="card-header">
                                <h5 className="card-title  bg-light" id="titulo">
                                    <p>
                                        {post.title}
                                    </p>
                                </h5>
                                <h6 className="card-subtitle " id="category">
                                    {post.category}
                                </h6>
                            </div>
                            <div className="card-body border d-flex" align="center">
                                <div className='me-4'>
                                    <div className='p-2'>
                                        {post.image && <img src={srcImage} alt="Foto" style={{ maxHeight: '238px', maxWidth: '238px' }} />}
                                    </div>
                                    <p className="card-text" id="Name">
                                        <FormattedMessage id='project.global.fields.title' />{': '}
                                        {post.title}
                                    </p>
                                    <p className="card-text" id="shortDescription">
                                        <FormattedMessage id='project.global.fields.subtitle' />{': '}
                                        {post.subtitle}

                                    </p>

                                    <div className="article-container">
                                    <p className="card-text" id="shortDescription">
                                        <FormattedMessage id='project.global.fields.article' />{': '}
                                        {post.article}

                                    </p>
                                    </div>
                                    {post.url && <p className="card-text" id="shortDescription">
                                        <FormattedMessage id='project.global.fields.url' />{': '}
                                        <a href={post.url} style={{ color: '#9900FF', textDecoration: 'underline' }}> {post.url} </a>
                                    </p>}
                                    <p className="card-text" id="shortDescription">
                                        <FormattedMessage id='project.global.fields.category' />{': '}
                                        {post.categoryName}
                                    </p>
                                    {renderButtons() ?
                                        <div className='d-flex justify-content-center'>
                                            <button type="submit p-2" className="btn btn-primary my-2" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }} id="modify post">
                                                <Link className="text-light text-decoration-none" to={`/posts/${post.id}`}>
                                                    <FormattedMessage id='project.global.post.modifyPost' />
                                                </Link>
                                            </button>
                                            &nbsp;
                                            <form ref={node => form = node}
                                                  className=""
                                                  onSubmit={e => handleSubmitDelete(e)}>
                                                <button type="submit m-2" className="btn btn-danger my-2" id="delete post">
                                                    <FormattedMessage id='project.global.post.deletePost' />
                                                </button>
                                            </form>
                                        </div> : null
                                    }
                                </div>
                                <div className="vr ms-auto"></div>
                            </div>

                            <div className="p-1">
                                <div className="col-md-2 mx-auto">
                                    <button type="submit" className="btn btn-primary bg-blue" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}>
                                        <FormattedMessage id="project.global.buttons.save" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PostDetails;
