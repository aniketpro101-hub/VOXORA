import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  userId?: Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const ActivityLogSchema: Schema<IActivityLog> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, default: '' },
  entityId: { type: String, default: '' },
  oldData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
