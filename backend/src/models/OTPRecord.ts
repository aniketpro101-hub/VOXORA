import mongoose, { Schema, Document } from 'mongoose';

export interface IOTPRecord extends Document {
  phone: string;
  code: string;
  expiresAt: Date;
  isVerified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const OTPRecordSchema = new Schema<IOTPRecord>(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    isVerified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const OTPRecord = mongoose.model<IOTPRecord>('OTPRecord', OTPRecordSchema);
