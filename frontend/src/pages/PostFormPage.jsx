import React, { useState } from "react";
import { createPost } from "../service/postService";

const PostFormPage = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    try {
      const data = await createPost(formData);
      setContent("");
      setImage(null);
      setPreview(null);
      setLoading(false);
      onPostCreated(data.post); // Cập nhật danh sách bài viết
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Hiển thị ảnh xem trước
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "20px", border: "1px solid #ddd" }}
    >
      <textarea
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview && (
        <div style={{ marginTop: "10px" }}>
          <img
            src={preview}
            alt="Xem trước"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ marginTop: "10px", padding: "10px 20px" }}
      >
        {loading ? "Đang đăng..." : "Đăng"}
      </button>
    </form>
  );
};

export default PostFormPage;
