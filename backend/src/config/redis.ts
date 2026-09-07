import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

export const redisHost = process.env.REDIS_HOST || 'localhost';
export const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnectionOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 3) {
      return null; // Stop retrying to avoid spamming logs when Docker is down
    }
    return Math.min(times * 200, 2000);
  },
};

let rawRedisClient: any;
export let isRedisAvailable = false;

try {
  rawRedisClient = new Redis(redisConnectionOptions);
  rawRedisClient
    .connect()
    .then(() => {
      isRedisAvailable = true;
      console.log('✅ [Redis] Connected to Redis server successfully');
    })
    .catch((_err: any) => {
      console.warn('⚠️ [Redis] Redis server is offline. Operating in Zero-Docker Embedded Queue Mode.');
      isRedisAvailable = false;
      rawRedisClient = new RedisMock();
    });
} catch {
  rawRedisClient = new RedisMock();
}

export const redisClient = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (rawRedisClient && typeof rawRedisClient[prop] === 'function') {
        return (...args: any[]) => rawRedisClient[prop](...args);
      }
      return rawRedisClient ? rawRedisClient[prop] : undefined;
    },
  }
) as any;
