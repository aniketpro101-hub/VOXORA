import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFlowStep {
  stepId: string;
  stepNumber: number;
  name: string;
  triggerCondition?: {
    buttonId?: string;
    keyword?: string;
    listSelectionId?: string;
  };
  response: any;
  nextSteps?: string[];
  waitForResponse: boolean;
  timeoutSeconds?: number;
}

export interface IConversationFlow extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  instanceIds: Types.ObjectId[];
  triggerRule?: Types.ObjectId;
  steps: IFlowStep[];
  variables?: Record<string, any>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationFlowSchema: Schema<IConversationFlow> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    instanceIds: [{ type: Schema.Types.ObjectId, ref: 'Instance' }],
    triggerRule: { type: Schema.Types.ObjectId, ref: 'AutoReplyRule' },
    steps: [
      {
        stepId: { type: String, required: true },
        stepNumber: { type: Number, required: true },
        name: { type: String, required: true },
        triggerCondition: { type: Schema.Types.Mixed },
        response: { type: Schema.Types.Mixed, required: true },
        nextSteps: [{ type: String }],
        waitForResponse: { type: Boolean, default: true },
        timeoutSeconds: { type: Number, default: 300 },
      },
    ],
    variables: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ConversationFlow = mongoose.model<IConversationFlow>('ConversationFlow', ConversationFlowSchema);
