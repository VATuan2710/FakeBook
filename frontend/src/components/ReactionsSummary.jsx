import React from 'react';

const ReactionsSummary = ({ post }) => {
  // Helper function to format reaction count
  const formatReactionCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count?.toString() || '0';
  };

  // Helper function to get reaction emoji
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

  // Get top reactions (maximum 3 most popular)
  const getTopReactions = (reactions) => {
    if (!reactions || typeof reactions !== 'object') return [];
    
    return Object.entries(reactions)
      .filter(([type, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  };

  const totalReactions = post.reactions && typeof post.reactions === 'object' 
    ? Object.values(post.reactions).reduce((sum, count) => sum + (count || 0), 0)
    : 0;

  const topReactions = getTopReactions(post.reactions);
  const commentsCount = post.commentsCount || 0;
  const sharesCount = post.sharesCount || 0;

  // Don't render if no reactions, comments, or shares
  if (totalReactions === 0 && commentsCount === 0 && sharesCount === 0) {
    return null;
  }

  return (
    <div style={{
      padding: '12px 16px 8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '15px',
      color: '#65676b'
    }}>
      {/* Reactions Summary */}
      {totalReactions > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer'
        }}>
          {/* Top Reaction Emojis */}
          <div style={{
            display: 'flex',
            marginRight: '6px'
          }}>
            {topReactions.map((reactionType, index) => (
              <span
                key={reactionType}
                style={{
                  fontSize: '16px',
                  marginLeft: index > 0 ? '-2px' : '0',
                  background: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid white',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {getReactionEmoji(reactionType)}
              </span>
            ))}
          </div>
          
          {/* Reactions Count */}
          <span style={{
            fontSize: '15px',
            color: '#65676b'
          }}>
            {formatReactionCount(totalReactions)}
          </span>
        </div>
      )}

      {/* Comments and Shares Count */}
      {(commentsCount > 0 || sharesCount > 0) && (
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '15px',
          color: '#65676b'
        }}>
          {commentsCount > 0 && (
            <span style={{ cursor: 'pointer' }}>
              {formatReactionCount(commentsCount)} bình luận
            </span>
          )}
          
          {sharesCount > 0 && (
            <span style={{ cursor: 'pointer' }}>
              {formatReactionCount(sharesCount)} lượt chia sẻ
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReactionsSummary; 