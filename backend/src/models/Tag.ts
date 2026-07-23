import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color: string;
  description?: string;
  usageCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema: Schema<ITag> = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    color: { type: String, default: '#10b981' },
    description: { type: String, default: '' },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Tag = mongoose.model<ITag>('Tag', TagSchema);
