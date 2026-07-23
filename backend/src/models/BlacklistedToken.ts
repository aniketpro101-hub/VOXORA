import mongoose, { Schema, Document } from 'mongoose';

export interface IBlacklistedToken extends Document {
  token: string;
  blacklistedAt: Date;
  expiresAt: Date;
}

const BlacklistedTokenSchema: Schema<IBlacklistedToken> = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    blacklistedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true }, // TTL index for auto-cleanup
  },
  { timestamps: true }
);

// Auto-delete expired blacklisted tokens
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BlacklistedToken = mongoose.model<IBlacklistedToken>('BlacklistedToken', BlacklistedTokenSchema);
