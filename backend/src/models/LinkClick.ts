import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILinkClick extends Document {
  messageId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  url: string;
  shortUrl: string;
  clickedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: { city?: string; country?: string };
  createdAt: Date;
  updatedAt: Date;
}

const LinkClickSchema: Schema<ILinkClick> = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'MessageLog', index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', index: true },
    url: { type: String, required: true },
    shortUrl: { type: String, required: true, index: true },
    clickedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    location: { city: String, country: String },
  },
  { timestamps: true }
);

export const LinkClick = mongoose.model<ILinkClick>('LinkClick', LinkClickSchema);
