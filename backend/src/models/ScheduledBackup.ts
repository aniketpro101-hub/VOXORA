import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScheduledBackup extends Document {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  lastBackup?: Date;
  lastBackupSize?: number;
  lastBackupStatus: 'success' | 'failed';
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledBackupSchema: Schema<IScheduledBackup> = new Schema(
  {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    time: { type: String, default: '03:00 AM' },
    lastBackup: { type: Date },
    lastBackupSize: { type: Number, default: 0 },
    lastBackupStatus: { type: String, enum: ['success', 'failed'], default: 'success' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ScheduledBackup = mongoose.model<IScheduledBackup>('ScheduledBackup', ScheduledBackupSchema);
