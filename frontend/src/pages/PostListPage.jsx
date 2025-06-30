import React, { useState, useEffect } from "react";
import { getPosts } from "../service/postService";
import { formatDate } from "../components/TimeFunction";

const PostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;

  // Gọi API để lấy bài viết
  const fetchPosts = async () => {
    try {
      const { posts: newPosts, totalPosts } = await getPosts(page, limit);
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      if (posts.length + newPosts.length >= totalPosts) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Lỗi khi lấy bài viết:", error);
    }
  };

  useEffect(() => {
    if (hasMore) fetchPosts();
  }, [page]);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      {posts.map((post) => {
        console.log("Bài viết:", post);
        return (
          <div key={post._id} className="post">
            <h4>{post.userId?.username}</h4>
            <p>{post.content}</p>
            <span>{formatDate(post.createdAt)}</span>
            {/* Kiểm tra và hiển thị ảnh */}
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Bài viết"
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  marginTop: "10px",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
        );
      })}
      {!hasMore && <p>Đã tải hết bài viết</p>}
    </div>
  );
};

export default PostListPage;
