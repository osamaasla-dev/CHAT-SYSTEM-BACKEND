import { Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RedisService } from '../../redis/redis.service';
import { ThrottlerException } from '@nestjs/throttler';

interface RateLimitParams {
  keyPrefix: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  limitExceededMessage?: string;
  logContext?: string;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly requestContextService: RequestContextService,
  ) {}

  async enforceRateLimit(
    params: RateLimitParams,
  ): Promise<{ key: string; attempts: number; limit: number }> {
    const {
      keyPrefix,
      identifier,
      limit,
      windowSeconds,
      limitExceededMessage = 'Too many attempts. Please try again later.',
      logContext,
    } = params;

    const sessionContext = this.requestContextService.snapshot();
    const ip = sessionContext.ip ?? 'unknown';

    const rateLimitKey = this.buildRateLimitKey(keyPrefix, identifier, ip);
    const { attempts } = await this.redisService.applyRateLimit(
      rateLimitKey,
      limit,
      windowSeconds,
    );

    if (attempts > limit) {
      const contextMessage = logContext ?? `identifier=${identifier} ip=${ip}`;
      this.logger.warn(`Rate limit exceeded for ${contextMessage}`);
      throw new ThrottlerException(limitExceededMessage);
    }

    return { key: rateLimitKey, attempts, limit };
  }

  async resetRateLimit(key: string): Promise<void> {
    await this.redisService.delete(key);
  }

  private buildRateLimitKey(
    keyPrefix: string,
    key: string,
    ip: string,
  ): string {
    const normalizedKey = key.trim().toLowerCase();
    const normalizedIp = ip || 'unknown';
    return `${keyPrefix}:${normalizedKey}:${normalizedIp}`;
  }
}
