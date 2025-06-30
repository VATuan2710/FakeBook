import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Vui lòng cung cấp Access Token!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) { 
    return res
      .status(401)
      .json({ message: "Access Token không hợp lệ hoặc đã hết hạn!" });
  }
};
