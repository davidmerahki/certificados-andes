import mongoose, { Schema, Document } from 'mongoose';

export interface CourseConfigDocument extends Omit<Document, '_id'> {
  _id: string;
  learnWorldsCourseId: string;
  name: string;
  description?: string;
  status: string;
  pokTemplateId?: string;
  emitterOrganization?: string;
  completionRequirements: {
    minProgressPercent: number;
    requireCompletedStatus: boolean;
    minCompletedUnits?: number;
  };
  eligibilityRules: {
    requireEmail: boolean;
    requireFullName: boolean;
    excludeTags: string[];
    includeOnlyTags: string[];
  };
  deliveryConfig: {
    sendEmail: boolean;
    locale?: string;
    tags: string[];
  };
  recertificationPolicy: {
    enabled: boolean;
    cycleDurationDays: number | null;
    allowManualNewCycle: boolean;
  };
  syncConfig: {
    includeInNightlySync: boolean;
    batchSize?: number;
  };
  activatedAt?: Date;
  configVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseConfigSchema = new Schema<CourseConfigDocument>(
  {
    _id: { type: String },
    learnWorldsCourseId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived', 'draft'],
      default: 'draft',
      index: true,
    },
    pokTemplateId: String,
    emitterOrganization: String,
    completionRequirements: {
      minProgressPercent: { type: Number, default: 100 },
      requireCompletedStatus: { type: Boolean, default: true },
      minCompletedUnits: Number,
    },
    eligibilityRules: {
      requireEmail: { type: Boolean, default: true },
      requireFullName: { type: Boolean, default: true },
      excludeTags: { type: [String], default: [] },
      includeOnlyTags: { type: [String], default: [] },
    },
    deliveryConfig: {
      sendEmail: { type: Boolean, default: true },
      locale: String,
      tags: { type: [String], default: [] },
    },
    recertificationPolicy: {
      enabled: { type: Boolean, default: false },
      cycleDurationDays: { type: Number, default: null },
      allowManualNewCycle: { type: Boolean, default: true },
    },
    syncConfig: {
      includeInNightlySync: { type: Boolean, default: true },
      batchSize: Number,
    },
    activatedAt: Date,
    configVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

CourseConfigSchema.index({ status: 1, 'syncConfig.includeInNightlySync': 1 });

export const CourseConfigModel = mongoose.model<CourseConfigDocument>(
  'CourseConfig',
  CourseConfigSchema,
);
