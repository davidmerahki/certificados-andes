import mongoose, { Schema, Document } from 'mongoose';

export interface SyncRunDocument extends Document {
  mode: string;
  status: string;
  simulation: boolean;
  startedAt: Date;
  finishedAt?: Date;
  courseResults: Array<{
    courseConfigId: string;
    courseName: string;
    studentsProcessed: number;
    eligibleFound: number;
    emissionsRequested: number;
    emissionsSimulated: number;
    errorMessages: string[];
    success: boolean;
  }>;
  totalEligible: number;
  totalEmitted: number;
  totalFailed: number;
  errorSummary?: string;
}

const SyncRunSchema = new Schema<SyncRunDocument>({
  _id: { type: String },
  mode: { type: String, required: true },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'partial'],
    required: true,
    index: true,
  },
  simulation: { type: Boolean, default: false },
  startedAt: { type: Date, required: true },
  finishedAt: Date,
  courseResults: [
    {
      courseConfigId: String,
      courseName: String,
      studentsProcessed: Number,
      eligibleFound: Number,
      emissionsRequested: Number,
      emissionsSimulated: Number,
      errorMessages: { type: [String], default: [] },
      success: Boolean,
    },
  ],
  totalEligible: { type: Number, default: 0 },
  totalEmitted: { type: Number, default: 0 },
  totalFailed: { type: Number, default: 0 },
  errorSummary: String,
});

SyncRunSchema.index({ startedAt: -1 });
SyncRunSchema.index({ 'courseResults.courseConfigId': 1, startedAt: -1 });

export const SyncRunModel = mongoose.model<SyncRunDocument>('SyncRun', SyncRunSchema);
