import mongoose, { Schema, Document } from 'mongoose';

export interface AcademicProgressDocument extends Document {
  studentId: string;
  courseConfigId: string;
  learnWorldsCourseId: string;
  progressRate: number;
  status: string;
  completedUnits: number;
  totalUnits: number;
  syncedAt: Date;
}

const AcademicProgressSchema = new Schema<AcademicProgressDocument>({
  _id: { type: String },
  studentId: { type: String, required: true, index: true },
  courseConfigId: { type: String, required: true, index: true },
  learnWorldsCourseId: { type: String, required: true },
  progressRate: { type: Number, required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    required: true,
  },
  completedUnits: { type: Number, default: 0 },
  totalUnits: { type: Number, default: 0 },
  syncedAt: { type: Date, default: Date.now },
});

AcademicProgressSchema.index(
  { studentId: 1, courseConfigId: 1 },
  { unique: true },
);

export const AcademicProgressModel = mongoose.model<AcademicProgressDocument>(
  'AcademicProgress',
  AcademicProgressSchema,
);
