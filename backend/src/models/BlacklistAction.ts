import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBlacklistAction extends Document {
  phone: string;
  action: 'added' | 'removed' | 'temp_removed' | 'permanent_ban';
  reason: string;
  triggeredBy: 'system' | 'user' | 'ai';
  performedBy?: Types.ObjectId;
  previousState?: any;
  newState?: any;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlacklistActionSchema: Schema<IBlacklistAction> = new Schema(
  {
    phone: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ['added', 'removed', 'temp_removed', 'permanent_ban'],
      required: true,
    },
    reason: { type: String, required: true },
    triggeredBy: { type: String, enum: ['system', 'user', 'ai'], default: 'system' },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    previousState: { type: Schema.Types.Mixed },
    newState: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const BlacklistAction = mongoose.model<IBlacklistAction>('BlacklistAction', BlacklistActionSchema);
