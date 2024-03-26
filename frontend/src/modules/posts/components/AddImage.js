import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Errors, Success } from '../../common';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import image from './Resources/default_image.jpg';

const AddImage = () => {
    const { id } = useParams();

    const [backendErrors, setBackendErrors] = useState(null);
    const [completedImage, setCompletedImage] = useState('');
    const post = useSelector(selectors.getPost);
    const dispatch = useDispatch();
    const navigate = useNavigate();


    const uploadPostImage = event => {
        event.preventDefault();
        setCompletedImage(null);

        if (formImage.checkValidity()) {
            const formData = new FormData(formImage);
            dispatch(actions.addPostImage(id, formData, () => {
                    setCompletedImage(srcImage);
                },
                errors => setBackendErrors(errors)));
        } else {
            setBackendErrors(null);
            formImage.classList.add('was-validated');
        }
    }

    let formImage;
    let srcImage;

    if (post.image === null) {
        srcImage = image;
    } else {
        srcImage = "data:image/jpg;base64," + post.image;
    }

    return (
        <div className='container '>
            <div className="card bg-light border-dark">
                <h5 className="card-header text-center">
                    <FormattedMessage id="project.global.post.addImageCreatePost" />
                </h5>
                <div className="ms-4 mt-3" align="center">
                    {srcImage ?
                        <img align="center" src={srcImage} alt="Foto" style={{ maxHeight: '270px', maxWidth: '270px' }} />
                        : <div><FormattedMessage id="project.user.postImage.selectImage" /></div>
                    }
                    <div style={{ margin: 5 }}>
                        <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                        {completedImage &&
                            <div className='p-2'>
                                <Success message={"project.user.addImage"} onClose={() => { setCompletedImage(null); }} />
                            </div>
                        }
                        <p className="card-title text-center" style={{ fontWeight: "bold" }}>
                            <FormattedMessage id="project.user.postImage.title" />
                        </p>
                        <div align="center">
                            <form ref={node => formImage = node} encType="multipart/form-data" className="needs-validation" noValidate
                                  onSubmit={(e) => uploadPostImage(e)} name="file" method="put">
                                <div>
                                    <input type="file" name="file" accept="image/jpeg" id="userPhoto"
                                           autoFocus
                                           className="input-sm"
                                           required></input>
                                </div>
                                <div>
                                    <button type="submit" className="btn btn-secondary m-2">
                                        <FormattedMessage id="project.global.buttons.save" />
                                    </button>
                                </div>
                                <div>
                                    <button className="btn btn-primary m-2" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }} onClick={() => navigate("/")}>
                                        <FormattedMessage id="project.global.buttons.continue" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddImage;
