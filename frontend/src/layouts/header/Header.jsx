import React, { useState, useEffect } from "react";
import "./Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faUsers,
  faTv,
  faBell,
  faUser,
  faMessage,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { getUserInfo } from "../../service/authService";
import ChatBox from "../../components/Chatbox";
import { NavLink } from "react-router-dom";
import UserList from "../../components/UserList";
import socketService from "../../service/socketService";
import NotificationCenter from "../../components/NotificationCenter";
import ChatInterface from "../../components/ChatInterface";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // disconnected, connecting, connected, error

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'true' || (savedTheme === null && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }

    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const userInfo = await getUserInfo();
        setUser(userInfo);
        
        // 🔗 Connect to socket when user is loaded
        if (userInfo && userInfo._id) {
          setSocketStatus('connecting');
          socketService.connect(userInfo._id);
          console.log(`🔗 Socket connecting for user: ${userInfo._id}`);
          
          // Listen for real-time notifications
          socketService.addEventListener('new_friend_request', handleNewNotification);
          socketService.addEventListener('friend_request_status', handleNewNotification);
          socketService.addEventListener('new_notification', handleNewNotification);
          
          // Listen for connection status updates
          socketService.addEventListener('connection_error', handleConnectionError);
          socketService.addEventListener('disconnected', handleDisconnected);
          socketService.addEventListener('reconnection_failed', handleReconnectionFailed);
          
          // Add listeners for successful connection
          socketService.addEventListener('connected', handleConnected);
          socketService.addEventListener('reconnected', handleConnected);
          
          // Check initial connection status
          setTimeout(() => {
            if (socketService.isConnectedToSocket()) {
              setSocketStatus('connected');
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        // If token is invalid, redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          socketService.disconnect(); // Disconnect socket on auth error
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();

    // Cleanup on component unmount
    return () => {
      socketService.removeEventListener('new_friend_request', handleNewNotification);
      socketService.removeEventListener('friend_request_status', handleNewNotification);
      socketService.removeEventListener('new_notification', handleNewNotification);
      socketService.removeEventListener('connection_error', handleConnectionError);
      socketService.removeEventListener('disconnected', handleDisconnected);
      socketService.removeEventListener('reconnection_failed', handleReconnectionFailed);
      socketService.removeEventListener('connected', handleConnected);
      socketService.removeEventListener('reconnected', handleConnected);
    };
  }, []);

  // Handle new real-time notifications
  const handleNewNotification = (data) => {
    console.log('🔔 New notification in Header:', data);
    
    // Increment notification count
    setNotificationCount(prev => prev + 1);
    
    // Optional: Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(data.message || 'Bạn có thông báo mới', {
        icon: data.fromUser?.avatarUrl || '/vite.svg',
        body: data.fromUser?.displayName || 'Thông báo từ Facebook',
        tag: data._id
      });
    }
  };

  // Handle socket connection errors
  const handleConnectionError = (data) => {
    console.error('🔥 Socket connection error in Header:', data);
    setSocketStatus('error');
    // You could show a notification to user about connection issues
  };

  // Handle socket disconnection
  const handleDisconnected = (data) => {
    console.log('❌ Socket disconnected in Header:', data.reason);
    setSocketStatus('disconnected');
    // You could show a notification to user about disconnection
  };

  // Handle reconnection failure
  const handleReconnectionFailed = (data) => {
    console.error('💥 Socket reconnection failed in Header after', data.attempts, 'attempts');
    setSocketStatus('error');
    // You could show a notification to user about connection failure
  };

  // Handle successful connection
  const handleConnected = (data) => {
    console.log('✅ Socket connected in Header:', data);
    setSocketStatus('connected');
  };

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close notification center if clicking outside
      if (isNotificationOpen && !event.target.closest('.notification-icon') && !event.target.closest('.notification-center')) {
        setIsNotificationOpen(false);
      }
      
      // Close user menu if clicking outside
      if (isMenuOpen && !event.target.closest('.user-icon') && !event.target.closest('.dropdown-menu')) {
        setIsMenuOpen(false);
      }
      
      // Close chat if clicking outside - but not when clicking inside chat content
      if (isChatOpen && 
          !event.target.closest('.message-icon') && 
          !event.target.closest('.chat-interface') && 
          !event.target.closest('.facebook-chatbox') &&
          !event.target.closest('.friend-item') &&
          !event.target.closest('.chat-search') &&
          !event.target.closest('.friends-list')) {
        setIsChatOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen, isMenuOpen, isChatOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) {
      // Reset notification count when opening notification center
      setNotificationCount(0);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
    
    // Close menu if open
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    // 🔌 Disconnect socket on logout
    socketService.disconnect();
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };



  return (
    <div className="header">
      <div className="header__left">
        <NavLink to="/">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
            alt="Facebook Logo"
          />
        </NavLink>
        <input type="text" placeholder="Tìm kiếm trên Facebook" />
      </div>
      
      <div className="header__between">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "header__icon active" : "header__icon"
          }
        >
          <FontAwesomeIcon icon={faHouse} />
        </NavLink>
        <NavLink
          to="/group"
          className={({ isActive }) =>
            isActive ? "header__icon active" : "header__icon"
          }
        >
          <FontAwesomeIcon icon={faUsers} />
        </NavLink>
        <NavLink
          to="/video"
          className={({ isActive }) =>
            isActive ? "header__icon active" : "header__icon"
          }
        >
          <FontAwesomeIcon icon={faTv} />
        </NavLink>
      </div>
      
      <div className="header__right">
        <div className="header__icon message-icon">
          <div onClick={toggleChat}>
            <FontAwesomeIcon icon={faMessage} />
          </div>
          {/* Render ChatInterface inside message icon */}
          <ChatInterface 
            currentUser={user}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
        
        <div className={`header__icon notification-icon ${isNotificationOpen ? 'active' : ''}`} onClick={toggleNotification}>
          <FontAwesomeIcon icon={faBell} />
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </div>

        <div 
          className={`header__icon socket-status ${socketStatus}`}
          title={`Socket: ${socketStatus === 'connected' ? 'Đã kết nối' : socketStatus === 'connecting' ? 'Đang kết nối...' : socketStatus === 'error' ? 'Lỗi kết nối' : 'Ngắt kết nối'}`}
        >
          <div className={`socket-indicator ${socketStatus}`}></div>
        </div>

        <div 
          className={`header__icon theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
        </div>
        
        <div className="header__icon user-icon" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faUser} />
          {isMenuOpen && (
            <div className="dropdown-menu">
              {loading ? (
                <p>Đang tải thông tin...</p>
              ) : user ? (
                <>
                  <p>Đăng nhập với: {user.email}</p>
                  <p>Username: {user.username}</p>
                  <div>
                    <NavLink to="/profile">Trang cá nhân</NavLink>
                  </div>
                  <div className="theme-menu-item" onClick={toggleDarkMode}>
                    <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
                    <span>{isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                  </div>
                  <button onClick={handleLogout}>Đăng xuất</button>
                </>
              ) : (
                <p>Không thể tải thông tin người dùng</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Render NotificationCenter outside of header__right to avoid hover conflicts */}
      {isNotificationOpen && (
        <NotificationCenter 
          isOpen={isNotificationOpen} 
          onClose={() => setIsNotificationOpen(false)}
        />
      )}
    </div>
  );
};

export default Header;
