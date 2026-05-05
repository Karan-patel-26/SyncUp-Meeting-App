import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

export const redisClient = createClient({
  url: REDIS_URI
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Successfully connected to Redis'));

export const connectRedis = async () => {
  await redisClient.connect();
};
