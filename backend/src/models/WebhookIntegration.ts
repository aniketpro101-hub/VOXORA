import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWebhookIntegration extends Document {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  isActive: boolean;
  lastTriggered?: Date;
  totalTriggers: number;
  failedTriggers: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookIntegrationSchema: Schema<IWebhookIntegration> = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    events: [{ type: String }],
    headers: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    lastTriggered: { type: Date },
    totalTriggers: { type: Number, default: 0 },
    failedTriggers: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const WebhookIntegration = mongoose.model<IWebhookIntegration>('WebhookIntegration', WebhookIntegrationSchema);
