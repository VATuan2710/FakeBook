import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    displayName: { type: String, default: "New User" },
    about: { type: String, default: "I'm new user" },
    birthday: { type: Date },
    gender: { 
      type: String, 
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say"
    },
    phone: { type: String },
    avatarUrl: {
      type: String,
      default:
        "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-social-media-user-image-gray-blank-silhouette-vector-illustration-305504024.jpg",
    },
    cover_photoUrl: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEHGJUumpyKnKS8ZFVqAsplrqgvkLGxNk8Xg&s",
    },
    location: {
      current: { type: String },
      hometown: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    work: [{
      company: { type: String },
      position: { type: String },
      description: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      current: { type: Boolean, default: false }
    }],
    education: [{
      school: { type: String },
      degree: { type: String },
      fieldOfStudy: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String }
    }],
    relationshipStatus: {
      type: String,
      enum: ["single", "in_relationship", "engaged", "married", "complicated", "separated", "divorced", "widowed"],
      default: "single"
    },
    website: { type: String },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "member",
      enum: ["member", "admin", "superAdmin"],
    },
    status: {
      type: String,
      default: "offline",
      enum: ["online", "offline", "busy", "away"],
    },
    lastSeen: { type: Date, default: Date.now },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    privacySettings: {
      profileVisibility: { 
        type: String, 
        enum: ["public", "friends", "friends_of_friends", "only_me"], 
        default: "friends" 
      },
      friendListVisibility: { 
        type: String, 
        enum: ["public", "friends", "only_me"], 
        default: "friends" 
      },
      postVisibility: { 
        type: String, 
        enum: ["public", "friends", "friends_of_friends", "only_me"], 
        default: "friends" 
      },
      allowMessagesFrom: { 
        type: String, 
        enum: ["everyone", "friends", "friends_of_friends"], 
        default: "friends" 
      },
      allowTagging: { 
        type: String, 
        enum: ["everyone", "friends", "no_one"], 
        default: "friends" 
      }
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      friendRequests: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      posts: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      tags: { type: Boolean, default: true }
    }
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for better performance
// Note: email and username already have unique indexes from schema definition
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ firstName: "text", lastName: "text", displayName: "text" });

const User = mongoose.model("User", userSchema);

export default User;
