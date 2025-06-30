import React, { useState, useEffect } from "react";
import { fetchUsers } from "../service/userService";

const UserList = ({ onSelectUser, users: propUsers }) => {
  const [users, setUsers] = useState(propUsers || []);
  const [loading, setLoading] = useState(!propUsers);

  useEffect(() => {
    // Only fetch if users are not provided via props
    if (!propUsers) {
      const fetchUserInfo = async () => {
        try {
          setLoading(true);
          const userList = await fetchUsers();
          setUsers(userList || []);
        } catch (error) {
          console.error("Lỗi khi lấy thông tin người dùng:", error);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      };

      fetchUserInfo();
    }
  }, [propUsers]);

  return (
    <div style={styles.userList}>
      <h3 style={styles.title}>Danh sách người dùng</h3>
      {loading ? (
        <p style={styles.loading}>Đang tải danh sách...</p>
      ) : users.length > 0 ? (
        users.map((user) => (
          <div
            key={user._id}
            style={styles.user}
            onClick={() => onSelectUser(user._id)}
          >
            <div style={styles.userAvatar}>🧑</div>
            <div style={styles.userInfo}>
              <span style={styles.username}>{user.username}</span>
              <span style={styles.email}>{user.email}</span>
            </div>
          </div>
        ))
      ) : (
        <p style={styles.noUsers}>Không có người dùng nào</p>
      )}
    </div>
  );
};

const styles = {
  userList: {
    width: "280px",
    maxHeight: "300px",
    padding: "12px",
    border: "1px solid #e4e6ea",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    overflowY: "auto",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1c1e21",
    borderBottom: "1px solid #e4e6ea",
    paddingBottom: "8px",
  },
  user: {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    gap: "8px",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#f0f2f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  username: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1c1e21",
  },
  email: {
    fontSize: "12px",
    color: "#8a8d91",
  },
  loading: {
    textAlign: "center",
    color: "#8a8d91",
    padding: "20px",
    fontSize: "14px",
  },
  noUsers: {
    textAlign: "center",
    color: "#8a8d91",
    padding: "20px",
    fontSize: "14px",
  },
};

// Add hover effect with inline styling
const userHoverStyle = {
  ...styles.user,
  ":hover": {
    backgroundColor: "#f0f2f5",
  },
};

export default UserList;
