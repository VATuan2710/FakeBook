import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { getMessages, sendMessage as sendMessageAPI } from '../service/chatService';
import socketService from '../service/socketService';
import moment from 'moment';
import './FacebookStyleChatbox.css';

const FacebookStyleChatbox = React.memo(({ friend, currentUser, position = 0, onClose }) => {
  // console.log('🚀 FacebookStyleChatbox mounted for:', { friend: friend?.firstName, currentUser: currentUser?.firstName, position });
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Memoize IDs
  const friendId = useMemo(() => friend?._id, [friend?._id]);
  const currentUserId = useMemo(() => currentUser?._id, [currentUser?._id]);

  // Socket realtime message handler - CHỈ trigger reload từ API
  const handleReceiveMessage = useCallback((messageData) => {
    console.log('📩 Received realtime notification:', messageData);
    
    // CHỈ xử lý notifications từ friend (không nhận từ chính mình)
    if (messageData && messageData.sender && messageData.sender._id === friendId) {
      console.log('🔄 Friend sent message, reloading from API...');
      
      // Reload messages từ API để có real data
      const reloadMessages = async () => {
        try {
          const result = await getMessages(currentUserId, friendId);
          if (result && result.messages) {
            console.log('✅ Reloaded', result.messages.length, 'messages after notification');
            setMessages(result.messages);
          }
        } catch (error) {
          console.error('❌ Error reloading messages:', error);
        }
      };
      
      reloadMessages();
    } else if (messageData && messageData.sender && messageData.sender._id === currentUserId) {
      console.log('🔇 Ignoring my own message notification (already have from API)');
    }
  }, [friendId, currentUserId]);

  // Load messages từ API + Setup socket - CHỈ 1 LẦN
  useEffect(() => {
    if (!friendId || !currentUserId) return;
    
    // console.log('🔌 Setting up chat for:', friendId);

    // Load messages từ database
    const loadMessages = async () => {
      try {
        setLoading(true);
        // console.log('📥 Loading messages from API...');
        
        const result = await getMessages(currentUserId, friendId);
        
        if (result && result.messages) {
          // console.log('✅ Loaded', result.messages.length, 'messages from database');
          setMessages(result.messages);
        } else {
          console.log('⚠️ No messages found');
          setMessages([]);
        }
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    // Setup socket cho realtime - SỬ DỤNG SOCKET TRỰC TIẾP
    const setupSocket = () => {
      if (socketService.isConnectedToSocket()) {
        // console.log('🔌 Setting up direct socket listeners');
        
        // Remove existing listeners trước khi add mới
        socketService.socket.off('receive_message', handleReceiveMessage);
        
        // Add listener trực tiếp
        socketService.socket.on('receive_message', handleReceiveMessage);
      }
    };

    loadMessages();
    setupSocket();

    return () => {
      // console.log('🧹 Cleanup for:', friendId);
      // Remove listener trực tiếp
      if (socketService.socket) {
        socketService.socket.off('receive_message', handleReceiveMessage);
      }
    };
  }, [friendId, currentUserId, handleReceiveMessage]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug
  // useEffect(() => {
  //   console.log('📊 Messages count:', messages.length);
  // }, [messages]);

  // Send message function - ĐƠN GIẢN CHỈ API + SOCKET NOTIFICATION
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      console.log('🚀 Sending message:', messageText);

      // 1. GỬI VIA API để save vào database
      const savedMessage = await sendMessageAPI(currentUserId, friendId, messageText);
      console.log('✅ API saved message:', savedMessage);

      // 2. THÊM message vào UI ngay lập tức (cho sender)
      setMessages(prev => {
        // Check duplicate
        const exists = prev.some(m => m._id === savedMessage._id);
        if (exists) {
          console.log('⚠️ Message already exists, not adding duplicate');
          return prev;
        }
        
        const newMessages = [...prev, savedMessage];
        return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      // 3. GỬI NOTIFICATION via socket để receiver reload
      if (socketService.isConnectedToSocket()) {
        socketService.sendMessage({
          sender: currentUserId,
          receiver: friendId,
          message: messageText,
          _id: savedMessage._id // Gửi kèm real ID
        });
      }

      // Focus input
      inputRef.current?.focus();

    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message if failed
      setNewMessage(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return moment(date).format('HH:mm');
  };

  const renderMessage = (message, index) => {
    if (!message?._id || !message?.sender) return null;

    const isOwn = message.sender._id === currentUserId;
    const showTime = index === messages.length - 1 || 
                     (messages[index + 1] && moment(messages[index + 1].createdAt).diff(moment(message.createdAt), 'minutes') > 5);

    return (
      <div key={message._id} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
          <span className="message-text">{message.message || message.content?.text || ''}</span>
          {showTime && (
            <div className="message-time">{formatTime(message.createdAt)}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`facebook-chatbox ${isMinimized ? 'minimized' : ''}`} 
      style={{
        position: 'fixed',
        bottom: '0',
        right: `${80 + (position * 330)}px`,
        zIndex: 999999,
        width: '328px',
        height: 'auto',
        maxHeight: '445px',
        backgroundColor: '#fff',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="chatbox-header">
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
          <FontAwesomeIcon 
            icon={faTimes} 
            className="action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onClose(friendId);
            }} 
          />
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="chatbox-messages">
            {loading ? (
              <div className="loading-messages">Đang tải tin nhắn...</div>
            ) : (
              messages.map((message, index) => renderMessage(message, index))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbox-input">
            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Aa"
                className="message-input"
              />
              <div className="input-actions">
                {newMessage.trim() ? (
                  <FontAwesomeIcon 
                    icon={faPaperPlane} 
                    className="send-btn" 
                    onClick={sendMessage}
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
}, (prevProps, nextProps) => {
  // Proper comparison để tránh re-render không cần thiết
  return (
    prevProps.friend?._id === nextProps.friend?._id &&
    prevProps.currentUser?._id === nextProps.currentUser?._id &&
    prevProps.position === nextProps.position
    // onClose không cần compare vì đã memoize trong Header
  );
});

export default FacebookStyleChatbox;