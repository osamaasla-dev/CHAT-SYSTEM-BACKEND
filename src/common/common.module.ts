import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestContextService } from './services/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { RateLimitService } from './services/rate-limit.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    RequestContextService,
    RequestContextMiddleware,
    RequestContextInterceptor,
    RateLimitService,
  ],
  exports: [
    RequestContextService,
    RequestContextMiddleware,
    RequestContextInterceptor,
    RateLimitService,
  ],
})
export class CommonModule {}
