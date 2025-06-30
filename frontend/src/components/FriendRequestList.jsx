import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faUserTimes, 
  faUsers,
  faSpinner,
  faRefresh,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { 
  getReceivedFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getDisplayName
} from '../service/friendService';
import { getUserInfo } from '../service/authService';
import '../assets/css/FriendRequestList.css';

const FriendRequestList = ({ onUpdate = () => {} }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');

  // Load friend requests
  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userInfo = await getUserInfo();
      setCurrentUser(userInfo);
      
      if (userInfo) {
        const data = await getReceivedFriendRequests(userInfo._id);
        setFriendRequests(data.friendRequests || []);
        onUpdate(data.count || 0);
      }
    } catch (error) {
      setError('Không thể tải lời mời kết bạn');
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendRequests();
  }, []);

  // Handle accept friend request
  const handleAccept = async (requestId, senderId) => {
    try {
      setActionLoading(prev => ({ ...prev, [requestId]: 'accepting' }));
      
      await acceptFriendRequest(requestId);
      
      // Remove from list
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      onUpdate(friendRequests.length - 1);
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Lỗi khi chấp nhận lời mời');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  // Handle decline friend request
  const handleDecline = async (requestId) => {
    try {
      setActionLoading(prev => ({ ...prev, [requestId]: 'declining' }));
      
      await declineFriendRequest(requestId);
      
      // Remove from list
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      onUpdate(friendRequests.length - 1);
      
    } catch (error) {
      console.error('Error declining friend request:', error);
      setError('Lỗi khi từ chối lời mời');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  // Format time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="friend-request-list loading">
        <div className="loading-spinner-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Đang tải lời mời kết bạn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-request-list">
      {/* Header */}
      <div className="friend-request-header">
        <h3>
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Lời mời kết bạn ({friendRequests.length})</span>
        </h3>
        <button 
          className="refresh-btn"
          onClick={loadFriendRequests}
          disabled={loading}
          title="Làm mới"
        >
          <FontAwesomeIcon icon={faRefresh} spin={loading} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faTimes} />
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Friend requests list */}
      {friendRequests.length === 0 ? (
        <div className="no-requests">
          <FontAwesomeIcon icon={faUsers} size="2x" />
          <p>Không có lời mời kết bạn nào</p>
        </div>
      ) : (
        <div className="requests-list">
          {friendRequests.map((request) => (
            <div key={request._id} className="request-item">
              {/* User info */}
              <div className="request-user">
                <img 
                  src={request.sender?.avatarUrl || 'https://via.placeholder.com/50'} 
                  alt={getDisplayName(request.sender)}
                  className="user-avatar"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/50';
                  }}
                />
                <div className="user-info">
                  <h4>{getDisplayName(request.sender)}</h4>
                  <p className="request-time">{getTimeAgo(request.createdAt)}</p>
                  {request.mutualFriends && (
                    <p className="mutual-friends">
                      {request.mutualFriends} bạn chung
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="request-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleAccept(request._id, request.sender._id)}
                  disabled={actionLoading[request._id]}
                  title="Chấp nhận lời mời"
                >
                  {actionLoading[request._id] === 'accepting' ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} />
                  )}
                  <span>Chấp nhận</span>
                </button>
                
                <button
                  className="btn-decline"
                  onClick={() => handleDecline(request._id)}
                  disabled={actionLoading[request._id]}
                  title="Từ chối lời mời"
                >
                  {actionLoading[request._id] === 'declining' ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faUserTimes} />
                  )}
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestList; 