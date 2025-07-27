import React from 'react';

const PostContent = ({ post }) => {
  return (
    <div className="post-content">
      {/* Text Content */}
      {post.content && (
        <div style={{
          padding: '0 16px 12px',
          fontSize: '15px',
          lineHeight: '1.33',
          color: '#050505',
          whiteSpace: 'pre-wrap'
        }}>
          {post.content}
        </div>
      )}

      {/* Media Content */}
      {post.media && post.media.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {post.media.map((mediaItem, index) => (
            <div key={index}>
              {mediaItem.type === 'image' ? (
                <img 
                  src={mediaItem.url}
                  alt="Post media"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    cursor: 'pointer'
                  }}
                />
              ) : mediaItem.type === 'video' ? (
                <video 
                  src={mediaItem.url}
                  controls
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Shared Post Preview */}
      {post.sharedPost && (
        <div style={{
          margin: '12px 16px',
          border: '1px solid #dadde1',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px',
            background: '#f7f8fa'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <img 
                src={post.sharedPost.author?.profilePicture || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNlNGU2ZWEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggOEMxMC4yMDkxIDggMTIgNi4yMDkxIDEyIDZDMTIgMy43OTA4NiAxMC4yMDkxIDIgOCAyQzUuNzkwODYgMiA0IDMuNzkwODYgNCA2QzQgNi4yMDkxIDUuNzkwODYgOCA4IDhaIiBmaWxsPSIjNjU2NzZiIi8+CjxwYXRoIGQ9Ik04IDEwQzUuMzMgMTAgMyAxMi42NyAzIDE2VjE4QzYuNDggMTggOCAxOCAxMCAxOFYxNkMxMCAxMi42NyA3LjY3IDEwIDggMTBaIiBmaWxsPSIjNjU2NzZiIi8+KPHN2Zz4KPHN2Zz4="}
                alt="Shared post author"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%'
                }}
              />
              <span style={{
                fontWeight: '600',
                fontSize: '13px',
                color: '#050505'
              }}>
                {post.sharedPost.author?.fullName || post.sharedPost.author?.username || 'Người dùng'}
              </span>
            </div>
            
            {post.sharedPost.content && (
              <div style={{
                fontSize: '14px',
                color: '#050505',
                lineHeight: '1.33'
              }}>
                {post.sharedPost.content}
              </div>
            )}
            
            {post.sharedPost.media && post.sharedPost.media.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {post.sharedPost.media.map((mediaItem, index) => (
                  <div key={index}>
                    {mediaItem.type === 'image' ? (
                      <img 
                        src={mediaItem.url}
                        alt="Shared post media"
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '4px'
                        }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostContent; 