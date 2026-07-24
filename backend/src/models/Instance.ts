import mongoose, { Schema, Document, Types } from 'mongoose';

export type InstanceStatus = 'connecting' | 'open' | 'close' | 'qr';

export interface IInstance extends Document {
  name: string;
  instanceId: string;
  phoneNumber?: string;
  status: InstanceStatus;
  qrCode?: string;
  pairingCode?: string;
  profilePic?: string;
  profileName?: string;
  batteryLevel?: number;
  dailyLimit: number;
  currentDayCount: number;
  currentHourCount: number;
  lastResetDate: Date;
  lastHourReset: Date;
  warmupDay: number;
  warmupStartDate: Date;
  healthScore: number;
  banRiskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  consecutiveFailures: number;
  lastSendTime?: Date;
  isBlocked: boolean;
  blockedAt?: Date;
  blockReason?: string;
  totalMessagesSent: number;
  successRate: number;
  owner?: Types.ObjectId;
  webhookUrl?: string;

  // Phase B: Account Age Tracking
  accountAge: {
    days: number;
    ageCategory: 'new' | 'young' | 'growing' | 'established' | 'mature' | 'veteran';
    isEstimated: boolean;
    createdDate?: Date;
    addedToVoxora: Date;
    lastAgedAt?: Date;
  };

  // Phase B: Smart Quota & Counter Tracking
  smartLimits: {
    dailyLimit: number;
    hourlyLimit: number;
    currentDayCount: number;
    currentHourCount: number;
    lastResetDay?: Date;
    lastResetHour?: Date;
  };

  // Phase B: Admin Override Options
  adminOverride: {
    enabled: boolean;
    customDailyLimit?: number;
    customHourlyLimit?: number;
    customMinDelay?: number;
    customMaxDelay?: number;
    isVerifiedEnterprise: boolean;
    overrideBy?: string;
    overrideAt?: Date;
    overrideReason?: string;
  };

  // Phase A/B: Anti-Ban Health Metrics
  antibanHealth: {
    consecutiveErrors: number;
    last463Error?: Date;
    circuitBreakerActive: boolean;
    circuitBreakerUntil?: Date;
    totalMessagesToday: number;
    totalRepliesReceived: number;
    replyRatio: number;
    needsRest: boolean;
    restUntil?: Date;
    lastMessageAt?: Date;
    currentBatchCount: number;
  };

  // Phase A/B: Message Timing & Gaussian Config
  messageTiming: {
    minDelay: number;
    maxDelay: number;
    avgDelay: number;
    useGaussianDistribution: boolean;
    batchSize: number;
    batchBreakMin: number;
    batchBreakMax: number;
  };

  // Phase B: SIM Rotation Priority
  rotationPriority: number;
  lastUsedAt?: Date;
  totalUses: number;

  createdAt: Date;
  updatedAt: Date;
}

const InstanceSchema: Schema<IInstance> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    instanceId: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, default: '' },
    status: {
      type: String,
      enum: ['connecting', 'open', 'close', 'qr'],
      default: 'close',
    },
    qrCode: { type: String, default: '' },
    pairingCode: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    profileName: { type: String, default: '' },
    batteryLevel: { type: Number, default: 100 },
    dailyLimit: { type: Number, default: 30 },
    currentDayCount: { type: Number, default: 0 },
    currentHourCount: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    lastHourReset: { type: Date, default: Date.now },
    warmupDay: { type: Number, default: 1 },
    warmupStartDate: { type: Date, default: Date.now },
    healthScore: { type: Number, default: 100 },
    banRiskLevel: {
      type: String,
      enum: ['safe', 'low', 'medium', 'high', 'critical'],
      default: 'safe',
    },
    consecutiveFailures: { type: Number, default: 0 },
    lastSendTime: { type: Date },
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date },
    blockReason: { type: String, default: '' },
    totalMessagesSent: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    webhookUrl: { type: String, default: '' },

    // Phase B: Account Age Tracking Schema
    accountAge: {
      days: { type: Number, default: 3 },
      ageCategory: {
        type: String,
        enum: ['new', 'young', 'growing', 'established', 'mature', 'veteran'],
        default: 'new',
      },
      isEstimated: { type: Boolean, default: true },
      createdDate: { type: Date },
      addedToVoxora: { type: Date, default: Date.now },
      lastAgedAt: { type: Date, default: Date.now },
    },

    // Phase B: Smart Limits Schema
    smartLimits: {
      dailyLimit: { type: Number, default: 20 },
      hourlyLimit: { type: Number, default: 5 },
      currentDayCount: { type: Number, default: 0 },
      currentHourCount: { type: Number, default: 0 },
      lastResetDay: { type: Date, default: Date.now },
      lastResetHour: { type: Date, default: Date.now },
    },

    // Phase B: Admin Override Schema
    adminOverride: {
      enabled: { type: Boolean, default: false },
      customDailyLimit: { type: Number },
      customHourlyLimit: { type: Number },
      customMinDelay: { type: Number },
      customMaxDelay: { type: Number },
      isVerifiedEnterprise: { type: Boolean, default: false },
      overrideBy: { type: String, default: '' },
      overrideAt: { type: Date },
      overrideReason: { type: String, default: '' },
    },

    // Phase A/B: Anti-Ban Health Metrics Schema
    antibanHealth: {
      consecutiveErrors: { type: Number, default: 0 },
      last463Error: { type: Date },
      circuitBreakerActive: { type: Boolean, default: false },
      circuitBreakerUntil: { type: Date },
      totalMessagesToday: { type: Number, default: 0 },
      totalRepliesReceived: { type: Number, default: 0 },
      replyRatio: { type: Number, default: 100 },
      needsRest: { type: Boolean, default: false },
      restUntil: { type: Date },
      lastMessageAt: { type: Date },
      currentBatchCount: { type: Number, default: 0 },
    },

    // Phase A/B: Message Timing & Gaussian Config Schema
    messageTiming: {
      minDelay: { type: Number, default: 15000 },
      maxDelay: { type: Number, default: 60000 },
      avgDelay: { type: Number, default: 30000 },
      useGaussianDistribution: { type: Boolean, default: true },
      batchSize: { type: Number, default: 15 },
      batchBreakMin: { type: Number, default: 300000 },
      batchBreakMax: { type: Number, default: 900000 },
    },

    // Phase B: Rotation Priority & Usage Schema
    rotationPriority: { type: Number, default: 5 },
    lastUsedAt: { type: Date },
    totalUses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Instance = mongoose.model<IInstance>('Instance', InstanceSchema);
