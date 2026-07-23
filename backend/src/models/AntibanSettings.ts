import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAntibanSettings extends Document {
  userId: Types.ObjectId;
  protectionLevel: 'aggressive' | 'recommended' | 'safe' | 'ultrasafe' | 'custom';
  minDelay: number;
  maxDelay: number;
  messagesPerBatch: number;
  batchBreakDuration: number;
  sleepModeEnabled: boolean;
  sleepStartHour: number;
  sleepEndHour: number;
  weekendMode: boolean;
  weekendReducedLimit: number;
  typingSimulation: boolean;
  typingDurationMin: number;
  typingDurationMax: number;
  readReceiptSimulation: boolean;
  onlinePresenceSimulation: boolean;
  warmupEnabled: boolean;
  warmupSchedule: Record<string, number>;
  randomizeOrder: boolean;
  spintaxRequired: boolean;
  verifyNumbersBeforeSend: boolean;
  pauseOnFailureRate: number;
  pauseOnConsecutiveFailures: number;
  proxyEnabled: boolean;
  proxyList: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AntibanSettingsSchema: Schema<IAntibanSettings> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    protectionLevel: {
      type: String,
      enum: ['aggressive', 'recommended', 'safe', 'ultrasafe', 'custom'],
      default: 'recommended',
    },
    minDelay: { type: Number, default: 20 },
    maxDelay: { type: Number, default: 55 },
    messagesPerBatch: { type: Number, default: 50 },
    batchBreakDuration: { type: Number, default: 10 },
    sleepModeEnabled: { type: Boolean, default: true },
    sleepStartHour: { type: Number, default: 22 },
    sleepEndHour: { type: Number, default: 8 },
    weekendMode: { type: Boolean, default: false },
    weekendReducedLimit: { type: Number, default: 50 },
    typingSimulation: { type: Boolean, default: true },
    typingDurationMin: { type: Number, default: 2 },
    typingDurationMax: { type: Number, default: 8 },
    readReceiptSimulation: { type: Boolean, default: true },
    onlinePresenceSimulation: { type: Boolean, default: true },
    warmupEnabled: { type: Boolean, default: true },
    warmupSchedule: {
      type: Schema.Types.Mixed,
      default: {
        '1-3': 30,
        '4-7': 100,
        '8-14': 300,
        '15-21': 500,
        '22-30': 800,
        '30+': 1000,
      },
    },
    randomizeOrder: { type: Boolean, default: true },
    spintaxRequired: { type: Boolean, default: true },
    verifyNumbersBeforeSend: { type: Boolean, default: true },
    pauseOnFailureRate: { type: Number, default: 20 },
    pauseOnConsecutiveFailures: { type: Number, default: 5 },
    proxyEnabled: { type: Boolean, default: false },
    proxyList: [{ type: String }],
  },
  { timestamps: true }
);

export const AntibanSettings = mongoose.model<IAntibanSettings>('AntibanSettings', AntibanSettingsSchema);
