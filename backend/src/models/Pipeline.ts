import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStage {
  stageId: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  targetDurationDays: number;
}

export interface IPipeline extends Document {
  name: string;
  description?: string;
  isDefault: boolean;
  stages: IStage[];
  owner: Types.ObjectId;
  teamId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineSchema: Schema<IPipeline> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    stages: [
      {
        stageId: { type: String, required: true },
        name: { type: String, required: true },
        color: { type: String, default: '#3b82f6' },
        order: { type: Number, required: true },
        probability: { type: Number, default: 50 },
        targetDurationDays: { type: Number, default: 7 },
      },
    ],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  },
  { timestamps: true }
);

export const Pipeline = mongoose.model<IPipeline>('Pipeline', PipelineSchema);
