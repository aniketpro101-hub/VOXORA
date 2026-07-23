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
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: () => new mongoose.Types.ObjectId('650000000000000000000001') },
    webhookUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Instance = mongoose.model<IInstance>('Instance', InstanceSchema);
