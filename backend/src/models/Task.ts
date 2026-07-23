import mongoose, { Schema, Document, Types } from 'mongoose';

export type TaskType = 'call' | 'message' | 'meeting' | 'email' | 'follow_up' | 'other';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ITask extends Document {
  title: string;
  description?: string;
  contactId?: Types.ObjectId;
  dealId?: Types.ObjectId;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date;
  assignedTo?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', index: true },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal' },
    type: {
      type: String,
      enum: ['call', 'message', 'meeting', 'email', 'follow_up', 'other'],
      default: 'follow_up',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);
