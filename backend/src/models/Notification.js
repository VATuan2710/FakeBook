import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accept", 
        "friend_reject",
        "post_like",
        "post_love",
        "post_haha", 
        "post_wow",
        "post_sad",
        "post_angry",
        "post_comment",
        "comment_reply",
        "post_share",
        "post_mention",
        "story_view",
        "story_reaction",
        "group_invite",
        "group_accept",
        "group_post",
        "group_comment",
        "group_mention",
        "page_like",
        "page_follow",
        "event_invite",
        "event_going",
        "event_interested",
        "birthday",
        "memory",
        "video_call",
        "message",
        "live_video",
        "marketplace_message",
        "job_alert",
        "dating_match",
        "gaming_invite",
        "payment_sent",
        "payment_received"
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionData: {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: "Posts" },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
      storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
      pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page" },
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
      url: { type: String },
      metadata: { type: mongoose.Schema.Types.Mixed }
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal"
    },
    deliveryStatus: {
      push: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false }
    },
    groupedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification"
    }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

// Indexes for better performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

notificationSchema.methods.markAsDelivered = function(channel) {
  if (this.deliveryStatus[channel] !== undefined) {
    this.deliveryStatus[channel] = true;
    return this.save();
  }
  return Promise.reject(new Error('Invalid delivery channel'));
};

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

notificationSchema.statics.getNotificationsByType = function(userId, type, limit = 20) {
  return this.find({ user: userId, type })
    .populate('sender', 'username firstName lastName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit);
};

notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Populate sender info for real-time updates
  await notification.populate('sender', 'username firstName lastName avatarUrl');
  
  return notification;
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification; 