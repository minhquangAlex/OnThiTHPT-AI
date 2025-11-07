import { Schema, model } from 'mongoose';
import { ISubject } from '../types';

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, required: true },
    description: { type: String },
  },
  {
    // Automatically add `createdAt` and `updatedAt` fields
    timestamps: true,
    // Include virtuals when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Subject = model<ISubject>('Subject', subjectSchema);
