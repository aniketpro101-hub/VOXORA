import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWhatsAppGroupMember {
  phone: string;
  jid: string;
  name?: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  joinedAt?: Date;
}

export interface IWhatsAppGroup extends Document {
  instanceId: Types.ObjectId | string;
  groupJid: string;
  name: string;
  description?: string;
  memberCount: number;
  isAdmin: boolean;
  creationDate?: Date;
  creator?: string;
  lastSyncedAt: Date;
  members: IWhatsAppGroupMember[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppGroupSchema: Schema<IWhatsAppGroup> = new Schema(
  {
    instanceId: { type: Schema.Types.Mixed, required: true, index: true },
    groupJid: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    memberCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    creationDate: { type: Date },
    creator: { type: String, default: '' },
    lastSyncedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
    members: [
      {
        phone: { type: String, required: true },
        jid: { type: String, required: true },
        name: { type: String, default: '' },
        isAdmin: { type: Boolean, default: false },
        isSuperAdmin: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

WhatsAppGroupSchema.index({ instanceId: 1, groupJid: 1 }, { unique: true });

export const WhatsAppGroup = mongoose.model<IWhatsAppGroup>('WhatsAppGroup', WhatsAppGroupSchema);
