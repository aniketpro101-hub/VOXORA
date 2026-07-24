import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISettings extends Document {
  userId: Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    campaignCompleted: boolean;
    errorAlerts: boolean;
  };
  antibanSettings: {
    defaultMinDelay: number;
    defaultMaxDelay: number;
    maxDailyMessagesPerNumber: number;
    autoPauseOnSpam: boolean;
  };
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  featureToggles: {
    enableOtpSender: boolean;
    enableGroupGrabber: boolean;
    enableStatusComposer: boolean;
    enableCarousel: boolean;
    enableButtons: boolean;
    enableAutoReply: boolean;
    enableBlacklist: boolean;
  };
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISettings> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      campaignCompleted: { type: Boolean, default: true },
      errorAlerts: { type: Boolean, default: true },
    },
    antibanSettings: {
      defaultMinDelay: { type: Number, default: 20 },
      defaultMaxDelay: { type: Number, default: 55 },
      maxDailyMessagesPerNumber: { type: Number, default: 500 },
      autoPauseOnSpam: { type: Boolean, default: true },
    },
    businessHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    featureToggles: {
      enableOtpSender: { type: Boolean, default: false }, // Default OFF as requested!
      enableGroupGrabber: { type: Boolean, default: true },
      enableStatusComposer: { type: Boolean, default: true },
      enableCarousel: { type: Boolean, default: true },
      enableButtons: { type: Boolean, default: true },
      enableAutoReply: { type: Boolean, default: true },
      enableBlacklist: { type: Boolean, default: true },
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
