import mongoose, { Schema, Document, Types } from 'mongoose';

export type LifecycleStage = 'subscriber' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer' | 'evangelist';
export type ContactSource =
  | 'manual'
  | 'csv_import'
  | 'excel_import'
  | 'paste'
  | 'whatsapp_contact'
  | 'whatsapp_group'
  | 'unsaved_contact'
  | 'google_contacts'
  | 'mobile_contacts'
  | 'vcard_import'
  | 'website_widget'
  | 'quick_message'
  | 'auto_reply';

export interface IContactNote {
  text: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface IContact extends Document {
  phone: string;
  normalizedPhone?: string;
  name: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;

  // WhatsApp Info
  whatsappName?: string;
  whatsappProfilePic?: string;
  whatsappAbout?: string;
  isOnWhatsApp?: boolean | null;
  lastSeenOnWhatsApp?: Date;

  // Contact Details
  email?: string;
  company?: string;
  designation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;

  // Organization & CRM
  groups: Types.ObjectId[];
  tags: string[];
  source: ContactSource;
  sourceDetails?: string;
  lifecycleStage?: LifecycleStage;
  engagementScore?: number;
  lastActivity?: Date;

  // Auto-naming
  autoName?: string;
  autoNameSeries?: string;
  isAutoNamed?: boolean;
  autoNaming?: {
    isAutoNamed: boolean;
    autoName: string;
    namingSeries: string;
    sequenceNumber?: number;
    originalName?: string;
  };
  whatsappSync?: {
    isSynced: boolean;
    syncedAt?: Date;
    syncedName?: string;
    syncMethod?: string;
    lastSyncStatus?: string;
    syncError?: string;
  };
  googleSync?: {
    isSyncedToGoogle: boolean;
    googleContactId?: string;
    syncedAt?: Date;
    lastUpdated?: Date;
  };

  // Status
  isFavorite?: boolean;
  isSaved?: boolean;
  isBlacklisted?: boolean;
  isOptedOut?: boolean;

  // Activity
  lastContactedAt?: Date;
  lastRepliedAt?: Date;
  totalMessagesSent?: number;
  totalMessagesReceived?: number;
  totalCampaigns?: number;

  // Notes & Custom Fields
  contactNotes?: IContactNote[];
  notes?: string;
  customFields?: Record<string, any>;

  importBatchId?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema<IContact> = new Schema(
  {
    phone: { type: String, required: true, index: true },
    normalizedPhone: { type: String, index: true },
    name: { type: String, default: '' },
    displayName: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },

    // WhatsApp Info
    whatsappName: { type: String, default: '' },
    whatsappProfilePic: { type: String, default: '' },
    whatsappAbout: { type: String, default: '' },
    isOnWhatsApp: { type: Boolean, default: null },
    lastSeenOnWhatsApp: { type: Date },

    // Contact Details
    email: { type: String, default: '' },
    company: { type: String, default: '' },
    designation: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    countryCode: { type: String, default: '91' },

    // Organization & CRM
    groups: [{ type: Schema.Types.ObjectId, ref: 'ContactGroup' }],
    tags: [{ type: String }],
    source: {
      type: String,
      enum: [
        'manual',
        'csv_import',
        'excel_import',
        'paste',
        'whatsapp_contact',
        'whatsapp_group',
        'unsaved_contact',
        'google_contacts',
        'mobile_contacts',
        'vcard_import',
        'website_widget',
        'quick_message',
        'auto_reply',
      ],
      default: 'manual',
    },
    sourceDetails: { type: String, default: '' },
    lifecycleStage: { type: String, default: 'lead' },
    engagementScore: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },

    // Auto-naming & Sync Details
    autoName: { type: String, default: '' },
    autoNameSeries: { type: String, default: '' },
    isAutoNamed: { type: Boolean, default: false },
    autoNaming: {
      isAutoNamed: { type: Boolean, default: false },
      autoName: { type: String, default: '' },
      namingSeries: { type: String, default: 'aRoasBodhi' },
      sequenceNumber: { type: Number, default: 0 },
      originalName: { type: String, default: '' },
    },
    whatsappSync: {
      isSynced: { type: Boolean, default: false },
      syncedAt: { type: Date },
      syncedName: { type: String, default: '' },
      syncMethod: { type: String, default: 'whatsapp_only' },
      lastSyncStatus: { type: String, default: 'pending' },
      syncError: { type: String, default: '' },
    },
    googleSync: {
      isSyncedToGoogle: { type: Boolean, default: false },
      googleContactId: { type: String, default: '' },
      syncedAt: { type: Date },
      lastUpdated: { type: Date },
    },

    // Status
    isFavorite: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: true },
    isBlacklisted: { type: Boolean, default: false },
    isOptedOut: { type: Boolean, default: false },

    // Activity
    lastContactedAt: { type: Date },
    lastRepliedAt: { type: Date },
    totalMessagesSent: { type: Number, default: 0 },
    totalMessagesReceived: { type: Number, default: 0 },
    totalCampaigns: { type: Number, default: 0 },

    // Notes
    contactNotes: [
      {
        text: { type: String, required: true },
        createdBy: { type: String, default: 'Agent' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, default: '' },
    customFields: { type: Schema.Types.Mixed, default: {} },

    importBatchId: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
