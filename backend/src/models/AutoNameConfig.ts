import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoNameConfig extends Document {
  prefix: string;
  currentNumber: number;
  paddingDigits: number;
  separator: string;
  userId: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const AutoNameConfigSchema = new Schema<IAutoNameConfig>(
  {
    prefix: { type: String, default: 'AA' },
    currentNumber: { type: Number, default: 0 },
    paddingDigits: { type: Number, default: 3 },
    separator: { type: String, default: '' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AutoNameConfig = mongoose.model<IAutoNameConfig>('AutoNameConfig', AutoNameConfigSchema);
