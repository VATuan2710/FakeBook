import React from 'react';

// Helper functions
const getReactionEmoji = (reactionType) => {
  const reactions = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡'
  };
  return reactions[reactionType] || '👍';
};

const getReactionLabel = (reactionType) => {
  const labels = {
    like: 'Thích',
    love: 'Yêu thích',
    haha: 'Haha',
    wow: 'Wow',
    sad: 'Buồn',
    angry: 'Giận dữ'
  };
  return labels[reactionType] || 'Thích';
};

const PostActions = ({ 
  post, 
  onLikeClick, 
  onCommentClick, 
  onShareClick,
  onReactionHover,
  onReactionLeave,
  userReaction
}) => {
  return (
    <div className="post-actions" style={{
      display: 'block',
      borderTop: '1px solid #e4e6ea',
      padding: '10px 16px',
      backgroundColor: 'white',
      minHeight: '60px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        gap: '8px'
      }}>
        
        {/* Like Button */}
        <button
          onClick={onLikeClick}
          style={{
            background: userReaction ? '#1877f2' : '#f0f2f5',
            color: userReaction ? 'white' : '#65676b',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '36px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={onReactionHover}
          onMouseLeave={onReactionLeave}
        >
          {userReaction ? (
            <>
              <span style={{ marginRight: '6px' }}>
                {getReactionEmoji(userReaction)}
              </span>
              <span>
                {getReactionLabel(userReaction)}
              </span>
            </>
          ) : (
            <>
              <span style={{ marginRight: '6px' }}>👍</span>
              <span>Thích</span>
            </>
          )}
        </button>

        {/* Comment Button */}
        <button 
          onClick={onCommentClick}
          style={{
            background: '#f0f2f5',
            color: '#65676b',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '36px',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ marginRight: '6px' }}>💬</span>
          <span>Bình luận</span>
        </button>

        {/* Share Button */}
        <button 
          onClick={onShareClick}
          style={{
            background: '#f0f2f5',
            color: '#65676b',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '36px',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ marginRight: '6px' }}>📤</span>
          <span>Chia sẻ</span>
        </button>
      </div>
    </div>
  );
};

export default PostActions; 