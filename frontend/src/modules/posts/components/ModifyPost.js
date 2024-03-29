import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { Errors, Success } from '../../common';
import * as actions from '../actions';
import * as selectors from '../selectors';

import image from './Resources/default_image.jpg';


const ModifyPost = () => {
    const post = useSelector(selectors.getPost);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const categories = useSelector(state => state.posts.categories);
    const [title, setTitle] = useState(post.title);
    const [subtitle, setSubtitle] = useState(post.subtitle);
    const[article, setArticle] = useState(post.article);
    const [categoryId, setCategory] = useState(post.categoryId);


    const [backendErrors, setBackendErrors] = useState(null);
    const setSuccess = useState(null)[1];
    const { id } = useParams();
    let form;

    const [completedImage, setCompletedImage] = useState('');
    let formImage;
    let srcImage;

    const handleSubmit = event => {

        event.preventDefault();

            dispatch(actions.modifyPost(
                id,
                {
                    title: title.trim(),
                    subtitle: subtitle.trim(),
                    article: article.trim(),
                    categoryId: categoryId
                },
                () => {
                    setSuccess('Se ha modificado el post correctamente');
                    navigate('/');
                },
                errors => setBackendErrors(errors),
            ));

            setBackendErrors(null);
            form.classList.add('was-validated');



    }

    const handleCategoryChange = event => {
        setCategory(event.target.value);
    }

    useEffect(() => {
            dispatch(actions.getAllCategories(() => { }))
            setCategory(post.categoryId);
        },
        [dispatch, post.categoryId]);

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

    if (post.image === null) {
        srcImage = image;
    } else {
        srcImage = "data:image/jpg;base64," + post.image;
    }



    return (

        <section className="container d-flex justify-content-center align-items-center min-vh-100 mx-auto" style={{ display: "flex", flex: "column", margin: 200 }}>

            <div className='container d-flex justify-content-center align-items-center min-vh-100'>
                <div className='col-md-10'>
                    <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                    <div className="card bg-light border-dark">
                        <h5 className="card-header text-center">
                            <FormattedMessage id="project.global.post.modifyPost" />
                        </h5>
                        <div className="card-body d-flex">
                            <div className='ms-auto'>
                                <form ref={node => form = node}
                                      className=""
                                      onSubmit={e => handleSubmit(e)}>
                                    <div className="justform-group row">
                                        <label htmlFor="title" className="col-md- col-form-label">
                                            <FormattedMessage id="project.global.fields.modifytitle" />
                                        </label>
                                        <div className="col-md-12">
                                            <input type="text" id="title" className="form-control"
                                                   value={title}
                                                   onChange={e => setTitle(e.target.value)}
                                                   autoFocus
                                                   required />
                                        </div>
                                    </div>

                                    <div className="form-group row">
                                        <label htmlFor="subtitle" className="col-md- col-form-label">
                                            <FormattedMessage id="project.global.fields.modifysubtitle" />
                                        </label>
                                        <div className="col-md-12">
                                            <input type="subtitle" id="subtitle" className="form-control"
                                                   value={subtitle}
                                                   onChange={e => setSubtitle(e.target.value)}
                                                   required />
                                        </div>
                                    </div>

                                    <div className="form-group row">
                                        <label htmlFor="article" className="col-md- col-form-label">
                                            <FormattedMessage id="project.global.fields.modifyarticle" />
                                        </label>
                                        <div className="col-md-12">
                                            <input type="article" id="article" className="form-control"
                                                   value={article}
                                                   onChange={e => setArticle(e.target.value)}
                                                   required />
                                        </div>
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label htmlFor="description" className="col-md- col-form-label">
                                            <FormattedMessage id="project.global.fields.modifycategory" />
                                        </label>
                                        {categories ? (
                                            <select
                                                className="form-select mt-2"
                                                aria-label="Select category"
                                                onChange={handleCategoryChange}
                                                value={categoryId}
                                            >
                                                {
                                                    categories.map(categoryId =>
                                                        <option key={categoryId.categoryId} value={categoryId.categoryId}>{categoryId.name}</option>)
                                                }
                                            </select>
                                        ) : null}
                                    </div>
                                    <div className="p-2">
                                        <div className="col-md-2 mx-auto">
                                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#9900FF', borderColor: '#E8E8E8' }}>
                                                <FormattedMessage id="project.global.buttons.save" />
                                            </button>
                                        </div>
                                    </div>

                                </form>
                            </div>

                            <div className="vr ms-auto"></div>
                            <div className="ms-4" align-items="center">
                                <div className="">
                                    <div className="" align="center">
                                        <img className="" src={srcImage} alt="Foto" style={{ maxHeight: '270px', maxWidth: '270px' }} />
                                    </div>
                                    <div className="" align="" style={{ margin: 5 }}>
                                        <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                                        {completedImage &&
                                            <Success message={"project.user.addImage"} onClose={() => { setCompletedImage(null); }} />
                                        }
                                        <p className="card-title text-center" style={{ fontWeight: "bold" }}>
                                            <FormattedMessage id="project.user.postImage.title" />
                                        </p>
                                        <div align="center">
                                            <form ref={node => formImage = node} encType="multipart/form-data" className="needs-validation" noValidate
                                                  onSubmit={(addUserImage) => uploadPostImage(addUserImage)} name="file" method="put">
                                                <div>
                                                    <input type="file" name="file" accept="image/jpeg" id="userPhoto" data-testid="userPhoto"
                                                           autoFocus
                                                           className="input-sm"
                                                           required></input>
                                                </div>
                                                <div>
                                                    <button type="submit" className="btn btn-secondary m-2">
                                                        <FormattedMessage id="project.global.buttons.save" />
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );


}

export default ModifyPost;
