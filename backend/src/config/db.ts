import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://admin:voxora_secure_password@localhost:27017/voxora?authSource=admin';

  try {
    // 1. Try local MongoDB first with 1.5s timeout
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 1500, connectTimeoutMS: 1500 });
    logger.info('✅ MongoDB Connected Successfully to local instance');
  } catch (error) {
    logger.warn('⚠️ Local MongoDB not running. Initializing embedded database engine...');
    try {
      // 2. Embedded in-memory MongoDB fallback
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      logger.info('✅ Embedded Mongo Engine active & ready!');
    } catch (memError) {
      logger.warn('⚠️ Database in offline mode. Query buffering disabled for instant response.');
      mongoose.set('bufferCommands', false);
    }
  }
};
