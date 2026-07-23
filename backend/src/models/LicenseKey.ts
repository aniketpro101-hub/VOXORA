import mongoose, { Schema, Document } from 'mongoose';

export type LicenseStatus = 'unused' | 'active' | 'expired' | 'revoked';

export interface ILicenseKey extends Document {
  key: string;
  status: LicenseStatus;
  generatedAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  validityDays: number;
  boundHWID?: string;
  boundPCName?: string;
  boundOSInfo?: string;
  assignedTo?: string;
  notes?: string;
  lastVerifiedAt?: Date;
  activationCount: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseKeySchema: Schema<ILicenseKey> = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['unused', 'active', 'expired', 'revoked'],
      default: 'unused',
      index: true,
    },
    generatedAt: { type: Date, default: Date.now },
    activatedAt: { type: Date },
    expiresAt: { type: Date },
    validityDays: { type: Number, default: 30 },
    boundHWID: { type: String, default: '' },
    boundPCName: { type: String, default: '' },
    boundOSInfo: { type: String, default: '' },
    assignedTo: { type: String, default: '' },
    notes: { type: String, default: '' },
    lastVerifiedAt: { type: Date },
    activationCount: { type: Number, default: 0 },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const LicenseKey = mongoose.model<ILicenseKey>('LicenseKey', LicenseKeySchema);
