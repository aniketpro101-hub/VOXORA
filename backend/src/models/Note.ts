import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INote extends Document {
  content: string;
  contactId: Types.ObjectId;
  dealId?: Types.ObjectId;
  isPinned: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema<INote> = new Schema(
  {
    content: { type: String, required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal' },
    isPinned: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Note = mongoose.model<INote>('Note', NoteSchema);
