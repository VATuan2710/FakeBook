import dotenv from "dotenv";
import Posts from "../models/Posts.js";
import Comment from "../models/Comment.js";
import cloudinary from "../config/cloudinaryConfig.js";

dotenv.config();

// **API: Tạo bài viết mới**
export const createPost = async (req, res) => {
  try {
    const { content, privacy = "friends", type = "text" } = req.body;
    const { userId } = req.user;
    
    if (!content) {
      return res.status(400).json({ message: "Nội dung bài viết không được để trống" });
    }

    let imageUrl = "";
    let mediaArray = [];

    // Handle file upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "uploads",
        });
        imageUrl = result.secure_url;
        
        // Create media object for new schema
        mediaArray = [{
          type: "image",
          url: result.secure_url,
          thumbnail: result.secure_url,
          size: req.file.size,
          filename: req.file.filename
        }];
      } catch (uploadError) {
        console.error("Lỗi upload cloudinary:", uploadError);
        return res.status(500).json({ message: "Lỗi khi upload hình ảnh" });
      }
    }

    console.log("File nhận được:", req.file);

    // Create post with backward compatibility
    const postData = {
      // New schema fields
      author: userId,
      content: content,
      text: {
        content: content
      },
      type: imageUrl ? "photo" : type,
      privacy: privacy,
      media: mediaArray,
      
      // Legacy fields for backward compatibility
      userId: userId,
      imageUrl: imageUrl,
      
      // Initialize arrays
      reactions: [],
      comments: []
    };

    const newPost = new Posts(postData);
    await newPost.save();

    // Populate author information for response
    await newPost.populate('author', 'displayName username avatarUrl');

    res.status(201).json({ 
      message: "Tạo bài viết thành công",
      post: newPost
    });
  } catch (error) {
    console.error("Lỗi khi đăng bài:", error);
    res.status(500).json({ 
      message: "Lỗi server khi tạo bài viết",
      error: error.message 
    });
  }
};

// **API: Lấy tất cả bài viết của user**
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const posts = await Posts.find({ 
      $or: [
        { userId: userId },
        { author: userId }
      ],
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    })
    .populate('author', 'displayName username avatarUrl')
    .populate('userId', 'displayName username avatarUrl') // Legacy support
    .populate('reactions.user', 'displayName avatarUrl')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

    // Format posts for frontend compatibility
    const formattedPosts = posts.map(post => ({
      ...post.toObject(),
      // Ensure backward compatibility
      userId: post.userId || post.author,
      author: post.author || post.userId,
      content: post.content || post.text?.content || "",
      imageUrl: post.imageUrl || (post.media && post.media[0] ? post.media[0].url : ""),
      likesCount: post.likesCount || (post.reactions ? post.reactions.filter(r => r.type === 'like').length : 0),
      commentsCount: post.commentsCount || (post.comments ? post.comments.length : 0)
    }));

    res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.error("Lỗi khi lấy bài viết của user:", error);
    res.status(500).json({ 
      message: "Lỗi server khi lấy bài viết",
      error: error.message 
    });
  }
};

