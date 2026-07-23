import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICampaignJob extends Document {
  campaignId: Types.ObjectId;
  contactId?: Types.ObjectId;
  phone: string;
  messageData: any;
  instanceId: Types.ObjectId;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped';
  attempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  messageId?: string;
  queuedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignJobSchema: Schema<ICampaignJob> = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    phone: { type: String, required: true, index: true },
    messageData: { type: Schema.Types.Mixed, required: true },
    instanceId: { type: Schema.Types.ObjectId, ref: 'Instance', required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    errorMessage: { type: String, default: '' },
    messageId: { type: String, default: '' },
    queuedAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    failedAt: { type: Date },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CampaignJobSchema.index({ campaignId: 1, status: 1 });

export const CampaignJob = mongoose.model<ICampaignJob>('CampaignJob', CampaignJobSchema);
