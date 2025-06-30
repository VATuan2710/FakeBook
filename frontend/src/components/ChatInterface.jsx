import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSearch,
  faCircle,
  faEdit,
  faEllipsisH,
  faVideoCamera,
  faPhone
} from '@fortawesome/free-solid-svg-icons';
import { getFriends, getDisplayName, getOnlineStatus } from '../service/friendService';
import FacebookStyleChatbox from './FacebookStyleChatbox';
import './ChatInterface.css';

const ChatInterface = ({ currentUser, isOpen, onClose }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openChats, setOpenChats] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && currentUser && currentUser._id && isMounted) {
      fetchFriends();
    }
  }, [isOpen, currentUser, isMounted]);

  useEffect(() => {
    // Lọc bạn bè theo tìm kiếm - đảm bảo friends là array
    if (Array.isArray(friends)) {
      const filtered = friends.filter(friend => {
        try {
          return getDisplayName(friend).toLowerCase().includes(searchTerm.toLowerCase());
        } catch (error) {
          console.error('❌ Error with getDisplayName for friend:', friend, error);
          return false;
        }
      });
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends([]);
    }
  }, [friends, searchTerm]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await getFriends(currentUser._id);
      
      // Đảm bảo friendsData là array và có dữ liệu hợp lệ
      if (!isMounted) return; // Tránh update state khi component đã unmount
      
      if (Array.isArray(friendsData)) {
        setFriends(friendsData);
      } else if (friendsData && Array.isArray(friendsData.friends)) {
        // Trường hợp API trả về object chứa array friends
        setFriends(friendsData.friends);
      } else if (friendsData && Array.isArray(friendsData.data)) {
        // Trường hợp API trả về object chứa array data
        setFriends(friendsData.data);
      } else {
        console.warn('⚠️ API getFriends trả về dữ liệu không đúng format:', friendsData);
        setFriends([]);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy danh sách bạn bè:', error);
      if (isMounted) {
        setFriends([]);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleStartChat = (friend, event) => {
    // Ngăn event bubbling để không trigger close chat
    if (event) {
      event.stopPropagation();
    }
    
    console.log('🔥 handleStartChat được gọi với friend:', friend);
    
    // Kiểm tra xem chat đã mở chưa
    if (friend && friend._id) {
      const existingChat = openChats.find(chat => chat._id === friend._id);
      console.log('🔍 Existing chat:', existingChat);
      console.log('📋 Current openChats:', openChats);
      
      if (!existingChat) {
        console.log('✅ Thêm chat mới cho friend:', friend.displayName || friend.firstName);
        setOpenChats(prev => {
          const newChats = [...prev, friend];
          console.log('📋 New openChats:', newChats);
          return newChats;
        });
      } else {
        console.log('⚠️ Chat đã tồn tại, không thêm mới');
      }
      // Đóng chat interface sau khi mở chat với bạn bè
      console.log('🔒 Đóng chat interface');
      onClose();
    } else {
      console.error('❌ Friend hoặc friend._id không hợp lệ:', friend);
    }
  };

  const handleCloseChat = (friendId) => {
    setOpenChats(prev => prev.filter(chat => chat._id !== friendId));
  };

  const getOnlineIndicator = (friend) => {
    const status = getOnlineStatus(friend);
    return (
      <FontAwesomeIcon 
        icon={faCircle} 
        className={`online-indicator ${status}`}
      />
    );
  };

  if (!isOpen || !currentUser) return null;

  return (
    <>
      {/* Chat Interface Dropdown */}
      <div 
        className="chat-interface" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chat-header">
          <h3>Chat</h3>
          <div className="chat-header-actions">
            <FontAwesomeIcon icon={faEllipsisH} className="action-icon" />
            <FontAwesomeIcon icon={faVideoCamera} className="action-icon" />
            <FontAwesomeIcon icon={faEdit} className="action-icon" />
            <FontAwesomeIcon icon={faTimes} className="action-icon" onClick={onClose} />
          </div>
        </div>

        <div className="chat-search">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm trong Messenger"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="friends-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : Array.isArray(filteredFriends) && filteredFriends.length > 0 ? (
            filteredFriends.map(friend => {
              if (!friend || !friend._id) {
                return null;
              }
              
              return (
                <div
                  key={friend._id}
                  className="friend-item"
                  onClick={(e) => handleStartChat(friend, e)}
                >
                  <div className="friend-avatar">
                    <img 
                      src={friend.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYyZjUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5Ljc5IDEyIDggMTAuMjEgOCA4UzkuNzkgNDEyIDRTMTQuMjEgNiAxNiA4UzEyIDEwLjIxIDEyIDEyWk0xMiAxNEM2IDEzIDYgMTcgNiAxOFYyMEgxOFYxOEMxOCAxNyAxOCAxMyAxMiAxNFoiIGZpbGw9IiM2NTY3NmIiLz4KPHN2Zz4KPHN2Zz4='} 
                      alt={getDisplayName(friend)}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYyZjUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5Ljc5IDEyIDggMTAuMjEgOCA4UzkuNzkgNDEyIDRTMTQuMjEgNiAxNiA4UzEyIDEwLjIxIDEyIDEyWk0xMiAxNEM2IDEzIDYgMTcgNiAxOFYyMEgxOFYxOEMxOCAxNyAxOCAxMyAxMiAxNFoiIGZpbGw9IiM2NTY3NmIiLz4KPHN2Zz4KPHN2Zz4=';
                      }}
                    />
                    {getOnlineIndicator(friend)}
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">{getDisplayName(friend)}</div>
                    <div className="friend-status">
                      {getOnlineStatus(friend) === 'online' ? 'Đang hoạt động' : 
                       getOnlineStatus(friend) === 'recently' ? 'Hoạt động gần đây' : ''}
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)
          ) : (
            <div className="no-friends">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có bạn bè nào'}
            </div>
          )}
        </div>
      </div>

      {/* Chat Boxes */}
      {(() => {
        console.log('🎯 Đang render chatboxes với openChats:', openChats);
        console.log('📊 Số lượng chatboxes cần render:', openChats.length);
        return null;
      })()}
      {openChats.map((friend, index) => {
        console.log(`📦 Rendering chatbox ${index} cho friend:`, friend);
        return (
          <FacebookStyleChatbox
            key={friend._id}
            friend={friend}
            currentUser={currentUser}
            position={index}
            onClose={() => handleCloseChat(friend._id)}
          />
        );
      })}
    </>
  );
};

export default ChatInterface; 