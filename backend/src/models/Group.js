import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    about: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    // Group creator and admins
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    admins: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    moderators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Group members
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      role: {
        type: String,
        enum: ["member", "moderator", "admin"],
        default: "member"
      },
      status: {
        type: String,
        enum: ["active", "banned", "muted"],
        default: "active"
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      // Member-specific settings
      notifications: {
        all: { type: Boolean, default: true },
        highlights: { type: Boolean, default: true },
        friends: { type: Boolean, default: true }
      },
      // Moderation info
      warnings: [{
        reason: { type: String },
        givenBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        givenAt: { type: Date, default: Date.now }
      }],
      mutedUntil: { type: Date },
      bannedReason: { type: String },
      bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      bannedAt: { type: Date }
    }],
    memberCount: {
      type: Number,
      default: 0
    },
    // Group join requests
    joinRequests: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      message: { type: String }, // Optional message from user
      questions: [{ // Answers to admin questions
        question: { type: String },
        answer: { type: String }
      }]
    }],
    // Group privacy and settings
    privacy: {
      type: String,
      enum: ["public", "private", "secret"],
      default: "public"
    },
    visibility: {
      type: String,
      enum: ["visible", "hidden"], // Whether group shows up in search
      default: "visible"
    },
    // Group posting permissions
    postApproval: {
      required: { type: Boolean, default: false },
      moderatorCanPost: { type: Boolean, default: true },
      memberCanPost: { type: Boolean, default: true },
      pendingPosts: [{
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post"
        },
        submittedAt: { type: Date, default: Date.now },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        reviewedAt: { type: Date },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending"
        },
        rejectionReason: { type: String }
      }]
    },
    // Group joining settings
    joinSettings: {
      adminApproval: { type: Boolean, default: false },
      allowMemberInvites: { type: Boolean, default: true },
      questions: [{ // Questions for new members
        question: { type: String },
        required: { type: Boolean, default: false }
      }]
    },
    // Group media and branding
    coverPhoto: {
      url: { type: String },
      filename: { type: String }
    },
    profilePhoto: {
      url: { type: String },
      filename: { type: String }
    },
    // Group location
    location: {
      name: { type: String },
      address: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      city: { type: String },
      country: { type: String }
    },
    // Group categories and tags
    category: {
      type: String,
      enum: [
        "buy_and_sell", "education", "entertainment", "family_and_parenting",
        "fitness_and_wellness", "food_and_cooking", "gaming", "health_and_support",
        "hobbies_and_activities", "local_community", "music", "news_and_politics",
        "photography", "professional_networking", "religion_and_spirituality",
        "social_issues", "sports", "technology", "travel", "other"
      ]
    },
    tags: [{ type: String }],
    // Group rules
    rules: [{
      title: { type: String, required: true },
      description: { type: String },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: { type: Date, default: Date.now }
    }],
    // Group announcements
    announcements: [{
      title: { type: String, required: true },
      content: { type: String, required: true },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: { type: Date, default: Date.now },
      isPinned: { type: Boolean, default: false }
    }],
    // Group events
    events: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event"
    }],
    // Group activity metrics
    metrics: {
      totalPosts: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      dailyActiveMembers: { type: Number, default: 0 },
      weeklyActiveMembers: { type: Number, default: 0 },
      monthlyActiveMembers: { type: Number, default: 0 },
      lastActivity: { type: Date, default: Date.now }
    },
    // Group status
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
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // Featured content
    featuredPosts: [{
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
      },
      featuredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      featuredAt: { type: Date, default: Date.now }
    }],
    // Group links and resources
    links: [{
      title: { type: String },
      url: { type: String },
      description: { type: String },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      addedAt: { type: Date, default: Date.now }
    }]
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes
groupSchema.index({ name: "text", description: "text", tags: "text" });
groupSchema.index({ creator: 1 });
groupSchema.index({ "members.user": 1 });
groupSchema.index({ privacy: 1 });
groupSchema.index({ category: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ "location.coordinates": "2dsphere" });
groupSchema.index({ memberCount: -1 });
groupSchema.index({ "metrics.lastActivity": -1 });

