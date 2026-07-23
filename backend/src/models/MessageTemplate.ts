import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessageTemplate extends Document {
  name: string;
  description?: string;
  category: 'welcome' | 'follow_up' | 'promotional' | 'transactional' | 'support' | 'birthday' | 'festival' | 'product_launch' | 'custom';
  industry: 'ecommerce' | 'real_estate' | 'education' | 'healthcare' | 'restaurant' | 'coaching' | 'saas' | 'agency' | 'other';
  language: string;
  content: string;
  variables: string[];
  buttons?: Array<{ id: string; text: string; type: string }>;
  isPublic: boolean;
  isFeatured: boolean;
  usageCount: number;
  rating: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema: Schema<IMessageTemplate> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['welcome', 'follow_up', 'promotional', 'transactional', 'support', 'birthday', 'festival', 'product_launch', 'custom'],
      default: 'promotional',
      index: true,
    },
    industry: {
      type: String,
      enum: ['ecommerce', 'real_estate', 'education', 'healthcare', 'restaurant', 'coaching', 'saas', 'agency', 'other'],
      default: 'other',
      index: true,
    },
    language: { type: String, default: 'english' },
    content: { type: String, required: true },
    variables: [{ type: String }],
    buttons: [
      {
        id: String,
        text: String,
        type: { type: String, default: 'reply' },
      },
    ],
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const MessageTemplate = mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
