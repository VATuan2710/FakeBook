import React, { useEffect, useState } from "react";
import "../assets/css/HomePage.css";
import Header from "../layouts/header/Header";
import Sidebar from "../layouts/sidebar/Sidebar";
import Posts from "../layouts/posts/Posts";
import Widgets from "../layouts/widgets/Widgets";
import Stories from "../components/Stories";
import PeopleYouMayKnow from "../components/PeopleYouMayKnow";
import PostFormPage from "./PostFormPage";
import PostListPage from "./PostListPage";
import { getPosts } from "../service/postService";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔄 Đang tải danh sách bài viết...");
        const postsData = await getPosts();
        
        console.log("✅ Tải bài viết thành công:", postsData);
        setPosts(postsData.posts || []);
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
        
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    // Kiểm tra xem user có đăng nhập không
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ Không tìm thấy token, chuyển hướng đến trang login");
      window.location.href = "/login";
      return;
    }

    fetchPosts();
  }, []);

  // Hàm callback để cập nhật danh sách bài viết
  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => {
      if (!Array.isArray(prevPosts)) {
        console.error("prevPosts không phải là mảng:", prevPosts);
        return [newPost]; 
      }
      return [newPost, ...prevPosts]; // Thêm bài viết mới vào đầu danh sách
    });
  };

  // Hàm retry để thử lại việc tải bài viết
  const handleRetry = () => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const postsData = await getPosts();
        setPosts(postsData.posts || []);
      } catch (error) {
        console.error("❌ Lỗi khi retry tải bài viết:", error);
        setError("Vẫn không thể tải bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
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
          
          {/* Hiển thị loading state */}
          {loading && (
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
          {error && !loading && (
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
          {!loading && !error && (
            <PostListPage posts={posts} />
          )}
        </div>
        <Widgets />
      </div>
    </div>
  );
};

export default HomePage;