// Virtual for admin check
groupSchema.virtual('adminCount').get(function() {
  return this.admins.length;
});

// Virtual for total member count including admins and moderators
groupSchema.virtual('totalMemberCount').get(function() {
  return this.members.filter(m => m.status === 'active').length;
});

// Pre-save middleware
groupSchema.pre('save', function(next) {
  // Update member count
  this.memberCount = this.members.filter(m => m.status === 'active').length;
  
  // Update last activity
  this.metrics.lastActivity = new Date();
  
  next();
});

// Instance methods
groupSchema.methods.addMember = function(userId, invitedBy = null) {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member');
  }
  
  this.members.push({
    user: userId,
    joinedAt: new Date(),
    invitedBy: invitedBy
  });
  
  return this.save();
};

groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

groupSchema.methods.promoteToAdmin = function(userId, promotedBy) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.role = 'admin';
    this.admins.push({
      user: userId,
      addedBy: promotedBy,
      addedAt: new Date()
    });
  }
  return this.save();
};

groupSchema.methods.promoteToModerator = function(userId, promotedBy) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.role = 'moderator';
    this.moderators.push({
      user: userId,
      addedBy: promotedBy,
      addedAt: new Date()
    });
  }
  return this.save();
};

groupSchema.methods.banMember = function(userId, bannedBy, reason) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.status = 'banned';
    member.bannedBy = bannedBy;
    member.bannedReason = reason;
    member.bannedAt = new Date();
  }
  return this.save();
};

groupSchema.methods.muteMember = function(userId, muteUntil, reason) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.status = 'muted';
    member.mutedUntil = muteUntil;
    member.warnings.push({
      reason: reason,
      givenAt: new Date()
    });
  }
  return this.save();
};

groupSchema.methods.addJoinRequest = function(userId, message = '', answers = []) {
  // Check if user already has a pending request
  const existingRequest = this.joinRequests.find(r => r.user.toString() === userId.toString());
  if (existingRequest) {
    throw new Error('Join request already exists');
  }
  
  this.joinRequests.push({
    user: userId,
    message: message,
    questions: answers,
    requestedAt: new Date()
  });
  
  return this.save();
};

groupSchema.methods.approveJoinRequest = function(userId, approvedBy) {
  const requestIndex = this.joinRequests.findIndex(r => r.user.toString() === userId.toString());
  if (requestIndex === -1) {
    throw new Error('Join request not found');
  }
  
  // Remove from join requests
  this.joinRequests.splice(requestIndex, 1);
  
  // Add as member
  return this.addMember(userId, approvedBy);
};

groupSchema.methods.rejectJoinRequest = function(userId) {
  this.joinRequests = this.joinRequests.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

groupSchema.methods.addRule = function(title, description, createdBy) {
  this.rules.push({
    title,
    description,
    createdBy,
    createdAt: new Date()
  });
  return this.save();
};

groupSchema.methods.addAnnouncement = function(title, content, createdBy, isPinned = false) {
  this.announcements.push({
    title,
    content,
    createdBy,
    isPinned,
    createdAt: new Date()
  });
  return this.save();
};

// Static methods
groupSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true, 
    privacy: { $in: ['public'] }
  }).sort({ memberCount: -1 });
};

groupSchema.statics.searchGroups = function(query, location = null) {
  const searchQuery = {
    $text: { $search: query },
    isActive: true,
    privacy: 'public'
  };
  
  if (location) {
    searchQuery['location.coordinates'] = {
      $near: {
        $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
        $maxDistance: 50000 // 50km radius
      }
    };
  }
  
  return this.find(searchQuery).sort({ memberCount: -1 });
};

const Group = mongoose.model("Group", groupSchema);

export default Group; 