import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeamMember {
  userId: Types.ObjectId;
  role: 'owner' | 'admin' | 'manager' | 'agent';
  joinedAt: Date;
}

export interface ITeam extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
          type: String,
          enum: ['owner', 'admin', 'manager', 'agent'],
          default: 'agent',
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
