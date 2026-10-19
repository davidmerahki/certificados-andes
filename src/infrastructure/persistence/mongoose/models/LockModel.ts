import mongoose, { Schema, Document } from 'mongoose';

export interface LockDocument extends Document {
  key: string;
  expiresAt: Date;
}

const LockSchema = new Schema<LockDocument>({
  key: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

LockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LockModel = mongoose.model<LockDocument>('DistributedLock', LockSchema);
