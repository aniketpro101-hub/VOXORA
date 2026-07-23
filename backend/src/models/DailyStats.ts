import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDailyStats extends Document {
  instanceId: Types.ObjectId;
  date: Date;
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  successRate: number;
  avgResponseTime: number;
  peakHour: number;
  healthScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyStatsSchema: Schema<IDailyStats> = new Schema(
  {
    instanceId: { type: Schema.Types.ObjectId, ref: 'Instance', required: true, index: true },
    date: { type: Date, required: true, index: true },
    messagesSent: { type: Number, default: 0 },
    messagesDelivered: { type: Number, default: 0 },
    messagesRead: { type: Number, default: 0 },
    messagesFailed: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 },
    avgResponseTime: { type: Number, default: 0 },
    peakHour: { type: Number, default: 12 },
    healthScore: { type: Number, default: 100 },
  },
  { timestamps: true }
);

DailyStatsSchema.index({ instanceId: 1, date: 1 }, { unique: true });

export const DailyStats = mongoose.model<IDailyStats>('DailyStats', DailyStatsSchema);
