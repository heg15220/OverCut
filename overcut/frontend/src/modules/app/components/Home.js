import { AllPostList } from "../../posts";
import { useEffect, useRef } from "react";
import * as actions from "../../posts/actions";
import { useDispatch, useSelector } from "react-redux";
import { getNewPosts, getLastGetPost } from "../../posts/selectors";
import "./Home.css";

const Home = () => {
  const dispatch = useDispatch();
  const newPost = useSelector(getNewPosts);
  const lastGetPost = useSelector(getLastGetPost);

  const lastGetPostRef = useRef(lastGetPost);

  useEffect(() => {
    lastGetPostRef.current = lastGetPost;
  }, [lastGetPost]);

  const handleRefresh = () => {
    dispatch(actions.getPosts({ page: 0 }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const lastGetPostTimestamp = parseInt(lastGetPostRef.current, 10);
      if (!isNaN(lastGetPostTimestamp)) {
        const date = new Date(lastGetPostTimestamp - tzoffset);
        if (!isNaN(date.getTime())) {
          dispatch(actions.getNewPosts(date.toISOString().split('.')[0]));
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="home-container">
      <div className="home-button-wrapper">
        {newPost &&
          <button className="home-refresh-button" onClick={handleRefresh}>
            New posts available!
          </button>
        }
      </div>
      <div className="home-postlist-wrapper">
        <AllPostList />
      </div>
    </div>
  );
};

export default Home;
