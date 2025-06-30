import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Get socket.io instance from server
let io;
export const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

// 📌 Gửi lời mời kết bạn
export const sendFriendRequest = async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    if (sender === receiver) {
      return res
        .status(400)
        .json({ message: "Không thể tự kết bạn với chính mình!" });
    }

    // Kiểm tra xem đã là bạn bè chưa
    const senderUser = await User.findById(sender);
    if (senderUser.friends.includes(receiver)) {
      return res.status(400).json({ message: "Đã là bạn bè rồi!" });
    }

    // Kiểm tra xem đã gửi lời mời chưa
    const existingRequest = await FriendRequest.findOne({
      sender,
      receiver,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Bạn đã gửi lời mời trước đó!" });
    }

    // Kiểm tra xem có lời mời ngược lại không
    const reverseRequest = await FriendRequest.findOne({
      sender: receiver,
      receiver: sender,
      status: "pending",
    });
    if (reverseRequest) {
      return res.status(400).json({ message: "Người này đã gửi lời mời cho bạn!" });
    }

    // Tạo lời mời mới
    const friendRequest = new FriendRequest({ sender, receiver });
    await friendRequest.save();

    // Populate sender info for response
    await friendRequest.populate('sender receiver', 'username firstName lastName avatarUrl displayName');

    // 📌 Tạo thông báo kết bạn
    const notification = new Notification({
      user: receiver,
      sender: sender,
      type: "friend_request",
      message: "Bạn có một lời mời kết bạn mới!",
    });
    await notification.save();
    await notification.populate('sender', 'username firstName lastName avatarUrl displayName');

    // 🔔 EMIT SOCKET EVENT - Real-time notification
    if (io) {
      io.emit("send_friend_request", {
        fromUser: sender,
        toUser: receiver,
        requestId: friendRequest._id,
        fromUserData: {
          _id: friendRequest.sender._id,
          displayName: friendRequest.sender.displayName || `${friendRequest.sender.firstName} ${friendRequest.sender.lastName}`,
          username: friendRequest.sender.username,
          avatarUrl: friendRequest.sender.avatarUrl
        }
      });

      console.log(`🔔 Socket: Friend request sent from ${sender} to ${receiver}`);
    }

    res.status(201).json({ 
      message: "Lời mời kết bạn đã được gửi!",
      friendRequest: friendRequest,
      notification: notification
    });
  } catch (error) {
    console.error("Lỗi khi gửi lời mời kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Chấp nhận lời mời kết bạn
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId)
      .populate('sender receiver', 'username firstName lastName avatarUrl displayName');
    
    if (!friendRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn!" });
    }

    const { sender, receiver } = friendRequest;

    // Cập nhật danh sách bạn bè
    await User.findByIdAndUpdate(sender._id, { $addToSet: { friends: receiver._id } });
    await User.findByIdAndUpdate(receiver._id, { $addToSet: { friends: sender._id } });

    // Xóa lời mời sau khi đã chấp nhận
    await FriendRequest.findByIdAndDelete(requestId);

    // 📌 Tạo thông báo bạn bè
    const notification = new Notification({
      user: sender._id,
      sender: receiver._id,
      type: "friend_accept",
      message: "Lời mời kết bạn của bạn đã được chấp nhận!",
    });
    await notification.save();

    // 🔔 EMIT SOCKET EVENT - Real-time notification
    if (io) {
      io.emit("friend_request_accepted", {
        fromUser: sender._id,
        toUser: receiver._id,
        toUserData: {
          _id: receiver._id,
          displayName: receiver.displayName || `${receiver.firstName} ${receiver.lastName}`,
          username: receiver.username,
          avatarUrl: receiver.avatarUrl
        }
      });

      console.log(`🔔 Socket: Friend request accepted ${receiver._id} → ${sender._id}`);
    }

    res.status(200).json({ 
      message: "Bạn đã kết bạn thành công!",
      newFriend: {
        _id: sender._id,
        displayName: sender.displayName,
        username: sender.username,
        avatarUrl: sender.avatarUrl
      }
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// hủy lời mời kết bạn
export const cancelFriendRequest = async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    const friendRequest = await FriendRequest.findOneAndDelete({
      sender,
      receiver,
      status: "pending",
    });

    if (!friendRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn!" });
    }

    res.status(200).json({ message: "Lời mời kết bạn đã bị hủy!" });
  } catch (error) {
    console.error("Lỗi khi hủy lời mời kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// từ chối kết bạn
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId)
      .populate('sender receiver', 'username firstName lastName avatarUrl displayName');

    if (!friendRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn!" });
    }

    const { sender, receiver } = friendRequest;
    
    // Xóa lời mời
    await FriendRequest.findByIdAndDelete(requestId);

    // 🔔 EMIT SOCKET EVENT - Real-time notification (optional)
    if (io) {
      io.emit("friend_request_declined", {
        fromUser: sender._id,
        toUser: receiver._id,
        toUserData: {
          _id: receiver._id,
          displayName: receiver.displayName || `${receiver.firstName} ${receiver.lastName}`,
          username: receiver.username,
          avatarUrl: receiver.avatarUrl
        }
      });

      console.log(`🔔 Socket: Friend request declined ${receiver._id} → ${sender._id}`);
    }

    res.status(200).json({ message: "Lời mời kết bạn đã bị từ chối!" });
  } catch (error) {
    console.error("Lỗi khi từ chối lời mời:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// xóa bạn
export const removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    res.status(200).json({ message: "Xóa bạn bè thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa bạn bè:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// lấy danh sách bạn bè
export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate(
      "friends",
      "username email avatarUrl firstName lastName displayName status lastSeen"
    );
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    res.status(200).json({
      friends: user.friends,
      count: user.friends.length
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Lấy danh sách lời mời kết bạn đã nhận
export const getReceivedFriendRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const friendRequests = await FriendRequest.find({
      receiver: userId,
      status: "pending"
    }).populate('sender', 'username firstName lastName avatarUrl displayName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      friendRequests,
      count: friendRequests.length
    });
  } catch (error) {
    console.error("Lỗi khi lấy lời mời kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Lấy danh sách lời mời kết bạn đã gửi
export const getSentFriendRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const friendRequests = await FriendRequest.find({
      sender: userId,
      status: "pending"
    }).populate('receiver', 'username firstName lastName avatarUrl displayName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      friendRequests,
      count: friendRequests.length
    });
  } catch (error) {
    console.error("Lỗi khi lấy lời mời đã gửi:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Lấy danh sách bạn chung
export const getMutualFriends = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    // Lấy danh sách bạn bè của user1 & user2
    const user1Data = await User.findById(user1).populate(
      "friends",
      "_id username firstName lastName avatarUrl displayName"
    );
    const user2Data = await User.findById(user2).populate(
      "friends",
      "_id username firstName lastName avatarUrl displayName"
    );

    if (!user1Data || !user2Data) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    // Tìm bạn chung
    const user1Friends = new Set(
      user1Data.friends.map((friend) => friend._id.toString())
    );
    const mutualFriends = user2Data.friends.filter((friend) =>
      user1Friends.has(friend._id.toString())
    );

    res.status(200).json({
      mutualFriends,
      count: mutualFriends.length
    });
  } catch (error) {
    console.error("Lỗi khi lấy bạn chung:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Kiểm tra trạng thái kết bạn
export const checkFriendship = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const user = await User.findById(user1);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    const isFriend = user.friends.includes(user2);

    // Kiểm tra lời mời kết bạn pending
    const sentRequest = await FriendRequest.findOne({
      sender: user1,
      receiver: user2,
      status: "pending"
    });

    const receivedRequest = await FriendRequest.findOne({
      sender: user2,
      receiver: user1,
      status: "pending"
    });

    let status = "none"; // none, friends, sent, received
    
    if (isFriend) {
      status = "friends";
    } else if (sentRequest) {
      status = "sent";
    } else if (receivedRequest) {
      status = "received";
    }

    res.status(200).json({ 
      status,
      isFriend,
      requestId: sentRequest?._id || receivedRequest?._id
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra bạn bè:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Tìm kiếm người dùng để kết bạn
export const searchUsers = async (req, res) => {
  try {
    const { query, userId } = req.query;
    const currentUserId = userId;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Từ khóa tìm kiếm quá ngắn!" });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Không bao gồm chính mình
        {
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username firstName lastName displayName avatarUrl')
    .limit(20);

    // Kiểm tra trạng thái kết bạn cho từng user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const checkResult = await checkFriendshipStatus(currentUserId, user._id);
        return {
          ...user.toObject(),
          friendshipStatus: checkResult.status
        };
      })
    );

    res.status(200).json({
      users: usersWithStatus,
      count: usersWithStatus.length
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Helper function để kiểm tra trạng thái kết bạn
const checkFriendshipStatus = async (user1, user2) => {
  const user = await User.findById(user1);
  const isFriend = user.friends.includes(user2);
  
  const sentRequest = await FriendRequest.findOne({
    sender: user1,
    receiver: user2,
    status: "pending"
  });

  const receivedRequest = await FriendRequest.findOne({
    sender: user2,
    receiver: user1,
    status: "pending"
  });

  let status = "none";
  
  if (isFriend) {
    status = "friends";
  } else if (sentRequest) {
    status = "sent";
  } else if (receivedRequest) {
    status = "received";
  }

  return { status, requestId: sentRequest?._id || receivedRequest?._id };
};
