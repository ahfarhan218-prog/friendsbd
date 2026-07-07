const mongoose = require('mongoose');

const forumCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  slug: String,
  description: String,
  icon: String,
  color: String,
  subCategories: { type: Array, default: [] },
  isHidden: { type: Boolean, default: false },
  allowedRoles: [String],
  order: { type: Number, default: 0 }
}, { _id: false });

const forumThreadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, index: true },
  subCategoryId: String,
  authorId: String,
  authorName: String,
  authorAvatar: String,
  title: String,
  tags: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  pinExpiry: Number,
  isLocked: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  lastActivity: { type: Number, index: true },
  lastPostAuthor: String,
  createdAt: Number,
  // ── Cricket Match Fields ───────────────────────────────────────────────
  type: { type: String, default: 'normal' },            // 'normal' | 'cricket_match'
  cricketMatchData: { type: mongoose.Schema.Types.Mixed, default: null }, // full MatchState JSON
  cricketMatchPhase: { type: String, default: null },   // 'live' | 'innings_break' | 'complete'
  cricketMatchWinner: { type: String, default: '' },
  cricketTeam1Name: { type: String, default: '' },
  cricketTeam2Name: { type: String, default: '' },
}, { _id: false });

const forumPostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  threadId: { type: String, index: true },
  authorId: String,
  authorName: String,
  authorAvatar: String,
  content: String,
  timestamp: { type: Number, index: true },
  updated_at: Number,
  is_deleted: { type: Boolean, default: false },
  editedBy: String,
  editedByAvatar: String,
  editedAt: Number,
  isSystemPost: { type: Boolean, default: false },
  systemAction: String,
  reactions: { type: Map, of: Number, default: {} },
  userReactions: { type: Map, of: String, default: {} },
  likedBy: { type: [String], default: [] },
  // ── Cricket Post Fields ────────────────────────────────────────────────
  postType: { type: String, default: 'text' },  // 'text' | 'bat_digit' | 'bowl_digit'
  isHidden: { type: Boolean, default: false },  // hidden until host reveals
  overNum: { type: Number, default: null },      // which over this digit post belongs to
}, { _id: false });

const ForumCategory = mongoose.model('ForumCategory', forumCategorySchema);
const ForumThread = mongoose.model('ForumThread', forumThreadSchema);
const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = { ForumCategory, ForumThread, ForumPost };
