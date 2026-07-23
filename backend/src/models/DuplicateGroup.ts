import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDuplicateGroup extends Document {
  masterPhone: string;
  variants: string[];
  occurrences: number;
  contacts: Types.ObjectId[];
  firstSeen: Date;
  lastSeen: Date;
  handlingRule: 'keep_first' | 'keep_latest' | 'merge' | 'ignore';
  createdAt: Date;
  updatedAt: Date;
}

const DuplicateGroupSchema: Schema<IDuplicateGroup> = new Schema(
  {
    masterPhone: { type: String, required: true, index: true },
    variants: [{ type: String }],
    occurrences: { type: Number, default: 1 },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    handlingRule: {
      type: String,
      enum: ['keep_first', 'keep_latest', 'merge', 'ignore'],
      default: 'keep_first',
    },
  },
  { timestamps: true }
);

export const DuplicateGroup = mongoose.model<IDuplicateGroup>('DuplicateGroup', DuplicateGroupSchema);
