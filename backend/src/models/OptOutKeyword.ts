import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOptOutKeyword extends Document {
  keyword: string;
  language: string;
  category: 'opt_out' | 'angry' | 'complaint' | 'negative';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  isDefault: boolean;
  customizedBy?: Types.ObjectId;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptOutKeywordSchema: Schema<IOptOutKeyword> = new Schema(
  {
    keyword: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: 'english' },
    category: {
      type: String,
      enum: ['opt_out', 'angry', 'complaint', 'negative'],
      default: 'opt_out',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    customizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    triggerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const OptOutKeyword = mongoose.model<IOptOutKeyword>('OptOutKeyword', OptOutKeywordSchema);
