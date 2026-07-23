import mongoose, { Schema, Document } from 'mongoose';

export interface IContactGroup extends Document {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  contacts: mongoose.Types.ObjectId[];
  contactCount: number;
  source?: 'manual' | 'import' | 'whatsapp_group' | 'auto';
  whatsappGroupId?: string;
  whatsappGroupName?: string;
  isDefault?: boolean;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactGroupSchema = new Schema<IContactGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#3B82F6' },
    icon: { type: String, default: '📁' },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    contactCount: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['manual', 'import', 'whatsapp_group', 'auto'],
      default: 'manual',
    },
    whatsappGroupId: { type: String, default: '' },
    whatsappGroupName: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: '650000000000000000000001' },
  },
  { timestamps: true }
);

export const ContactGroup = mongoose.model<IContactGroup>('ContactGroup', ContactGroupSchema);
