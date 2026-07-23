import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
  date: Date;
  type: 'daily' | 'weekly' | 'monthly';
  userId: Types.ObjectId;
  instanceId?: Types.ObjectId;
  campaignId?: Types.ObjectId;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSnapshotSchema: Schema<IAnalyticsSnapshot> = new Schema(
  {
    date: { type: Date, required: true, index: true },
    type: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    instanceId: { type: Schema.Types.ObjectId, ref: 'Instance' },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const AnalyticsSnapshot = mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
