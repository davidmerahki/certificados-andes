import mongoose, { Schema, Document } from 'mongoose';

export interface StudentDocument extends Document {
  learnWorldsUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  tags: string[];
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<StudentDocument>(
  {
    _id: { type: String },
    learnWorldsUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    tags: { type: [String], default: [] },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const StudentModel = mongoose.model<StudentDocument>('Student', StudentSchema);
