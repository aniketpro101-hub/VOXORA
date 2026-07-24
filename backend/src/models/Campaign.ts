import mongoose, { Schema, Document, Types } from 'mongoose';

export type CampaignType = 'instant' | 'scheduled' | 'drip' | 'recurring';
export type CampaignStatus = 'draft' | 'pending' | 'running' | 'paused' | 'completed' | 'stopped' | 'failed' | 'cancelled' | 'scheduled';

export interface ICampaignSettings {
  minDelaySeconds: number;
  maxDelaySeconds: number;
  batchSize: number;
  breakDurationMinutes: number;
  sleepMode: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface ICampaignStats {
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  repliedCount?: number;
}

export interface ICampaign extends Document {
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  messageTemplate?: string;
  messageTemplates?: string[];
  mediaFiles: string[];
  buttons: Array<{ id: string; text: string; type: string; url?: string; phone?: string }>;
  listMenu?: Record<string, any>;
  contacts: Types.ObjectId[];
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  repliedCount: number;
  stats?: ICampaignStats;
  startedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  settings: ICampaignSettings;
  message?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  contactInfo?: Record<string, any>;
  contactInfoHeader?: string;
  showContactInfo?: boolean;
  contactsList?: any[];
  cancelledAt?: Date;
  campaignType: 'instant' | 'scheduled' | 'drip' | 'recurring';
  scheduledAt?: Date;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];
    time?: string;
  };
  dripSequence?: Array<{
    step: number;
    delayDays: number;
    message: string;
    mediaUrl?: string;
  }>;
  currentDripStep?: number;
  instanceIds: any[];
  currentInstanceIndex: number;
  batchSize: number;
  totalBatches: number;
  currentBatch: number;
  pausedByUser: boolean;
  pausedByAutoAntiban: boolean;
  pauseReason?: string;
  speedMode?: string;
  autoAdjustSpeed?: boolean;
  speedAdjustedAt?: Date;
  speedAdjustmentReason?: string;
  antibanButtons?: {
    autoAddUnsubscribe?: boolean;
    onlyForFirstContact?: boolean;
    unsubscribeText?: string;
    useUnsubscribeVariant?: string;
    maxContentButtons?: number;
    addNotNowButton?: boolean;
    autoBlacklistOnClick?: boolean;
    sendConfirmation?: boolean;
    confirmationMessage?: string;
  };
  lastActivityAt?: Date;
  estimatedCompletionAt?: Date;
  actualCompletionAt?: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
  tags: string[];
  owner: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema<ICampaign> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['instant', 'scheduled', 'drip', 'recurring'],
      default: 'instant',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'running', 'paused', 'completed', 'stopped', 'failed', 'cancelled', 'scheduled'],
      default: 'draft',
    },
    messageTemplate: { type: String, default: '' },
    messageTemplates: [{ type: String }],
    message: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, default: '' },
    caption: { type: String, default: '' },
    mediaFiles: [{ type: String }],
    buttons: [
      {
        id: { type: String },
        text: { type: String },
        type: { type: String, default: 'reply' },
        url: { type: String },
        phone: { type: String },
      },
    ],
    listMenu: { type: Schema.Types.Mixed, default: {} },
    contactInfo: { type: Schema.Types.Mixed, default: {} },
    contactInfoHeader: { type: String, default: '📞 *Contact Us:*' },
    showContactInfo: { type: Boolean, default: true },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    totalContacts: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    repliedCount: { type: Number, default: 0 },
    stats: {
      totalContacts: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      readCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      repliedCount: { type: Number, default: 0 },
    },
    campaignType: {
      type: String,
      enum: ['instant', 'scheduled', 'drip', 'recurring'],
      default: 'instant',
    },
    scheduledAt: { type: Date },
    recurringPattern: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      days: [{ type: Number }],
      time: { type: String },
    },
    dripSequence: [
      {
        step: { type: Number },
        delayDays: { type: Number },
        message: { type: String },
        mediaUrl: { type: String },
      },
    ],
    currentDripStep: { type: Number, default: 0 },
    instanceIds: [{ type: Schema.Types.ObjectId, ref: 'Instance' }],
    currentInstanceIndex: { type: Number, default: 0 },
    batchSize: { type: Number, default: 50 },
    totalBatches: { type: Number, default: 1 },
    currentBatch: { type: Number, default: 0 },
    pausedByUser: { type: Boolean, default: false },
    pausedByAutoAntiban: { type: Boolean, default: false },
    pauseReason: { type: String, default: '' },
    speedMode: { type: String, default: 'medium' },
    autoAdjustSpeed: { type: Boolean, default: true },
    speedAdjustedAt: { type: Date },
    speedAdjustmentReason: { type: String, default: '' },
    antibanButtons: {
      autoAddUnsubscribe: { type: Boolean, default: true },
      onlyForFirstContact: { type: Boolean, default: true },
      unsubscribeText: { type: String, default: '✕ Not Interested' },
      useUnsubscribeVariant: { type: String, default: 'not_interested' },
      maxContentButtons: { type: Number, default: 2 },
      addNotNowButton: { type: Boolean, default: true },
      autoBlacklistOnClick: { type: Boolean, default: true },
      sendConfirmation: { type: Boolean, default: true },
      confirmationMessage: { type: String, default: '✅ You have been unsubscribed successfully.' },
    },
    lastActivityAt: { type: Date },
    estimatedCompletionAt: { type: Date },
    actualCompletionAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    tags: [{ type: String }],
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    settings: {
      minDelaySeconds: { type: Number, default: 20 },
      maxDelaySeconds: { type: Number, default: 55 },
      batchSize: { type: Number, default: 50 },
      breakDurationMinutes: { type: Number, default: 15 },
      sleepMode: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: '22:00' },
        endTime: { type: String, default: '08:00' },
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
