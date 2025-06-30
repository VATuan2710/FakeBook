import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faMinus,
  faPhone,
  faVideoCamera,
  faInfo,
  faPaperPlane,
  faImage,
  faSmile,
  faThumbsUp,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import { getDisplayName, getOnlineStatus } from '../service/friendService';
import { getMessages } from '../service/chatService';
import socketService from '../service/socketService';
import moment from 'moment';
import './FacebookStyleChatbox.css';

const FacebookStyleChatbox = ({ friend, currentUser, position = 0, onClose }) => {
  console.log('🚀 FacebookStyleChatbox được mount với:', { friend, currentUser, position });
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (friend && currentUser) {
      initializeChat();
      setupSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [friend, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      // Lấy tin nhắn thật từ API
      const messages = await getMessages(currentUser._id, friend._id);
      setMessages(messages || []);
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error);
      // Fallback to empty messages if API fails
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (socketService.isConnectedToSocket()) {
      socketService.addEventListener('receive_message', handleReceiveMessage);
      socketService.addEventListener('user_typing', handleUserTyping);
    }
  };

  const cleanupSocketListeners = () => {
    socketService.removeEventListener('receive_message', handleReceiveMessage);
    socketService.removeEventListener('user_typing', handleUserTyping);
  };

  const handleReceiveMessage = (messageData) => {
    if (messageData && messageData.sender === friend._id) {
      setMessages(prev => Array.isArray(prev) ? [...prev, messageData] : [messageData]);
    }
  };

  const handleUserTyping = (data) => {
    if (data.userId === friend._id) {
      setIsTyping(data.isTyping);
      if (data.isTyping) {
        setTimeout(() => setIsTyping(false), 3000);
      }
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser || !friend) return;

    const messageData = {
      _id: Date.now().toString(),
      sender: currentUser,
      receiver: friend,
      message: newMessage.trim(),
      createdAt: new Date(),
      readBy: []
    };

    // Thêm tin nhắn vào UI ngay lập tức
    setMessages(prev => Array.isArray(prev) ? [...prev, messageData] : [messageData]);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    // Gửi tin nhắn qua socket
    try {
      if (socketService.isConnectedToSocket()) {
        socketService.sendMessage({
          sender: currentUser._id,
          receiver: friend._id,
          message: messageToSend
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn qua socket:', error);
    }

    // Focus lại input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return moment(date).format('HH:mm');
  };

  const renderMessage = (message, index) => {
    if (!message || !message._id || !message.sender) {
      return null;
    }

    const isOwn = message.sender._id === currentUser._id;
    const showAvatar = !isOwn && (index === 0 || 
      (messages[index - 1] && messages[index - 1].sender && messages[index - 1].sender._id !== message.sender._id));
    const showTime = index === messages.length - 1 || 
                     (messages[index + 1] && messages[index + 1].sender && messages[index + 1].sender._id !== message.sender._id) ||
                     (messages[index + 1] && moment(messages[index + 1].createdAt).diff(moment(message.createdAt), 'minutes') > 5);

    return (
      <div key={message._id} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
        {showAvatar && !isOwn && (
          <img 
            src={message.sender.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYyZjUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5Ljc5IDEyIDggMTAuMjEgOCA4UzkuNzkgNDEyIDRTMTQuMjEgNiAxNiA4UzEyIDEwLjIxIDEyIDEyWk0xMiAxNEM2IDEzIDYgMTcgNiAxOFYyMEgxOFYxOEMxOCAxNyAxOCAxMyAxMiAxNFoiIGZpbGw9IiM2NTY3NmIiLz4KPHN2Zz4KPHN2Zz4='} 
            alt={getDisplayName(message.sender)}
            className="message-avatar"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYyZjUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5Ljc5IDEyIDggMTAuMjEgOCA4UzkuNzkgNDEyIDRTMTQuMjEgNiAxNiA4UzEyIDEwLjIxIDEyIDEyWk0xMiAxNEM2IDEzIDYgMTcgNiAxOFYyMEgxOFYxOEMxOCAxNyAxOCAxMyAxMiAxNFoiIGZpbGw9IiM2NTY3NmIiLz4KPHN2Zz4KPHN2Zz4=';
            }}
          />
        )}
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
          <span className="message-text">{message.message || ''}</span>
          {showTime && (
            <div className="message-time">{formatTime(message.createdAt)}</div>
          )}
        </div>
      </div>
    );
  };

  const chatStyle = {
    position: 'fixed',
    bottom: '0',
    right: `${80 + (position * 330)}px`,
    zIndex: 999999,
    width: '328px',
    height: 'auto',
    maxHeight: '445px',
    backgroundColor: '#fff',
    borderRadius: '8px 8px 0 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)'
  };

  console.log('🎨 Rendering FacebookStyleChatbox với style:', chatStyle);
  console.log('👤 Friend name:', getDisplayName(friend));

  return (
    <div 
      className={`facebook-chatbox ${isMinimized ? 'minimized' : ''}`} 
      style={chatStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Chat Header */}
              <div 
          className="chatbox-header" 
          onClick={(e) => {
            // Chỉ toggle minimize nếu không click vào action buttons
            if (!e.target.closest('.action-btn')) {
              setIsMinimized(!isMinimized);
            }
          }}
        >
        <div className="header-info">
          <div className="header-avatar">
            <img 
              src={friend.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYyZjUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5Ljc5IDEyIDggMTAuMjEgOCA4UzkuNzkgNDEyIDRTMTQuMjEgNiAxNiA4UzEyIDEwLjIxIDEyIDEyWk0xMiAxNEM2IDEzIDYgMTcgNiAxOFYyMEgxOFYxOEMxOCAxNyAxOCAxMyAxMiAxNFoiIGZpbGw9IiM2NTY3NmIiLz4KPHN2Zz4KPHN2Zz4='} 
              alt={getDisplayName(friend)}
            />
            <FontAwesomeIcon 
              icon={faCircle} 
              className={`online-status ${getOnlineStatus(friend)}`}
            />
          </div>
          <div className="header-text">
            <div className="friend-name">{getDisplayName(friend)}</div>
            <div className="activity-status">
              {getOnlineStatus(friend) === 'online' ? 'Đang hoạt động' : ''}
            </div>
          </div>
        </div>
        <div className="header-actions">
                      <FontAwesomeIcon icon={faPhone} className="action-btn" title="Bắt đầu gọi thoại" />
          <FontAwesomeIcon icon={faVideoCamera} className="action-btn" title="Bắt đầu gọi video" />
          <FontAwesomeIcon icon={faMinus} className="action-btn" title="Thu nhỏ đoạn chat" />
          <FontAwesomeIcon 
            icon={faTimes} 
            className="action-btn" 
            title="Đóng đoạn chat"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
          />
        </div>
      </div>

      {/* Chat Body */}
      {!isMinimized && (
        <>
          <div className="chatbox-messages">
            {loading ? (
              <div className="loading-messages">Đang tải tin nhắn...</div>
            ) : (
              <>
                {Array.isArray(messages) && messages.map((message, index) => 
                  renderMessage(message, index)
                ).filter(Boolean)}
                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>{getDisplayName(friend)} đang soạn tin nhắn...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="chatbox-input">
            <div className="input-wrapper">
                              <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Aa"
                  className="message-input"
                />
              <div className="input-actions">
                <FontAwesomeIcon icon={faImage} className="input-action" />
                <FontAwesomeIcon icon={faSmile} className="input-action" />
                {newMessage.trim() ? (
                  <FontAwesomeIcon 
                    icon={faPaperPlane} 
                    className="send-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendMessage();
                    }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faThumbsUp} className="like-btn" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacebookStyleChatbox; 