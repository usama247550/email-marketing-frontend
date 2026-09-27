import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CampaignStatus = 'Running' | 'Completed' | 'Draft';

export interface ICampaign extends Document {
  name: string;
  projectId: Types.ObjectId;
  leadsCount: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  failedCount: number;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    leadsCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    repliedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Running', 'Completed', 'Draft'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign ?? mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
