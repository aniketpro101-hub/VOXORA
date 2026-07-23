import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversationSession extends Document {
  contactId?: Types.ObjectId;
  phone: string;
  instanceId: Types.ObjectId;
  flowId?: Types.ObjectId;
  currentStepId?: string;
  variables: Record<string, any>;
  startedAt: Date;
  lastInteractionAt: Date;
  status: 'active' | 'completed' | 'timeout' | 'handedOver';
  history: Array<{
    sender: 'user' | 'bot' | 'agent';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSessionSchema: Schema<IConversationSession> = new Schema(
  {
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    phone: { type: String, required: true, index: true },
    instanceId: { type: Schema.Types.ObjectId, ref: 'Instance', required: true },
    flowId: { type: Schema.Types.ObjectId, ref: 'ConversationFlow' },
    currentStepId: { type: String },
    variables: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    lastInteractionAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'completed', 'timeout', 'handedOver'],
      default: 'active',
      index: true,
    },
    history: [
      {
        sender: { type: String, enum: ['user', 'bot', 'agent'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ConversationSession = mongoose.model<IConversationSession>('ConversationSession', ConversationSessionSchema);
