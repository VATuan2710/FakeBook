import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUser,
  faHeart,
  faComment,
  faShare,
  faUsers,
  faCalendar,
  faGift,
  faVideo,
  faImages,
  faTimes,
  faCheck,
  faEllipsisH,
  faUserPlus,
  faUserMinus,
  faBirthdayCake,
  faMapMarkerAlt,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { 
  getReceivedFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getDisplayName
} from '../service/friendService';
import { getUserInfo } from '../service/authService';
import socketService from '../service/socketService';
import FriendRequestList from './FriendRequestList';
import '../assets/css/NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user info and notifications
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userInfo = await getUserInfo();
        setCurrentUser(userInfo);
        
        if (userInfo) {
          await loadFriendRequests(userInfo._id);
          await loadNotifications();
        }
      } catch (error) {
        setError('Lỗi khi tải thông báo');
        console.error('Error loading notification data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // 🔔 Setup real-time socket listeners
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    // Listen for real-time notifications
    const handleNewFriendRequest = (data) => {
      console.log('🔔 Real-time friend request:', data);
      
      // Add to friend requests list
      setFriendRequests(prev => [data, ...prev]);
      setFriendRequestCount(prev => prev + 1);
      
      // Add to notifications list
      const notification = {
        _id: data._id,
        type: 'friend_request',
        fromUser: data.fromUser,
        message: data.message,
        createdAt: new Date(data.createdAt),
        isRead: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleFriendRequestStatus = (data) => {
      console.log('🎉 Friend request status:', data);
      
      // Add status notification
      const notification = {
        _id: `status_${Date.now()}`,
        type: data.type,
        fromUser: data.fromUser,
        message: data.message,
        createdAt: new Date(data.createdAt),
        isRead: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleNewNotification = (data) => {
      console.log('🔔 New notification:', data);
      
      const notification = {
        _id: data._id,
        type: data.type,
        fromUser: data.fromUser,
        message: data.message,
        actionData: data.actionData,
        createdAt: new Date(data.createdAt),
        isRead: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Add socket listeners
    socketService.addEventListener('new_friend_request', handleNewFriendRequest);
    socketService.addEventListener('friend_request_status', handleFriendRequestStatus);
    socketService.addEventListener('new_notification', handleNewNotification);

    // Cleanup
    return () => {
      socketService.removeEventListener('new_friend_request', handleNewFriendRequest);
      socketService.removeEventListener('friend_request_status', handleFriendRequestStatus);
      socketService.removeEventListener('new_notification', handleNewNotification);
    };
  }, [isOpen, currentUser]);

  // Load friend requests
  const loadFriendRequests = async (userId) => {
    try {
      const data = await getReceivedFriendRequests(userId);
      setFriendRequests(data.friendRequests || []);
      setFriendRequestCount(data.count || 0);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  // Load notifications (mock for now - can be replaced with real API)
  const loadNotifications = async () => {
    // Mock notifications data - replace with real API call
    const mockNotifications = [
      {
        _id: 'notif2',
        type: 'post_like',
        fromUser: {
          _id: 'user2',
          displayName: 'Trần Thị B',
          avatarUrl: 'https://via.placeholder.com/50'
        },
        message: 'đã thích bài viết của bạn',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
        actionData: { postId: 'post1' },
        relatedMedia: 'https://via.placeholder.com/60x60'
      },
      {
        _id: 'notif3',
        type: 'post_comment',
        fromUser: {
          _id: 'user3',
          displayName: 'Lê Văn C',
          avatarUrl: 'https://via.placeholder.com/50'
        },
        message: 'đã bình luận về bài viết của bạn',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: true,
        actionData: { postId: 'post2', commentId: 'comment1' }
      },
      {
        _id: 'notif4',
        type: 'group_invite',
        fromUser: {
          _id: 'user4',
          displayName: 'Phạm Thị D',
          avatarUrl: 'https://via.placeholder.com/50'
        },
        message: 'đã mời bạn tham gia nhóm "React Developers Vietnam"',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isRead: false,
        actionData: { groupId: 'group1' }
      },
      {
        _id: 'notif5',
        type: 'birthday',
        fromUser: {
          _id: 'user5',
          displayName: 'Nguyễn Văn E',
          avatarUrl: 'https://via.placeholder.com/50'
        },
        message: 'hôm nay sinh nhật',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isRead: false,
        actionData: { birthday: true }
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      friend_request: faUserPlus,
      friend_accepted: faCheck,
      post_like: faHeart,
      post_comment: faComment,
      post_share: faShare,
      group_invite: faUsers,
      event_invite: faCalendar,
      birthday: faBirthdayCake,
      video: faVideo,
      photo: faImages,
      gift: faGift,
      location: faMapMarkerAlt
    };
    return iconMap[type] || faBell;
  };

  // Get notification color
  const getNotificationColor = (type) => {
    const colorMap = {
      friend_request: '#1877f2',
      friend_accepted: '#42b883',
      post_like: '#e74c3c',
      post_comment: '#3498db',
      post_share: '#9b59b6',
      group_invite: '#f39c12',
      event_invite: '#e67e22',
      birthday: '#e91e63',
      video: '#ff5722',
      photo: '#4caf50',
      gift: '#ff9800',
      location: '#795548'
    };
    return colorMap[type] || '#6c757d';
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    return `${days} ngày`;
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
  };

  // Handle notification action
  const handleNotificationAction = (notification, action) => {
    switch (action) {
      case 'view':
        if (!notification.isRead) {
          markAsRead(notification._id);
        }
        
        // Handle different notification types
        switch (notification.type) {
          case 'friend_request':
            setFilter('requests');
            break;
          case 'post_like':
          case 'post_comment':
            if (notification.actionData?.postId) {
              console.log('Navigate to post:', notification.actionData.postId);
            }
            break;
          default:
            console.log('Notification clicked:', notification);
        }
        break;
      case 'delete':
        deleteNotification(notification._id);
        break;
    }
  };

  // Handle friend request update
  const handleFriendRequestUpdate = (newCount) => {
    setFriendRequestCount(newCount);
  };

  // Get filtered items
  const getFilteredItems = () => {
    switch (filter) {
      case 'requests':
        return friendRequests;
      case 'unread':
        return notifications.filter(notif => !notif.isRead);
      default:
        return notifications;
    }
  };

  // Get total unread count
  const getTotalUnreadCount = () => {
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    return unreadNotifications + friendRequestCount;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-header">
          <h2>Thông báo</h2>
          <div className="header-actions">
            <button className="btn-mark-read" onClick={markAllAsRead}>
              <FontAwesomeIcon icon={faCheck} />
              Đánh dấu đã đọc
            </button>
            <button className="close-btn" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="notification-filters">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <FontAwesomeIcon icon={faBell} />
            <span>Tất cả ({notifications.length})</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Chưa đọc ({notifications.filter(n => !n.isRead).length})</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'requests' ? 'active' : ''}`}
            onClick={() => setFilter('requests')}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Lời mời ({friendRequestCount})</span>
          </button>
        </div>

        {/* Content */}
        <div className="notification-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải thông báo...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Thử lại</button>
            </div>
          ) : filter === 'requests' ? (
            <FriendRequestList onUpdate={handleFriendRequestUpdate} />
          ) : (
            <div className="notifications-list">
              {getFilteredItems().length === 0 ? (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faBell} size="3x" />
                  <p>
                    {filter === 'unread' 
                      ? 'Không có thông báo chưa đọc'
                      : 'Không có thông báo nào'
                    }
                  </p>
                </div>
              ) : (
                getFilteredItems().map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationAction(notification, 'view')}
                  >
                    <div className="notification-avatar">
                      <img 
                        src={notification.fromUser?.avatarUrl || 'https://via.placeholder.com/50'} 
                        alt={notification.fromUser?.displayName || 'User'}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                      <div 
                        className="notification-type-icon"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                      >
                        <FontAwesomeIcon icon={getNotificationIcon(notification.type)} />
                      </div>
                    </div>

                    <div className="notification-content-item">
                      <div className="notification-text">
                        <span className="user-name">
                          {notification.fromUser?.displayName || 'Người dùng'}
                        </span>
                        <span className="notification-message"> {notification.message}</span>
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.isRead && <div className="unread-dot"></div>}
                      </div>
                    </div>

                    {notification.relatedMedia && (
                      <div className="notification-media">
                        <img 
                          src={notification.relatedMedia} 
                          alt="Related content"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="notification-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        title="Xóa thông báo"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 