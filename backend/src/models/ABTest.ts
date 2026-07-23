import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVariant {
  id: string;
  name: string;
  messageContent: string;
  mediaUrl?: string;
  sampleSize: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  conversionCount: number;
}

export interface IABTest extends Document {
  name: string;
  campaignId?: Types.ObjectId;
  variants: IVariant[];
  winnerCriteria: 'reply_rate' | 'read_rate' | 'conversion_rate' | 'click_rate';
  testDurationHours: number;
  testGroupPercent: number;
  status: 'draft' | 'running' | 'completed' | 'applied';
  winnerId?: string;
  confidenceLevel?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ABTestSchema: Schema<IABTest> = new Schema(
  {
    name: { type: String, required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    variants: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        messageContent: { type: String, required: true },
        mediaUrl: String,
        sampleSize: { type: Number, default: 0 },
        sentCount: { type: Number, default: 0 },
        deliveredCount: { type: Number, default: 0 },
        readCount: { type: Number, default: 0 },
        repliedCount: { type: Number, default: 0 },
        conversionCount: { type: Number, default: 0 },
      },
    ],
    winnerCriteria: {
      type: String,
      enum: ['reply_rate', 'read_rate', 'conversion_rate', 'click_rate'],
      default: 'reply_rate',
    },
    testDurationHours: { type: Number, default: 24 },
    testGroupPercent: { type: Number, default: 20 },
    status: {
      type: String,
      enum: ['draft', 'running', 'completed', 'applied'],
      default: 'draft',
    },
    winnerId: { type: String },
    confidenceLevel: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ABTest = mongoose.model<IABTest>('ABTest', ABTestSchema);
