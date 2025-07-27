import React, { useState, useEffect } from "react";
import { 
  toggleReaction, 
  commentOnPost, 
  getPostComments, 
  sharePost, 
  formatReactionCount, 
  getReactionEmoji 
} from "../../service/postService";
import "./Posts.css";

const Posts = ({ posts = [], onPostUpdate = () => {} }) => {
  const [commentsVisible, setCommentsVisible] = useState({});
  const [newComment, setNewComment] = useState({});
  const [postComments, setPostComments] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [shareModalVisible, setShareModalVisible] = useState({});
  const [shareText, setShareText] = useState({});

  // Reaction types với emoji
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Thích' },
    { type: 'love', emoji: '❤️', label: 'Yêu thích' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Buồn' },
    { type: 'angry', emoji: '😠', label: 'Phẫn nộ' }
  ];

  // Get default avatar
  const getDefaultAvatar = () => {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e4e6ea'/%3E%3Cpath d='M20 19c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z' fill='%23bdbdbd'/%3E%3C/svg%3E";
  };

  // Handle reaction
  const handleReaction = async (postId, reactionType) => {
    try {
      const result = await toggleReaction(postId, reactionType);
      onPostUpdate(postId, {
        reactions: result.reactions,
        reactionsCount: result.reactionsCount,
        reactionsSummary: result.reactionsSummary,
        userReaction: result.userReaction
      });
      setShowReactionPicker(prev => ({ ...prev, [postId]: false }));
    } catch (error) {
      console.error('Lỗi khi reaction:', error);
    }
  };

  // Toggle comments visibility
  const toggleComments = async (postId) => {
    const isVisible = commentsVisible[postId];
    setCommentsVisible(prev => ({ ...prev, [postId]: !isVisible }));
    
    // Load comments if not loaded yet
    if (!isVisible && !postComments[postId]) {
      try {
        const result = await getPostComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: result.comments }));
      } catch (error) {
        console.error('Lỗi khi lấy comments:', error);
      }
    }
  };

  // Handle comment submission
  const handleComment = async (postId) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    try {
      const result = await commentOnPost(postId, commentText);
      
      // Update comments list
      setPostComments(prev => ({
        ...prev,
        [postId]: [result.comment, ...(prev[postId] || [])]
      }));
      
      // Clear input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      
      // Update post comment count
      onPostUpdate(postId, { commentsCount: (posts.find(p => p._id === postId)?.commentsCount || 0) + 1 });
    } catch (error) {
      console.error('Lỗi khi comment:', error);
    }
  };

  // Handle share
  const handleShare = async (postId) => {
    try {
      const shareTextValue = shareText[postId] || '';
      const result = await sharePost(postId, shareTextValue);
      
      setShareModalVisible(prev => ({ ...prev, [postId]: false }));
      setShareText(prev => ({ ...prev, [postId]: '' }));
      
      alert('Đã chia sẻ bài viết thành công!');
    } catch (error) {
      console.error('Lỗi khi chia sẻ:', error);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Get most common reactions to display
  const getTopReactions = (reactionsSummary) => {
    if (!reactionsSummary) return [];
    
    return Object.entries(reactionsSummary)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => ({ type, emoji: getReactionEmoji(type) }));
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="posts-container">
        <div className="no-posts">
          <p>Chưa có bài viết nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-container">
      {posts.map((post) => (
        <div key={post._id} className="post-card">
          {/* Post Header */}
          <div className="post-header">
            <img 
              src={post.author?.avatarUrl || post.userId?.avatarUrl || getDefaultAvatar()} 
              alt="" 
              className="post-avatar"
              onError={(e) => { e.target.src = getDefaultAvatar(); }}
            />
            <div className="post-info">
              <h4 className="post-author">
                {post.author?.displayName || post.userId?.displayName || 'Người dùng'}
              </h4>
              <span className="post-time">{formatTime(post.createdAt)}</span>
              {post.privacy && (
                <span className="post-privacy">{post.privacy === 'public' ? '🌍' : '👥'}</span>
              )}
            </div>
            <div className="post-options">
              <button className="options-btn">⋯</button>
            </div>
          </div>

          {/* Post Content */}
          <div className="post-content">
            {post.content && <p className="post-text">{post.content}</p>}
            
            {/* Shared Post */}
            {post.type === 'shared_post' && post.originalPost && (
              <div className="shared-post">
                <div className="shared-post-header">
                  <img 
                    src={post.originalPost.author?.avatarUrl || getDefaultAvatar()} 
                    alt="" 
                    className="shared-avatar"
                    onError={(e) => { e.target.src = getDefaultAvatar(); }}
                  />
                  <div>
                    <h5>{post.originalPost.author?.displayName}</h5>
                    <span>{formatTime(post.originalPost.createdAt)}</span>
                  </div>
                </div>
                <div className="shared-post-content">
                  {post.originalPost.content && <p>{post.originalPost.content}</p>}
                  {post.originalPost.imageUrl && (
                    <img 
                      src={post.originalPost.imageUrl} 
                      alt="" 
                      className="shared-post-image" 
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Post Image */}
            {post.imageUrl && post.type !== 'shared_post' && (
              <img 
                src={post.imageUrl} 
                alt="" 
                className="post-image" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>

          {/* Reactions Summary */}
          {post.reactionsCount > 0 && (
            <div className="reactions-summary">
              <div className="reaction-emojis">
                {getTopReactions(post.reactionsSummary).map((reaction, index) => (
                  <span key={reaction.type} className="reaction-emoji">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
              <span className="reaction-count">
                {formatReactionCount(post.reactionsCount)}
              </span>
              <div className="comments-shares-count">
                {post.commentsCount > 0 && (
                  <span>{post.commentsCount} bình luận</span>
                )}
                {post.sharesCount > 0 && (
                  <span>{post.sharesCount} chia sẻ</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="post-actions">
            <div className="action-buttons">
              {/* Like Button with Reaction Picker */}
              <div className="reaction-wrapper">
                <button
                  className={`action-btn like-btn ${post.userReaction ? 'reacted' : ''}`}
                  onClick={() => handleReaction(post._id, 'like')}
                  onMouseEnter={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: true }))}
                  onMouseLeave={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: false }))}
                >
                  {post.userReaction ? (
                    <>
                      <span className="reaction-emoji">{getReactionEmoji(post.userReaction)}</span>
                      <span className={`reaction-text ${post.userReaction}`}>
                        {reactionTypes.find(r => r.type === post.userReaction)?.label || 'Thích'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="like-icon">👍</span>
                      <span>Thích</span>
                    </>
                  )}
                </button>

                {/* Reaction Picker */}
                {showReactionPicker[post._id] && (
                  <div 
                    className="reaction-picker"
                    onMouseEnter={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: true }))}
                    onMouseLeave={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: false }))}
                  >
                    {reactionTypes.map((reaction) => (
                      <button
                        key={reaction.type}
                        className="reaction-option"
                        onClick={() => handleReaction(post._id, reaction.type)}
                        title={reaction.label}
                      >
                        {reaction.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Button */}
              <button 
                className="action-btn comment-btn"
                onClick={() => toggleComments(post._id)}
              >
                <span className="comment-icon">💬</span>
                <span>Bình luận</span>
              </button>

              {/* Share Button */}
              <button 
                className="action-btn share-btn"
                onClick={() => setShareModalVisible(prev => ({ ...prev, [post._id]: true }))}
              >
                <span className="share-icon">📤</span>
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {commentsVisible[post._id] && (
            <div className="comments-section">
              {/* New Comment Input */}
              <div className="new-comment">
                <img 
                  src={getDefaultAvatar()} 
                  alt="" 
                  className="comment-avatar" 
                />
                <div className="comment-input-wrapper">
                  <input
                    type="text"
                    placeholder="Viết bình luận..."
                    value={newComment[post._id] || ''}
                    onChange={(e) => setNewComment(prev => ({ 
                      ...prev, 
                      [post._id]: e.target.value 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(post._id);
                      }
                    }}
                    className="comment-input"
                  />
                  <button 
                    onClick={() => handleComment(post._id)}
                    className="comment-submit"
                    disabled={!newComment[post._id]?.trim()}
                  >
                    📤
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="comments-list">
                {postComments[post._id]?.map((comment) => (
                  <div key={comment._id} className="comment">
                    <img 
                      src={comment.author?.avatarUrl || getDefaultAvatar()} 
                      alt="" 
                      className="comment-avatar"
                      onError={(e) => { e.target.src = getDefaultAvatar(); }}
                    />
                    <div className="comment-content">
                      <div className="comment-bubble">
                        <h5 className="comment-author">{comment.author?.displayName}</h5>
                        <p className="comment-text">{comment.content?.text}</p>
                      </div>
                      <div className="comment-actions">
                        <span className="comment-time">{formatTime(comment.createdAt)}</span>
                        <button className="comment-like">Thích</button>
                        <button className="comment-reply">Phản hồi</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Modal */}
          {shareModalVisible[post._id] && (
            <div className="share-modal-overlay">
              <div className="share-modal">
                <div className="share-modal-header">
                  <h3>Chia sẻ bài viết</h3>
                  <button 
                    className="close-modal"
                    onClick={() => setShareModalVisible(prev => ({ ...prev, [post._id]: false }))}
                  >
                    ✖
                  </button>
                </div>
                <div className="share-modal-content">
                  <textarea
                    placeholder="Nói gì đó về bài viết này..."
                    value={shareText[post._id] || ''}
                    onChange={(e) => setShareText(prev => ({ 
                      ...prev, 
                      [post._id]: e.target.value 
                    }))}
                    className="share-textarea"
                  />
                  <div className="original-post-preview">
                    <div className="preview-author">
                      <img 
                        src={post.author?.avatarUrl || getDefaultAvatar()} 
                        alt=""
                        onError={(e) => { e.target.src = getDefaultAvatar(); }}
                      />
                      <span>{post.author?.displayName}</span>
                    </div>
                    <p>{post.content}</p>
                    {post.imageUrl && <img src={post.imageUrl} alt="" />}
                  </div>
                </div>
                <div className="share-modal-actions">
                  <button 
                    className="share-cancel"
                    onClick={() => setShareModalVisible(prev => ({ ...prev, [post._id]: false }))}
                  >
                    Hủy
                  </button>
                  <button 
                    className="share-confirm"
                    onClick={() => handleShare(post._id)}
                  >
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Posts;
