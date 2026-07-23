import mongoose, { Schema, Document, Types } from 'mongoose';

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export interface IMessageLog extends Document {
  campaignId?: any;
  instanceId: any;
  contactId?: any;
  recipientPhone: string;
  messageType: string;
  content: any;
  status: MessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  deliveryTime?: number;
  readTime?: number;
  responseTime?: number;
  mediaViewCount: number;
  mediaDownloadCount: number;
  linkClickCount: number;
  callButtonClickCount: number;
  revenueGenerated: number;
  location?: { city?: string; country?: string };
  deviceType?: string;
  hasButtons?: boolean;
  buttons?: any[];
  hasListMenu?: boolean;
  listMenu?: any;
  createdAt: Date;
  updatedAt: Date;
}

const MessageLogSchema: Schema<IMessageLog> = new Schema(
  {
    campaignId: { type: Schema.Types.Mixed, index: true },
    instanceId: { type: Schema.Types.Mixed, required: true, index: true },
    contactId: { type: Schema.Types.Mixed, index: true },
    recipientPhone: { type: String, required: true, index: true },
    messageType: { type: String, default: 'text' },
    content: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    hasButtons: { type: Boolean, default: false },
    buttons: [{ type: Schema.Types.Mixed }],
    hasListMenu: { type: Boolean, default: false },
    listMenu: { type: Schema.Types.Mixed },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String, default: '' },
    deliveryTime: { type: Number },
    readTime: { type: Number },
    responseTime: { type: Number },
    mediaViewCount: { type: Number, default: 0 },
    mediaDownloadCount: { type: Number, default: 0 },
    linkClickCount: { type: Number, default: 0 },
    callButtonClickCount: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    location: { city: String, country: String },
    deviceType: { type: String, default: 'Android' },
  },
  { timestamps: true }
);

export const MessageLog = mongoose.model<IMessageLog>('MessageLog', MessageLogSchema);
