import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['offer', 'seek'], required: true },
    category: { type: String, required: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Expert'],
      default: 'Intermediate',
    },
    sessionFormat: {
      type: String,
      enum: ['Online', 'In-Person', 'Both'],
      default: 'Both',
    },
    durationMinutes: { type: Number, default: 60 },
    frequency: { type: String, default: 'Weekly' },
    portfolio: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    flaggedReason: { type: String, default: '' },
    completionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', tags: 'text' });
listingSchema.index({ type: 1, category: 1, isActive: 1 });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
