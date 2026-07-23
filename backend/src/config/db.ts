import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
      logger.info('✅ MongoDB Atlas Connected Successfully!');
      return;
    } catch (error) {
      logger.error('❌ Failed to connect to MONGO_URI:', error);
    }
  }

  // Local development fallback
  const localUri = 'mongodb://localhost:27017/voxora';
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    logger.info('✅ Connected to local MongoDB instance');
  } catch (error) {
    logger.warn('⚠️ Local MongoDB not running. Initializing embedded database engine...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      logger.info('✅ Embedded Mongo Engine active & ready!');
    } catch (memError) {
      logger.warn('⚠️ Database in offline mode. Query buffering disabled for instant response.');
      mongoose.set('bufferCommands', false);
    }
  }
};
