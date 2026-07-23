import mongoose, { Schema, Document, Types } from 'mongoose';

export type BlacklistCategory = 'opt_out' | 'angry' | 'blocked' | 'invalid' | 'spam' | 'manual' | 'ai_detected';

export interface IBlacklistNumber extends Document {
  phone: string;
  countryCode: string;
  normalizedPhone: string;
  originalFormats: string[];
  reason: string;
  category: BlacklistCategory;
  confidence: number;
  lastAttemptToSend?: Date;
  attemptedSendCount: number;
  sourceCampaigns: Types.ObjectId[];
  unbanRequests: Array<{
    userId: Types.ObjectId;
    requestedAt: Date;
    reason: string;
    approved?: boolean;
  }>;
  unbanHistory: Array<{
    removedAt: Date;
    removedBy: Types.ObjectId;
    addedBackAt?: Date;
  }>;
  tags: string[];
  addedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlacklistNumberSchema: Schema<IBlacklistNumber> = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    countryCode: { type: String, default: '91' },
    normalizedPhone: { type: String, required: true, index: true },
    originalFormats: [{ type: String }],
    reason: { type: String, default: 'Opt-Out Keyword' },
    category: {
      type: String,
      enum: ['opt_out', 'angry', 'blocked', 'invalid', 'spam', 'manual', 'ai_detected'],
      default: 'opt_out',
      index: true,
    },
    confidence: { type: Number, default: 100 },
    lastAttemptToSend: { type: Date },
    attemptedSendCount: { type: Number, default: 0 },
    sourceCampaigns: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
    unbanRequests: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date, default: Date.now },
        reason: String,
        approved: Boolean,
      },
    ],
    unbanHistory: [
      {
        removedAt: { type: Date, default: Date.now },
        removedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedBackAt: Date,
      },
    ],
    tags: [{ type: String }],
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const BlacklistNumber = mongoose.model<IBlacklistNumber>('BlacklistNumber', BlacklistNumberSchema);
