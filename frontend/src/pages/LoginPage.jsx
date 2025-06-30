import React, { useEffect, useState } from "react";
import { loginAccount } from "../service/authService";
import { useNavigate } from "react-router-dom";
import "../assets/css/LoginPage.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const nav = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginAccount(formData);
      console.log("Dữ liệu từ API:", response);
      console.log("Token từ API:", response.accessToken);

      setMessage("Đăng nhập thành công!");
      localStorage.setItem("token", response.accessToken);
      nav("/");
    } catch (error) {
      console.error(
        "Lỗi khi đăng nhập:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      nav("/");
    }
  });

  return (
    <div className="login-container">
      <h1>Đăng nhập</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Mật khẩu:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="login-btn">
          Đăng nhập
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default LoginPage;
