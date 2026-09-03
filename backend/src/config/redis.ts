import Redis from 'ioredis';

export const redisHost = process.env.REDIS_HOST || 'localhost';
export const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnectionOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis(redisConnectionOptions);

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis server successfully');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});
