import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (!url) {
      throw new Error('UPSTASH_REDIS_REST_URL is not configured');
    }

    if (!token) {
      throw new Error('UPSTASH_REDIS_REST_TOKEN is not configured');
    }

    this.redis = new Redis({ url, token });
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const options =
      ttlSeconds && ttlSeconds > 0 ? { ex: ttlSeconds } : undefined;

    await this.redis.set(key, serialized, options);
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.redis.get<
      string | Record<string, unknown> | null
    >(key);

    if (result === null || result === undefined) {
      return null;
    }

    if (typeof result !== 'string') {
      return result as T;
    }

    try {
      return JSON.parse(result) as T;
    } catch (error) {
      this.logger.warn(
        `Failed to parse cached value for key ${key}, returning raw string`,
        error as Error,
      );
      return result as unknown as T;
    }
  }

  async delete(key: string): Promise<number> {
    return (await this.redis.del(key)) ?? 0;
  }

  async increment(key: string, amount = 1): Promise<number> {
    return this.redis.incrby(key, amount);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    return this.redis.expire(key, ttlSeconds);
  }

  async applyRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ attempts: number; limit: number }> {
    if (limit <= 0) {
      throw new Error('Rate limit must be greater than zero');
    }

    if (windowSeconds <= 0) {
      throw new Error('Rate limit window must be greater than zero seconds');
    }

    const attempts = await this.increment(key);

    if (attempts === 1) {
      await this.expire(key, windowSeconds);
    }

    return { attempts, limit };
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshValue = await factory();
    await this.set(key, freshValue, ttlSeconds);
    return freshValue;
  }
}
