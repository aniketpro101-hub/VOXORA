import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAIConfig extends Document {
  userId: Types.ObjectId;
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  aiModel: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  knowledgeBase: Array<{
    fileName: string;
    content: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AIConfigSchema: Schema<IAIConfig> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    provider: { type: String, enum: ['openai', 'anthropic', 'gemini'], default: 'openai' },
    apiKey: { type: String, default: '' },
    aiModel: { type: String, default: 'gpt-4o-mini' },
    systemPrompt: {
      type: String,
      default:
        'You are a helpful customer support assistant for Voxora. Be polite, concise, professional, and reply in the same language as the customer.',
    },
    maxTokens: { type: Number, default: 250 },
    temperature: { type: Number, default: 0.7 },
    isActive: { type: Boolean, default: false },
    knowledgeBase: [
      {
        fileName: String,
        content: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const AIConfig = mongoose.model<IAIConfig>('AIConfig', AIConfigSchema);
