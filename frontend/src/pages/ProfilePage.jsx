import React, { useEffect, useState } from "react";
import { getUserProfile } from "../service/userService";
import { getUserPosts } from "../service/postService";
import { getUserInfo } from "../service/authService";
import { getFriends } from "../service/friendService";
import "../assets/css/ProfilePage.css";
import Header from "../layouts/header/Header";
import FriendRequestButton from "../components/FriendRequestButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faEdit,
  faUserPlus,
  faMessage,
  faMapMarkerAlt,
  faCalendarAlt,
  faUsers,
  faImages,
  faNewspaper,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Get current user info
        const currentUserInfo = await getUserInfo();
        setCurrentUser(currentUserInfo);
        
        // For now, we're showing current user's profile
        // Later this can be modified to show other users' profiles based on URL params
        const profileData = await getUserProfile();
        setUser(profileData);
        
        // Check if this is own profile
        setIsOwnProfile(currentUserInfo._id === profileData._id);
        
        const userPosts = await getUserPosts();
        setPosts(userPosts.posts || []);
        
        // Get friends list
        if (profileData._id) {
          const friendsData = await getFriends(profileData._id);
          setFriends(friendsData.friends || []);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleFriendStatusChange = (newStatus, result) => {
    // Refresh friends list if friendship status changed
    if (newStatus === 'friends' && user?._id) {
      getFriends(user._id).then(data => {
        setFriends(data.friends || []);
      });
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="profile-loading">
          <div className="loading-spinner">🔄 Đang tải trang cá nhân...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header />
        <div className="profile-error">
          <p>❌ Không thể tải thông tin trang cá nhân</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="profile-page">
        {/* Cover Photo Section */}
        <div className="cover-section">
          <div className="cover-photo">
            <img 
              src={user.cover_photoUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop'} 
              alt="Ảnh bìa" 
              className="cover-img" 
            />
            {isOwnProfile && (
              <button className="cover-edit-btn">
                <FontAwesomeIcon icon={faCamera} />
                Chỉnh sửa ảnh bìa
              </button>
            )}
          </div>
          
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-info-main">
              <div className="avatar-section">
                <div className="profile-avatar">
                  <img 
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                    alt="Avatar" 
                    className="avatar-img" 
                  />
                  {isOwnProfile && (
                    <button className="avatar-edit-btn">
                      <FontAwesomeIcon icon={faCamera} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="profile-details">
                <h1 className="profile-name">{user.displayName || user.username}</h1>
                <p className="profile-friends-count">
                  <FontAwesomeIcon icon={faUsers} />
                  {friends.length} bạn bè
                </p>
              </div>
            </div>
            
            <div className="profile-actions">
              {isOwnProfile ? (
                <button className="btn btn-primary">
                  <FontAwesomeIcon icon={faEdit} />
                  Chỉnh sửa trang cá nhân
                </button>
              ) : (
                <div className="profile-action-buttons">
                  <FriendRequestButton 
                    targetUserId={user._id}
                    onStatusChange={handleFriendStatusChange}
                    size="md"
                    showText={true}
                  />
                  <button className="btn btn-secondary">
                    <FontAwesomeIcon icon={faMessage} />
                    Nhắn tin
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="profile-nav">
            <button 
              className={`nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FontAwesomeIcon icon={faNewspaper} />
              Bài viết
            </button>
            <button 
              className={`nav-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              Giới thiệu
            </button>
            <button 
              className={`nav-tab ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              <FontAwesomeIcon icon={faImages} />
              Ảnh
            </button>
            <button 
              className={`nav-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <FontAwesomeIcon icon={faUsers} />
              Bạn bè ({friends.length})
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          <div className="profile-left">
            <div className="profile-card">
              <h3>Giới thiệu</h3>
              <div className="about-items">
                {user.about && <p className="bio">{user.about}</p>}
                {user.location?.current && (
                  <div className="about-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>Sống tại {user.location.current}</span>
                  </div>
                )}
                <div className="about-item">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Tham gia vào {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3>Ảnh</h3>
              <div className="photos-grid">
                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop" alt="" />
                <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop" alt="" />
                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop" alt="" />
                <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop" alt="" />
              </div>
            </div>

            {/* Friends Section */}
            {activeTab === 'friends' && (
              <div className="profile-card">
                <h3>Bạn bè ({friends.length})</h3>
                <div className="friends-grid">
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <div key={friend._id} className="friend-item">
                        <img 
                          src={friend.avatarUrl} 
                          alt={friend.displayName || friend.username}
                          className="friend-avatar"
                        />
                        <div className="friend-info">
                          <h4>{friend.displayName || friend.username}</h4>
                          {!isOwnProfile && currentUser && (
                            <FriendRequestButton 
                              targetUserId={friend._id}
                              size="sm"
                              showText={false}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-friends">Chưa có bạn bè nào</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="profile-right">
            {activeTab === 'posts' && (
              <div className="posts-section">
                <div className="posts-feed">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <div key={post._id} className="post-card">
                        <div className="post-header">
                          <img src={user.avatarUrl} alt="" className="post-avatar" />
                          <div className="post-info">
                            <h4>{user.displayName}</h4>
                            <span className="post-time">
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <div className="post-content">
                          <p>{post.content}</p>
                          {post.imageUrl && (
                            <img src={post.imageUrl} alt="" className="post-image" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-posts">
                      <p>Chưa có bài viết nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="about-section">
                <div className="profile-card">
                  <h3>Thông tin cơ bản</h3>
                  <div className="about-details">
                    <div className="about-item">
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div className="about-item">
                      <strong>Username:</strong> @{user.username}
                    </div>
                    {user.phone && (
                      <div className="about-item">
                        <strong>Điện thoại:</strong> {user.phone}
                      </div>
                    )}
                    {user.birthday && (
                      <div className="about-item">
                        <strong>Sinh nhật:</strong> {new Date(user.birthday).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {user.gender && (
                      <div className="about-item">
                        <strong>Giới tính:</strong> {user.gender}
                      </div>
                    )}
                  </div>
                </div>

                {user.work && user.work.length > 0 && (
                  <div className="profile-card">
                    <h3>Công việc</h3>
                    <div className="work-items">
                      {user.work.map((job, index) => (
                        <div key={index} className="work-item">
                          <strong>{job.position}</strong> tại <strong>{job.company}</strong>
                          {job.description && <p>{job.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.education && user.education.length > 0 && (
                  <div className="profile-card">
                    <h3>Học vấn</h3>
                    <div className="education-items">
                      {user.education.map((edu, index) => (
                        <div key={index} className="education-item">
                          <strong>{edu.school}</strong>
                          {edu.degree && <span> - {edu.degree}</span>}
                          {edu.fieldOfStudy && <span> ({edu.fieldOfStudy})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="photos-section">
                <div className="profile-card">
                  <h3>Ảnh của {user.displayName || user.username}</h3>
                  <div className="photos-gallery">
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop" alt="" />
                    <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop" alt="" />
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop" alt="" />
                    <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop" alt="" />
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop" alt="" />
                    <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop" alt="" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
