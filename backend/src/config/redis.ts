import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

export let isRedisConnected = false;

export const redisClient = createClient({
  url: REDIS_URI,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log('Redis reconnection exhausted. Operating in in-memory mode.');
        return false; // Stop retrying after 3 attempts
      }
      return 5000; // Retry every 5 seconds
    }
  }
});

redisClient.on('error', (err) => {
  if (isRedisConnected) {
    console.log('Redis Client Error', err);
    isRedisConnected = false;
  }
});

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis');
  isRedisConnected = true;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Could not connect to Redis, continuing without cache:', err);
    isRedisConnected = false;
  }
};
