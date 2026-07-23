import mongoose, { Schema, Document, Types } from 'mongoose';

export type DealStatus = 'open' | 'won' | 'lost' | 'abandoned';

export interface IDeal extends Document {
  name: string;
  contactId: Types.ObjectId;
  pipelineId: Types.ObjectId;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  status: DealStatus;
  lostReason?: string;
  assignedTo?: Types.ObjectId;
  products?: Array<{ name: string; quantity: number; price: number }>;
  tags?: string[];
  notes?: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema: Schema<IDeal> = new Schema(
  {
    name: { type: String, required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
    stageId: { type: String, required: true, index: true },
    value: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    probability: { type: Number, default: 50 },
    expectedCloseDate: { type: Date },
    actualCloseDate: { type: Date },
    status: {
      type: String,
      enum: ['open', 'won', 'lost', 'abandoned'],
      default: 'open',
      index: true,
    },
    lostReason: { type: String, default: '' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    products: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    tags: [{ type: String }],
    notes: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
