import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // Message type determines how to display the message
  type: {
    type: String,
    enum: [
      "text", 
      "image", 
      "video", 
      "audio", 
      "file", 
      "sticker", 
      "gif", 
      "location", 
      "contact",
      "system", // For system messages like "User joined group"
      "call", // For call notifications
      "link" // For shared links with preview
    ],
    default: "text"
  },
  // Main message content
  content: {
    text: { type: String },
    // For media messages
    media: {
      url: { type: String },
      filename: { type: String },
      size: { type: Number },
      mimeType: { type: String },
      duration: { type: Number }, // For audio/video
      thumbnail: { type: String }, // For video/images
      width: { type: Number },
      height: { type: Number }
    },
    // For location messages
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      name: { type: String }
    },
    // For contact messages
    contact: {
      name: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    // For link messages with preview
    link: {
      url: { type: String },
      title: { type: String },
      description: { type: String },
      image: { type: String },
      siteName: { type: String }
    },
    // For call messages
    call: {
      type: { type: String, enum: ["voice", "video"] },
      duration: { type: Number }, // in seconds
      status: { type: String, enum: ["missed", "completed", "declined", "busy"] }
    }
  },
  // Reply functionality
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  // Forward functionality
  forwardedFrom: {
    originalMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    originalSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  // Message reactions (like, love, laugh, etc.)
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    emoji: {
      type: String,
      enum: ["👍", "❤️", "😂", "😮", "😢", "😡", "👎"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message status
  status: {
    type: String,
    enum: ["sending", "sent", "delivered", "read", "failed"],
    default: "sent"
  },
  // Message priority
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },
  // Scheduled messages
  scheduledFor: {
    type: Date
  },
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
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // Message encryption
  isEncrypted: {
    type: Boolean,
    default: false
  },
  // Mentioned users in the message
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    startIndex: { type: Number },
    length: { type: Number }
  }],
  // Hashtags in the message
  hashtags: [{ type: String }],
  // Message metadata
  metadata: {
    deviceInfo: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ "readBy.user": 1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ scheduledFor: 1 });
messageSchema.index({ "mentions.user": 1 });

// Text search index
messageSchema.index({ 
  "content.text": "text",
  hashtags: "text"
});

// Pre-save middleware to handle message validation
messageSchema.pre('save', function(next) {
  // Ensure content matches message type
  if (this.type === 'text' && !this.content.text) {
    return next(new Error('Text messages must have content.text'));
  }
  if (this.type === 'image' && !this.content.media?.url) {
    return next(new Error('Image messages must have content.media.url'));
  }
  // Add more validations as needed
  next();
});

// Instance methods
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  return this.save();
};

messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  return this.save();
};

messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

const Message = mongoose.model("Message", messageSchema, "messages");

export default Message;
