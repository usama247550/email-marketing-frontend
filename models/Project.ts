import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  name: string;
  slug: string;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

const Project: Model<IProject> =
  mongoose.models.Project ?? mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
