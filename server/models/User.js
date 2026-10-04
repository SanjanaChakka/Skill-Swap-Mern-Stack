import mongoose from 'mongoose';

const availabilityDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['link', 'image', 'document'], default: 'link' },
    url: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    bio: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    location: {
      city: { type: String, default: '' },
      radiusKm: { type: Number, default: 50 },
    },
    availability: {
      schedule: { type: [availabilityDaySchema], default: [] },
      timezone: { type: String, default: '' },
    },
    portfolio: { type: [portfolioSchema], default: [] },
    skills: {
      offered: [{ type: String }],
      sought: [{ type: String }],
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    verificationPending: { type: Boolean, default: false },
    reputationScore: { type: Number, default: 0 },
    reviewsReceived: { type: Number, default: 0 },
    swapsCompleted: { type: Number, default: 0 },
    badges: { type: [badgeSchema], default: [] },
    bookmarkedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    isFlagged: { type: Boolean, default: false },
    flaggedReason: { type: String, default: '' },
    lastActiveAt: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ name: 'text', bio: 'text' });

const User = mongoose.model('User', userSchema);
export default User;
