import mongoose from 'mongoose';
import { config } from '../config';
import logger from '../infrastructure/logger';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('disconnected', () => {
      logger.warn('[DB] MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('[DB] MongoDB reconnected');
    });

    mongoose.connection.on('error', (err: Error) => {
      logger.error('[DB] MongoDB error:', err);
    });

    await mongoose.connect(config.database.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    logger.info(`[DB] MongoDB connected → ${mongoose.connection.host}`);
  } catch (err) {
    logger.error('[DB] Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[DB] MongoDB disconnected');
}
