import User from "../models/User.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userInfo = await User.findOne({ _id: userId }).populate('friends', 'username firstName lastName displayName avatarUrl status lastSeen');

    if (!userInfo) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.status(200).json(userInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// lấy danh sách người dùng
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id username email avatarUrl firstName lastName displayName status lastSeen"); // Sửa từ avatar thành avatarUrl

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Không có người dùng nào!" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-password') // Exclude password from response
      .populate('friends', 'username firstName lastName displayName avatarUrl status lastSeen');

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.email;
    delete updateData.friends;
    delete updateData.blockedUsers;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      user: updatedUser
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const currentUserId = req.user.userId;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Từ khóa tìm kiếm quá ngắn!" });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { displayName: searchRegex },
            { username: searchRegex },
            { email: searchRegex }
          ]
        }
      ]
    })
    .select('username firstName lastName displayName avatarUrl status lastSeen')
    .limit(parseInt(limit));

    res.status(200).json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
