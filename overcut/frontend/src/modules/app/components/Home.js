// Home.js
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AllPostList } from "../../posts";
import * as actions from "../../posts/actions";
import { getNewPosts, getLastGetPost } from "../../posts/selectors";
import { useConsent } from "../../../cookies/ConsentContext"; // <-- importa el contexto
import CookieIntroModal from "../../../cookies/CookieIntroModal";      // <-- el banner
import "./Home.css";

const Home = () => {
  const dispatch = useDispatch();
  const newPost = useSelector(getNewPosts);
  const lastGetPost = useSelector(getLastGetPost);
  const lastGetPostRef = useRef(lastGetPost);

  const { bannerOpen } = useConsent(); // <-- sabrá si debe mostrarse

  useEffect(() => { lastGetPostRef.current = lastGetPost; }, [lastGetPost]);

  useEffect(() => {
    const interval = setInterval(() => {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const ts = parseInt(lastGetPostRef.current, 10);
      if (!isNaN(ts)) {
        const date = new Date(ts - tzoffset);
        if (!isNaN(date.getTime())) {
          dispatch(actions.getNewPosts(date.toISOString().split(".")[0]));
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = () => dispatch(actions.getPosts({ page: 0 }));

  return (
    <div className="home-container">
      {/* ⬇️ El banner aparece solo si NO hay consentimiento aún */}
      {bannerOpen && <CookieIntroModal />}

      <div className="home-button-wrapper">
        {newPost && (
          <button className="home-refresh-button" onClick={handleRefresh}>
            New posts available!
          </button>
        )}
      </div>

      <div className="home-postlist-wrapper">
        <AllPostList />
      </div>
    </div>
  );
};

export default Home;
