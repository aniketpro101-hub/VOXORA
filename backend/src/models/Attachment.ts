import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment extends Document {
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileSizeMB: number;
  mimeType: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'gif';
  userId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  uploadedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  timesUsed: number;
  lastUsedAt?: Date;
  validated: boolean;
  validationErrors?: string[];
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileSizeMB: { type: Number, required: true },
    mimeType: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'sticker', 'gif'],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    timesUsed: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    validated: { type: Boolean, default: true },
    validationErrors: [{ type: String }],
  },
  { timestamps: true }
);

// TTL index for automatic MongoDB document cleanup after 48 hours (172,800 seconds)
AttachmentSchema.index({ uploadedAt: 1 }, { expireAfterSeconds: 172800 });

export const Attachment = mongoose.model<IAttachment>('Attachment', AttachmentSchema);