// **API: Lấy tất cả bài viết (feed)**
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const currentUserId = req.user?.userId;

    const posts = await Posts.find({
      isDeleted: { $ne: true },
      isArchived: { $ne: true },
      isPublished: { $ne: false }
    })
    .populate('author', 'displayName username avatarUrl')
    .populate('userId', 'displayName username avatarUrl') // Legacy support
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'displayName username avatarUrl'
      },
      options: { limit: 3, sort: { createdAt: -1 } }
    })
    .populate('reactions.user', 'displayName avatarUrl')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

    const totalPosts = await Posts.countDocuments({
      isDeleted: { $ne: true },
      isArchived: { $ne: true },
      isPublished: { $ne: false }
    });

    // Format posts for frontend compatibility
    const formattedPosts = posts.map(post => {
      const postObj = post.toObject();
      
      return {
        ...postObj,
        // Ensure backward compatibility
        userId: postObj.userId || postObj.author,
        author: postObj.author || postObj.userId,
        content: postObj.content || postObj.text?.content || "",
        imageUrl: postObj.imageUrl || (postObj.media && postObj.media[0] ? postObj.media[0].url : ""),
        likesCount: postObj.likesCount || (postObj.reactions ? postObj.reactions.filter(r => r.type === 'like').length : 0),
        commentsCount: postObj.commentsCount || (postObj.comments ? postObj.comments.length : 0),
        
        // Add new fields for enhanced features
        reactionsCount: postObj.reactions ? postObj.reactions.length : 0,
        reactionsSummary: postObj.reactions ? postObj.reactions.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        }, {}) : {},
        
        userReaction: currentUserId && postObj.reactions ? 
          postObj.reactions.find(r => r.user.toString() === currentUserId.toString())?.type : null
      };
    });

    console.log(`Trả về ${formattedPosts.length} bài viết`);
    res.status(200).json({ 
      posts: formattedPosts, 
      totalPosts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalPosts / limit)
    });
  } catch (error) {
    console.error("Lỗi khi lấy tất cả bài viết:", error);
    res.status(500).json({ 
      message: "Lỗi server khi lấy bài viết",
      error: error.message 
    });
  }
};

// **API: Thêm/xóa reaction cho bài viết**
export const toggleReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType = "like" } = req.body;
    const { userId } = req.user;

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    await post.addReaction(userId, reactionType);
    await post.populate('reactions.user', 'displayName avatarUrl');

    res.status(200).json({
      message: "Cập nhật reaction thành công",
      reactions: post.reactions,
      reactionsCount: post.reactions.length,
      reactionsSummary: post.reactions.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {}),
      userReaction: post.getUserReaction(userId)
    });
  } catch (error) {
    console.error("Lỗi khi toggle reaction:", error);
    res.status(500).json({ 
      message: "Lỗi server khi cập nhật reaction",
      error: error.message 
    });
  }
};

// **API: Xóa bài viết**
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.user;

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    // Check if user is the author
    const isAuthor = post.author?.toString() === userId || post.userId?.toString() === userId;
    if (!isAuthor) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
    }

    // Soft delete
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.status(200).json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    res.status(500).json({ 
      message: "Lỗi server khi xóa bài viết",
      error: error.message 
    });
  }
};

// **API: Cập nhật bài viết**
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, privacy } = req.body;
    const { userId } = req.user;

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    // Check if user is the author
    const isAuthor = post.author?.toString() === userId || post.userId?.toString() === userId;
    if (!isAuthor) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài viết này" });
    }

    // Update fields
    if (content !== undefined) {
      post.content = content;
      if (!post.text) post.text = {};
      post.text.content = content;
    }
    
    if (privacy !== undefined) {
      post.privacy = privacy;
    }

    await post.save();
    await post.populate('author', 'displayName username avatarUrl');

    res.status(200).json({
      message: "Cập nhật bài viết thành công",
      post: post
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({ 
      message: "Lỗi server khi cập nhật bài viết",
      error: error.message 
    });
  }
};

// **API: Tạo comment cho bài viết**
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentComment = null } = req.body;
    const { userId } = req.user;

    if (!content?.text?.trim()) {
      return res.status(400).json({ message: "Nội dung comment không được để trống" });
    }

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    // Create comment
    const commentData = {
      postId: postId,
      author: userId,
      content: {
        text: content.text || content
      },
      parentComment: parentComment,
      level: 0
    };

    // If it's a reply, set the level
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent) {
        commentData.level = parent.level + 1;
        if (commentData.level > 3) {
          return res.status(400).json({ message: "Không thể reply quá 3 cấp" });
        }
      }
    }

    const newComment = new Comment(commentData);
    await newComment.save();

    // Add comment to post
    post.comments.push(newComment._id);
    post.commentsCount += 1;
    await post.save();

    // Populate comment data
    await newComment.populate('author', 'displayName username avatarUrl');

    res.status(201).json({
      message: "Tạo comment thành công",
      comment: newComment
    });
  } catch (error) {
    console.error("Lỗi khi tạo comment:", error);
    res.status(500).json({ 
      message: "Lỗi server khi tạo comment",
      error: error.message 
    });
  }
};

