import instance from ".";

// Tạo bài viết mới (Gửi form-data có ảnh)
export const createPost = async (formData) => {
  try {
    const { data } = await instance.post("/posts/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    throw error;
  }
};

// Cập nhật bài viết
export const updatePost = async (postId, postData) => {
  try {
    const { data } = await instance.put(`/posts/${postId}`, postData);
    return data;
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    throw error;
  }
};

// Xóa bài viết
export const deletePost = async (postId) => {
  try {
    const { data } = await instance.delete(`/posts/${postId}`);
    return data;
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    throw error;
  }
};

// Lấy tất cả bài viết (bao gồm ảnh từ Cloudflare)
export const getPosts = async (page = 1, limit = 10) => {
  try {
    const { data } = await instance.get(
      `/posts/get-all-posts?page=${page}&limit=${limit}`
    );
    console.log("Dữ liệu trả về từ API:", data);
    return data;
  } catch (error) {
    console.error(
      "Lỗi khi lấy bài viết:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Lấy bài viết của user
export const getUserPosts = async (page = 1, limit = 10) => {
  try {
    const { data } = await instance.get(
      `/posts/get-post?page=${page}&limit=${limit}`
    );
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy bài viết của user:", error);
    throw error;
  }
};

// Toggle reaction cho bài viết (thay thế like)
export const toggleReaction = async (postId, reactionType = "like") => {
  try {
    const { data } = await instance.post(`/posts/${postId}/reaction`, {
      reactionType
    });
    return data;
  } catch (error) {
    console.error("Lỗi khi toggle reaction:", error);
    throw error;
  }
};

// Legacy support - Thích bài viết (wrapper cho toggleReaction)
export const likePost = async (postId) => {
  return toggleReaction(postId, "like");
};

// Thêm các reaction khác
export const lovePost = async (postId) => {
  return toggleReaction(postId, "love");
};

export const laughPost = async (postId) => {
  return toggleReaction(postId, "haha");
};

export const wowPost = async (postId) => {
  return toggleReaction(postId, "wow");
};

export const sadPost = async (postId) => {
  return toggleReaction(postId, "sad");
};

export const angryPost = async (postId) => {
  return toggleReaction(postId, "angry");
};

// Bình luận bài viết - CẬP NHẬT API MỚI
export const commentOnPost = async (postId, comment) => {
  try {
    const response = await instance.post(`/posts/${postId}/comment`, {
      content: { text: comment }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi bình luận bài viết:", error);
    throw error;
  }
};

// Lấy comments của bài viết - CẬP NHẬT API MỚI
export const getPostComments = async (postId, page = 1, limit = 10) => {
  try {
    const { data } = await instance.get(
      `/posts/${postId}/comments?page=${page}&limit=${limit}`
    );
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy comments:", error);
    throw error;
  }
};

// React cho comment - API MỚI
export const toggleCommentReaction = async (commentId, reactionType = "like") => {
  try {
    const { data } = await instance.post(`/posts/comments/${commentId}/reaction`, {
      reactionType
    });
    return data;
  } catch (error) {
    console.error("Lỗi khi react comment:", error);
    throw error;
  }
};

// Xóa comment - API MỚI
export const deleteComment = async (commentId) => {
  try {
    const { data } = await instance.delete(`/posts/comments/${commentId}`);
    return data;
  } catch (error) {
    console.error("Lỗi khi xóa comment:", error);
    throw error;
  }
};

// Chia sẻ bài viết - CẬP NHẬT API MỚI
export const sharePost = async (postId, shareText = "") => {
  try {
    const { data } = await instance.post(`/posts/${postId}/share`, {
      shareText
    });
    return data;
  } catch (error) {
    console.error("Lỗi khi chia sẻ bài viết:", error);
    throw error;
  }
};

// Báo cáo bài viết
export const reportPost = async (postId, reason, description = "") => {
  try {
    const { data } = await instance.post(`/posts/${postId}/report`, {
      reason,
      description
    });
    return data;
  } catch (error) {
    console.error("Lỗi khi báo cáo bài viết:", error);
    throw error;
  }
};

// Lưu/bỏ lưu bài viết
export const savePost = async (postId) => {
  try {
    const { data } = await instance.post(`/posts/${postId}/save`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lưu bài viết:", error);
    throw error;
  }
};

// Ẩn bài viết
export const hidePost = async (postId) => {
  try {
    const { data } = await instance.post(`/posts/${postId}/hide`);
    return data;
  } catch (error) {
    console.error("Lỗi khi ẩn bài viết:", error);
    throw error;
  }
};

// Tìm kiếm bài viết
export const searchPosts = async (query, page = 1, limit = 10) => {
  try {
    const { data } = await instance.get(
      `/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return data;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm bài viết:", error);
    throw error;
  }
};

// Helper function để format reaction count
export const formatReactionCount = (count) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Helper function để lấy emoji reaction
export const getReactionEmoji = (type) => {
  const emojis = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😠"
  };
  return emojis[type] || "👍";
};

// Helper function để format reaction summary
export const formatReactionSummary = (reactionsSummary) => {
  if (!reactionsSummary || Object.keys(reactionsSummary).length === 0) {
    return "";
  }
  
  // Sắp xếp reactions theo thứ tự ưu tiên
  const priorityOrder = ["like", "love", "haha", "wow", "sad", "angry"];
  const sortedReactions = Object.entries(reactionsSummary)
    .sort(([a], [b]) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b))
    .slice(0, 3); // Hiển thị tối đa 3 loại reaction
  
  return sortedReactions
    .map(([type, count]) => `${getReactionEmoji(type)} ${count}`)
    .join(" ");
};
