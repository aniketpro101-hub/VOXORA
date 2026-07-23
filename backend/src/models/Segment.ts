import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISegment extends Document {
  name: string;
  description?: string;
  filters: Record<string, any>;
  contactCount: number;
  isDynamic: boolean;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema: Schema<ISegment> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    filters: { type: Schema.Types.Mixed, required: true },
    contactCount: { type: Number, default: 0 },
    isDynamic: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Segment = mongoose.model<ISegment>('Segment', SegmentSchema);
