import mongoose, { Schema, Document } from 'mongoose';

export interface CertificationDocument extends Omit<Document, '_id'> {
  _id: string;
  studentId: string;
  courseConfigId: string;
  learnWorldsCourseId: string;
  certificationCycle: string;
  idempotencyKey: string;
  status: string;
  pokTemplateId: string;
  emitterOrganization?: string;
  pokCredentialId?: string;
  configVersionAtEmission: number;
  simulated: boolean;
  failureReason?: string;
  attemptCount: number;
  emittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CertificationSchema = new Schema<CertificationDocument>(
  {
    _id: { type: String },
    studentId: { type: String, required: true, index: true },
    courseConfigId: { type: String, required: true, index: true },
    learnWorldsCourseId: { type: String, required: true },
    certificationCycle: { type: String, required: true, default: 'default' },
    idempotencyKey: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        'eligible',
        'simulated',
        'pending_emission',
        'emitted',
        'failed',
        'retrying',
        'cancelled',
      ],
      required: true,
      index: true,
    },
    pokTemplateId: { type: String, required: true },
    emitterOrganization: String,
    pokCredentialId: String,
    configVersionAtEmission: { type: Number, required: true },
    simulated: { type: Boolean, default: false },
    failureReason: String,
    attemptCount: { type: Number, default: 0 },
    emittedAt: Date,
  },
  { timestamps: true },
);

// Prevent duplicate certifications across courses and cycles
CertificationSchema.index(
  { studentId: 1, courseConfigId: 1, certificationCycle: 1 },
  { unique: true },
);

export const CertificationModel = mongoose.model<CertificationDocument>(
  'Certification',
  CertificationSchema,
);
