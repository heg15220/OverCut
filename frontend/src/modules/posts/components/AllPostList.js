import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import PostList from "./PostList";
import * as actions from '../actions';
import { Pager } from '../../common';
import { FormattedMessage } from 'react-intl';

const AllPostList = () => {

    const dispatch = useDispatch();
    const posts = useSelector(selectors.getPosts);
    const categories = useSelector(state => state.posts.categories);
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(null);
    const [criteria, setCriteria] = useState(null);
    const [order, setOrder] = useState(false);
    let form;

    const handleSubmit = event => {

        event.preventDefault();
        if (form.checkValidity()) {

            dispatch(actions.getPosts(
                {
                    title: title.trim(),
                    categoryId: categoryId,
                    page: 0,
                    criteria: criteria,
                    order: order,
                },
                () => { },
                () => { },
            ));

        } else {

            form.classList.add('was-validated');

        }

    }

    useEffect(() => {
            dispatch(actions.getPosts(
                {
                    title: title.trim(),
                    categoryId: categoryId,
                    page: 0,
                    criteria: criteria,
                    order: order,
                },
                () => { },
                () => { },
            ));
            dispatch(actions.getAllCategories(() => { }))
        },
        [dispatch, categoryId, title, criteria, order]);

    return (
        <div>
            <div className="d-flex justify-content-center">
                <div className="p-1">
                    <input type="title" id="title" className="form-control" placeholder="Title"
                           value={title}
                           onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="p-1">
                    {categories ? (
                        <select className="form-select" aria-label="Default select example"
                                onChange={e => setCategoryId(e.target.value)}>
                            <option value=""><FormattedMessage id="project.global.dropdown.allCategories" /></option>
                            {
                                categories.map(category =>
                                    <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)
                            }
                        </select>
                    ) : null}
                </div>
                <div className="p-1">
                    <select className="form-select" aria-label="Default select example" onChange={e => {

                    }}>
                        <option value="all"><FormattedMessage id="project.global.dropdown.expiredandnotexpired" /></option>
                    </select>
                </div>

                <div className="p-1">
                    <select className="form-select" aria-label="Default select example" onChange={e => {
                        if (e.target.value === "all") {
                            setCriteria(null)
                        }
                        if (e.target.value === "creationDate") {
                            setCriteria(0)
                        }
                    }}>
                        <option value="all"><FormattedMessage id="project.global.dropdown.sortCriteriaAll" /></option>
                        <option value="creationDate" ><FormattedMessage id="project.global.dropdown.sortCriteriaCreationDate" /></option>
                    </select>
                </div>

                <div className="p-1">
                    <select className="form-select" aria-label="Default select example" onChange={e => {
                        if (e.target.value === "orderDefault") {
                            setOrder(null)
                        }
                        if (e.target.value === "orderASC") {
                            setOrder(true)
                        }
                        if (e.target.value === "orderDES") {
                            setOrder(false)
                        }
                    }}>
                        <option value="orderDefault"><FormattedMessage id="project.global.dropdown.sortOrderDefault" /></option>
                        <option value="orderASC" ><FormattedMessage id="project.global.dropdown.sortOrderASC" /></option>
                        <option value="orderDES"><FormattedMessage id="project.global.dropdown.sortOrderDES" /></option>
                    </select>
                </div>

                <div className="p-1">
                    <form ref={node => form = node}
                          className=""
                          onSubmit={e => handleSubmit(e)}>
                        <button type="submit" className="btn btn-primary text-nowrap" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}>
                            <FormattedMessage id="project.global.buttons.filter" />
                        </button>
                    </form>
                </div>


            </div>
            <div className="p-5">
                <PostList posts={posts} />
                {posts ?
                    (
                        <Pager
                            back={{
                                enabled: posts.criteria.page >= 1,
                                onClick: () => dispatch(actions.previousGetPosts(posts.criteria))
                            }}
                            next={{
                                enabled: posts.result.existMoreItems,
                                onClick: () => dispatch(actions.nextGetPosts(posts.criteria))
                            }} />
                    )
                    : null}
            </div>
        </div >
    );


}

export default AllPostList;
