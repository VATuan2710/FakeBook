import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({});

export const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      username, 
      firstName, 
      lastName, 
      displayName,
      role 
    } = req.body;

    console.log("Registration data:", { email, username, firstName, lastName });

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username đã được sử dụng!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate firstName và lastName nếu không được cung cấp
    let autoFirstName = firstName;
    let autoLastName = lastName;
    let autoDisplayName = displayName;

    if (!firstName || !lastName) {
      // Extract từ username hoặc email
      const nameFromEmail = email.split('@')[0];
      const nameFromUsername = username;
      
      // Tách username thành firstName và lastName
      const nameParts = nameFromUsername.split(/[._-]/).filter(part => part.length > 0);
      
      if (nameParts.length >= 2) {
        autoFirstName = firstName || nameParts[0];
        autoLastName = lastName || nameParts.slice(1).join(' ');
      } else {
        autoFirstName = firstName || nameFromUsername;
        autoLastName = lastName || "User";
      }
    }

    // Auto-generate displayName nếu không có
    if (!autoDisplayName) {
      autoDisplayName = `${autoFirstName} ${autoLastName}`;
    }

    const userData = {
      email,
      username,
      password: hashedPassword,
      firstName: autoFirstName,
      lastName: autoLastName,
      displayName: autoDisplayName,
      role: role || "member"
    };

    const savedUser = await User.create(userData);

    return res.status(201).json({
      message: "Tạo tài khoản thành công!",
      user: {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        displayName: savedUser.displayName,
        role: savedUser.role,
      },
    });
  } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
    
    // Xử lý lỗi validation cụ thể
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        message: "Dữ liệu không hợp lệ!", 
        errors: validationErrors 
      });
    }
    
    // Xử lý lỗi duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : 'Username'} đã được sử dụng!` 
      });
    }
    
    res.status(500).json({ message: "Lỗi server!" });
  }
};

const { SECRET_KEY } = process.env;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    const isMatch = await bcrypt.compare(password, userExist.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác!" });
    }

    const accessToken = jwt.sign(
      { userId: userExist._id, role: userExist.role },
      SECRET_KEY,
      { expiresIn: "15h" }
    );

    const refreshToken = jwt.sign(
      { userId: userExist._id },
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Lưu Refresh Token vào cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      accessToken,
      user: {
        id: userExist._id,
        email: userExist.email,
        username: userExist.username,
        role: userExist.role,
      },
    });
  } catch (err) {
    console.error("Lỗi khi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(403).json({ message: "Không tìm thấy Refresh Token!" });
    }

    // Xác thực Refresh Token
    jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Refresh Token không hợp lệ!" });
      }

      // Tạo Access Token mới
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.SECRET_KEY,
        { expiresIn: "15m" }
      );

      return res.status(200).json({
        message: "Tạo mới Access Token thành công!",
        accessToken: newAccessToken,
      });
    });
  } catch (err) {
    console.error("Lỗi khi làm mới Access Token:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId, "username email role");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    return res.status(200).json({
      message: "Lấy thông tin người dùng thành công",
      user,
    });
  } catch (err) {
    console.error("Lỗi khi lấy thông tin người dùng:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
