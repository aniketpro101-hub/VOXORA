import mongoose, { Schema, Document, Types } from 'mongoose';

export type StatusType = 'text' | 'image' | 'video';
export type StatusPostStatus = 'scheduled' | 'posted' | 'failed';

export interface IWhatsAppStatus extends Document {
  instanceId: Types.ObjectId | string;
  type: StatusType;
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  font?: number;
  postedAt?: Date;
  scheduledAt?: Date;
  status: StatusPostStatus;
  views: number;
  viewers: string[];
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppStatusSchema: Schema<IWhatsAppStatus> = new Schema(
  {
    instanceId: { type: Schema.Types.Mixed, required: true, index: true },
    type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
    content: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    backgroundColor: { type: String, default: '#25D366' },
    font: { type: Number, default: 0 },
    postedAt: { type: Date },
    scheduledAt: { type: Date },
    status: { type: String, enum: ['scheduled', 'posted', 'failed'], default: 'posted' },
    views: { type: Number, default: 0 },
    viewers: [{ type: String }],
    failureReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const WhatsAppStatus = mongoose.model<IWhatsAppStatus>('WhatsAppStatus', WhatsAppStatusSchema);
