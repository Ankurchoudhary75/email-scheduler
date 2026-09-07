import { PrismaClient } from '@prisma/client';
import { embeddedDb } from './embeddedStore';

const realPrisma = new PrismaClient({
  log: ['error'],
});

let isPostgresAvailable = true;

// Proactively test postgres connection
realPrisma
  .$connect()
  .then(() => {
    console.log('✅ [Database] Connected to PostgreSQL successfully');
    isPostgresAvailable = true;
  })
  .catch((err) => {
    console.warn('⚠️ [Database] PostgreSQL is currently offline. Operating in Zero-Docker Embedded Storage Mode.');
    isPostgresAvailable = false;
  });

function createResilientModelProxy(modelName: 'user' | 'sender' | 'emailJob' | 'rateLimitLog') {
  return new Proxy(
    {},
    {
      get(_target, propKey: string) {
        return async (...args: any[]) => {
          if (isPostgresAvailable) {
            try {
              return await (realPrisma as any)[modelName][propKey](...args);
            } catch (err: any) {
              // If connection fails (e.g. Docker stopped), seamlessly switch to embedded store
              if (
                err.message?.includes('Can\'t reach database server') ||
                err.message?.includes('ECONNREFUSED') ||
                err.code === 'P1001'
              ) {
                isPostgresAvailable = false;
                console.warn(`[Database] PostgreSQL disconnected. Switching ${modelName}.${propKey} to embedded store.`);
                return await (embeddedDb as any)[modelName][propKey](...args);
              }
              throw err;
            }
          } else {
            return await (embeddedDb as any)[modelName][propKey](...args);
          }
        };
      },
    }
  );
}

export const prisma = {
  user: createResilientModelProxy('user'),
  sender: createResilientModelProxy('sender'),
  emailJob: createResilientModelProxy('emailJob'),
  rateLimitLog: createResilientModelProxy('rateLimitLog'),
  $connect: () => realPrisma.$connect(),
  $disconnect: () => realPrisma.$disconnect(),
} as unknown as PrismaClient;
