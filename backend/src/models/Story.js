import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["image", "video", "text"],
      required: true
    },
    content: {
      // For text stories
      text: {
        content: { type: String },
        backgroundColor: { type: String, default: "#ffffff" },
        fontFamily: { type: String, default: "Arial" },
        fontSize: { type: Number, default: 16 },
        textColor: { type: String, default: "#000000" },
        textAlign: { type: String, enum: ["left", "center", "right"], default: "center" }
      },
      // For media stories
      media: {
        url: { type: String },
        thumbnail: { type: String },
        filename: { type: String },
        size: { type: Number },
        mimeType: { type: String },
        width: { type: Number },
        height: { type: Number },
        duration: { type: Number }, // For videos
        // Story overlay text
        overlay: {
          text: { type: String },
          x: { type: Number }, // Position percentage
          y: { type: Number },
          color: { type: String },
          fontSize: { type: Number },
          fontFamily: { type: String }
        }
      },
      // Stickers and decorations
      stickers: [{
        type: { type: String }, // emoji, gif, location, poll, etc.
        data: { type: mongoose.Schema.Types.Mixed },
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
        rotation: { type: Number, default: 0 }
      }],
      // Music added to story
      music: {
        title: { type: String },
        artist: { type: String },
        url: { type: String },
        startTime: { type: Number, default: 0 },
        duration: { type: Number }
      }
    },
    // Story privacy
    privacy: {
      type: String,
      enum: ["public", "friends", "close_friends", "custom"],
      default: "friends"
    },
    // Custom privacy for close friends or specific users
    customPrivacy: {
      allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }],
      isCloseFriends: { type: Boolean, default: false }
    },
    // Story interactions
    views: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      viewedAt: {
        type: Date,
        default: Date.now
      },
      viewDuration: { type: Number } // In seconds
    }],
    viewCount: {
      type: Number,
      default: 0
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      type: {
        type: String,
        enum: ["like", "love", "haha", "wow", "sad", "angry", "fire", "hundred"],
        default: "like"
      },
      emoji: {
        type: String,
        enum: ["👍", "❤️", "😂", "😮", "😢", "😠", "🔥", "💯"]
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Story replies (private messages)
    replyCount: {
      type: Number,
      default: 0
    },
    // Tagged users in story
    taggedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    // Location tag
    location: {
      name: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      placeId: { type: String }
    },
    // Story highlights (saved stories)
    isHighlight: {
      type: Boolean,
      default: false
    },
    highlightTitle: {
      type: String
    },
    // Story expiration (24 hours by default)
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      }
    },
    // Story status
    isActive: {
      type: Boolean,
      default: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    },
    // Story sharing settings
    allowSharing: {
      type: Boolean,
      default: true
    },
    allowSaving: {
      type: Boolean,
      default: true
    },
    // Story analytics
    analytics: {
      totalReach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      profileVisits: { type: Number, default: 0 },
      websiteClicks: { type: Number, default: 0 },
      emailClicks: { type: Number, default: 0 },
      callClicks: { type: Number, default: 0 }
    }
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ isActive: 1 });
storySchema.index({ isHighlight: 1 });
storySchema.index({ taggedUsers: 1 });
storySchema.index({ privacy: 1 });

// TTL index for automatic deletion of expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if story is expired
storySchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for story age in hours
storySchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Pre-save middleware
storySchema.pre('save', function(next) {
  // Archive expired stories instead of deleting them if they are highlights
  if (this.isExpired && this.isHighlight && this.isActive) {
    this.isActive = false;
    this.isArchived = true;
    this.archivedAt = new Date();
  }
  
  next();
});

// Instance methods
storySchema.methods.addView = function(userId, viewDuration = 0) {
  // Check if user already viewed this story
  const existingView = this.views.find(v => v.user.toString() === userId.toString());
  
  if (!existingView) {
    this.views.push({ 
      user: userId, 
      viewedAt: new Date(),
      viewDuration: viewDuration 
    });
    this.viewCount = this.views.length;
    this.analytics.impressions += 1;
  }
  
  return this.save();
};

storySchema.methods.addReaction = function(userId, reactionType, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ 
    user: userId, 
    type: reactionType, 
    emoji: emoji 
  });
  
  return this.save();
};

storySchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

storySchema.methods.saveAsHighlight = function(title) {
  this.isHighlight = true;
  this.highlightTitle = title;
  this.allowSharing = true;
  this.allowSaving = true;
  return this.save();
};

storySchema.methods.removeFromHighlight = function() {
  this.isHighlight = false;
  this.highlightTitle = undefined;
  return this.save();
};

// Static methods
storySchema.statics.getActiveStories = function(userId = null) {
  const query = { 
    isActive: true, 
    expiresAt: { $gt: new Date() } 
  };
  
  if (userId) {
    query.author = userId;
  }
  
  return this.find(query)
    .populate('author', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });
};

storySchema.statics.getStoriesForUser = function(userId, privacy = ['public', 'friends']) {
  return this.find({
    author: { $ne: userId }, // Not user's own stories
    isActive: true,
    expiresAt: { $gt: new Date() },
    privacy: { $in: privacy }
  })
  .populate('author', 'username displayName avatarUrl')
  .sort({ createdAt: -1 });
};

storySchema.statics.getHighlights = function(userId) {
  return this.find({
    author: userId,
    isHighlight: true
  })
  .sort({ createdAt: -1 });
};

const Story = mongoose.model("Story", storySchema);

export default Story; 