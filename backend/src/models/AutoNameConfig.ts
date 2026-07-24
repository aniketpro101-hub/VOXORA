import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoNameConfig extends Document {
  userId: mongoose.Types.ObjectId;
  seriesName: string;
  prefix: string;
  startNumber: number;
  currentSequence: number;
  paddingDigits: number;
  separator: string;
  suffix: string;
  existingNameHandling: 'prefix' | 'suffix' | 'replace' | 'keep';
  existingNamePrefix: string;
  existingNameSuffix: string;
  updatedAt: Date;
}

const AutoNameConfigSchema = new Schema<IAutoNameConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    seriesName: { type: String, default: 'aRoasBodhi' },
    prefix: { type: String, default: 'aRoasBodhi' },
    startNumber: { type: Number, default: 1 },
    currentSequence: { type: Number, default: 0 },
    paddingDigits: { type: Number, default: 5 },
    separator: { type: String, default: '' },
    suffix: { type: String, default: '' },
    existingNameHandling: { type: String, enum: ['prefix', 'suffix', 'replace', 'keep'], default: 'prefix' },
    existingNamePrefix: { type: String, default: 'aRoasBodhi_' },
    existingNameSuffix: { type: String, default: '_aRoasBodhi' },
  },
  { timestamps: true }
);

export const AutoNameConfig = mongoose.model<IAutoNameConfig>('AutoNameConfig', AutoNameConfigSchema);
