import React from 'react';
import { formatTimeAgo } from './TimeFunction';

const PostHeader = ({ post }) => {
  const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNGU2ZWEiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTJaIiBmaWxsPSIjNjU2NzZiIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDQuIDYgMTYuNjcgNiAyMFYyMkMxMC40OCAyMiAxNCAyMiAxOCAyMlYyMEMxOCAxNi42NyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM2NTY3NmIiLz4KPHN2Zz4KPHN2Zz4=";

  return (
    <div className="post-header" style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      gap: '12px'
    }}>
      <img 
        src={post.author?.profilePicture || defaultAvatar}
        alt="Avatar"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
      
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '2px'
        }}>
          <span style={{
            fontWeight: '600',
            fontSize: '15px',
            color: '#050505'
          }}>
            {post.author?.fullName || post.author?.username || 'Người dùng'}
          </span>
          
          {post.privacy && (
            <span style={{
              fontSize: '12px',
              color: '#65676b',
              background: '#f0f2f5',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {post.privacy === 'public' ? '🌍 Công khai' : 
               post.privacy === 'friends' ? '👥 Bạn bè' : '🔒 Riêng tư'}
            </span>
          )}
        </div>
        
        <div style={{
          fontSize: '13px',
          color: '#65676b'
        }}>
          {formatTimeAgo(post.createdAt)}
        </div>
      </div>
      
      <button style={{
        background: 'none',
        border: 'none',
        padding: '8px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '20px',
        color: '#65676b'
      }}>
        •••
      </button>
    </div>
  );
};

export default PostHeader; 