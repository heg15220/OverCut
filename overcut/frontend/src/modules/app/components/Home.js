import { AllPostList } from "../../posts";
import { useEffect } from "react";
import * as actions from "../../posts/actions";
import { useDispatch, useSelector } from "react-redux";
import { getNewPosts, getLastGetPost } from "../../posts/selectors";
import * as selectors from "../../quiz/selectors";
import { useRef } from "react";

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
    <div className="d-flex align-self-stretch align-items-start flex-column justify-content-between" style={{ minHeight: '2vh', width: '100%', border: 'none' }}>
      <div className="p-4 align-self-center" style={{ border: 'none' }}>
        {newPost &&
          <button className="btn btn-warning" onClick={() => handleRefresh()}>
            New posts available!
          </button>
        }
      </div>
      <div className="p-4" style={{ width: '100%', height: '100%', border: 'none' }}>
        <AllPostList />
      </div>
      <div className="p-4" style={{ border: 'none' }}>
      </div>
    </div>
  );
};

export default Home;

