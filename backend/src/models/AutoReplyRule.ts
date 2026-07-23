import mongoose, { Schema, Document, Types } from 'mongoose';

export type TriggerType = 'keyword' | 'button_click' | 'list_select' | 'no_reply' | 'event';
export type MatchType = 'any' | 'all' | 'exact' | 'starts_with' | 'ends_with' | 'regex';
export type ReplyType = 'text' | 'media' | 'buttons' | 'list' | 'carousel' | 'ai_generated';

export interface IAutoReplyRule extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  instanceIds: Types.ObjectId[];
  triggerType: TriggerType;
  keywords: string[];
  matchType: MatchType;
  caseSensitive: boolean;
  excludeKeywords: string[];
  replyType: ReplyType;
  replyContent: any;
  replyMedia?: {
    url: string;
    type: 'image' | 'video' | 'document' | 'audio';
    caption?: string;
  };
  replyButtons?: Array<{
    id: string;
    text: string;
    type: 'reply' | 'url' | 'call';
    url?: string;
    phone?: string;
  }>;
  replyList?: {
    title: string;
    description: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
  delayMs: number;
  typingSimulation: boolean;
  businessHoursOnly: boolean;
  executionCount: number;
  lastExecuted?: Date;
  successCount: number;
  failureCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AutoReplyRuleSchema: Schema<IAutoReplyRule> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 1, index: true },
    instanceIds: [{ type: Schema.Types.ObjectId, ref: 'Instance' }],
    triggerType: {
      type: String,
      enum: ['keyword', 'button_click', 'list_select', 'no_reply', 'event'],
      default: 'keyword',
    },
    keywords: [{ type: String }],
    matchType: {
      type: String,
      enum: ['any', 'all', 'exact', 'starts_with', 'ends_with', 'regex'],
      default: 'any',
    },
    caseSensitive: { type: Boolean, default: false },
    excludeKeywords: [{ type: String }],
    replyType: {
      type: String,
      enum: ['text', 'media', 'buttons', 'list', 'carousel', 'ai_generated'],
      default: 'text',
    },
    replyContent: { type: Schema.Types.Mixed, required: true },
    replyMedia: {
      url: String,
      type: { type: String, enum: ['image', 'video', 'document', 'audio'] },
      caption: String,
    },
    replyButtons: [
      {
        id: String,
        text: String,
        type: { type: String, enum: ['reply', 'url', 'call'] },
        url: String,
        phone: String,
      },
    ],
    replyList: { type: Schema.Types.Mixed },
    delayMs: { type: Number, default: 2000 },
    typingSimulation: { type: Boolean, default: true },
    businessHoursOnly: { type: Boolean, default: false },
    executionCount: { type: Number, default: 0 },
    lastExecuted: { type: Date },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const AutoReplyRule = mongoose.model<IAutoReplyRule>('AutoReplyRule', AutoReplyRuleSchema);
