import React, { useEffect, useState } from "react";
import {
  getFriends,
  removeFriend,
  getMutualFriends,
} from "../service/friendService";

const FriendList = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mutualFriends, setMutualFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await getFriends(userId);
        setFriends(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn bè:", error);
      }
    };

    fetchFriends();
  }, [userId]);

  // 📌 Lấy danh sách bạn chung
  const fetchMutualFriends = async (friendId) => {
    try {
      const response = await getMutualFriends(userId, friendId);
      setMutualFriends(response.data);
      setSelectedUser(friendId);
    } catch (error) {
      console.error("Lỗi khi lấy bạn chung:", error);
    }
  };

  // 📌 Xóa bạn bè
  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend({ userId, friendId });
      setFriends(friends.filter((friend) => friend._id !== friendId));
    } catch (error) {
      console.error("Lỗi khi xóa bạn bè:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h3>📋 Danh sách bạn bè</h3>
      {friends.length > 0 ? (
        friends.map((friend) => (
          <div key={friend._id} style={styles.friendItem}>
            <img
              src={friend.avatarUrl}
              alt={friend.username}
              style={styles.avatar}
            />
            <span>{friend.username}</span>
            <button onClick={() => fetchMutualFriends(friend._id)}>
              👥 Xem bạn chung
            </button>
            <button onClick={() => handleRemoveFriend(friend._id)}>
              ❌ Xóa bạn
            </button>
          </div>
        ))
      ) : (
        <p>❌ Bạn chưa có bạn bè nào</p>
      )}

      {selectedUser && (
        <div style={styles.mutualFriends}>
          <h4>👥 Bạn chung:</h4>
          {mutualFriends.length > 0 ? (
            mutualFriends.map((friend) => (
              <p key={friend._id}>🧑 {friend.username}</p>
            ))
          ) : (
            <p>❌ Không có bạn chung</p>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "10px",
    width: "300px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  friendItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px",
  },
  avatar: { width: "30px", height: "30px", borderRadius: "50%" },
  mutualFriends: {
    marginTop: "10px",
    padding: "5px",
    backgroundColor: "#f1f1f1",
    borderRadius: "5px",
  },
};

export default FriendList;
