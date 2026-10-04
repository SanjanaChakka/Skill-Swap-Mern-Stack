import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    date: { type: Date },
    format: { type: String, enum: ['Online', 'In-Person'], default: 'Online' },
    durationMinutes: { type: Number, default: 60 },
    frequency: { type: String, default: 'Weekly' },
    videoLink: { type: String, default: '' },
  },
  { _id: false }
);

const termsSchema = new mongoose.Schema(
  {
    offeredSkill: { type: String, required: true },
    requestedSkill: { type: String, required: true },
    session: { type: sessionSchema, default: () => ({}) },
  },
  { _id: false }
);

const swapRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offeringListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    requestingListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    message: { type: String, default: '' },
    terms: { type: termsSchema, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'counter_offered',
        'accepted',
        'confirmed',
        'declined',
        'cancelled',
        'completed',
        'disputed',
      ],
      default: 'pending',
    },
    awaitingConfirmationFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    counterOfferBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    agreedAt: { type: Date },
    completedAt: { type: Date },
    summary: { type: String },
  },
  { timestamps: true }
);

swapRequestSchema.index({ fromUser: 1, toUser: 1, status: 1 });

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);
export default SwapRequest;
