import { Router } from "express";
import { 
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  getMutualFriends,
  checkFriendship,
  searchUsers
} from "../controllers/FriendAndNoficationController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";

const friendAuth = Router();

// 🔒 Tất cả routes đều cần authentication
friendAuth.use(verifyToken);

// 📌 Friend Request Routes
friendAuth.post("/request", sendFriendRequest);                    // Gửi lời mời kết bạn
friendAuth.put("/request/:requestId/accept", acceptFriendRequest);  // Chấp nhận lời mời
friendAuth.delete("/request/:requestId/decline", declineFriendRequest); // Từ chối lời mời
friendAuth.delete("/request/cancel", cancelFriendRequest);          // Hủy lời mời đã gửi

// 📌 Friend Management Routes  
friendAuth.delete("/remove", removeFriend);                        // Xóa bạn bè
friendAuth.get("/:userId", getFriends);                             // Lấy danh sách bạn bè
friendAuth.get("/:userId/requests/received", getReceivedFriendRequests); // Lời mời nhận được
friendAuth.get("/:userId/requests/sent", getSentFriendRequests);    // Lời mời đã gửi

// 📌 Friend Discovery Routes
friendAuth.get("/mutual/:user1/:user2", getMutualFriends);          // Bạn chung
friendAuth.get("/check/:user1/:user2", checkFriendship);            // Kiểm tra trạng thái kết bạn
friendAuth.get("/search/users", searchUsers);                       // Tìm kiếm người dùng

export default friendAuth;
