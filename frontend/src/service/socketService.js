import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.userId = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.connectionTimeout = null;
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
      console.log(`🔗 Connecting to socket server for user: ${userId}`);
      
      // Create socket connection with proper configuration
      this.socket = io('http://localhost:8080', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: true,
        forceNew: false
      });

      this.setupSocketEvents();
      this.setupConnectionTimeout();

    } catch (error) {
      console.error('❌ Socket connection initialization failed:', error);
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  // Setup all socket event handlers
  setupSocketEvents() {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('🔗 Socket connected successfully:', this.socket.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.clearConnectionTimeout();
      
      // Join user's personal room
      this.joinUserRoom(this.userId);
      
      // Setup application event listeners
      this.setupApplicationListeners();
      
      // Emit connected event for UI
      this.triggerListener('connected', { socketId: this.socket.id });
    });

    // Connection failed
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.handleConnectionError(error);
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.handleDisconnection(reason);
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attemptNumber;
    });

    // Reconnection successful
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.joinUserRoom(this.userId);
      
      // Emit reconnected event for UI
      this.triggerListener('connected', { socketId: this.socket.id, reconnected: true, attempts: attemptNumber });
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after maximum attempts');
      this.handleReconnectionFailed();
    });
  }

  // Setup application-specific event listeners
  setupApplicationListeners() {
    if (!this.socket) return;

    // Remove existing listeners to prevent duplicates
    this.socket.off('new_friend_request');
    this.socket.off('friend_request_status');
    this.socket.off('new_notification');
    this.socket.off('notification_read');
    this.socket.off('user_online');
    this.socket.off('user_offline');
    this.socket.off('user_typing');
    this.socket.off('receive_message');

    // Friend request notifications
    this.socket.on('new_friend_request', (data) => {
      console.log('🔔 New friend request:', data);
      this.triggerListener('new_friend_request', data);
    });

    // Friend request status updates
    this.socket.on('friend_request_status', (data) => {
      console.log('🎉 Friend request status:', data);
      this.triggerListener('friend_request_status', data);
    });

    // General notifications
    this.socket.on('new_notification', (data) => {
      console.log('🔔 New notification:', data);
      this.triggerListener('new_notification', data);
    });

    // Notification read status
    this.socket.on('notification_read', (data) => {
      console.log('📖 Notification read:', data);
      this.triggerListener('notification_read', data);
    });

    // User online/offline status
    this.socket.on('user_online', (data) => {
      console.log('🟢 User online:', data);
      this.triggerListener('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('🔴 User offline:', data);
      this.triggerListener('user_offline', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.triggerListener('user_typing', data);
    });

    // Messages
    this.socket.on('receive_message', (data) => {
      console.log('📩 New message:', data);
      this.triggerListener('receive_message', data);
    });

    console.log('✅ Application socket listeners set up');
  }

  // Join user's personal room
  joinUserRoom(userId) {
    if (this.socket && this.isConnected && userId) {
      this.socket.emit('join', userId);
      console.log(`👤 Joined room for user: ${userId}`);
    }
  }

  // Handle connection errors
  handleConnectionError(error) {
    console.error('🔥 Socket connection error details:', error);
    
    // Notify listeners about connection error
    this.triggerListener('connection_error', { error, attempts: this.reconnectAttempts });
    
    // Clear connection timeout
    this.clearConnectionTimeout();
  }

  // Handle disconnection
  handleDisconnection(reason) {
    console.log('🔌 Handling disconnection, reason:', reason);
    
    // Notify listeners about disconnection
    this.triggerListener('disconnected', { reason });
    
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
    this.triggerListener('reconnection_failed', { 
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
    console.log('🔌 Disconnecting socket...');
    
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
    this.listeners.clear();
    
    console.log('✅ Socket disconnected cleanly');
  }

  // Check connection status
  isConnectedToSocket() {
    return this.socket && this.isConnected && this.socket.connected;
  }

  // Add event listener with safety checks
  addEventListener(event, callback) {
    if (typeof callback !== 'function') {
      console.error('❌ Socket event listener must be a function');
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    console.log(`📝 Added listener for event: ${event}`);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      console.log(`🗑️ Removed listener for event: ${event}`);
    }
  }

  // Trigger all listeners for an event
  triggerListener(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
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
      return false;
    }

    try {
      this.socket.emit('send_message', messageData);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Send typing indicators
  startTyping(receiverId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('typing_start', {
        senderId: this.userId,
        receiverId
      });
    }
  }

  stopTyping(receiverId) {
    if (this.isConnectedToSocket()) {
      this.socket.emit('typing_stop', {
        senderId: this.userId,
        receiverId
      });
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
      listenerCount: this.listeners.size
    };
  }

  // Debug method
  debug() {
    console.log('🔍 Socket Debug Info:', this.getConnectionStatus());
    console.log('🎯 Active listeners:', Array.from(this.listeners.keys()));
  }
}

// Create singleton instance
const socketService = new SocketService();

// Add global error handler
window.addEventListener('beforeunload', () => {
  socketService.disconnect();
});

export default socketService; 