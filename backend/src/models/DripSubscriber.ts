import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDripSubscriber extends Document {
  campaignId: Types.ObjectId;
  contactId: Types.ObjectId;
  currentStep: number;
  nextMessageAt?: Date;
  status: 'active' | 'completed' | 'unsubscribed';
  messagesSent: Array<{
    step: number;
    sentAt: Date;
    messageId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DripSubscriberSchema: Schema<IDripSubscriber> = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    currentStep: { type: Number, default: 1 },
    nextMessageAt: { type: Date },
    status: {
      type: String,
      enum: ['active', 'completed', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    messagesSent: [
      {
        step: { type: Number },
        sentAt: { type: Date, default: Date.now },
        messageId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

DripSubscriberSchema.index({ campaignId: 1, contactId: 1 }, { unique: true });

export const DripSubscriber = mongoose.model<IDripSubscriber>('DripSubscriber', DripSubscriberSchema);
