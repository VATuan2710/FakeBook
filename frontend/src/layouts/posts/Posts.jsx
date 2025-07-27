import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toggleReaction, commentOnPost, getPostComments, sharePost } from '../../service/postService';
import PostHeader from '../../components/PostHeader';
import PostContent from '../../components/PostContent';
import PostActions from '../../components/PostActions';
import ReactionPicker from '../../components/ReactionPicker';
import ReactionsSummary from '../../components/ReactionsSummary';
import './Posts.css';

const Posts = ({ posts, onPostUpdate }) => {
  const user = useSelector(state => state.auth.user);
  
  // State management
  const [commentsVisible, setCommentsVisible] = useState({});
  const [newComment, setNewComment] = useState({});
  const [postComments, setPostComments] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [shareModalVisible, setShareModalVisible] = useState({});
  const [shareText, setShareText] = useState({});

  // Reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Thích' },
    { type: 'love', emoji: '❤️', label: 'Yêu thích' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Buồn' },
    { type: 'angry', emoji: '😡', label: 'Giận dữ' }
  ];

  // Handle reaction
  const handleReaction = async (postId, reactionType) => {
    try {
      const response = await toggleReaction(postId, reactionType);
      if (response.success && onPostUpdate) {
        onPostUpdate(postId, response.data);
      }
      setShowReactionPicker(prev => ({ ...prev, [postId]: false }));
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  // Handle comment
  const handleComment = async (postId) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;

    try {
      const response = await commentOnPost(postId, comment);
      if (response.success) {
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        await fetchComments(postId);
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  // Toggle comments visibility
  const toggleComments = async (postId) => {
    const isVisible = !commentsVisible[postId];
    setCommentsVisible(prev => ({ ...prev, [postId]: isVisible }));
    
    if (isVisible && !postComments[postId]) {
      await fetchComments(postId);
    }
  };

  // Fetch comments
  const fetchComments = async (postId) => {
    try {
      const response = await getPostComments(postId);
      if (response.success) {
        setPostComments(prev => ({ ...prev, [postId]: response.data }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Handle share
  const handleShare = async (postId) => {
    const text = shareText[postId] || '';
    
    try {
      const response = await sharePost(postId, text);
      if (response.success) {
        setShareModalVisible(prev => ({ ...prev, [postId]: false }));
        setShareText(prev => ({ ...prev, [postId]: '' }));
        alert('Đã chia sẻ bài viết thành công!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Có lỗi xảy ra khi chia sẻ bài viết');
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#65676b',
        fontSize: '16px'
      }}>
        Chưa có bài viết nào để hiển thị
      </div>
    );
  }

  return (
    <div className="posts-container" style={{
      maxWidth: '680px',
      margin: '0 auto',
      gap: '16px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {posts.map((post) => (
        <div key={post._id} className="post-card" style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          {/* Post Header */}
          <PostHeader post={post} />

          {/* Post Content */}
          <PostContent post={post} />

          {/* Reactions Summary */}
          <ReactionsSummary post={post} />

          {/* Post Actions */}
          <PostActions
            post={post}
            userReaction={post.userReaction}
            onLikeClick={() => handleReaction(post._id, 'like')}
            onCommentClick={() => toggleComments(post._id)}
            onShareClick={() => setShareModalVisible(prev => ({ ...prev, [post._id]: true }))}
            onReactionHover={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: true }))}
            onReactionLeave={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: false }))}
          />

          {/* Reaction Picker */}
          <ReactionPicker
            isVisible={showReactionPicker[post._id]}
            onReactionSelect={(reactionType) => handleReaction(post._id, reactionType)}
            onMouseEnter={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: true }))}
            onMouseLeave={() => setShowReactionPicker(prev => ({ ...prev, [post._id]: false }))}
          />

          {/* Comments Section */}
          {commentsVisible[post._id] && (
            <div style={{
              borderTop: '1px solid #e4e6ea',
              padding: '12px 16px'
            }}>
              {/* New Comment Input */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <img 
                  src={user?.profilePicture || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNlNGU2ZWEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggOEMxMC4yMDkxIDggMTIgNi4yMDkxIDEyIDZDMTIgMy43OTA4NiAxMC4yMDkxIDIgOCAyQzUuNzkwODYgMiA0IDMuNzkwODYgNCA2QzQgNi4yMDkxIDUuNzkwODYgOCA4IDhaIiBmaWxsPSIjNjU2NzZiIi8+CjxwYXRoIGQ9Ik04IDEwQzUuMzMgMTAgMyAxMi42NyAzIDE2VjE4QzYuNDggMTggOCAxOCAxMCAxOFYxNkMxMCAxMi42NyA3LjY3IDEwIDggMTBaIiBmaWxsPSIjNjU2NzZiIi8+KPHN2Zz4KPHN2Zz4="}
                  alt="Your avatar"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%'
                  }}
                />
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Viết bình luận..."
                    value={newComment[post._id] || ''}
                    onChange={(e) => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ccd0d5',
                      borderRadius: '20px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    style={{
                      background: '#1877f2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Gửi
                  </button>
                </div>
              </div>

              {/* Comments List */}
              {postComments[post._id] && postComments[post._id].length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {postComments[post._id].map((comment) => (
                    <div key={comment._id} style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <img 
                        src={comment.author?.profilePicture || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNlNGU2ZWEiLz4KPHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcgN0M5LjIwOTEgNyAxMSA1LjIwOTEgMTEgNUMxMSAyLjc5MDg2IDkuMjA5MSAxIDcgMUM0Ljc5MDg2IDEgMyAyLjc5MDg2IDMgNUMzIDUuMjA5MSA0Ljc5MDg2IDcgNyA3WiIgZmlsbD0iIzY1Njc2YiIvPgo8cGF0aCBkPSJNNyA5QzQuMzMgOSAyIDExLjY3IDIgMTVWMTdDNS40OCAxNyA3IDE3IDkgMTdWMTVDOSAxMS42NyA2LjY3IDkgNyA5WiIgZmlsbD0iIzY1Njc2YiIvPgo8L3N2Zz4KPHN2Zz4="}
                        alt="Comment author"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%'
                        }}
                      />
                      <div style={{
                        background: '#f0f2f5',
                        padding: '8px 12px',
                        borderRadius: '16px',
                        flex: 1
                      }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#050505',
                          marginBottom: '2px'
                        }}>
                          {comment.author?.fullName || comment.author?.username || 'Người dùng'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#050505'
                        }}>
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Share Modal */}
          {shareModalVisible[post._id] && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                width: '500px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto'
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #dadde1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                    Chia sẻ bài viết
                  </h3>
                  <button
                    onClick={() => setShareModalVisible(prev => ({ ...prev, [post._id]: false }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#65676b'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ padding: '16px' }}>
                  <textarea
                    placeholder="Nói gì đó về bài viết này..."
                    value={shareText[post._id] || ''}
                    onChange={(e) => setShareText(prev => ({ ...prev, [post._id]: e.target.value }))}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      border: '1px solid #ccd0d5',
                      borderRadius: '8px',
                      resize: 'vertical',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                  
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    border: '1px solid #dadde1',
                    borderRadius: '8px',
                    background: '#f7f8fa'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#65676b',
                      marginBottom: '8px'
                    }}>
                      Bài viết gốc:
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#050505'
                    }}>
                      {post.content}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '16px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => setShareModalVisible(prev => ({ ...prev, [post._id]: false }))}
                      style={{
                        background: '#e4e6ea',
                        color: '#050505',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleShare(post._id)}
                      style={{
                        background: '#1877f2',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Chia sẻ
                    </button>
                  </div>
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
