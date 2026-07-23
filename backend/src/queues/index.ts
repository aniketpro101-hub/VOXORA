import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

let redisAvailable = false;
let warningLogged = false;

export const connection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // Stop retrying immediately if Redis is unreachable
  lazyConnect: true,
  enableOfflineQueue: false,
});

connection.on('connect', () => {
  redisAvailable = true;
  logger.info(`[BullMQ] Connected to Redis at ${redisHost}:${redisPort}`);
});

connection.on('error', () => {
  redisAvailable = false;
  if (!warningLogged) {
    warningLogged = true;
    logger.warn(`⚠️ [BullMQ] Local Redis not running. Queue features will operate in direct mode.`);
  }
});

// Quick connection test (non-blocking)
connection.connect().catch(() => {
  redisAvailable = false;
  if (!warningLogged) {
    warningLogged = true;
    logger.warn(`⚠️ [BullMQ] Local Redis not running. Queue features will operate in direct mode.`);
  }
});

export const isRedisAvailable = () => redisAvailable;

export const campaignQueue = new Queue('campaign-sending-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

export const scheduledCampaignQueue = new Queue('scheduled-campaign-queue', { connection });
export const dripCampaignQueue = new Queue('drip-campaign-queue', { connection });
export const cleanupQueue = safeCreateQueue('cleanup-maintenance-queue');

function safeCreateQueue(name: string) {
  try {
    return new Queue(name, { connection });
  } catch (err) {
    return new Queue(name, { connection });
  }
}