// **API: Lấy comments của bài viết**
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10, sort = "desc" } = req.query;

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const sortOrder = sort === "asc" ? 1 : -1;
    
    // Get top-level comments (not replies)
    const comments = await Comment.find({
      postId: postId,
      parentComment: null,
      isDeleted: false
    })
    .populate('author', 'displayName username avatarUrl')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'displayName username avatarUrl'
      },
      match: { isDeleted: false },
      options: { limit: 3, sort: { createdAt: 1 } } // Show first 3 replies
    })
    .sort({ isPinned: -1, createdAt: sortOrder })
    .skip((page - 1) * limit)
    .limit(Number(limit));

    const totalComments = await Comment.countDocuments({
      postId: postId,
      parentComment: null,
      isDeleted: false
    });

    res.status(200).json({
      comments,
      totalComments,
      currentPage: Number(page),
      totalPages: Math.ceil(totalComments / limit)
    });
  } catch (error) {
    console.error("Lỗi khi lấy comments:", error);
    res.status(500).json({ 
      message: "Lỗi server khi lấy comments",
      error: error.message 
    });
  }
};

// **API: React cho comment**
export const toggleCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reactionType = "like" } = req.body;
    const { userId } = req.user;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(r => r.user.toString() === userId.toString());

    if (existingReaction) {
      if (existingReaction.type === reactionType) {
        // Remove reaction
        comment.reactions = comment.reactions.filter(r => r.user.toString() !== userId.toString());
      } else {
        // Update reaction
        existingReaction.type = reactionType;
        existingReaction.createdAt = new Date();
      }
    } else {
      // Add new reaction
      comment.reactions.push({
        user: userId,
        type: reactionType,
        createdAt: new Date()
      });
    }

    comment.updateReactionCounts();
    await comment.save();
    await comment.populate('reactions.user', 'displayName avatarUrl');

    res.status(200).json({
      message: "Cập nhật reaction comment thành công",
      reactions: comment.reactions,
      reactionCounts: comment.reactionCounts
    });
  } catch (error) {
    console.error("Lỗi khi toggle comment reaction:", error);
    res.status(500).json({ 
      message: "Lỗi server khi cập nhật comment reaction",
      error: error.message 
    });
  }
};

// **API: Chia sẻ bài viết**
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { shareText = "" } = req.body;
    const { userId } = req.user;

    const originalPost = await Posts.findById(postId);
    if (!originalPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    // Create shared post
    const sharedPostData = {
      author: userId,
      content: shareText,
      text: {
        content: shareText
      },
      type: "shared_post",
      originalPost: postId,
      shareText: shareText,
      privacy: "friends", // Default privacy for shared posts
      reactions: [],
      comments: []
    };

    const sharedPost = new Posts(sharedPostData);
    await sharedPost.save();

    // Increment shares count on original post
    originalPost.sharesCount += 1;
    await originalPost.save();

    // Populate shared post
    await sharedPost.populate([
      { path: 'author', select: 'displayName username avatarUrl' },
      { 
        path: 'originalPost', 
        populate: { 
          path: 'author', 
          select: 'displayName username avatarUrl' 
        }
      }
    ]);

    res.status(201).json({
      message: "Chia sẻ bài viết thành công",
      sharedPost: sharedPost
    });
  } catch (error) {
    console.error("Lỗi khi chia sẻ bài viết:", error);
    res.status(500).json({ 
      message: "Lỗi server khi chia sẻ bài viết",
      error: error.message 
    });
  }
};

// **API: Xóa comment**
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.user;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    // Check if user is the author of comment or post
    const post = await Posts.findById(comment.postId);
    const isCommentAuthor = comment.author.toString() === userId;
    const isPostAuthor = post.author?.toString() === userId || post.userId?.toString() === userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "Bạn không có quyền xóa comment này" });
    }

    // Soft delete
    await comment.softDelete(userId);

    // Update post comment count
    post.commentsCount = Math.max(0, post.commentsCount - 1);
    await post.save();

    res.status(200).json({ message: "Xóa comment thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa comment:", error);
    res.status(500).json({ 
      message: "Lỗi server khi xóa comment",
      error: error.message 
    });
  }
};
