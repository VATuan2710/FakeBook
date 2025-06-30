import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faUsers,
  faSpinner,
  faRefresh,
  faSearch,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { searchUsers, getDisplayName } from '../service/friendService';
import { getAllUsers } from '../service/userService';
import { getUserInfo } from '../service/authService';
import FriendRequestButton from './FriendRequestButton';

const PeopleYouMayKnow = ({ 
  maxUsers = 6,
  showSearch = true,
  title = "Những người bạn có thể biết"
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [showingSearch, setShowingSearch] = useState(false);

  // Load suggested users
  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userInfo = await getUserInfo();
      setCurrentUser(userInfo);
      
      if (userInfo) {
        // Get all users and filter out current user and friends
        const allUsersData = await getAllUsers();
        const filteredUsers = allUsersData.users
          ?.filter(user => 
            user._id !== userInfo._id && 
            !userInfo.friends?.includes(user._id)
          )
          .slice(0, maxUsers) || [];
        
        setSuggestedUsers(filteredUsers);
      }
    } catch (error) {
      setError('Không thể tải gợi ý kết bạn');
      console.error('Error loading suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowingSearch(false);
      return;
    }

    try {
      setSearchLoading(true);
      setShowingSearch(true);
      
      const data = await searchUsers(query, currentUser._id);
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Lỗi khi tìm kiếm người dùng');
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowingSearch(false);
  };

  // Handle friend request status change
  const handleStatusChange = (newStatus, result) => {
    // Refresh suggestions if someone became a friend
    if (newStatus === 'friends') {
      loadSuggestedUsers();
    }
  };

  useEffect(() => {
    loadSuggestedUsers();
  }, [maxUsers]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentUser) {
        handleSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, currentUser]);

  const usersToShow = showingSearch ? searchResults : suggestedUsers;

  return (
    <div className="people-you-may-know">
      {/* Header */}
      <div className="pymk-header">
        <h3>
          <FontAwesomeIcon icon={faUsers} />
          {title}
        </h3>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={loadSuggestedUsers}
          disabled={loading}
          title="Làm mới"
        >
          <FontAwesomeIcon icon={faRefresh} spin={loading} />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="search-section">
          <div className="search-input-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={clearSearch}
                title="Xóa tìm kiếm"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
          
          {showingSearch && (
            <div className="search-status">
              {searchLoading ? (
                <span><FontAwesomeIcon icon={faSpinner} spin /> Đang tìm kiếm...</span>
              ) : (
                <span>Kết quả cho "{searchQuery}" ({searchResults.length})</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Đang tải...</span>
        </div>
      ) : usersToShow.length === 0 ? (
        <div className="no-users">
          <FontAwesomeIcon icon={faUsers} size="2x" />
          <p>
            {showingSearch 
              ? 'Không tìm thấy người dùng nào'
              : 'Không có gợi ý kết bạn'
            }
          </p>
        </div>
      ) : (
        <div className="users-grid">
          {usersToShow.map((user) => (
            <div key={user._id} className="user-card">
              {/* User avatar */}
              <div className="user-avatar-container">
                <img 
                  src={user.avatarUrl} 
                  alt={getDisplayName(user)}
                  className="user-avatar"
                />
              </div>
              
              {/* User info */}
              <div className="user-info">
                <h4 className="user-name">{getDisplayName(user)}</h4>
                <p className="user-username">@{user.username}</p>
              </div>
              
              {/* Friend request button */}
              <div className="user-actions">
                <FriendRequestButton 
                  targetUserId={user._id}
                  size="sm"
                  showText={false}
                  onStatusChange={handleStatusChange}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .people-you-may-know {
          background: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .pymk-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-4);
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
        }

        .pymk-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          font-size: var(--font-size-lg);
          color: var(--gray-800);
        }

        .search-section {
          padding: var(--spacing-4);
          border-bottom: 1px solid var(--gray-100);
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--gray-400);
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: var(--spacing-2) var(--spacing-3) var(--spacing-2) 40px;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 2px var(--primary-blue-light);
        }

        .clear-search {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }

        .clear-search:hover {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        .search-status {
          margin-top: var(--spacing-2);
          font-size: var(--font-size-sm);
          color: var(--gray-500);
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-2);
          padding: var(--spacing-6);
          color: var(--gray-500);
        }

        .error-message {
          padding: var(--spacing-3);
          background: var(--danger-red);
          color: var(--white);
          text-align: center;
          font-size: var(--font-size-sm);
        }

        .no-users {
          text-align: center;
          padding: var(--spacing-8);
          color: var(--gray-500);
        }

        .no-users p {
          margin: var(--spacing-3) 0 0 0;
          font-size: var(--font-size-base);
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--spacing-3);
          padding: var(--spacing-4);
        }

        .user-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-4);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-blue-light);
        }

        .user-avatar-container {
          margin-bottom: var(--spacing-3);
        }

        .user-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--white);
          box-shadow: var(--shadow-sm);
        }

        .user-info {
          text-align: center;
          margin-bottom: var(--spacing-3);
          flex: 1;
        }

        .user-name {
          margin: 0 0 var(--spacing-1) 0;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--gray-800);
        }

        .user-username {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--gray-500);
        }

        .user-actions {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .users-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: var(--spacing-2);
            padding: var(--spacing-3);
          }

          .user-avatar {
            width: 60px;
            height: 60px;
          }

          .user-card {
            padding: var(--spacing-3);
          }
        }

        /* Dark mode styles */
        [data-theme="dark"] .people-you-may-know {
          background: var(--gray-800);
          border: 1px solid var(--gray-700);
        }

        [data-theme="dark"] .pymk-header {
          background: var(--gray-700);
          border-bottom-color: var(--gray-600);
        }

        [data-theme="dark"] .pymk-header h3 {
          color: var(--gray-100);
        }

        [data-theme="dark"] .search-section {
          border-bottom-color: var(--gray-700);
        }

        [data-theme="dark"] .search-input {
          background: var(--gray-700);
          border-color: var(--gray-600);
          color: var(--gray-200);
        }

        [data-theme="dark"] .search-input:focus {
          border-color: var(--primary-blue);
          background: var(--gray-600);
        }

        [data-theme="dark"] .search-status {
          color: var(--gray-400);
        }

        [data-theme="dark"] .user-card {
          background: var(--gray-700);
          border-color: var(--gray-600);
        }

        [data-theme="dark"] .user-card:hover {
          background: var(--gray-600);
          border-color: var(--primary-blue);
        }

        [data-theme="dark"] .user-name {
          color: var(--gray-100);
        }

        [data-theme="dark"] .user-username {
          color: var(--gray-400);
        }

        [data-theme="dark"] .no-users {
          color: var(--gray-400);
        }

        [data-theme="dark"] .loading-spinner {
          color: var(--gray-400);
        }
      `}</style>
    </div>
  );
};

export default PeopleYouMayKnow; 