import mongoose from 'mongoose';
import { ILogger } from '../../domain/ports/ILogger';

export async function connectDatabase(
  uri: string,
  logger: ILogger,
): Promise<void> {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
