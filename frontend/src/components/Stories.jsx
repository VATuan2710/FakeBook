import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import './Stories.css';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate current user
    setCurrentUser({
      _id: '1',
      displayName: 'Bạn',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'
    });

    // Simulate stories data
    setStories([
      {
        _id: 'story1',
        author: {
          _id: '2',
          displayName: 'Nguyễn Văn A',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
        },
        type: 'image',
        content: {
          media: {
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=500&fit=crop',
            thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=112&h=200&fit=crop'
          }
        },
        viewCount: 23,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
        isViewed: false
      },
      {
        _id: 'story2',
        author: {
          _id: '3',
          displayName: 'Trần Thị B',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=50&h=50&fit=crop&crop=face'
        },
        type: 'image',
        content: {
          media: {
            url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop',
            thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=112&h=200&fit=crop'
          }
        },
        viewCount: 45,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
        isViewed: true
      },
      {
        _id: 'story3',
        author: {
          _id: '4',
          displayName: 'Lê Văn C',
          avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=50&h=50&fit=crop&crop=face'
        },
        type: 'text',
        content: {
          text: {
            content: 'Chúc mọi người một ngày tốt lành! 🌟',
            backgroundColor: '#1877f2',
            textColor: '#ffffff',
            textAlign: 'center'
          }
        },
        viewCount: 12,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours from now
        isViewed: false
      }
    ]);
  }, []);

  const handleCreateStory = () => {
    // Handle story creation
    console.log('Create new story');
  };

  const handleStoryClick = (story) => {
    setSelectedStory(story);
    // Mark as viewed
    setStories(prev => prev.map(s => 
      s._id === story._id ? { ...s, isViewed: true } : s
    ));
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Vừa xong';
    if (hours === 1) return '1 giờ';
    return `${hours} giờ`;
  };

  return (
    <>
      <div className="story-section">
        {/* Create Story Button */}
        <div className="story-item create-story" onClick={handleCreateStory}>
          <div className="create-story-avatar">
            <img src={currentUser?.avatarUrl} alt="Your avatar" className="avatar avatar-lg" />
            <div className="create-story-plus">
              <FontAwesomeIcon icon={faPlus} />
            </div>
          </div>
          <span className="create-story-text">Tạo tin</span>
        </div>

        {/* Stories List */}
        {stories.map((story) => (
          <div 
            key={story._id} 
            className={`story-item ${story.isViewed ? 'viewed' : ''}`}
            onClick={() => handleStoryClick(story)}
          >
            {story.type === 'image' ? (
              <img src={story.content.media.thumbnail} alt="Story" />
            ) : (
              <div 
                className="story-text-preview"
                style={{ 
                  backgroundColor: story.content.text.backgroundColor,
                  color: story.content.text.textColor 
                }}
              >
                {story.content.text.content}
              </div>
            )}
            
            <div className="story-overlay">
              <div className="story-author">
                <img 
                  src={story.author.avatarUrl} 
                  alt={story.author.displayName}
                  className="story-author-avatar"
                />
                <span className="story-author-name">{story.author.displayName}</span>
              </div>
            </div>

            <div className="story-ring">
              <div className={`story-progress ${story.isViewed ? 'viewed' : ''}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="story-viewer-overlay" onClick={handleCloseStory}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-header">
              <div className="story-viewer-author">
                <img 
                  src={selectedStory.author.avatarUrl} 
                  alt={selectedStory.author.displayName}
                  className="avatar avatar-md"
                />
                <div>
                  <h4>{selectedStory.author.displayName}</h4>
                  <p>{formatTimeAgo(selectedStory.createdAt)}</p>
                </div>
              </div>
              <button className="story-close-btn" onClick={handleCloseStory}>
                ✕
              </button>
            </div>

            <div className="story-progress-bar">
              <div className="story-progress-fill"></div>
            </div>

            <div className="story-content">
              {selectedStory.type === 'image' ? (
                <img src={selectedStory.content.media.url} alt="Story" />
              ) : (
                <div 
                  className="story-text-content"
                  style={{ 
                    backgroundColor: selectedStory.content.text.backgroundColor,
                    color: selectedStory.content.text.textColor,
                    textAlign: selectedStory.content.text.textAlign
                  }}
                >
                  {selectedStory.content.text.content}
                </div>
              )}
            </div>

            <div className="story-viewer-footer">
              <div className="story-stats">
                <span>
                  <FontAwesomeIcon icon={faEye} /> {selectedStory.viewCount} lượt xem
                </span>
              </div>
              <div className="story-actions">
                <button className="btn btn-ghost btn-sm">
                  <FontAwesomeIcon icon={faHeart} />
                </button>
                <button className="btn btn-ghost btn-sm">
                  <FontAwesomeIcon icon={faComment} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Stories; 