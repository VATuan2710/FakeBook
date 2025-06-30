import mongoose from "mongoose";

const postsSchema = new mongoose.Schema(
  {
    // Backward compatibility: support both old and new author field
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return !this.userId; // Required only if userId is not present
      }
    },
    // Legacy field for backward compatibility
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return !this.author; // Required only if author is not present
      }
    },
    
    // Content field - backward compatible
    content: {
      type: String,
      required: function() {
        return !this.text?.content; // Required if new text format is not used
      }
    },
    
    // New structured content (optional for backward compatibility)
    text: {
      content: { type: String },
      mentions: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        displayName: String 
      }],
      hashtags: [String],
      links: [{
        url: String,
        title: String,
        description: String,
        image: String
      }]
    },
    
    type: {
      type: String,
      enum: ["text", "photo", "video", "poll", "event", "shared_post", "memory"],
      default: function() {
        // Auto-detect type based on content
        if (this.media && this.media.length > 0) {
          return this.media[0].type === 'image' ? 'photo' : 'video';
        }
        return 'text';
      }
    },
    
    // Legacy imageUrl field for backward compatibility
    imageUrl: {
      type: String,
      default: ""
    },
    
    // New media array
    media: [{
      type: {
        type: String,
        enum: ["image", "video", "audio", "document"],
        default: function() {
          // Try to detect from legacy imageUrl
          if (this.parent().imageUrl) return "image";
          return "image";
        }
      },
      url: { 
        type: String,
        default: function() {
          // Use legacy imageUrl if available
          return this.parent().imageUrl || "";
        }
      },
      thumbnail: String,
      caption: String,
      duration: Number, // for videos/audio
      size: Number,
      dimensions: {
        width: Number,
        height: Number
      }
    }],
    
    // Privacy settings
    privacy: {
      type: String,
      enum: ["public", "friends", "friends_of_friends", "only_me", "custom"],
      default: "friends"
    },
    
    customPrivacy: {
      allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      excludedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },
    
    // Location data
    location: {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      address: String
    },
    
    // Reactions (replacing simple likes)
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      type: { 
        type: String, 
        enum: ["like", "love", "haha", "wow", "sad", "angry"],
        required: true 
      },
      createdAt: { type: Date, default: Date.now }
    }],
    
    // Legacy likes count for backward compatibility
    likesCount: {
      type: Number,
      default: function() {
        return this.reactions ? this.reactions.filter(r => r.type === 'like').length : 0;
      }
    },
    
    // Comments
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }],
    
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    
    // Sharing data
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "Posts" },
    shareText: String,
    
    // Poll data (for poll posts)
    poll: {
      question: String,
      options: [{
        text: String,
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        imageUrl: String
      }],
      allowMultiple: { type: Boolean, default: false },
      expiresAt: Date
    },
    
    // Event data (for event posts)
    event: {
      title: String,
      description: String,
      startDate: Date,
      endDate: Date,
      location: String,
      attendees: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["going", "interested", "not_going"], default: "interested" }
      }]
    },
    
    // Post scheduling
    scheduledAt: Date,
    isPublished: { type: Boolean, default: true },
    
    // Moderation
    isReported: { type: Boolean, default: false },
    reports: [{
      reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, enum: ["spam", "inappropriate", "harassment", "fake_news", "other"] },
      description: String,
      createdAt: { type: Date, default: Date.now }
    }],
    
    // Analytics
    views: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 },
    
    // Visibility settings
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    
    // Legacy fields support
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

// Pre-save middleware for backward compatibility
postsSchema.pre('save', function(next) {
  // Sync author and userId fields
  if (this.userId && !this.author) {
    this.author = this.userId;
  } else if (this.author && !this.userId) {
    this.userId = this.author;
  }
  
  // Sync content with text.content
  if (this.content && !this.text?.content) {
    if (!this.text) this.text = {};
    this.text.content = this.content;
  } else if (this.text?.content && !this.content) {
    this.content = this.text.content;
  }
  
  // Handle legacy imageUrl
  if (this.imageUrl && (!this.media || this.media.length === 0)) {
    this.media = [{
      type: "image",
      url: this.imageUrl,
      thumbnail: this.imageUrl
    }];
  } else if (this.media && this.media.length > 0 && !this.imageUrl) {
    this.imageUrl = this.media[0].url;
  }
  
  // Update counts
  this.likesCount = this.reactions ? this.reactions.filter(r => r.type === 'like').length : 0;
  this.commentsCount = this.comments ? this.comments.length : 0;
  
  next();
});

// Virtual for total reactions count
postsSchema.virtual('reactionsCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual for reaction summary
postsSchema.virtual('reactionsSummary').get(function() {
  if (!this.reactions || this.reactions.length === 0) return {};
  
  const summary = {};
  this.reactions.forEach(reaction => {
    summary[reaction.type] = (summary[reaction.type] || 0) + 1;
  });
  return summary;
});

// Indexes for performance
postsSchema.index({ author: 1, createdAt: -1 });
postsSchema.index({ userId: 1, createdAt: -1 }); // Legacy support
postsSchema.index({ privacy: 1 });
postsSchema.index({ createdAt: -1 });
postsSchema.index({ isDeleted: 1, isArchived: 1 });
postsSchema.index({ "text.hashtags": 1 });
postsSchema.index({ "text.content": "text" });

// Instance methods
postsSchema.methods.addReaction = function(userId, reactionType) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString());
  
  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      // Remove reaction
      this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
    } else {
      // Update reaction
      existingReaction.type = reactionType;
      existingReaction.createdAt = new Date();
    }
  } else {
    // Add new reaction
    this.reactions.push({
      user: userId,
      type: reactionType,
      createdAt: new Date()
    });
  }
  
  this.likesCount = this.reactions.filter(r => r.type === 'like').length;
  return this.save();
};

postsSchema.methods.getUserReaction = function(userId) {
  const reaction = this.reactions.find(r => r.user.toString() === userId.toString());
  return reaction ? reaction.type : null;
};

postsSchema.methods.canUserView = function(userId, userFriends = []) {
  if (this.isDeleted || this.isArchived) return false;
  
  switch (this.privacy) {
    case 'public':
      return true;
    case 'only_me':
      return this.author.toString() === userId.toString();
    case 'friends':
      return this.author.toString() === userId.toString() || 
             userFriends.includes(this.author.toString());
    case 'custom':
      if (this.customPrivacy.excludedUsers.includes(userId)) return false;
      if (this.customPrivacy.allowedUsers.length === 0) return true;
      return this.customPrivacy.allowedUsers.includes(userId);
    default:
      return true;
  }
};

// Static methods
postsSchema.statics.getPostsForUser = function(userId, userFriends = [], options = {}) {
  const { page = 1, limit = 10, type = null } = options;
  
  const query = {
    isDeleted: false,
    isArchived: false,
    isPublished: true,
    $or: [
      { privacy: 'public' },
      { author: userId },
      { privacy: 'friends', author: { $in: userFriends } }
    ]
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('author', 'displayName avatarUrl username')
    .populate('userId', 'displayName avatarUrl username') // Legacy support
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'displayName avatarUrl username'
      },
      options: { limit: 3, sort: { createdAt: -1 } }
    })
    .populate('reactions.user', 'displayName avatarUrl')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

const Posts = mongoose.model("Posts", postsSchema);

export default Posts;
