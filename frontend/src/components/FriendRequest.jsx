import React, { useEffect, useState } from "react";
import {
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from "../service/friendService";

const FriendRequests = ({ userId }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getFriendRequests(userId);
        setRequests(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy lời mời kết bạn:", error);
      }
    };

    fetchRequests();
  }, [userId]);

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      setRequests(requests.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời:", error);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await declineFriendRequest(requestId);
      setRequests(requests.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error("Lỗi khi từ chối lời mời:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h3>📩 Lời mời kết bạn</h3>
      {requests.length > 0 ? (
        requests.map((request) => (
          <div key={request._id} style={styles.requestItem}>
            <span>{request.sender.username}</span>
            <button onClick={() => handleAccept(request._id)}>
              ✅ Chấp nhận
            </button>
            <button onClick={() => handleDecline(request._id)}>
              ❌ Từ chối
            </button>
          </div>
        ))
      ) : (
        <p>📭 Không có lời mời kết bạn</p>
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
  requestItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px",
  },
};

export default FriendRequests;
