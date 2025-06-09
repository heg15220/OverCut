import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { Errors, Success } from '../../common';
import * as actions from '../actions';
import * as selectors from '../selectors';
import image from './Resources/default_image.jpg';
import PostSectionEditor from './PostSectionEditor';

const ModifyPost = () => {
  const post = useSelector(selectors.getPost);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const categories = useSelector(state => state.posts.categories);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [article, setArticle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [backendErrors, setBackendErrors] = useState(null);
  const setSuccess = useState(null)[1];

  const [sections, setSections] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSubtitle(post.subtitle);
      setArticle(post.article);
      setCategoryId(post.categoryId);
      setMainImage(post.image);
    }
  }, [post]);

  useEffect(() => {
    dispatch(actions.getAllCategories(() => {}));
  }, [dispatch]);

  useEffect(() => {
    if (post && post.id && !sectionsLoaded) {
      dispatch(actions.getPostSections(post.id, result => {
        setSections(result);
        setSectionsLoaded(true);
      }));
    }
  }, [post, dispatch, sectionsLoaded]);

  const handleMainImageChange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setMainImage(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

  const handleSubmit = e => {
    e.preventDefault();
    dispatch(actions.modifyPost(
      id,
      {
        title: title.trim(),
        subtitle: subtitle.trim(),
        article: article.trim(),
        categoryId,
        image: mainImage
      },
      () => {
        const dtoSections = sections.map((s, idx) => ({
          ...s,
          sectionOrder: idx,
          id: null
        }));

        dispatch(actions.deletePostSections(id, () => {
          dispatch(actions.addPostSections(id, dtoSections, () => {
            setSuccess('Post y secciones modificados correctamente');
            navigate('/');
          }));
        }));
      },
      errors => setBackendErrors(errors)
    ));
  };

  const srcImage = mainImage ? `data:image/jpeg;base64,${mainImage}` : image;

  return (
    <section className="container mt-5 mb-5">
      <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />

      <div className="card bg-light border-dark p-4">
        <h4 className="text-center mb-4">
          <FormattedMessage id="project.global.post.modifyPost" />
        </h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label"><FormattedMessage id="project.global.fields.modifytitle" /></label>
            <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label"><FormattedMessage id="project.global.fields.modifysubtitle" /></label>
            <input type="text" className="form-control" value={subtitle} onChange={e => setSubtitle(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label"><FormattedMessage id="project.global.fields.modifyarticle" /></label>
            <textarea className="form-control" rows={5} value={article} onChange={e => setArticle(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label"><FormattedMessage id="project.global.fields.modifycategory" /></label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              {categories?.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label d-block"><FormattedMessage id="project.user.postImage.title" /></label>
            <img src={srcImage} alt="Preview" style={{ maxWidth: '250px', borderRadius: '8px' }} />
            <input className="form-control mt-2" type="file" accept="image/*" onChange={handleMainImageChange} />
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-primary">
              <FormattedMessage id="project.global.buttons.save" />
            </button>
          </div>
        </form>

        {sectionsLoaded && (
          <div className="mt-5">
            <h5 className="text-center mb-3">
              <FormattedMessage id="project.global.post.editSections" defaultMessage="Editar secciones del post" />
            </h5>
            <PostSectionEditor
              postId={post.id}
              existingSections={sections}
              onChangeSections={setSections}
              onSave={() => setSuccess("Secciones actualizadas correctamente")}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ModifyPost;
