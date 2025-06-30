import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      default: "direct"
    },
    name: {
      type: String,
      // Required for group conversations
      required: function() {
        return this.type === "group";
      }
    },
    description: {
      type: String
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      leftAt: {
        type: Date
      },
      isActive: {
        type: Boolean,
        default: true
      },
      // Last time user read messages in this conversation
      lastRead: {
        type: Date,
        default: Date.now
      },
      // User-specific notification settings
      notifications: {
        type: Boolean,
        default: true
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    avatar: {
      type: String // For group conversations
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    // Privacy settings for group
    privacy: {
      type: String,
      enum: ["public", "private", "secret"],
      default: "private"
    },
    // Group settings
    settings: {
      allowMembersToAddOthers: {
        type: Boolean,
        default: false
      },
      allowMembersToChangeName: {
        type: Boolean,
        default: false
      },
      allowMembersToChangePhoto: {
        type: Boolean,
        default: false
      },
      approvalRequired: {
        type: Boolean,
        default: false
      }
    },
    // For direct conversations, store the two user IDs for quick lookup
    directParticipants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for performance
conversationSchema.index({ "participants.user": 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ directParticipants: 1 });
conversationSchema.index({ 
  "directParticipants.0": 1, 
  "directParticipants.1": 1 
}, { 
  sparse: true 
});

// Ensure direct conversations have exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.type === 'direct') {
    if (this.participants.length !== 2) {
      return next(new Error('Direct conversations must have exactly 2 participants'));
    }
    // Set directParticipants for quick lookup
    this.directParticipants = this.participants.map(p => p.user);
  }
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation; 