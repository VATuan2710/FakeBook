import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.connectionTimeout = null;
    this.eventListeners = new Map();
  }

  // Connect to socket server with robust error handling
  connect(userId) {
    if (this.isConnecting) {
      console.log('🔄 Socket connection already in progress...');
      return;
    }

    if (this.socket && this.isConnected) {
      console.log('🔗 Socket already connected');
      this.joinUserRoom(userId);
      return;
    }

    this.isConnecting = true;
    this.userId = userId;

    try {
      console.log(`🚀 Connecting to socket for user: ${userId}`);
      
      // Create socket connection with proper configuration
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
      this.setupConnectionTimeout();

    } catch (error) {
      console.error('❌ Socket connection initialization failed:', error);
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  // Setup all socket event handlers
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      
      this.emit('connected', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason, timestamp: new Date() });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('reconnection_failed', { attempts: this.reconnectAttempts });
      } else {
        this.emit('connection_error', { error, attempts: this.reconnectAttempts });
      }
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      
      this.emit('reconnected', { timestamp: new Date() });
    });

    // Message events
    this.socket.on('receive_message', (messageData) => {
      console.log('📩 Received message:', messageData);
      this.emit('receive_message', messageData);
    });

    this.socket.on('message_error', (errorData) => {
      console.error('❌ Message error:', errorData);
      this.emit('message_error', errorData);
    });

    this.socket.on('conversation_updated', (data) => {
      console.log('💬 Conversation updated:', data);
      this.emit('conversation_updated', data);
    });

    this.socket.on('messages_read', (data) => {
      console.log('📖 Messages marked as read:', data);
      this.emit('messages_read', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      this.emit('user_typing', data);
    });

    // Online status events
    this.socket.on('user_online', (data) => {
      console.log('🟢 User online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('🔴 User offline:', data);
      this.emit('user_offline', data);
    });

    // Friend request events
    this.socket.on('new_friend_request', (data) => {
      console.log('👥 New friend request:', data);
      this.emit('new_friend_request', data);
    });

    this.socket.on('friend_request_status', (data) => {
      console.log('✅ Friend request status:', data);
      this.emit('friend_request_status', data);
    });

    // Notification events
    this.socket.on('new_notification', (data) => {
      console.log('🔔 New notification:', data);
      this.emit('new_notification', data);
    });

    this.socket.on('notification_read', (data) => {
      console.log('📖 Notification read:', data);
      this.emit('notification_read', data);
    });
  }

  // Join user's personal room
  joinUserRoom(userId) {
    if (this.isConnectedToSocket() && userId) {
      console.log(`👤 Joining room for user: ${userId}`);
      this.socket.emit('join', userId);
    }
  }

  // Handle connection errors
  handleConnectionError(error) {
    console.error('🔥 Socket connection error details:', error);
    
    // Notify listeners about connection error
    this.emit('connection_error', { error, attempts: this.reconnectAttempts });
    
    // Clear connection timeout
    this.clearConnectionTimeout();
  }

  // Handle disconnection
  handleDisconnection(reason) {
    console.log('🔌 Handling disconnection, reason:', reason);
    
    // Notify listeners about disconnection
    this.emit('disconnected', { reason });
    
    // Don't auto-reconnect for certain reasons
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      console.log('🛑 Manual disconnection, not attempting to reconnect');
      return;
    }
  }

  // Handle reconnection failure
  handleReconnectionFailed() {
    console.error('💥 All reconnection attempts failed');
    this.isConnected = false;
    this.isConnecting = false;
    
    // Notify listeners
    this.emit('reconnection_failed', { 
      attempts: this.maxReconnectAttempts 
    });
  }

  // Setup connection timeout
  setupConnectionTimeout() {
    this.clearConnectionTimeout();
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.error('⏰ Socket connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, 15000); // 15 second timeout
  }

  // Clear connection timeout
  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  // Disconnect socket cleanly
  disconnect() {
    console.log('🔌 Disconnecting socket');
    
    this.clearConnectionTimeout();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.eventListeners.clear();
    
    console.log('✅ Socket disconnected cleanly');
  }

  // Check connection status
  isConnectedToSocket() {
    return this.socket && this.isConnected;
  }

  // Add event listener with safety checks
  addEventListener(event, callback) {
    if (typeof callback !== 'function') {
      console.error('❌ Socket event listener must be a function');
      return;
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    console.log(`📝 Added listener for event: ${event}`);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      console.log(`🗑️ Removed listener for event: ${event}`);
    }
  }

  // Trigger all listeners for an event
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  // Send message with connection check
  sendMessage(messageData) {
    if (!this.isConnectedToSocket()) {
      console.warn('⚠️ Cannot send message: Socket not connected');
      throw new Error('Socket not connected');
    }

    try {
      console.log('📤 Sending message via socket:', messageData);
      this.socket.emit('send_message', messageData);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Send typing indicators
  startTyping(senderId, receiverId, conversationId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('typing_start', { senderId, receiverId, conversationId });
    }
  }

  stopTyping(senderId, receiverId, conversationId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('typing_stop', { senderId, receiverId, conversationId });
    }
  }

  // Mark notification as read
  markNotificationRead(notificationId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('mark_notification_read', {
        userId: this.userId,
        notificationId
      });
    }
  }

  // Force reconnection
  forceReconnect() {
    console.log('🔄 Forcing socket reconnection...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Wait a bit then reconnect
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, 1000);
  }

  // Get detailed connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      socketId: this.socket?.id,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      transport: this.socket?.io?.engine?.transport?.name,
      listenerCount: this.eventListeners.size
    };
  }

  // Debug method
  debug() {
    console.log('🔍 Socket Debug Info:', this.getConnectionStatus());
    console.log('🎯 Active listeners:', Array.from(this.eventListeners.keys()));
  }



  // Mark messages as read
  markMessagesAsRead(conversationId, userId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('mark_messages_read', { conversationId, userId });
    }
  }

  // Friend request events
  sendFriendRequest(data) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('send_friend_request', data);
    }
  }

  acceptFriendRequest(data) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('friend_request_accepted', data);
    }
  }

  declineFriendRequest(data) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('friend_request_declined', data);
    }
  }

  // Notification events
  sendNotification(data) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('send_notification', data);
    }
  }

  markNotificationAsRead(userId, notificationId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('mark_notification_read', { userId, notificationId });
    }
  }

  // Utility methods
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Add global error handler
window.addEventListener('beforeunload', () => {
  socketService.disconnect();
});

export default socketService; 