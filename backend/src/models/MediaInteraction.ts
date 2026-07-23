import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMediaInteraction extends Document {
  messageId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  mediaUrl: string;
  mediaType: string;
  action: 'viewed' | 'downloaded' | 'played' | 'shared';
  timestamp: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaInteractionSchema: Schema<IMediaInteraction> = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'MessageLog', index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', index: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, default: 'image' },
    action: {
      type: String,
      enum: ['viewed', 'downloaded', 'played', 'shared'],
      default: 'viewed',
    },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MediaInteraction = mongoose.model<IMediaInteraction>('MediaInteraction', MediaInteractionSchema);
