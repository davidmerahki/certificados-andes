import mongoose, { Schema, Document } from 'mongoose';

export interface EnrollmentDocument extends Document {
  studentId: string;
  courseConfigId: string;
  learnWorldsCourseId: string;
  enrolledAt: Date;
  syncedAt: Date;
}

const EnrollmentSchema = new Schema<EnrollmentDocument>({
  _id: { type: String },
  studentId: { type: String, required: true, index: true },
  courseConfigId: { type: String, required: true, index: true },
  learnWorldsCourseId: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now },
  syncedAt: { type: Date, default: Date.now },
});

EnrollmentSchema.index({ studentId: 1, courseConfigId: 1 }, { unique: true });

export const EnrollmentModel = mongoose.model<EnrollmentDocument>(
  'Enrollment',
  EnrollmentSchema,
);
