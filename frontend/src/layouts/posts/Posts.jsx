import React from "react";
import "./Posts.css";

const Feed = () => {
  return (
    <div className="feed">
      <div className="post">
        <h3>Post</h3>
        <p>Cermia counter ✅</p>
        <img
          src="https://fastly.picsum.photos/id/84/600/400.jpg?hmac=B8m9smoVjzzIwLYZuE6g_bm4aTflSo2FW5fd7oB6U4k"
          alt="Post"
        />
      </div>
    </div>
  );
};

export default Feed;
