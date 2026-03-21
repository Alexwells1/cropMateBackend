import Redis from 'ioredis';
import { config } from '../../config';
import logger from '../logger';

let client: Redis | null = null;
let isConnected = false;

export function connectRedis(): void {
  try {
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.warn('[Redis] Max retries reached — caching disabled for this session');
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    client.on('connect', () => {
      isConnected = true;
      logger.info('[Redis] Connected successfully');
    });

    client.on('close', () => {
      isConnected = false;
    });

    client.on('error', (err: Error) => {
      isConnected = false;
      logger.warn(`[Redis] Non-fatal error: ${err.message}`);
    });

    void client.connect().catch(() => {
      logger.warn('[Redis] Could not connect — running without cache');
    });
  } catch (err) {
    logger.warn('[Redis] Initialization failed — running without cache');
    client = null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client || !isConnected) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = config.redis.ttlSeconds
): Promise<void> {
  if (!client || !isConnected) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!client || !isConnected) return;
  try {
    await client.del(key);
  } catch {
    // non-fatal
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!client || !isConnected) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // non-fatal
  }
}
