import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAPIKey extends Document {
  name: string;
  key: string;
  rateLimit: number;
  lastUsed?: Date;
  totalCalls: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const APIKeySchema: Schema<IAPIKey> = new Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, index: true },
    rateLimit: { type: Number, default: 100 },
    lastUsed: { type: Date },
    totalCalls: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const APIKey = mongoose.model<IAPIKey>('APIKey', APIKeySchema);
