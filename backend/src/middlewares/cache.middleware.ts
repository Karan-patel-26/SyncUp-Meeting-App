import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

/**
 * Middleware to cache API GET responses in Redis
 * @param durationInSeconds How long to keep the cache
 */
export const cacheResponse = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // We only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Construct a unique key based on the URL and optionally the user ID for user-specific data
    const key = `__express__${req.originalUrl || req.url}__${req.userId || 'public'}`;

    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        res.status(200).json(JSON.parse(cachedResponse));
        return;
      }

      // Intercept the res.json to cache the outgoing data
      const originalJson = res.json.bind(res);
      res.json = ((body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, durationInSeconds, JSON.stringify(body))
            .catch(err => console.error('Redis Cache Error:', err));
        }
        return originalJson(body);
      }) as any;

      next();
    } catch (error) {
      console.error('Redis Cache Middleware Error:', error);
      // Fail gracefully and proceed without cache
      next();
    }
  };
};

/**
 * Helper to invalidate cache based on a pattern
 */
export const invalidateCache = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis Invalidate Error:', error);
  }
};
