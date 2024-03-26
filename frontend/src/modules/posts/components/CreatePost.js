import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Errors, Success } from '../../common';
import * as actions from '../actions';


const CreatePost = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const categories = useSelector(state => state.posts.categories);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [article, setArticle] = useState('');
    const [category, setCategory] = useState(1);
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    let form;

    const handleSubmit = event => {

        event.preventDefault();
        if (form.checkValidity()) {

            dispatch(actions.createPost(
                {
                    title: title.trim(),
                    subtitle: subtitle.trim(),
                    article: article.trim(),
                    category: category
                },
                post => {
                    setSuccess('Se ha creado el post correctamente');
                    navigate(`/posts/${post}/add-image`);
                },
                errors => setBackendErrors(errors),
            ));

        } else {
            setBackendErrors(null);
            form.classList.add('was-validated');
        }

    }

    const handleCategoryChange = event => {
        setCategory(event.target.value);
    }

    useEffect(() => {
            dispatch(actions.getAllCategories(() => { }))
        },
        [dispatch]);



    return (
        <div className="">
            <div>
                <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                <Success id="success" message={success} onClose={() => setSuccess(null)} />
                <div className="card bg-light">
                    <h5 className="card-header text-center">
                        <FormattedMessage id="project.posts.CreatePost.title" />
                    </h5>
                    <div className="card-body">
                        <form ref={node => form = node}
                              className=""
                              onSubmit={e => handleSubmit(e)}>
                            <div className="form-group">
                                <label htmlFor="title" className="col-md- col-form-label">
                                    <FormattedMessage id="project.global.fields.postType" />
                                </label>
                            </div>
                            <div className="form-group row">
                                <label htmlFor="title" className="col-md- col-form-label">
                                    <FormattedMessage id="project.global.fields.title" />
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
                                    <FormattedMessage id="project.global.fields.subtitle" />
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
                                    <FormattedMessage id="project.global.fields.article" />
                                </label>
                                <div className="col-md-12">
                                    <input type="article" id="article" className="form-control"
                                           value={article}
                                           onChange={e => setArticle(e.target.value)}
                                           required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="description" className="col-md- col-form-label">
                                    <FormattedMessage id="project.global.fields.category" />
                                </label>
                                {categories ? (
                                    <select className="form-select mt-2 col-md-12" aria-label="Default select example"
                                            onChange={handleCategoryChange}>
                                        {
                                            categories.map(category =>
                                                <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)
                                        }
                                    </select>
                                ) : null}
                            </div>
                            <div className="p-2">
                                <div className="col-md-2 mx-auto">
                                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}>
                                        <FormattedMessage id="project.global.buttons.save" />
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default CreatePost;
