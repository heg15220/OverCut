import { AllPostList } from "../../posts";
import { useEffect } from "react";
import * as actions from "../../posts/actions";
import { useDispatch, useSelector } from "react-redux";
import { getNewPosts, getLastGetPost } from "../../posts/selectors";



const Home = () => {
    const dispatch = useDispatch()
    const newPost = useSelector(getNewPosts)
    const lastGetPost = useSelector(getLastGetPost)


    const handleRefresh = () => {
        dispatch(actions.getPosts({ page: 0 }));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const lastGetPostTimestamp = parseInt(lastGetPost, 10); // Ensure it's a number
            if (!isNaN(lastGetPostTimestamp)) {
                const date = new Date(lastGetPostTimestamp - tzoffset);
                if (!isNaN(date.getTime())) { // Check if the date is valid
                    dispatch(actions.getNewPosts(date.toISOString().split('.')[0]), 1500000);
                } else {
                    console.error('Invalid date created from timestamp');
                    // Handle the error appropriately
                }
            } else {
                console.error('Invalid timestamp for lastGetPost');
                // Handle the error appropriately
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [dispatch, newPost, lastGetPost]);



    return (
        <div className="d-flex align-self-stretch align-items-start flex-column justify-content-between">
            <div className="p-4 align-self-center">
                {newPost ?
                    <button className="btn btn-warning" onClick={() => handleRefresh()}>
                        New posts avaliable!
                    </button> : null
                }
            </div>
            <div className="p-4 container">
                <AllPostList />
            </div>
            <div className="p-4">
            </div>
        </div>
    );
};

export default Home;

