import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faImage,
  faVideo,
  faFile,
  faSmile,
  faEllipsisV,
  faPhone,
  faVideoCamera,
  faTimes,
  faPlus,
  faUsers,
  faReply,
  faForward,
  faTrash,
  faHeart,
  faThumbsUp,
  faLaugh,
  faSurprise,
  faSadTear,
  faAngry
} from "@fortawesome/free-solid-svg-icons";

const EnhancedChatbox = ({ conversation, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState([]);
  const [showReactions, setShowReactions] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockMessages = [
      {
        _id: 'msg1',
        sender: conversation.participants.find(p => p._id !== currentUser._id),
        content: {
          type: 'text',
          text: 'Hey! Bạn có khỏe không?'
        },
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        readBy: [],
        reactions: [
          { user: currentUser._id, type: 'like' }
        ]
      },
      {
        _id: 'msg2',
        sender: currentUser,
        content: {
          type: 'text',
          text: 'Tôi khỏe! Cảm ơn bạn đã hỏi 😊'
        },
        createdAt: new Date(Date.now() - 8 * 60 * 1000),
        readBy: conversation.participants.map(p => p._id),
        reactions: []
      },
      {
        _id: 'msg3',
        sender: conversation.participants.find(p => p._id !== currentUser._id),
        content: {
          type: 'image',
          media: {
            url: 'https://via.placeholder.com/300x200',
            thumbnail: 'https://via.placeholder.com/300x200'
          }
        },
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        readBy: [],
        reactions: [
          { user: currentUser._id, type: 'love' }
        ]
      }
    ];
    setMessages(mockMessages);
  }, [conversation, currentUser]);

  const reactions = [
    { type: 'like', icon: faThumbsUp, emoji: '👍', color: '#1877f2' },
    { type: 'love', icon: faHeart, emoji: '❤️', color: '#f33e58' },
    { type: 'haha', icon: faLaugh, emoji: '😂', color: '#f7b125' },
    { type: 'wow', icon: faSurprise, emoji: '😮', color: '#f7b125' },
    { type: 'sad', icon: faSadTear, emoji: '😢', color: '#f7b125' },
    { type: 'angry', icon: faAngry, emoji: '😡', color: '#e74c3c' }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      _id: Date.now().toString(),
      sender: currentUser,
      content: {
        type: 'text',
        text: newMessage
      },
      createdAt: new Date(),
      readBy: [currentUser._id],
      reactions: [],
      replyTo: replyingTo
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    setReplyingTo(null);
    
    // Scroll to bottom
    setTimeout(() => {
      chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, 100);
  };

  const handleReaction = (messageId, reactionType) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        const existingReaction = msg.reactions.find(r => r.user === currentUser._id);
        let newReactions = [...msg.reactions];
        
        if (existingReaction) {
          if (existingReaction.type === reactionType) {
            // Remove reaction
            newReactions = newReactions.filter(r => r.user !== currentUser._id);
          } else {
            // Update reaction
            newReactions = newReactions.map(r => 
              r.user === currentUser._id ? { ...r, type: reactionType } : r
            );
          }
        } else {
          // Add new reaction
          newReactions.push({ user: currentUser._id, type: reactionType });
        }
        
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
    setShowReactions(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'file';

    const message = {
      _id: Date.now().toString(),
      sender: currentUser,
      content: {
        type: fileType,
        media: {
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        }
      },
      createdAt: new Date(),
      readBy: [currentUser._id],
      reactions: []
    };

    setMessages(prev => [...prev, message]);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const renderMessage = (message) => {
    const isOwn = message.sender._id === currentUser._id;
    const hasReactions = message.reactions.length > 0;

    return (
      <div
        key={message._id}
        className={`message ${isOwn ? 'own' : 'other'}`}
      >
        {!isOwn && (
          <img
            src={message.sender.avatarUrl}
            alt={message.sender.displayName}
            className="avatar avatar-sm"
          />
        )}
        
        <div className="message-content">
          {message.replyTo && (
            <div className="reply-indicator">
              <FontAwesomeIcon icon={faReply} />
              <span>Trả lời</span>
            </div>
          )}
          
          <div
            className={`message-bubble ${isOwn ? 'own' : 'other'}`}
            onDoubleClick={() => setShowReactions(message._id)}
          >
            {message.content.type === 'text' && (
              <p>{message.content.text}</p>
            )}
            
            {message.content.type === 'image' && (
              <img
                src={message.content.media.url}
                alt="Shared image"
                className="message-image"
              />
            )}
            
            {message.content.type === 'video' && (
              <video
                src={message.content.media.url}
                controls
                className="message-video"
              />
            )}
            
            {message.content.type === 'file' && (
              <div className="message-file">
                <FontAwesomeIcon icon={faFile} />
                <span>{message.content.media.name}</span>
              </div>
            )}
            
            <span className="message-time">{formatTime(message.createdAt)}</span>
          </div>
          
          {hasReactions && (
            <div className="message-reactions">
              {reactions
                .filter(r => message.reactions.some(mr => mr.type === r.type))
                .map(reaction => {
                  const count = message.reactions.filter(mr => mr.type === reaction.type).length;
                  return (
                    <span
                      key={reaction.type}
                      className="reaction-count"
                      style={{ color: reaction.color }}
                    >
                      {reaction.emoji} {count}
                    </span>
                  );
                })}
            </div>
          )}
          
          <div className="message-actions">
            <button
              className="action-btn"
              onClick={() => setReplyingTo(message)}
            >
              <FontAwesomeIcon icon={faReply} />
            </button>
            <button
              className="action-btn"
              onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
            >
              <FontAwesomeIcon icon={faSmile} />
            </button>
            <button className="action-btn">
              <FontAwesomeIcon icon={faForward} />
            </button>
            {isOwn && (
              <button className="action-btn">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
          
          {showReactions === message._id && (
            <div className="reactions-popup">
              {reactions.map(reaction => (
                <button
                  key={reaction.type}
                  className="reaction-btn"
                  onClick={() => handleReaction(message._id, reaction.type)}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-chatbox">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-info">
          {conversation?.type === 'group' ? (
            <>
              <div className="group-avatar">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div>
                <h4>{conversation.name || 'Nhóm chat'}</h4>
                <p>{conversation.participants?.length || 0} thành viên</p>
              </div>
            </>
          ) : (
            <>
              <img
                src={conversation?.participants?.find(p => p._id !== currentUser._id)?.avatarUrl || 'https://via.placeholder.com/40'}
                alt="Avatar"
                className="avatar avatar-md"
              />
              <div>
                <h4>{conversation?.participants?.find(p => p._id !== currentUser._id)?.displayName || 'Unknown'}</h4>
                <p>Đang hoạt động</p>
              </div>
            </>
          )}
        </div>
        
        <div className="chat-actions">
          <button className="chat-action-btn">
            <FontAwesomeIcon icon={faPhone} />
          </button>
          <button className="chat-action-btn">
            <FontAwesomeIcon icon={faVideoCamera} />
          </button>
          <button className="chat-action-btn">
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          <button className="chat-action-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map(renderMessage)}
        
        {isTyping.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>{isTyping.join(', ')} đang nhập...</p>
          </div>
        )}
      </div>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <FontAwesomeIcon icon={faReply} />
            <span>Trả lời {replyingTo.sender.displayName}</span>
            <p>{replyingTo.content.text || 'Media'}</p>
          </div>
          <button
            className="cancel-reply"
            onClick={() => setReplyingTo(null)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input">
        <div className="input-actions">
          <button
            className="input-action-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button className="input-action-btn">
            <FontAwesomeIcon icon={faImage} />
          </button>
          <button className="input-action-btn">
            <FontAwesomeIcon icon={faVideo} />
          </button>
        </div>
        
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="message-input"
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*,.pdf,.doc,.docx"
          style={{ display: 'none' }}
        />
      </div>

      <style jsx>{`
        .enhanced-chatbox {
          width: 380px;
          height: 600px;
          background-color: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          border: 1px solid var(--gray-200);
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-4);
          border-bottom: 1px solid var(--gray-200);
          background-color: var(--white);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }

        .chat-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        }

        .chat-info h4 {
          margin: 0;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--gray-800);
        }

        .chat-info p {
          margin: 0;
          font-size: var(--font-size-xs);
          color: var(--success-green);
        }

        .group-avatar {
          width: 40px;
          height: 40px;
          background-color: var(--primary-blue);
          color: var(--white);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-actions {
          display: flex;
          gap: var(--spacing-2);
        }

        .chat-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background-color: var(--gray-100);
          color: var(--gray-600);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .chat-action-btn:hover {
          background-color: var(--gray-200);
          color: var(--gray-800);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-3);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-3);
        }

        .message {
          display: flex;
          gap: var(--spacing-2);
          align-items: flex-end;
        }

        .message.own {
          flex-direction: row-reverse;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-1);
          max-width: 70%;
          position: relative;
        }

        .message.own .message-content {
          align-items: flex-end;
        }

        .reply-indicator {
          display: flex;
          align-items: center;
          gap: var(--spacing-1);
          font-size: var(--font-size-xs);
          color: var(--gray-500);
          margin-bottom: var(--spacing-1);
        }

        .message-bubble {
          padding: var(--spacing-3);
          border-radius: var(--radius-lg);
          position: relative;
          cursor: pointer;
        }

        .message-bubble.own {
          background-color: var(--primary-blue);
          color: var(--white);
        }

        .message-bubble.other {
          background-color: var(--gray-100);
          color: var(--gray-800);
        }

        .message-bubble p {
          margin: 0;
          font-size: var(--font-size-sm);
          line-height: 1.4;
        }

        .message-image,
        .message-video {
          max-width: 200px;
          border-radius: var(--radius-md);
          display: block;
        }

        .message-file {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          padding: var(--spacing-2);
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
        }

        .message-time {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          margin-top: var(--spacing-1);
        }

        .message-reactions {
          display: flex;
          gap: var(--spacing-1);
          margin-top: var(--spacing-1);
        }

        .reaction-count {
          font-size: var(--font-size-xs);
          padding: var(--spacing-1) var(--spacing-2);
          background-color: var(--white);
          border-radius: var(--radius-full);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .message-actions {
          display: none;
          position: absolute;
          top: -15px;
          right: 0;
          background-color: var(--white);
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-md);
          padding: var(--spacing-1);
          gap: var(--spacing-1);
        }

        .message:hover .message-actions {
          display: flex;
        }

        .action-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: none;
          color: var(--gray-500);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: var(--font-size-xs);
        }

        .action-btn:hover {
          background-color: var(--gray-100);
          color: var(--gray-700);
        }

        .reactions-popup {
          display: flex;
          gap: var(--spacing-1);
          position: absolute;
          bottom: -35px;
          left: 0;
          background-color: var(--white);
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-2);
          z-index: 10;
        }

        .reaction-btn {
          width: 30px;
          height: 30px;
          border: none;
          background: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: transform var(--transition-fast);
        }

        .reaction-btn:hover {
          transform: scale(1.2);
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          padding: var(--spacing-2) var(--spacing-3);
          opacity: 0.7;
        }

        .typing-dots {
          display: flex;
          gap: 2px;
        }

        .typing-dots span {
          width: 4px;
          height: 4px;
          background-color: var(--gray-400);
          border-radius: var(--radius-full);
          animation: typing 1.5s infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.5);
          }
        }

        .reply-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-2) var(--spacing-4);
          background-color: var(--gray-50);
          border-top: 1px solid var(--gray-200);
        }

        .reply-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }

        .reply-content span {
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--primary-blue);
        }

        .reply-content p {
          margin: 0;
          font-size: var(--font-size-xs);
          color: var(--gray-500);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cancel-reply {
          width: 20px;
          height: 20px;
          border: none;
          background-color: var(--gray-300);
          color: var(--gray-600);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: var(--font-size-xs);
        }

        .chat-input {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          padding: var(--spacing-3);
          border-top: 1px solid var(--gray-200);
          background-color: var(--white);
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }

        .input-actions {
          display: flex;
          gap: var(--spacing-1);
        }

        .input-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background-color: var(--primary-blue);
          color: var(--white);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-sm);
        }

        .input-action-btn:hover {
          background-color: var(--primary-blue-hover);
          transform: scale(1.05);
        }

        .message-input {
          flex: 1;
          border: none;
          background-color: var(--gray-100);
          border-radius: var(--radius-full);
          padding: var(--spacing-2) var(--spacing-4);
          font-size: var(--font-size-sm);
          outline: none;
        }

        .message-input:focus {
          background-color: var(--white);
          box-shadow: 0 0 0 1px var(--primary-blue);
        }

        .send-btn {
          width: 32px;
          height: 32px;
          border: none;
          background-color: var(--primary-blue);
          color: var(--white);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .send-btn:hover:not(:disabled) {
          background-color: var(--primary-blue-hover);
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background-color: var(--gray-300);
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .enhanced-chatbox {
            width: 100vw;
            height: 100vh;
            bottom: 0;
            right: 0;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedChatbox; 