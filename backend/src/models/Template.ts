import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  category: string;
  content: string;
  mediaUrl?: string;
  buttons?: Array<{ id: string; text: string; type: string; url?: string; phone?: string }>;
  listMenu?: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', index: true },
    content: { type: String, required: true },
    mediaUrl: { type: String, default: '' },
    buttons: [
      {
        id: { type: String },
        text: { type: String },
        type: { type: String },
        url: { type: String },
        phone: { type: String },
      },
    ],
    listMenu: { type: Schema.Types.Mixed, default: {} },
    isPublic: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
