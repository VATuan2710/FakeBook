import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faUserCheck, 
  faUserTimes, 
  faUsers,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { 
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  checkFriendship,
  getFriendButtonConfig
} from '../service/friendService';
import { getUserInfo } from '../service/authService';

const FriendRequestButton = ({ 
  targetUserId, 
  onStatusChange = () => {},
  size = 'md',
  showText = true 
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('none'); // none, friends, sent, received
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user info and check friendship status
  useEffect(() => {
    const loadData = async () => {
      try {
        const userInfo = await getUserInfo();
        setCurrentUser(userInfo);
        
        if (userInfo && targetUserId && userInfo._id !== targetUserId) {
          const statusData = await checkFriendship(userInfo._id, targetUserId);
          setFriendshipStatus(statusData.status);
          setRequestId(statusData.requestId);
        }
      } catch (error) {
        console.error('Error loading friendship status:', error);
      }
    };

    loadData();
  }, [targetUserId]);

  // Handle friend request actions
  const handleAction = async (action) => {
    if (!currentUser || loading) return;

    setLoading(true);
    setError('');

    try {
      let result = {};
      
      switch (action) {
        case 'send':
          result = await sendFriendRequest(currentUser._id, targetUserId);
          setFriendshipStatus('sent');
          break;
          
        case 'cancel':
          result = await cancelFriendRequest(currentUser._id, targetUserId);
          setFriendshipStatus('none');
          setRequestId(null);
          break;
          
        case 'accept':
          result = await acceptFriendRequest(requestId);
          setFriendshipStatus('friends');
          setRequestId(null);
          break;
          
        case 'decline':
          result = await declineFriendRequest(requestId);
          setFriendshipStatus('none');
          setRequestId(null);
          break;
          
        case 'remove':
          result = await removeFriend(currentUser._id, targetUserId);
          setFriendshipStatus('none');
          break;
          
        default:
          throw new Error('Invalid action');
      }

      // Notify parent component
      onStatusChange(friendshipStatus, result);
      
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra');
      console.error('Friend action error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if same user
  if (!currentUser || !targetUserId || currentUser._id === targetUserId) {
    return null;
  }

  // Get button configuration
  const getButtonConfig = () => {
    const baseConfig = getFriendButtonConfig(friendshipStatus);
    
    switch (friendshipStatus) {
      case 'friends':
        return {
          text: showText ? 'Bạn bè' : '',
          icon: faUsers,
          className: `btn btn-success ${size === 'sm' ? 'btn-sm' : ''}`,
          onClick: () => handleAction('remove'),
          dropdown: true
        };
        
      case 'sent':
        return {
          text: showText ? 'Đã gửi lời mời' : '',
          icon: faUserCheck,
          className: `btn btn-secondary ${size === 'sm' ? 'btn-sm' : ''}`,
          onClick: () => handleAction('cancel'),
          disabled: true
        };
        
      case 'received':
        return {
          text: showText ? 'Chấp nhận' : '',
          icon: faUserPlus,
          className: `btn btn-primary ${size === 'sm' ? 'btn-sm' : ''}`,
          onClick: () => handleAction('accept'),
          showDecline: true
        };
        
      case 'none':
      default:
        return {
          text: showText ? 'Kết bạn' : '',
          icon: faUserPlus,
          className: `btn btn-primary ${size === 'sm' ? 'btn-sm' : ''}`,
          onClick: () => handleAction('send')
        };
    }
  };

  const config = getButtonConfig();

  return (
    <div className="friend-request-button">
      {/* Error message */}
      {error && (
        <div className="error-message" style={{ fontSize: '12px', color: 'red', marginBottom: '5px' }}>
          {error}
        </div>
      )}

      <div className="button-group">
        {/* Main button */}
        <button
          className={config.className}
          onClick={config.onClick}
          disabled={loading || config.disabled}
          title={config.text}
        >
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={config.icon} />
          )}
          {config.text && <span style={{ marginLeft: '8px' }}>{config.text}</span>}
        </button>

        {/* Decline button for received requests */}
        {config.showDecline && (
          <button
            className={`btn btn-ghost ${size === 'sm' ? 'btn-sm' : ''}`}
            onClick={() => handleAction('decline')}
            disabled={loading}
            title="Từ chối"
            style={{ marginLeft: '8px' }}
          >
            <FontAwesomeIcon icon={faUserTimes} />
            {showText && <span style={{ marginLeft: '8px' }}>Từ chối</span>}
          </button>
        )}

        {/* Friends dropdown menu */}
        {config.dropdown && (
          <div className="friend-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className={`btn btn-ghost ${size === 'sm' ? 'btn-sm' : ''}`}
              onClick={() => {/* Toggle dropdown */}}
              style={{ marginLeft: '8px' }}
            >
              ▼
            </button>
            {/* Dropdown content can be added here */}
          </div>
        )}
      </div>

      <style jsx>{`
        .friend-request-button {
          display: inline-block;
        }
        
        .button-group {
          display: flex;
          align-items: center;
        }
        
        .error-message {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FriendRequestButton; 