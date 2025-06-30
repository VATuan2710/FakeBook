import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      text: {
        type: String,
        required: true,
        trim: true
      },
      // For image/gif comments
      media: {
        url: { type: String },
        type: { 
          type: String, 
          enum: ["image", "gif", "video"],
        },
        filename: { type: String },
        mimeType: { type: String }
      }
    },
    // For nested comments (replies)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    // Level of nesting (0 = top level, 1 = reply, 2 = reply to reply, etc.)
    level: {
      type: Number,
      default: 0,
      max: 3 // Limit nesting to prevent too deep threads
    },
    // Replies to this comment
    replies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }],
    // Comment reactions
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      type: {
        type: String,
        enum: ["like", "love", "laugh", "angry", "sad", "wow"],
        default: "like"
      },
      emoji: {
        type: String,
        enum: ["👍", "❤️", "😂", "😮", "😢", "😡"]
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Total reaction counts for quick access
    reactionCounts: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      laugh: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    // Mentioned users in the comment
    mentions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      startIndex: { type: Number },
      length: { type: Number }
    }],
    // Hashtags in the comment
    hashtags: [{ type: String }],
    // Edit functionality
    editHistory: [{
      content: { type: mongoose.Schema.Types.Mixed },
      editedAt: { type: Date, default: Date.now }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    // Comment visibility
    isHidden: {
      type: Boolean,
      default: false
    },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // Spam/moderation
    isSpam: {
      type: Boolean,
      default: false
    },
    reportCount: {
      type: Number,
      default: 0
    },
    reports: [{
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reason: {
        type: String,
        enum: ["spam", "harassment", "hate_speech", "false_information", "violence", "nudity", "other"]
      },
      description: { type: String },
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Pinned comments
    isPinned: {
      type: Boolean,
      default: false
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    pinnedAt: {
      type: Date
    }
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

// Indexes for better performance
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ level: 1 });
commentSchema.index({ isDeleted: 1 });
commentSchema.index({ isPinned: 1 });
commentSchema.index({ "mentions.user": 1 });

// Text search index
commentSchema.index({ 
  "content.text": "text",
  hashtags: "text"
});

// Compound indexes
commentSchema.index({ postId: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ postId: 1, isPinned: 1, createdAt: -1 });

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Pre-save middleware
commentSchema.pre('save', function(next) {
  // Set level based on parent comment
  if (this.parentComment && this.isNew) {
    mongoose.model('Comment').findById(this.parentComment)
      .then(parent => {
        if (parent) {
          this.level = parent.level + 1;
          if (this.level > 3) {
            return next(new Error('Maximum comment nesting level reached'));
          }
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Post-save middleware to update parent comment's replies array
commentSchema.post('save', function(doc) {
  if (doc.parentComment && doc.isNew) {
    mongoose.model('Comment').findByIdAndUpdate(
      doc.parentComment,
      { $addToSet: { replies: doc._id } }
    ).exec();
  }
});

// Instance methods
commentSchema.methods.addReaction = function(userId, reactionType, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ 
    user: userId, 
    type: reactionType, 
    emoji: emoji 
  });
  
  // Update reaction counts
  this.updateReactionCounts();
  
  return this.save();
};

commentSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  this.updateReactionCounts();
  return this.save();
};

commentSchema.methods.updateReactionCounts = function() {
  const counts = {
    like: 0, love: 0, laugh: 0, angry: 0, sad: 0, wow: 0, total: 0
  };
  
  this.reactions.forEach(reaction => {
    if (counts.hasOwnProperty(reaction.type)) {
      counts[reaction.type]++;
      counts.total++;
    }
  });
  
  this.reactionCounts = counts;
};

commentSchema.methods.softDelete = function(deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  if (deletedBy) {
    this.deletedBy = deletedBy;
  }
  return this.save();
};

commentSchema.methods.pin = function(pinnedBy) {
  this.isPinned = true;
  this.pinnedBy = pinnedBy;
  this.pinnedAt = new Date();
  return this.save();
};

commentSchema.methods.unpin = function() {
  this.isPinned = false;
  this.pinnedBy = undefined;
  this.pinnedAt = undefined;
  return this.save();
};

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
