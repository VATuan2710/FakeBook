import React, { useEffect, useState } from "react";
import "../assets/css/HomePage.css";
import Header from "../layouts/header/Header";
import Sidebar from "../layouts/sidebar/Sidebar";
import Posts from "../layouts/posts/Posts";
import Widgets from "../layouts/widgets/Widgets";
import Stories from "../components/Stories";
import PeopleYouMayKnow from "../components/PeopleYouMayKnow";
import PostFormPage from "./PostFormPage";
import { getPosts } from "../service/postService";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Đang tải danh sách bài viết trang ${pageNum}...`);
      const postsData = await getPosts(pageNum, 10);
      
      console.log("✅ Tải bài viết thành công:", postsData);
      
      if (reset) {
        setPosts(postsData.posts || []);
      } else {
        setPosts(prev => [...prev, ...(postsData.posts || [])]);
      }
      
      // Check if there are more posts
      if (postsData.posts && postsData.posts.length < 10) {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách bài viết:", error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Đang chuyển hướng...");
      } else if (error.response?.status === 403) {
        setError("Bạn không có quyền xem các bài viết này.");
      } else if (error.response?.status >= 500) {
        setError("Lỗi server. Vui lòng thử lại sau.");
      } else if (!navigator.onLine) {
        setError("Không có kết nối internet. Vui lòng kiểm tra kết nối của bạn.");
      } else {
        setError("Không thể tải bài viết. Vui lòng thử lại.");
      }
      
      if (reset) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, true);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
        hasMore &&
        !loading
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loading]);

  // Handle when a new post is created
  const handlePostCreated = (newPost) => {
    console.log("✅ Bài viết mới được tạo:", newPost);
    setPosts(prev => [newPost.post, ...prev]);
  };

  // Handle when a post is updated (reactions, comments, etc.)
  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post._id === postId 
        ? { ...post, ...updates }
        : post
    ));
  };

  // Retry loading posts
  const handleRetry = () => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  };

  return (
    <div>
      <Header />
      <div className="homePage">
        <Sidebar />
        <div className="mainContent">
          <Stories />
          <PostFormPage onPostCreated={handlePostCreated} />
          
          {/* People You May Know Section */}
          <div className="pymk-section">
            <PeopleYouMayKnow 
              maxUsers={6}
              showSearch={true}
              title="Những người bạn có thể biết"
            />
          </div>
          
          {/* Hiển thị loading state cho lần đầu load */}
          {loading && posts.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              backgroundColor: '#f0f2f5',
              borderRadius: '8px',
              margin: '10px 0'
            }}>
              <div>🔄 Đang tải bài viết...</div>
            </div>
          )}
          
          {/* Hiển thị error state */}
          {error && posts.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              margin: '10px 0',
              border: '1px solid #f44336',
              color: '#d32f2f'
            }}>
              <div>❌ {error}</div>
              <button 
                onClick={handleRetry}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#1877f2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Thử lại
              </button>
            </div>
          )}
          
          {/* Hiển thị danh sách bài viết */}
          {posts.length > 0 && (
            <Posts 
              posts={posts} 
              onPostUpdate={handlePostUpdate}
            />
          )}
          
          {/* Loading indicator for infinite scroll */}
          {loading && posts.length > 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: '#65676b'
            }}>
              <div>🔄 Đang tải thêm bài viết...</div>
            </div>
          )}
          
          {/* No more posts indicator */}
          {!hasMore && posts.length > 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: '#65676b',
              backgroundColor: '#f0f2f5',
              borderRadius: '8px',
              margin: '10px 0'
            }}>
              <div>✅ Đã tải hết tất cả bài viết</div>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && posts.length === 0 && !error && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              margin: '10px 0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ color: '#1c1e21', marginBottom: '8px' }}>Chưa có bài viết nào</h3>
              <p style={{ color: '#65676b' }}>Hãy tạo bài viết đầu tiên của bạn!</p>
            </div>
          )}
        </div>
        <Widgets />
      </div>
    </div>
  );
};

export default HomePage;
