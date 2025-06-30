import React, { useEffect, useState, useRef } from "react";
import {
  getMessages,
  sendMessage,
  receiveMessages,
  joinRoom,
  disconnectSocket,
} from "../service/chatService";
import moment from "moment";

const ChatBox = ({ userId, chatUserId, closeChat }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef(null);

  // 📌 **Lấy tin nhắn cũ khi mở chat**
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(userId);
        setMessages(data); // Load tin nhắn từ DB
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
      }
    };

    fetchMessages(); // Gọi API lấy tin nhắn

    joinRoom(userId); // Tham gia phòng riêng của user

    // 📌 **Lắng nghe tin nhắn mới**
    receiveMessages((newMessage) => {
      if (newMessage.sender === userId) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setTimeout(() => {
          chatContainerRef.current?.scrollTo(
            0,
            chatContainerRef.current.scrollHeight
          );
        }, 100);
      }
    });

    return () => {
      disconnectSocket(); // Ngắt kết nối khi rời chat
    };
  }, [userId]);
  return (
    <div style={styles.chatBox}>
      <div style={styles.header}>
        💬 Chat với User {chatUserId}
        <button onClick={closeChat} style={styles.closeButton}>
          ❌
        </button>
      </div>

      <div style={styles.messageContainer} ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.sender === userId ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === userId ? "#0078FF" : "#E4E6EB",
              color: msg.sender === userId ? "#fff" : "#000",
            }}
          >
            <p>{msg.message}</p>
            <span style={styles.timestamp}>
              {moment(msg.createdAt).format("HH:mm")}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter"}
        />
        <button style={styles.sendButton}>Gửi</button>
      </div>
    </div>
  );
};

// **CSS Styles**
const styles = {
  chatBox: {
    width: "350px",
    height: "500px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
    position: "absolute",
    right: "20px",
    bottom: "20px",
  },
  header: {
    backgroundColor: "#0078FF",
    color: "white",
    padding: "10px",
    textAlign: "center",
    fontWeight: "bold",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default ChatBox;
