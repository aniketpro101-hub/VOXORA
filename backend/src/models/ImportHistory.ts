import mongoose, { Schema, Document } from 'mongoose';

export interface IImportHistory extends Document {
  source: 'csv' | 'excel' | 'paste' | 'whatsapp_contacts' | 'whatsapp_group' | 'google_contacts' | 'mobile_contacts' | 'vcard';
  fileName?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newContactsAdded?: number;
  updatedContacts?: number;
  groupName?: string;
  groupId?: mongoose.Types.ObjectId;
  autoNameSeries?: string;
  countryCode?: string;
  importErrors?: { row?: number; phone?: string; error: string }[];
  importedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ImportHistorySchema = new Schema<IImportHistory>(
  {
    source: {
      type: String,
      enum: ['csv', 'excel', 'paste', 'whatsapp_contacts', 'whatsapp_group', 'google_contacts', 'mobile_contacts', 'vcard'],
      default: 'paste',
    },
    fileName: { type: String, default: 'Import_Batch.txt' },
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    newContactsAdded: { type: Number, default: 0 },
    updatedContacts: { type: Number, default: 0 },
    groupName: { type: String, default: 'General' },
    groupId: { type: Schema.Types.ObjectId, ref: 'ContactGroup' },
    autoNameSeries: { type: String, default: '' },
    countryCode: { type: String, default: '91' },
    importErrors: [
      {
        row: { type: Number },
        phone: { type: String },
        error: { type: String },
      },
    ],
    importedBy: { type: Schema.Types.ObjectId, ref: 'User', default: '650000000000000000000001' },
  },
  { timestamps: true }
);

export const ImportHistory = mongoose.model<IImportHistory>('ImportHistory', ImportHistorySchema);
