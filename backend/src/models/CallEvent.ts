import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICallEvent extends Document {
  messageId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  phoneNumber: string;
  initiatedAt: Date;
  duration?: number;
  callStatus: 'initiated' | 'completed' | 'missed';
  createdAt: Date;
  updatedAt: Date;
}

const CallEventSchema: Schema<ICallEvent> = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'MessageLog' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    phoneNumber: { type: String, required: true },
    initiatedAt: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    callStatus: {
      type: String,
      enum: ['initiated', 'completed', 'missed'],
      default: 'initiated',
    },
  },
  { timestamps: true }
);

export const CallEvent = mongoose.model<ICallEvent>('CallEvent', CallEventSchema);
